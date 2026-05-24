# EV-003: Modified Gantt Date Calculation Algorithm — Design Spec

**Date**: 2026-04-03
**Status**: Approved
**Dependency**: EV-002 (Configurable Working Hours) ✅ Complete
**Scope**: Algorithm refactoring only — no new triggers, no schema changes, no frontend changes

---

## 1. Problem Statement

The current Gantt date calculation assumes every resource works 8 hours/day on a fixed Mon-Fri schedule. This causes incorrect completion dates for part-time resources, leading to unrealistic timelines.

**Example**: A 16-hour task assigned to a 4h/day resource:
- Current (wrong): 16h / 8h = 2 business days
- Correct: 16h / 4h = 4 business days

EV-002 already built the infrastructure (ResourceWeeklySchedule, ResourceScheduleOverride, Resource.DailyWorkingHours, ResourceAbsence.AbsenceHours), but the Gantt calculation does not use it yet.

---

## 2. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage unit | Days (1 day = 8 hours, universal) | Users estimate in days; decouples effort from resource capacity |
| Recalculation triggers | Manual "Update Gantt" button only | CRUD operations stay light and safe |
| Database schema | No new columns — use existing StartDate/EndDate | No migration, no dual-date confusion |
| Unassigned activities | 8h/day default (Mon-Fri) | Natural fallback when no resource context exists |
| Architecture | New shared utility class `ResourceCapacityUtilities` | Single source of truth, both callers share identical logic |
| Naming constant | `WorkAssignmentConstants.DEFAULT_WORKING_HOURS_PER_DAY` (8.0) | Already exists, reused |

---

## 3. Architecture

### New Class: `ResourceCapacityUtilities`

Location: `TaskManagementWebApi/Utilities/ResourceCapacityUtilities.cs`

Encapsulates 3-tier schedule resolution and hours-based date distribution. Both existing callers delegate to it.

```
ResourceCapacityUtilities              ← core: schedule resolution + date calculation
  ↑ used by
  ├── TaskManagementServices           ← Gantt update (CalculateActivityEndDate)
  └── WorkloadCalculationUtilities     ← workload %, end date preview (delegates)
```

### Constructor / Dependencies

```csharp
public ResourceCapacityUtilities(IUnitOfWork unitOfWork)
```

Injected via Unity DI. Accesses:
- `ResourceRepository` (DailyWorkingHours — tier 3)
- `ResourceWeeklyScheduleRepository` (tier 2)
- `ResourceScheduleOverrideRepository` (tier 1)
- `ResourceAbsenceRepository` (absence subtraction)

### Public API

```csharp
// 3-Tier Resolution
decimal GetEffectiveHoursForDate(int resourceId, DateTime date)
Dictionary<DateTime, decimal> GetEffectiveHoursForDateRange(int resourceId, DateTime startDate, DateTime endDate)

// Date Calculation
DateTime CalculateEndDateFromHours(decimal totalHours, DateTime startDate, int resourceId)
DateTime CalculateEndDateFromDays(double estimatedDays, DateTime startDate, int resourceId)
DateTime CalculateEndDateFromDays(double estimatedDays, DateTime startDate)  // unassigned overload
```

---

## 4. Core Algorithm: `CalculateEndDateFromHours`

### Input/Output

- **Input**: `totalHours` (decimal), `startDate` (DateTime), `resourceId` (int)
- **Output**: `endDate` (DateTime)

### Steps

1. **Pre-fetch** resource schedule data (4 queries):
   - Resource.DailyWorkingHours (tier 3 fallback)
   - ResourceWeeklySchedule — 7 rows (tier 2)
   - ResourceScheduleOverride — for estimated date range (tier 1)
   - ResourceAbsence — all absences for resource

2. **Set** `remainingHours = totalHours`, `currentDate = startDate`

3. **While** `remainingHours > 0`:
   - **Resolve scheduled hours** for `currentDate` (3-tier):
     - Override for (resourceId, currentDate) → if found, use its WorkingHours
     - Else WeeklySchedule for (resourceId, currentDate.DayOfWeek) → if found, use its WorkingHours
     - Else Resource.DailyWorkingHours
   - **Subtract absences** for `currentDate`:
     - If any absence has AbsenceHours = NULL → full-day → effectiveHours = 0
     - Else effectiveHours = scheduledHours - SUM(AbsenceHours)
     - Clamp to minimum 0
   - If effectiveHours > 0: `remainingHours -= effectiveHours`
   - If remainingHours > 0: `currentDate += 1 day`

4. **Return** `currentDate`

### `CalculateEndDateFromDays` Convenience Method

```
totalHours = estimatedDays × DEFAULT_WORKING_HOURS_PER_DAY (8.0)
return CalculateEndDateFromHours(totalHours, startDate, resourceId)
```

### Unassigned Overload (No Resource)

Uses system default: 8h/day Mon-Fri, no absences. Implemented as a simplified version that skips DB lookups.

### Pre-fetch Strategy for Overrides

