# TaskManagement Development Plan - TICKET#22900

**Purpose**: Phased implementation roadmap for 9 evolutionary features.

**Parent**: Root `CLAUDE.md` > Development Plan

**Reference Documents**:
- `TICKET#22900 - TaskManagement - modifiche per U.T. - FunctionalAnalysis.md` - Complete functional specs
- `TICKET#22900 - TaskManagement - modifiche per U.T. - use_cases.md` - 28+ detailed use cases
- `.claude/functional-requirements.md` - Feature overview

---

## Overview

**Total Features**: 9 (6 High Priority, 3 Medium Priority)
**Implementation Approach**: 4 phases, sequential with some parallelization
**Target Completion**: Q1 2026

**Current Status**:
- ✅ EV-001 Complete | ✅ EV-002 Complete | ✅ EV-003 Complete | ✅ EV-005 Complete | ✅ EV-006 Complete | ✅ EV-007 Complete | ✅ EV-008 Complete | ✅ EV-009 Complete
- 🔲 Next: EV-004 (Parallel Work Support in Gantt)

---

## Completed Features Summary

### EV-005 - Data Persistence on Validation Error ✅ COMPLETED

**Completion Date**: December 2025

**Summary**: Data persistence on validation error for 13 MVC controllers (39 CRUD methods) and 60 Kendo Grid views.

#### Reusable Controller Pattern

```csharp
// CREATE - use collectProcessedModels: true to return entities with IDs
[AcceptVerbs(HttpVerbs.Post)]
public Task<ActionResult> EntityPage_Create([DataSourceRequest] DataSourceRequest request,
    [Bind(Prefix = "models")] IEnumerable<EntityViewModel> viewModels)
{
    return ExecuteBatchCrudAsync(
        request, viewModels,
        vms => _mapper.Map<IEnumerable<EntityViewModel>, IEnumerable<Entity>>(vms),
        entity => _taskManagementServices.getHttpResponseMessageFromAddEntity(entity),
        entity => _taskManagementServices.SetEntityAssignedStatus(entity),  // optional pre-process
        collectProcessedModels: true);
}

// UPDATE
[AcceptVerbs(HttpVerbs.Post)]
public Task<ActionResult> EntityPage_Update([DataSourceRequest] DataSourceRequest request,
    [Bind(Prefix = "models")] IEnumerable<EntityViewModel> viewModels)
{
    return ExecuteBatchCrudAsync(
        request, viewModels,
        vms => _mapper.Map<IEnumerable<EntityViewModel>, IEnumerable<Entity>>(vms),
        entity => _taskManagementServices.getHttpResponseMessageFromUpdateEntity(entity));
}

// DELETE
[AcceptVerbs(HttpVerbs.Post)]
public Task<ActionResult> EntityPage_Destroy([DataSourceRequest] DataSourceRequest request,
    [Bind(Prefix = "models")] IEnumerable<EntityViewModel> viewModels)
{
    return ExecuteBatchDeleteAsync(
        request, viewModels,
        vms => _mapper.Map<IEnumerable<EntityViewModel>, IEnumerable<Entity>>(vms),
        entity => _taskManagementServices.getHttpResponseMessageFromDeleteEntity(entity));
}
```

**View Error Handler**: `.Events(events => events.Error("KendoGridErrorHandlerWithPersistence")...`

#### Key Files
| Component | File |
|-----------|------|
| **Base Controller Helpers** | `Controllers/TaskManagementTraceController.cs:103-449` |
| **Validation Persistence JS** | `Scripts/ManageValidationErrorPersistence.js` |
| **Grid Utilities** | `Scripts/ManageKendoGrid.js` |

#### Lessons Learned
1. **HTTP 400 Required**: Kendo DataSource error event only fires for HTTP 4xx/5xx
2. **Batch Mode**: With `Batch(true)`, return ALL items in `SubmittedData[]`
3. **Grid ID Detection**: Use `getKendoGridIdFromDataSource()` - `this.element` is undefined in DataSource events
4. **Date Format**: Parse `/Date(timestamp)/` format with `parseAllDatesInObject()` before repopulating

