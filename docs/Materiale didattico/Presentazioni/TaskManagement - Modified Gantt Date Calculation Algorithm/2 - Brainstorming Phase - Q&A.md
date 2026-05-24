# EV-003 Brainstorming Summary

**Date**: 2026-04-03
**Participants**: Stefano Zaghi + Claude (AI Assistant)
**Duration**: 1 session, 7 design sections discussed and approved
**Output**: Design spec at `Documentazione/Evolutive/2025/EV-003_Modified_Gantt_Date_Calculation_Algorithm.md`

---

## Problem

The Gantt date calculation assumes every resource works 8h/day on a fixed Mon-Fri schedule. Part-time resources get incorrect completion dates (e.g., a 16h task shows 2 days for everyone, but a 4h/day resource actually needs 4 days). EV-002 already built the infrastructure (3-tier working hours, partial absences), but the Gantt doesn't use it.

---

## Exploration Findings

Two independent calculation paths exist in the codebase:

1. **`TaskManagementServices.CalculateActivityEndDate()`** — Main Gantt engine. Day-based iterative algorithm that extends end dates for weekends and full-day absences.
2. **`WorkloadCalculationUtilities.CalculateEndDate()`** — Work Assignment wizard preview. Forward-counts business days with same limitations.

**Key discovery**: `Activity.RemainingTime` is computed in a SQL View as `EstimatedTime + EstimatedTimeVariation - (WorkedTime / 8)`. The `/ 8` confirms the existing convention that 1 day = 8 hours. Values are in days.

**Dead code found**: `DateTimeUtilities.cs` (5 methods), `Activity` helper methods (3), and `ActivityViewModel` helper methods (3) are either already unused or only called from Gantt methods being replaced.

---

## Decisions Made

### Q1: Storage/Input Unit

**Options explored**:
- (A) Keep days, convert to hours internally using 8h constant
- (B) Switch to hours as storage unit
- (C) Keep days, interpret per-resource

**Chosen: A** — Users think in days. 1 day = 8 hours universally. A "2-day" estimate = 16h for any resource. The system distributes hours across the resource's actual schedule.

### Q2: Recalculation Triggers

**Options explored**:
- (A) Refactor algorithm only, keep manual "Update Gantt" button
- (B) Add automatic triggers on CRUD operations

**Chosen: A** — CRUD operations stay light and safe. No auto-triggers. This decision was saved to project memory as a permanent rule.

### Q3: Database Schema

**Options explored**:
- (A) Keep existing StartDate/EndDate
- (B) Add new CalculatedStartDate/CalculatedEndDate columns

**Chosen: A** — No new columns. The functional analysis suggested new columns, but they're unnecessary since StartDate/EndDate already serve this purpose.

**Verified**: `EstimatedStartDate`/`EstimatedEndDate` are write-once (set at creation, never updated). Completed activities are excluded from Gantt updates via `GetAllWorkInProgressActivities*` queries.

### Q4: Unassigned Activities

**Chosen**: 8h/day default (Mon-Fri). Natural fallback when no resource context exists.

### Q5: Architecture

**Options explored**:
- (A) New shared `ResourceCapacityUtilities` class
- (B) Extend `WorkloadCalculationUtilities` in-place
- (C) Inline logic in both callers independently

**Chosen: A** — Clean SRP, single source of truth, avoids cross-layer dependency issues. Both callers delegate to it.

### Q6: Both Calculation Paths

**Confirmed**: Both `TaskManagementServices` and `WorkloadCalculationUtilities` use the same core algorithm via `ResourceCapacityUtilities`. No independent implementations.

### Q7: Dead Code Cleanup

**Confirmed**: Full deletion of `DateTimeUtilities.cs`, and removal of helper methods from `Activity.cs` and `ActivityViewModel.cs`. All verified to have zero external callers after EV-003.

---

## Designed Algorithm

### 3-Tier Resolution (per date, per resource)

```
1. Override  → ResourceScheduleOverride for (resourceId, date)
2. Weekly    → ResourceWeeklySchedule for (resourceId, dayOfWeek)
3. Default   → Resource.DailyWorkingHours
Then subtract absences:
   - NULL AbsenceHours = full-day → 0 effective
   - Numeric = partial → scheduled - SUM(absenceHours), clamped to 0
```

### Date Calculation Flow

```
Input:  estimatedDays, startDate, resourceId
Step 1: totalHours = estimatedDays x 8
Step 2: Pre-fetch schedule data (4 queries)
Step 3: Walk day-by-day, subtract effectiveHours from remainingHours
Step 4: Return date when remainingHours <= 0
```

### Secondary Impact: Workload Percentage

The `GetBusinessDays` method (returning int days) is renamed to `GetAvailableHours` (returning decimal hours). Workload formula updated from `days/days` to `hours/hours` — fixes underreported workload for part-time resources.

---

## File Impact Summary

| Category | Count | Details |
|----------|-------|---------|
| **New files** | 1 | `ResourceCapacityUtilities.cs` |
| **Modified files** | 4 | UnityConfig, WorkloadCalculationUtilities, WorkAssignmentController, TaskManagementServices |
| **Deleted files** | 1 | `DateTimeUtilities.cs` |
| **Methods removed** | 15 | 9 private in TaskManagementServices + 3 in Activity + 3 in ActivityViewModel |
| **SQL changes** | 0 | No migrations, views, or stored procedures |
| **Frontend changes** | 0 | No JavaScript or Razor changes |

---

## Edge Cases Addressed

- **Zero-capacity resource**: Safety guard at 365 days, then descriptive Italian error
- **Override on weekend**: Works correctly (tier 1 wins over tier 2)
- **Multiple absences per day**: Summed (partial) or NULL wins (full-day)
- **Backward compatibility**: Full-time 8h/day Mon-Fri resources get identical results to current algorithm

---

## Next Steps

1. User reviews the design spec
2. Transition to implementation planning via `writing-plans` skill