Overrides need a date range, but end date is unknown:
1. Initial estimate: `startDate + (totalHours / minDailyHours * 2)` — generous overestimate
2. Pre-fetch overrides for [startDate, estimatedEndDate]
3. If algorithm runs past estimatedEndDate (rare), extend and re-fetch

---

## 5. 3-Tier Resolution Detail

### Schedule Resolution (Before Absences)

```
Tier 1 — Override:   ResourceScheduleOverride WHERE ResourceId = @id AND OverrideDate = @date
Tier 2 — Weekly:     ResourceWeeklySchedule WHERE ResourceId = @id AND DayOfWeek = @dayOfWeek
Tier 3 — Default:    Resource.DailyWorkingHours (always exists, default 8.0)
```

### Absence Subtraction (After Resolution)

1. Get all ResourceAbsence records for (resourceId, date)
2. If any has AbsenceHours = NULL → return 0 (full-day wins)
3. Else totalAbsenceHours = SUM(AbsenceHours) for that date
4. effectiveHours = scheduledHours - totalAbsenceHours
5. Clamp: return MAX(effectiveHours, 0)

**Why SUM?** No unique index on (ResourceId, AbsenceDate) — multiple partial absences per day are valid (e.g., 2h medical + 1h permit = 3h absent).

**Why NULL wins?** Consistent with existing `UnifyResourceAbsences` merging logic: if any absence is full-day, the entire day is unavailable.

### Batch Version (`GetEffectiveHoursForDateRange`)

Same logic, but pre-fetches all data in 4 queries upfront, then resolves each date in-memory. Used internally by `CalculateEndDateFromHours`.

---

## 6. Integration with Existing Callers

### Caller 1: `TaskManagementServices.CalculateActivityEndDate()`

**New signature:**
```csharp
private DateTime CalculateActivityEndDate(Activity activity,
    int? resourceId = null,
    Nullable<DateTime> overrideStartDate = null)
```

**New body:**
```
startDate = overrideStartDate ?? activity.StartDate
remainingDays = activity.RemainingTime
If resourceId has value:
    return _resourceCapacityUtilities.CalculateEndDateFromDays(remainingDays, startDate, resourceId.Value)
Else:
    return _resourceCapacityUtilities.CalculateEndDateFromDays(remainingDays, startDate)
```

**Calling context change in `UpdateAssignedActivitiesGanttTimeline`:**
```csharp
// Before:
IEnumerable<ResourceAbsence> resourceAbsences = ManageResourceAbsencesInterferences(GetAllResourceAbsencesByResourceIdApi(resource.Id));
firstActivity.EndDate = CalculateActivityEndDate(firstActivity, resourceAbsences, selectedDate);

// After:
firstActivity.EndDate = CalculateActivityEndDate(firstActivity, resource.Id, selectedDate);
```

`UpdateUnassignedActivitiesGanttTimeline` calls the no-resource overload (8h/day default).

### Caller 2: `WorkloadCalculationUtilities`

**`CalculateEndDate()`** — body replaced by delegation, signature unchanged:
```csharp
public DateTime CalculateEndDate(DateTime startDate, double estimatedDays, int resourceId)
{
    return _resourceCapacityUtilities.CalculateEndDateFromDays(estimatedDays, startDate, resourceId);
}
```

**`GetBusinessDays()` → renamed to `GetAvailableHours()`** — returns `decimal` hours:
```csharp
public decimal GetAvailableHours(DateTime startDate, DateTime endDate, int resourceId)
{
    var dailyHours = _resourceCapacityUtilities.GetEffectiveHoursForDateRange(resourceId, startDate, endDate);
    return dailyHours.Values.Sum();
}
```

Rename ensures compile error if any caller is missed (instead of silent unit mismatch).

**`CalculateWorkloadPercentage()`** — formula updated to hours-based:
```
// Before (wrong for part-time):
totalRemainingDays / availableDays * 100

// After:
(totalRemainingDays × 8) / availableHours * 100
```

### Caller 3: `WorkAssignmentController.cs` (line 243)

Updated to use `GetAvailableHours`:
```csharp
// Before:
int availableDays = _workloadCalculationUtilities.GetBusinessDays(DateTime.Today, DateTime.Today.AddDays(30), firstResource.Id);
decimal additionalPercentage = availableDays > 0 ? (decimal)(additionalDays / availableDays * 100) : 0;

// After:
decimal availableHours = _workloadCalculationUtilities.GetAvailableHours(DateTime.Today, DateTime.Today.AddDays(30), firstResource.Id);
decimal additionalPercentage = availableHours > 0 ? (decimal)(additionalDays * 8 / (double)availableHours * 100) : 0;
```

---

## 7. `RemainingTime` — SQL View Context

`RemainingTime` is computed in a SQL View, not stored directly:

```sql
RemainingTime = EstimatedTime + EstimatedTimeVariation - (WorkedTime / 8)
```

- `EstimatedTime` = original estimate in days
- `EstimatedTimeVariation` = adjustments in days
- `WorkedTime` = hours worked (divided by 8 to convert to days)

The `/ 8` in the SQL View is consistent with our 1 day = 8 hours convention. **No SQL changes needed.**