---

### EV-006 - Robust Server-Side Validation ✅ COMPLETED

**Completion Date**: December 2025

**Summary**: FluentValidation 5.1.0 with Unity DI integration. 14 validators auto-discovered via assembly scanning.

#### ⚠️ CRITICAL: FluentValidation 5.x Patterns

| Feature | ❌ DON'T USE (v6+) | ✅ USE (v5.x) |
|---------|-------------------|---------------|
| Max length | `MaximumLength(100)` | `Length(0, 100)` |
| Range | `InclusiveBetween(0, 100)` | `GreaterThanOrEqualTo(0)` + `LessThanOrEqualTo(100)` |
| Culture | `ValidatorOptions.LanguageManager.Culture` | `.WithMessage()` with Italian text |

**DataAnnotations Conflict**: Comment out `[Required]`/`[Range]` in ViewModels when FluentValidation validator exists.

#### Validator Pattern

```csharp
public class ExampleViewModelValidator : AbstractValidator<ExampleViewModel>
{
    public ExampleViewModelValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Il campo Nome è obbligatorio")
            .Length(0, 250).WithMessage("Il Nome non può superare 250 caratteri");

        RuleFor(x => x.TypeId)
            .NotEmpty().WithMessage("Il campo Tipologia è obbligatorio")
            .GreaterThan(0).WithMessage("Il campo Tipologia è obbligatorio");

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
            .WithMessage("La Data Fine deve essere successiva alla Data Inizio");
    }
}
```

#### Key Files
| Purpose | File Path |
|---------|-----------|
| **Validators Location** | `TaskManagementBusinessLayer/BusinessLogic/ViewModelValidators/` |
| **MVC FluentValidation Config** | `GammaTaskManagement/App_Start/FluentValidationConfig.cs` |
| **MVC Validator Factory** | `GammaTaskManagement/App_Start/UnityValidatorFactory.cs` |

---

### EV-001 - Drag & Drop Work Reordering ✅ COMPLETED

**Completion Date**: November 2025

**Summary**: Drag & drop priority reordering for 32 Kendo Grid views with automatic priority rebalancing.

#### Architecture Pattern

```
Browser → MVC Controller → Service Layer → Web API → Repository → Database
           (proxy action)    (API call)     (logic)   (stored proc)

NO DIRECT BROWSER → WEB API CALLS (causes CORS errors)
```

#### Key Files
| Component | File |
|-----------|------|
| **Priority Utilities** | `TaskManagementWebApi/Utilities/PriorityManagementUtilities.cs` |
| **Data Utilities** | `TaskManagementWebApi/Utilities/ManageDataUtilities.cs` |
| **Drag & Drop JS** | `GammaTaskManagement/Scripts/ManageKendoGridRowReordering.js` |

#### View Implementation Pattern

```razor
@* 1. Drag handle column *@
columns.Bound(c => c.Id).ClientTemplate("<span class='drag-handle' style='cursor: move;'>☰</span>")
    .Title("").Width(50).Sortable(false).Filterable(false);

@* 2. RequestEnd event *@
.Events(events => events.RequestEnd("initializeDragDropOnce"))
```

```javascript
// 3. JavaScript initialization
var dragDropInitialized = false;
function initializeDragDropOnce(e) {
    if (!dragDropInitialized && e.type === "read") {
        var apiUrl = "@Url.Action("UpdateActivityPriority", "ActivityManagement")";
        var dragDropOptions = {
            sourceType: "DepartmentOpenActivities",  // matches ActivitySourceTypeEnum
            departmentId: @(Model.DepartmentId ?? 0),
            resourceCode: "@Model.ResourceCode"
        };
        setTimeout(function() {
            initializeKendoGridRowReordering("GridId", apiUrl, true, dragDropOptions);
            dragDropInitialized = true;
        }, 100);
    }
}
```

---

### EV-007 - Dedicated Work Assignment Interface ✅ COMPLETED

**Completion Date**: January 2026

**Summary**: 4-step wizard for department managers to assign activities to resources with workload visualization, priority management, and multi-resource support.

#### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      WORK ASSIGNMENT WIZARD                              │
├─────────────────────────────────────────────────────────────────────────┤
│  Step 1: Activity Type     │  Step 2: Resource      │  Step 3: Details  │
│  & Project Selection       │  Selection             │  & Priority       │
│  ─────────────────────     │  ──────────────────    │  ───────────────  │
│  • Activity type selector  │  • Department filter   │  • Description    │
│  • SAP/GR/AC specific      │  • Resource MultiSelect│  • Est. hours/days│
│  • SAP project grid/search │  • Workload indicators │  • Priority calc  │
│                            │  • Activities tabs     │  • Dates          │
├─────────────────────────────────────────────────────────────────────────┤
│  Step 4: Preview & Submit                                               │
│  • Summary of all data • Validation warnings • Submit button            │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Key Files

| Component | File Path |
|-----------|-----------|
| **JavaScript (Modular)** | `GammaTaskManagement/Scripts/WorkAssignmentWizard/*.js` (6 files) |
| **Web API Controller** | `TaskManagementWebApi/Controllers/WorkAssignmentController.cs` |
| **MVC Controller** | `GammaTaskManagement/Controllers/WorkAssignmentController.cs` |
| **Wizard View** | `GammaTaskManagement/Views/WorkAssignment/AssignWorkWizard.cshtml` |
| **Workload Utilities** | `TaskManagementWebApi/Utilities/WorkloadCalculationUtilities.cs` |
| **Activity Creation** | `TaskManagementWebApi/Utilities/ActivityCreationUtilities.cs` |
| **Constants** | `TaskManagementBusinessLayer/BusinessLogic/ApplicationConstants/WorkAssignmentConstants.cs` |
| **FluentValidation** | `TaskManagementBusinessLayer/BusinessLogic/ViewModelValidators/CreateAssignmentRequestViewModelValidator.cs` |
| **User Manual** | `Documentation/EV-007_ManualeUtente_AssegnazioneAttivita.md` |

#### Key Patterns Discovered

1. **Activity.RemainingTime**: Read-only SQL View field - never initialize manually
2. **InitializeActivityTimeline()**: Extension method for Start/End dates initialization
3. **CreateValidationErrorResponse<T>()**: EV-005 error response with `{Errors, SubmittedData}`
4. **WorkloadCalculationUtilities**: End date, workload %, priority slots - accounts for holidays/absences
5. **SAP Projects Cache**: `MemoryCache` with 10-min TTL in MVC controller
6. **Validators Auto-Registration**: `FluentValidationConfig.RegisterValidators()` assembly scanning
7. **DEFAULT_PRIORITY = 1**: Highest priority position, used when resource has no activities

#### JavaScript Modularization Pattern

```javascript
// Load order in BundleConfig.cs (dependency order):
// 1. Utilities (no deps)
// 2. Core (uses Utilities)
// 3. Step1 (uses Utilities, Core)
// 4. Step3 (uses Utilities, Core - needed before Step2)
// 5. Step2 (uses Utilities, Core, Step3)
// 6. Step4 (uses Utilities, Core)
```

#### Workload Calculation Logic

```
WorkloadPercentage = (TotalRemainingDays / AvailableDaysInPeriod) * 100

Color Thresholds (WorkAssignmentConstants):
- Green (#28a745): < 80%
- Yellow (#ffc107): 80-90%
- Red (#dc3545): > 90%

End Date Calculation:
1. WorkDays = EstimatedDays (already in days)
2. Starting from StartDate, count forward WorkDays business days
3. Skip: Saturdays, Sundays, Festivities, ResourceAbsences
```

---

### EV-002 - Configurable Working Hours per Resource ✅ COMPLETED

**Priority**: ALTA | **Completion Date**: March 2026

**User Story**: As an administrator, I want to configure daily working hours per resource with weekly patterns, date-specific overrides, and granular absence management, so that Gantt calculations reflect part-time schedules, irregular weeks, and partial absences accurately.