Completed activities get `RemainingTime = 0` (status check in View). Completed activities are excluded from `UpdateGanttTimeline` via `GetAllWorkInProgressActivities*` queries.

`EstimatedStartDate` / `EstimatedEndDate` are write-once "original" dates set at creation. Not updated by Gantt calculations.

---

## 8. Edge Cases

| Scenario | Handling |
|----------|----------|
| RemainingTime = 0 | Returns startDate immediately (0 hours to distribute) |
| Resource has no WeeklySchedule rows | Falls to tier 3 (DailyWorkingHours). Shouldn't happen (InsertResource SP creates 7 rows). |
| Resource DailyWorkingHours = 0 with all tiers resolving to 0 | Safety guard: max 365 iterations, then throw descriptive error |
| Absence hours exceed scheduled hours | Clamp to 0 effective (not negative) |
| Multiple full-day + partial absences on same date | NULL wins → full-day → 0 effective |
| Override sets WorkingHours = 0 | Non-working day, skipped |
| Override on weekend with WorkingHours > 0 | Resource works that day (tier 1 wins over tier 2) |
| Fractional remaining hours on last day | Activity ends on that day (partial day is still a working day) |

### Safety Guard

```csharp
const int MAX_CALENDAR_DAYS = 365;

if ((currentDate - startDate).Days > MAX_CALENDAR_DAYS)
    throw new InvalidOperationException(
        $"Impossibile calcolare la data fine: nessuna capacità lavorativa trovata per la risorsa nei prossimi {MAX_CALENDAR_DAYS} giorni.");
```

---

## 9. Backward Compatibility

| Aspect | Guarantee |
|--------|-----------|
| Full-time resources (8h/day, Mon-Fri) | Identical results to current algorithm |
| API signatures | `WorkloadCalculationUtilities.CalculateEndDate()` keeps same signature |
| Gantt trigger flow | `UpdateGanttTimeline()` entry point unchanged |
| SQL Views / Stored Procedures | No changes |
| Frontend / JavaScript | No changes — Gantt reads same StartDate/EndDate fields |
| `EstimatedHours` computed property | Uses same 8.0 constant — no change needed |

---

## 10. Files Changed

### New Files (1)

| File | Purpose |
|------|---------|
| `TaskManagementWebApi/Utilities/ResourceCapacityUtilities.cs` | Core class: 3-tier resolution + hours-based date calculation |

### Modified Files (4)

| File | Change |
|------|--------|
| `TaskManagementWebApi/App_Start/UnityConfig.cs` | Register `ResourceCapacityUtilities` in Unity DI |
| `TaskManagementWebApi/Utilities/WorkloadCalculationUtilities.cs` | Add `ResourceCapacityUtilities` dependency; delegate `CalculateEndDate`; rename `GetBusinessDays` → `GetAvailableHours`; update workload percentage formulas to hours-based |
| `TaskManagementWebApi/Controllers/WorkAssignmentController.cs` | Update `GetBusinessDays` → `GetAvailableHours`; convert days to hours in workload calc |
| `GammaTaskManagement/Services/TaskManagementServices.cs` | Add `ResourceCapacityUtilities` dependency; simplify `CalculateActivityEndDate` to delegate; remove 9 private absence/festivity methods; pass `resource.Id` in `UpdateAssignedActivitiesGanttTimeline` |

### Cleanup — Dead Code Removal (3)

| File | What to Remove |
|------|---------------|
| `TaskManagementBusinessLayer/Utilities/DateTimeUtilities.cs` | **Delete entire file** — all methods either already dead or only called from methods being removed |
| `TaskManagementBusinessLayer/BusinessLogic/Models/Activity.cs` | Remove 3 helper methods: `GetNumberOfWorkingDays`, `GetNumberOfFestivityDays`, `GetOverlappingResourceAbsences` |
| `TaskManagementBusinessLayer/BusinessLogic/ViewModels/ActivityViewModel.cs` | Remove 3 helper methods: `GetNumberOfWorkingDays`, `GetNumberOfFestivityDays`, `GetOverlappingResourceAbsences` |

### Private Methods Removed from `TaskManagementServices.cs` (9)

| Method | Line |
|--------|------|
| `GetAbsenceDaysList()` | 352 |
| `GetResourceAbsencesInterferences()` | 360 |
| `CountResourceAbsencesInterferences()` | 369 |
| `CountAllResourceAbsencesInterferences()` | 374 |
| `IsResourceAbsenceAlreadyPresent()` | 386 |
| `UnifyResourceAbsences()` | 396 |
| `ManageResourceAbsencesInterferences()` | 450 |
| `GetActivityFestivityDays()` | 466 |
| `AddFestivitiesAndAbsenceDays()` | 474 |

### Unchanged

- No SQL migrations, Views, or Stored Procedures
- No frontend / JavaScript changes
- No Razor view changes
- `EstimatedStartDate` / `EstimatedEndDate` fields untouched
- `UpdateGanttTimeline()` entry point and trigger flow unchanged