#### Effective Hours Resolution (3-tier)

For any resource on any given date:
```
1. Check ResourceScheduleOverride for (ResourceId, Date) -> if found, use its WorkingHours
2. Else check ResourceWeeklySchedule for (ResourceId, DayOfWeek) -> if found, use its WorkingHours
3. Else use Resource.DailyWorkingHours (the global default for the resource)
4. Then subtract ResourceAbsence.AbsenceHours for that date:
   - NULL AbsenceHours = full-day absence -> effective hours = 0
   - Numeric AbsenceHours = partial absence -> effective = scheduled - absent
   - Result clamped to minimum 0
```

#### Database Schema (Migration: `0055_UpdateDatabaseScript_ConfigurableWorkingHours.sql`)

| Table | Key Fields | Constraints |
|-------|-----------|-------------|
| `Resource` (modified) | `DailyWorkingHours DECIMAL(4,2) DEFAULT 8.0` | CHECK 0.0-24.0 |
| `ResourceWeeklySchedule` (new) | `ResourceId, DayOfWeek (0-6), WorkingHours` | UNIQUE(ResourceId, DayOfWeek), CHECK 0.0-24.0 |
| `ResourceScheduleOverride` (new) | `ResourceId, OverrideDate, WorkingHours, Description` | UNIQUE(ResourceId, OverrideDate), CHECK 0.0-24.0 |
| `ResourceAbsence` (modified) | `AbsenceDate, AbsenceHours (nullable)` | CHECK AbsenceHours IS NULL OR (>= 0.5 AND <= 24.0) |

**ResourceAbsence has NO unique index on (ResourceId, AbsenceDate)** — intentional, allows multiple absence records per resource per day.

#### Key Stored Procedures

- `InsertResource`: Transactional — creates resource + `InitializeResourceWeeklySchedule` (Mon-Fri = DailyWorkingHours, Sat-Sun = 0) + `InsertAllFestivitiesAsResourceAbsence`
- `UpdateResource`: When `DailyWorkingHours` changes, syncs Mon-Fri weekly schedule rows (NOT Sat-Sun)
- `DeleteResource`: Cascades cleanup of weekly schedules and overrides
- `InsertFestivity`: Transactional — inserts festivity + upgrades partial absences to full-day + creates full-day absence for all resources
- `DeleteFestivity`: Transactional — deletes festivity + removes matching full-day absence entries (WHERE AbsenceHours IS NULL AND AbsenceDescription = FestivityName)
- `InsertResourceScheduleOverride`: Includes duplicate (ResourceId, OverrideDate) check with Italian error message

#### Key Files

| Layer | Files |
|-------|-------|
| **SQL Migration** | `TaskManagementBusinessLayer/BusinessLogic/Database/0055_UpdateDatabaseScript_ConfigurableWorkingHours.sql` |
| **Models** | `Models/ResourceWeeklySchedule.cs`, `Models/ResourceScheduleOverride.cs` |
| **ViewModels** | `ViewModels/ResourceWeeklyScheduleViewModel.cs`, `ViewModels/ResourceScheduleOverrideViewModel.cs` |
| **Validators** | `ViewModelValidators/ResourceWeeklyScheduleViewModelValidator.cs`, `ViewModelValidators/ResourceScheduleOverrideViewModelValidator.cs` |
| **Repositories** | `Repositories/ResourceWeeklyScheduleRepository.cs`, `Repositories/ResourceScheduleOverrideRepository.cs` |
| **Web API** | `TaskManagementWebApi/Controllers/ResourceWeeklyScheduleController.cs`, `ResourceScheduleOverrideController.cs` |
| **MVC** | `GammaTaskManagement/Controllers/ResourceWorkingCalendarController.cs` |
| **View** | `GammaTaskManagement/Views/ResourceWorkingCalendar/ResourceWorkingCalendarPage.cshtml` |
| **Editor Templates** | `Views/Shared/EditorTemplates/WorkingHours.cshtml`, `AbsenceHours.cshtml` |
| **Navigation** | `Scripts/ManageKendoGridCustomization.js` (GoToResourceWorkingCalendarPage) |

#### WorkloadCalculationUtilities — Current State (Pre-EV-003)

`GetBusinessDays()` and `CalculateEndDate()` at `WorkloadCalculationUtilities.cs:128-219`:
- Still use **hardcoded weekend logic** (`DayOfWeek.Saturday/Sunday`) — does NOT use ResourceWeeklySchedule
- Only skip **full-day absences** (`AbsenceHours == NULL`) — partial absences do NOT reduce business day count
- Holidays checked via both Festivity table AND ResourceAbsence table (redundant but harmless — festivities create absence records too)
- EV-003 must refactor these methods to use 3-tier schedule resolution and hours-based calculations

#### Discovered Patterns

1. **Two-Endpoint Delete Pattern**: Every entity controller has TWO delete endpoints: `Delete{Entity}({Entity} entity)` (full object) and `Delete{Entity}ById(int Id)` (scalar). MVC layer uses entity-based; ById exists for direct API consumers.

2. **Nullable Numeric Editor Templates**: All Kendo numeric editor templates use `decimal?` (nullable). Kendo's in-cell editing lifecycle may pass null during transitions — nullable prevents binding errors.

3. **DB bigint vs C# int Pattern**: Tables use `bigint` for Id but C# models use `int`. Consistent across entire codebase. Dapper's implicit widening handles conversion safely.

4. **Resource Sub-Pages Open in New Tabs**: Pages like `ResourceWorkingCalendarPage` and `ResourceAbsencePage` open via `window.open(..., '_blank')` from Resource grid. No "Back" buttons needed.

5. **AbsenceHours Minimum is 0.5**: FluentValidation and SQL CHECK constraint enforce `AbsenceHours >= 0.5`. NULL = full-day absence, numeric >= 0.5 = partial. An absence of 0 hours is semantically meaningless.

6. **30-Minute Granularity on All Hours Fields**: All hours fields enforce multiples of 0.5 via FluentValidation `.Must(v => v % 0.5m == 0)`. Aligns with UI NumericTextBox `step=0.5`.

7. **WeeklySchedule Grid Sort from SQL**: The SP returns rows ordered Mon->Sun via `CASE WHEN DayOfWeek = 0 THEN 7 ELSE DayOfWeek END`. Grid sorting is disabled (`.Sortable(false)`). No Kendo DataSource `.Sort()` needed.

8. **DailyWorkingHours Change Warning Pattern**: When batch-edit modifies a field with cascading side-effects, intercept `SaveChanges` event, inspect `data[i].dirtyFields`, and show `confirm()` dialog stating which records are affected and which are NOT.

9. **DayOfWeekName Computed in SQL**: The `DayOfWeekName` field (Italian day names) is computed via a CASE expression in the `GetResourceWeeklyScheduleByResourceId` SP, not in C# code.

---

### Phase 3: EV-003 - Modified Gantt Date Calculation Algorithm ✅ COMPLETED

**Priority**: ALTA | **Dependencies**: EV-002 ✅ complete | **Completion Date**: April 2026

**User Story**: As any user, I want Gantt completion dates to be accurate for part-time resources.

**Design Spec**: `specs/EV-003_Modified_Gantt_Date_Calculation_Algorithm.md`
**Implementation Plan**: `specs/EV-003_Implementation_Plan.md`

#### Key Design Decisions

| Decision | Choice |
|----------|--------|
| Storage unit | Days (1 day = 8 hours, universal constant) |
| Recalculation triggers | Manual "Update Gantt" button only — NO automatic triggers on CRUD |
| Database schema | No new columns — use existing StartDate/EndDate |
| Unassigned activities | 8h/day default (Mon-Fri, skip festivities via FestivityRepository) |
| EndDate convention | **Exclusive** (day AFTER last working day) — matches Kendo Gantt 2018.1.221 |
| Architecture | New shared `ResourceCapacityUtilities` class in WebApi layer |
| Safety guard | MAX_CALENDAR_DAYS = 730 (2 years, for part-time resources) |

#### Architecture: `ResourceCapacityUtilities`

New class at `TaskManagementWebApi/Utilities/ResourceCapacityUtilities.cs`. Encapsulates 3-tier schedule resolution (Override → WeeklySchedule → DailyWorkingHours) and hours-based date distribution. Exposed via WebApi endpoint for MVC access.

```
ResourceCapacityUtilities              ← core: schedule resolution + date calculation
  ↑ used by
  ├── TaskManagementServices           ← Gantt update (via HTTP POST to ResourceCapacityController)
  └── WorkloadCalculationUtilities     ← workload %, end date preview (direct call, same layer)
```

**Core Algorithm**: Convert `RemainingTime` (days) → hours (× 8), then distribute day-by-day across the resource's schedule. Zero-capacity days (weekends via WeeklySchedule, absences, overrides with 0h) are skipped. Partial absences reduce effective hours on that day. Returns exclusive EndDate (last working day + 1) for Gantt chaining.

**Batch Gantt Endpoint**: `ResourceCapacityController.CalculateGanttDates` accepts a `GanttCalculationRequest` with all activities for one resource, pre-fetches schedule data once, then chains: `activity[k].StartDate = activity[k-1].EndDate`. One HTTP call per resource instead of per activity.

#### Key Files

| Component | File Path |
|-----------|-----------|
| **Core Utility** | `TaskManagementWebApi/Utilities/ResourceCapacityUtilities.cs` |
| **WebApi Controller** | `TaskManagementWebApi/Controllers/ResourceCapacityController.cs` |
| **Request/Response Models** | `TaskManagementBusinessLayer/BusinessLogic/Models/GanttCalculationRequest.cs`, `GanttCalculationResponse.cs` |
| **API Constant** | `TaskManagementApi.ResourceCapacityApi.CalculateGanttDatesAction` |
| **SQL Migration** | `TaskManagementBusinessLayer/BusinessLogic/Database/0057_UpdateDatabaseScript_GanttDateCalculation.sql` |
| **User Manual** | `Documentazione/Evolutive/2025/EV-003_ManualeUtente_CalcoloDateGantt.md` |
| **Modified: Workload** | `TaskManagementWebApi/Utilities/WorkloadCalculationUtilities.cs` |
| **Modified: Gantt Update** | `GammaTaskManagement/Services/TaskManagementServices.cs` (region: Gantt Update) |
| **Modified: Assignment** | `TaskManagementWebApi/Controllers/WorkAssignmentController.cs` |

#### Discovered Patterns

1. **Batch API for Gantt Chains**: Instead of N HTTP calls (one per activity), bundle all activities for one resource into a single `GanttCalculationRequest`. Pre-fetch schedule data once, then calculate all dates in sequence. Apply this pattern if EV-004 (parallel work) needs similar batching.

2. **MVC→WebApi HTTP POST Pattern (async)**: Use `Invoke.getHttpResponseMessageFromHttpPostAsync()` with JSON serialization for complex request objects. Always check `response.IsSuccessStatusCode` before deserializing — `BadRequest` returns `{"Message":"..."}` which cannot be deserialized as the expected response type.

3. **Exclusive EndDate Convention**: `EndDate = lastWorkingDay + 1 day`. Kendo Gantt 2018.1.221 expects this. All Gantt views use `kendo.date.addDays(end, -1)` in week/month headers. `InsertTask` and `UpdateTask` both use `(End - Start)` arithmetic assuming exclusive EndDate. Kendo Grid views display the raw exclusive date without adjustment (pre-existing behavior, not a regression).

4. **Unassigned Activities Use Festivities, Not Absences**: When `ResourceId = 0`, `CalculateGanttDatesForUnassigned` uses `FestivityRepository.GetFestivitiesByDateRange()` to skip public holidays. It does NOT use ResourceAbsence (no resource = no absences). Every activity is assigned to at least one department, so the "completely unassigned" path in `GetAllCompletelyUnassignedActivitiesAmongActivityList` is unused by `UpdateGanttTimeline`.

5. **Pre-fetch with Extension Strategy**: Override and absence data require a date range, but the end date is unknown upfront. Estimate an initial range (`totalHours / minDailyHours * 2`), pre-fetch, then extend and re-fetch if the algorithm runs past the estimate (rare edge case).

#### Post-Review Fixes (April 2026)

| Fix | Description |
|-----|-------------|
| HTTP status check | `CalculateGanttDatesApi` now checks `response.IsSuccessStatusCode` before deserializing; throws `ApplicationException` with API error body on failure |
| Null safety | `UpdateAssignedActivitiesGanttTimeline` and `UpdateUnassignedActivitiesGanttTimeline` guard against `ganttResponse?.Results == null` |
| Comment clarification | `MAX_CALENDAR_DAYS = 730` comment explains rationale (part-time resources spanning >1 year) |

---

### Phase 3: EV-004 - Parallel Work Support in Gantt

**Priority**: MEDIA | **Dependencies**: EV-003 complete

**User Story**: As a department manager, I want to assign multiple works to a resource simultaneously with allocation percentages.

**Key Tasks**:
- [ ] Add `AllocationPercentage` field to `ActivityResource` junction table
- [ ] Modify Gantt calculation: `EffectiveHours = WorkingHoursPerDay * (AllocationPercentage / 100)`
- [ ] Validation: Sum of allocations per resource ≤ 100%

---

### EV-008 - Report Interface with Preset Filters ✅ COMPLETED

**Completion Date**: February 2026

**Summary**: Unified report download interface with 13 report categories (10 Excel + 3 Gantt), filter panel with department/resource/status/date/entity-specific filters, preset buttons, and cascading dropdowns. Major backend consolidation: 52 scope-specific ByTimeRange endpoints → 10 unified endpoints using enhanced `ActivityDataKeys`.

#### Key Files

| Component | File Path |
|-----------|-----------|
| **MVC Controller** | `GammaTaskManagement/Controllers/ReportController.cs` |
| **View** | `GammaTaskManagement/Views/Report/ReportPage.cshtml` |
| **Filter JS** | `GammaTaskManagement/Scripts/ManageReportFilters.js` |
| **ViewModel** | `GammaTaskManagement/ViewModels/ReportViewModel.cs` |
| **Web API Controller** | `TaskManagementWebApi/Controllers/ReportController.cs` |
| **Data Model** | `TaskManagementBusinessLayer/BusinessLogic/Models/ActivityDataKeys.cs` |
| **SQL Migration** | `TaskManagementBusinessLayer/BusinessLogic/Database/0054_UpdateDatabaseScript_ReportPresetFilters.sql` |

#### Reusable Patterns

1. **Backward-Compatible Filter Expansion**: Adding nullable properties to `ActivityDataKeys` preserved all existing Kendo Grid callers — new fields default to null/false, so stored procedures return unfiltered results when not supplied. Apply this pattern when adding filter parameters to any shared data model.

2. **SP Filter Pattern with EXISTS**: Use `EXISTS (SELECT 1 FROM ...)` instead of JOINs for optional filters — zero overhead when parameter is NULL:
   ```sql
   AND (@DepartmentId IS NULL OR EXISTS (
       SELECT 1 FROM ResourceActivity RA
       INNER JOIN Resource R ON RA.ResourceCode = R.ResourceCode
       WHERE RA.ActivityId = A.Id AND R.DepartmentId = @DepartmentId))
   ```

3. **Kendo Cascade Pattern**: Use `.Events(e => e.Change("onParentChange"))` + `dataSource.read()` on child. Provide filter params via `.DataSource(ds => ds.Read(r => r.Data("getFilterParams")))`. Pre-loaded data (via ViewData) needs no async guard; remote data needs `setDataSource()` with new DataSource on parent change.

4. **File Download from MVC Form POST**: Returns `FileResult` without page reload — UI state changes (disabled buttons, spinners) persist. Disabling a submit button synchronously in `onclick` prevents the form POST entirely.

5. **Kendo Button Name → HTML ID**: `.Name("ApplyFilter")` renders as `id="ApplyFilter"`. Always check the Razor `.Name()` value when targeting Kendo buttons in JS.

---

### EV-009 - Automated Excel Data Conversion ✅ COMPLETED

**Completion Date**: February 2026

**Summary**: Fixed `InsertColumnValues<T>` type routing in `ExcelReportUtilities.cs` so all numeric types and nullable dates export as native Excel types instead of text. Added `InsertIntegerColumn` and `InsertDecimalColumn` methods, wired existing `InsertNullableDateTimeColumn`. All 22 report methods and 46 server-side export views automatically fixed via the centralized routing change.

#### Key Files

| Component | File Path |
|-----------|-----------|
| **Excel Generation** | `ExcelUtilities/ExcelReportUtilities.cs` |
| **EPPlus Package** | EPPlus 4.5.3.2 (via `ExcelUtilities/packages.config`) |

#### Type Routing Reference (`InsertColumnValues<T>`)

| C# Type | Method | Excel Format |
|---------|--------|-------------|
| `string` | `InsertTextColumn` | Text |
| `DateTime` | `InsertDateTimeColumn` | `dd/MM/yyyy HH:mm:ss` |
| `DateTime?` | `InsertNullableDateTimeColumn` | `dd/MM/yyyy HH:mm:ss` |
| `int`, `int?` | `InsertIntegerColumn` | `#,##0` |
| `decimal`, `double`, `float` + nullable | `InsertDecimalColumn` | `#,##0.00` |
| `bool` | `InsertTextColumn` | Text (intentional) |

#### Reusable Patterns

1. **EPPlus Cell-by-Cell for Nullable Types**: `LoadFromCollection()` converts nulls to 0 for value types. Use cell-by-cell assignment with `value.HasValue` check to leave cells empty for null values.

2. **Locale-Neutral Excel Formats**: `#,##0` and `#,##0.00` are locale-neutral — Excel applies the user's locale (Italian comma as decimal separator) automatically at display time. Never hardcode locale-specific separators in format strings.

3. **Centralized Type Routing**: All 22 report methods call `InsertColumnValues<T>` — fixing routing in one place propagates to all exports. When adding new column types, add the method and wire it in `InsertColumnValues<T>`.

---

## Feature Dependencies

```
EV-005 ─┬─→ EV-001
EV-006 ─┘
EV-005 ───→ EV-007 ✅
EV-002 ───→ EV-003 ───→ EV-004
EV-008 ✅ (independent)
EV-009 ✅ (independent)
```

---

## Global Patterns & Utilities

### Architecture Rule
```
Browser → MVC Controller → Service Layer → Web API → Repository → Database
NO DIRECT BROWSER → WEB API CALLS
```

### Utility Classes (Reusable)
| Class | Purpose |
|-------|---------|
| `ResourceCapacityUtilities` | 3-tier schedule resolution, hours-based date calculation, Gantt batch dates |
| `PriorityManagementUtilities` | Priority calculation, rebalancing |
| `WorkloadCalculationUtilities` | Workload %, end date (delegates to ResourceCapacityUtilities), priority slots |
| `ActivityCreationUtilities` | Type-specific entity creation |
| `ManageDataUtilities` | `GetActivitiesBySourceType()` |

### JavaScript Modules (Reusable)
| File | Purpose |
|------|---------|
| `ManageKendoGridRowReordering.js` | Drag & drop for any grid |
| `ManageValidationErrorPersistence.js` | Form data recovery |
| `ManageKendoNotification.js` | Centralized notifications |
| `ManageKendoGrid.js` | Grid utilities, repopulation |
| `ManageReportFilters.js` | Report filter panel, presets, cascades |

---

## Progress Tracking

**Update this document when**:
- Completing features (update status)
- Discovering new reusable patterns
- Identifying dependencies

**Completed**: 8/9 features (EV-001, EV-002, EV-003, EV-005, EV-006, EV-007, EV-008, EV-009)
**Next Implementation**: EV-004 (Parallel Work Support in Gantt)
