# EV-003: Modified Gantt Date Calculation Algorithm — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded 8h/day Gantt date calculation with hours-based calculation using the 3-tier schedule resolution (Override → WeeklySchedule → DailyWorkingHours), so part-time resources get accurate completion dates.

**Architecture:** New `ResourceCapacityUtilities` class in WebApi layer encapsulates 3-tier resolution and hours-based date distribution. Exposed via a WebApi endpoint. MVC `TaskManagementServices` calls it via HTTP (following existing MVC→WebApi communication pattern). `WorkloadCalculationUtilities` calls it directly (same layer). Both callers share identical algorithm.

**Tech Stack:** ASP.NET MVC 5 / Web API 2, .NET Framework 4.7.2, Unity DI, Kendo UI 2018.1.221

**Design Spec:** `Documentazione/Evolutive/2025/specs/EV-003_Modified_Gantt_Date_Calculation_Algorithm.md`

**Codebase Root:** `D:\GammaTaskManagement\GammaTaskManagement`

**Solution File:** `GammaTaskManagement.sln`

**Build Command:** `msbuild GammaTaskManagement.sln /t:Build /verbosity:minimal`

**IMPORTANT — .NET Framework `.csproj` Convention:** This project uses **explicit** `<Compile Include="...">` entries. Every new `.cs` file MUST be added to its project's `.csproj`, and every deleted `.cs` file MUST be removed from its `.csproj`. Forgetting this causes the file to exist on disk but not compile.

---

## Architecture Note: MVC→WebApi Boundary

`TaskManagementServices` (MVC layer) communicates with WebApi exclusively via HTTP using `Invoke.getResponseJSON()`. It does NOT have direct access to WebApi utility classes or `IUnitOfWork`. This means:

- `ResourceCapacityUtilities` lives in `TaskManagementWebApi/Utilities/` (needs `IUnitOfWork`)
- A WebApi endpoint exposes `CalculateEndDateFromDays` via HTTP
- MVC calls the endpoint through an API wrapper method (same pattern as `GetAllResourceAbsencesByResourceIdApi()`)
- `WorkloadCalculationUtilities` (same WebApi layer) calls `ResourceCapacityUtilities` directly

---

## Reference: Existing Patterns to Follow

### MVC→WebApi HTTP Call Pattern

MVC service methods call WebApi via `Invoke.getResponseJSON()` with `NameValueCollection` parameters. Example from `TaskManagementServices.cs:1363`:

```csharp
public IEnumerable<ResourceAbsence> GetAllResourceAbsencesByResourceIdApi(int ResourceId)
{
    NameValueCollection resourceAbsenceParameters = new NameValueCollection();
    resourceAbsenceParameters.Add("ResourceId", ResourceId.ToString());

    string responseJson = Invoke.getResponseJSON(TaskManagementWebApiBaseAddress, TaskManagementApi.ResourceAbsenceApi.GetAllResourceAbsencesByResourceIdAction, resourceAbsenceParameters);
    return JsonConvert.DeserializeObject<IEnumerable<ResourceAbsence>>(responseJson);
}
```

- `TaskManagementWebApiBaseAddress` — static field reading from `ConfigurationManager.AppSettings`
- `TaskManagementApi.*` — static URL constants in `TaskManagementBusinessLayer/BusinessLogic/ApplicationConstants/TaskManagementApi.cs`
- `Invoke` — utility class in `Utilities.WebApi` namespace
- Public API wrapper methods in `TaskManagementServices` must also be declared in `ITaskManagementServices` interface at `GammaTaskManagement/Interfaces/Services/ITaskManagementServices.cs`

### Unity DI Registration Pattern

In `TaskManagementWebApi/App_Start/UnityConfig.cs:51-55`:

```csharp
container.RegisterType<ManageDataUtilities, ManageDataUtilities>();
container.RegisterType<PriorityManagementUtilities, PriorityManagementUtilities>();
container.RegisterType<WorkloadCalculationUtilities, WorkloadCalculationUtilities>();
container.RegisterType<ActivityCreationUtilities, ActivityCreationUtilities>();
container.RegisterType<ActivityStatusUtilities, ActivityStatusUtilities>();
```

All utility classes receive `IUnitOfWork` via constructor injection. Unity resolves this automatically.

### WebApi Controller Pattern

All WebApi controllers inherit from `TraceApiController` (at `TaskManagementWebApi/Controllers/TraceApiController.cs`). They use `[RoutePrefix]` and `[Route]` attributes. Constructor injection for dependencies.

### Repository Interfaces Available (via `IUnitOfWork`)

```csharp
// IUnitOfWork properties:
IResourceRepository ResourceRepository { get; }                          // .GetResourceById(int Id)
IResourceWeeklyScheduleRepository ResourceWeeklyScheduleRepository { get; }  // .GetResourceWeeklyScheduleByResourceId(int ResourceId) → 7 rows
IResourceScheduleOverrideRepository ResourceScheduleOverrideRepository { get; }  // .GetResourceScheduleOverridesByResourceIdAndDateRange(int ResourceId, DateTime StartDate, DateTime EndDate)
IResourceAbsenceRepository ResourceAbsenceRepository { get; }            // .GetAllResourceAbsencesByResourceId(int ResourceId)
```

### Key Model Structures

```csharp
// ResourceWeeklySchedule — 7 rows per resource (Mon-Sun)
public class ResourceWeeklySchedule {
    public int Id { get; set; }
    public int ResourceId { get; set; }
    public int DayOfWeek { get; set; }        // .NET convention: 0=Sunday, 1=Monday, ..., 6=Saturday
    public string DayOfWeekName { get; set; }
    public decimal WorkingHours { get; set; }  // 0.0-24.0
}

// ResourceScheduleOverride — date-specific overrides
public class ResourceScheduleOverride {
    public int Id { get; set; }
    public int ResourceId { get; set; }
    public DateTime OverrideDate { get; set; }
    public decimal WorkingHours { get; set; }  // 0.0-24.0
    public string Description { get; set; }
}

// ResourceAbsence — per-day absence records
public class ResourceAbsence {
    public int Id { get; set; }
    public int ResourceId { get; set; }
    public DateTime AbsenceDate { get; set; }
    public decimal? AbsenceHours { get; set; }  // NULL=full-day, >=0.5=partial
    public string AbsenceDescription { get; set; }
}

// Resource — DailyWorkingHours is the tier-3 fallback
public class Resource {
    public int Id { get; set; }
    public string ResourceCode { get; set; }
    public decimal DailyWorkingHours { get; set; }  // Default 8.0
    // ... other fields
}
```

### Constants

```csharp
// WorkAssignmentConstants (TaskManagementBusinessLayer/BusinessLogic/ApplicationConstants/WorkAssignmentConstants.cs)
public const double DEFAULT_WORKING_HOURS_PER_DAY = 8.0;
```

---

## File Map

### New Files

| File | Responsibility |
|------|---------------|
| `TaskManagementWebApi/Utilities/ResourceCapacityUtilities.cs` | Core: 3-tier schedule resolution + hours-based date calculation |
| `TaskManagementWebApi/Controllers/ResourceCapacityController.cs` | WebApi endpoint exposing `CalculateEndDateFromDays` |

### Modified Files

| File | Change Summary |
|------|---------------|
| `TaskManagementBusinessLayer/BusinessLogic/ApplicationConstants/TaskManagementApi.cs` | Add `ResourceCapacityApi` static class with endpoint URL constant |
| `TaskManagementWebApi/App_Start/UnityConfig.cs` | Register `ResourceCapacityUtilities` |
| `TaskManagementWebApi/Utilities/WorkloadCalculationUtilities.cs` | Add `ResourceCapacityUtilities` dependency; delegate `CalculateEndDate`; rename `GetBusinessDays` → `GetAvailableHours`; update workload formulas to hours-based |
| `TaskManagementWebApi/Controllers/WorkAssignmentController.cs` | Update `GetBusinessDays` → `GetAvailableHours`; convert days→hours in workload calc |
| `GammaTaskManagement/Services/TaskManagementServices.cs` | Add `CalculateEndDateFromDaysApi` wrapper; simplify `CalculateActivityEndDate`; remove 9 private methods; pass `resource.Id` in `UpdateAssignedActivitiesGanttTimeline` |
| `GammaTaskManagement/Interfaces/Services/ITaskManagementServices.cs` | Add `CalculateEndDateFromDaysApi` method declaration |
| `TaskManagementWebApi/TaskManagementWebApi.csproj` | Add `<Compile Include>` for `ResourceCapacityUtilities.cs` and `ResourceCapacityController.cs` |
| `TaskManagementBusinessLayer/TaskManagementBusinessLayer.csproj` | Remove `<Compile Include>` for `DateTimeUtilities.cs` |

### Deleted Files

| File | Reason |
|------|--------|
| `TaskManagementBusinessLayer/Utilities/DateTimeUtilities.cs` | All methods dead code after refactoring |

### Cleanup (Method Removal)

| File | Methods Removed |
|------|----------------|
| `TaskManagementBusinessLayer/BusinessLogic/Models/Activity.cs` | `GetNumberOfWorkingDays`, `GetNumberOfFestivityDays`, `GetOverlappingResourceAbsences` |
| `TaskManagementBusinessLayer/BusinessLogic/ViewModels/ActivityViewModel.cs` | `GetNumberOfWorkingDays`, `GetNumberOfFestivityDays`, `GetOverlappingResourceAbsences` |
| `GammaTaskManagement/Services/TaskManagementServices.cs` | 9 private methods (see Task 6) |

---

## Task 1: Create `ResourceCapacityUtilities` — 3-Tier Resolution

**Files:**
- Create: `TaskManagementWebApi/Utilities/ResourceCapacityUtilities.cs`

This is the core class. It resolves effective working hours per date using the 3-tier hierarchy and calculates end dates by distributing hours across the resource's schedule.

- [ ] **Step 1: Create `ResourceCapacityUtilities.cs` with constructor and constants**

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using TaskManagementBusinessLayer.BusinessLogic.Models;
using TaskManagementBusinessLayer.BusinessLogic.ApplicationConstants;
using TaskManagementBusinessLayer.Interfaces.UnitOfWork;

namespace TaskManagementWebApi.Utilities
{
    /// <summary>
    /// Core utility for resource capacity resolution and hours-based date calculation.
    /// Uses 3-tier schedule resolution: Override → WeeklySchedule → DailyWorkingHours.
    /// Shared by TaskManagementServices (via WebApi endpoint) and WorkloadCalculationUtilities (direct).
    /// </summary>
    public class ResourceCapacityUtilities
    {
        private readonly IUnitOfWork _unitOfWork;

        /// <summary>
        /// Maximum calendar days to scan before throwing. Prevents infinite loops
        /// when a resource has zero capacity on all days (misconfiguration).
        /// </summary>
        private const int MAX_CALENDAR_DAYS = 365;

        public ResourceCapacityUtilities(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }
    }
}
```

- [ ] **Step 2: Add `GetEffectiveHoursForDate` — single-date 3-tier resolution**

Add this method to `ResourceCapacityUtilities`:

```csharp
/// <summary>
/// Returns effective working hours for a resource on a specific date.
/// Resolution: Override → WeeklySchedule → DailyWorkingHours, then subtract absences.
/// </summary>
public decimal GetEffectiveHoursForDate(int resourceId, DateTime date,
    IEnumerable<ResourceScheduleOverride> overrides,
    IEnumerable<ResourceWeeklySchedule> weeklySchedule,
    decimal dailyWorkingHours,
    IEnumerable<ResourceAbsence> absences)
{
    // Tier 1: Check override for this specific date
    var dateOverride = overrides.FirstOrDefault(o => o.OverrideDate.Date == date.Date);
    decimal scheduledHours;

    if (dateOverride != null)
    {
        scheduledHours = dateOverride.WorkingHours;
    }
    else
    {
        // Tier 2: Check weekly schedule for this day of week
        // ResourceWeeklySchedule.DayOfWeek uses .NET convention: 0=Sunday, 1=Monday, ..., 6=Saturday
        var daySchedule = weeklySchedule.FirstOrDefault(w => w.DayOfWeek == (int)date.DayOfWeek);

        if (daySchedule != null)
        {
            scheduledHours = daySchedule.WorkingHours;
        }
        else
        {
            // Tier 3: Use resource default
            scheduledHours = dailyWorkingHours;
        }
    }

    // If no scheduled hours, skip absence check
    if (scheduledHours <= 0)
        return 0m;

    // Subtract absences for this date
    var dayAbsences = absences.Where(a => a.AbsenceDate.Date == date.Date);

    if (dayAbsences.Any())
    {
        // NULL AbsenceHours = full-day absence → entire day unavailable
        if (dayAbsences.Any(a => !a.AbsenceHours.HasValue))
            return 0m;

        // Partial absences: subtract sum of absence hours
        decimal totalAbsenceHours = dayAbsences.Sum(a => a.AbsenceHours.Value);
        return Math.Max(scheduledHours - totalAbsenceHours, 0m);
    }

    return scheduledHours;
}
```

- [ ] **Step 3: Add `GetEffectiveHoursForDateRange` — batch version**

Add this method to `ResourceCapacityUtilities`:

```csharp
/// <summary>
/// Returns effective working hours for each date in a range.
/// Pre-fetches all schedule data in 4 queries to avoid N+1.
/// </summary>
public Dictionary<DateTime, decimal> GetEffectiveHoursForDateRange(int resourceId, DateTime startDate, DateTime endDate)
{
    // Pre-fetch all data (4 queries)
    Resource resource = _unitOfWork.ResourceRepository.GetResourceById(resourceId);
    decimal dailyWorkingHours = resource?.DailyWorkingHours ?? (decimal)WorkAssignmentConstants.DEFAULT_WORKING_HOURS_PER_DAY;

    IEnumerable<ResourceWeeklySchedule> weeklySchedule = _unitOfWork.ResourceWeeklyScheduleRepository
        .GetResourceWeeklyScheduleByResourceId(resourceId);

    IEnumerable<ResourceScheduleOverride> overrides = _unitOfWork.ResourceScheduleOverrideRepository
        .GetResourceScheduleOverridesByResourceIdAndDateRange(resourceId, startDate, endDate);

    IEnumerable<ResourceAbsence> absences = _unitOfWork.ResourceAbsenceRepository
        .GetAllResourceAbsencesByResourceId(resourceId);

    // Resolve each date in-memory
    var result = new Dictionary<DateTime, decimal>();
    DateTime current = startDate.Date;

    while (current <= endDate.Date)
    {
        result[current] = GetEffectiveHoursForDate(resourceId, current, overrides, weeklySchedule, dailyWorkingHours, absences);
        current = current.AddDays(1);
    }

    return result;
}
```

- [ ] **Step 4: Add `CalculateEndDateFromHours` — core date calculation algorithm**

Add this method to `ResourceCapacityUtilities`:

```csharp
/// <summary>
/// Distributes totalHours across the resource's schedule day by day.
/// Skips zero-capacity days (weekends, absences, overrides with 0h).
/// Returns the date when all hours are consumed.
/// </summary>
public DateTime CalculateEndDateFromHours(decimal totalHours, DateTime startDate, int resourceId)
{
    if (totalHours <= 0)
        return startDate;

    // Pre-fetch resource data
    Resource resource = _unitOfWork.ResourceRepository.GetResourceById(resourceId);
    decimal dailyWorkingHours = resource?.DailyWorkingHours ?? (decimal)WorkAssignmentConstants.DEFAULT_WORKING_HOURS_PER_DAY;

    IEnumerable<ResourceWeeklySchedule> weeklySchedule = _unitOfWork.ResourceWeeklyScheduleRepository
        .GetResourceWeeklyScheduleByResourceId(resourceId);

    IEnumerable<ResourceAbsence> absences = _unitOfWork.ResourceAbsenceRepository
        .GetAllResourceAbsencesByResourceId(resourceId);

    // Pre-fetch overrides with generous estimate for date range
    decimal minDailyHours = GetMinNonZeroDailyHours(weeklySchedule, dailyWorkingHours);
    int estimatedDays = minDailyHours > 0
        ? (int)Math.Ceiling((double)(totalHours / minDailyHours) * 2)
        : MAX_CALENDAR_DAYS;
    DateTime estimatedEndDate = startDate.AddDays(Math.Min(estimatedDays, MAX_CALENDAR_DAYS));

    IEnumerable<ResourceScheduleOverride> overrides = _unitOfWork.ResourceScheduleOverrideRepository
        .GetResourceScheduleOverridesByResourceIdAndDateRange(resourceId, startDate, estimatedEndDate);

    // Distribute hours day by day
    decimal remainingHours = totalHours;
    DateTime currentDate = startDate.Date;

    while (remainingHours > 0)
    {
        // Safety guard: prevent infinite loop for misconfigured resources
        if ((currentDate - startDate.Date).Days > MAX_CALENDAR_DAYS)
        {
            throw new InvalidOperationException(
                $"Impossibile calcolare la data fine: nessuna capacità lavorativa trovata per la risorsa nei prossimi {MAX_CALENDAR_DAYS} giorni.");
        }

        // Re-fetch overrides if we've gone past the initial estimate (rare edge case)
        if (currentDate > estimatedEndDate)
        {
            DateTime newEstimatedEndDate = currentDate.AddDays(estimatedDays);
            overrides = _unitOfWork.ResourceScheduleOverrideRepository
                .GetResourceScheduleOverridesByResourceIdAndDateRange(resourceId, estimatedEndDate, newEstimatedEndDate);
            estimatedEndDate = newEstimatedEndDate;
        }

        decimal effectiveHours = GetEffectiveHoursForDate(resourceId, currentDate, overrides, weeklySchedule, dailyWorkingHours, absences);

        if (effectiveHours > 0)
        {
            remainingHours -= effectiveHours;
        }

        if (remainingHours > 0)
        {
            currentDate = currentDate.AddDays(1);
        }
    }

    return currentDate;
}

/// <summary>
/// Gets the minimum non-zero daily hours from weekly schedule, used for estimating date ranges.
/// Falls back to dailyWorkingHours if all weekly schedule entries are zero.
/// </summary>
private decimal GetMinNonZeroDailyHours(IEnumerable<ResourceWeeklySchedule> weeklySchedule, decimal dailyWorkingHours)
{
    var nonZeroHours = weeklySchedule.Where(w => w.WorkingHours > 0).Select(w => w.WorkingHours);
    if (nonZeroHours.Any())
        return nonZeroHours.Min();
    return dailyWorkingHours > 0 ? dailyWorkingHours : 1m; // Fallback to avoid division by zero
}
```

- [ ] **Step 5: Add `CalculateEndDateFromDays` — both overloads**

Add these methods to `ResourceCapacityUtilities`:

```csharp
/// <summary>
/// Converts estimatedDays to hours (× 8) then delegates to CalculateEndDateFromHours.
/// Convention: 1 day = DEFAULT_WORKING_HOURS_PER_DAY (8.0) hours, universal for all resources.
/// </summary>
public DateTime CalculateEndDateFromDays(double estimatedDays, DateTime startDate, int resourceId)
{
    if (estimatedDays <= 0)
        return startDate;

    decimal totalHours = (decimal)(estimatedDays * WorkAssignmentConstants.DEFAULT_WORKING_HOURS_PER_DAY);
    return CalculateEndDateFromHours(totalHours, startDate, resourceId);
}

/// <summary>
/// Overload for unassigned activities (no resource).
/// Uses system default: 8h/day Mon-Fri, no absences.
/// </summary>
public DateTime CalculateEndDateFromDays(double estimatedDays, DateTime startDate)
{
    if (estimatedDays <= 0)
        return startDate;

    decimal totalHours = (decimal)(estimatedDays * WorkAssignmentConstants.DEFAULT_WORKING_HOURS_PER_DAY);
    decimal hoursPerDay = (decimal)WorkAssignmentConstants.DEFAULT_WORKING_HOURS_PER_DAY;
    decimal remainingHours = totalHours;
    DateTime currentDate = startDate.Date;

    while (remainingHours > 0)
    {
        if ((currentDate - startDate.Date).Days > MAX_CALENDAR_DAYS)
        {
            throw new InvalidOperationException(
                $"Impossibile calcolare la data fine: nessuna capacità lavorativa trovata nei prossimi {MAX_CALENDAR_DAYS} giorni.");
        }

        // Default schedule: Mon-Fri = 8h, Sat-Sun = 0h
        if (currentDate.DayOfWeek != DayOfWeek.Saturday && currentDate.DayOfWeek != DayOfWeek.Sunday)
        {
            remainingHours -= hoursPerDay;
        }

        if (remainingHours > 0)
        {
            currentDate = currentDate.AddDays(1);
        }
    }

    return currentDate;
}
```

- [ ] **Step 6: Add to `.csproj`**

In `TaskManagementWebApi/TaskManagementWebApi.csproj`, add after line 299 (`<Compile Include="Utilities\WorkloadCalculationUtilities.cs" />`):

```xml
    <Compile Include="Utilities\ResourceCapacityUtilities.cs" />
```

- [ ] **Step 7: Verify the project builds**

Run: `msbuild TaskManagementWebApi/TaskManagementWebApi.csproj /t:Build /verbosity:minimal`
Expected: Build succeeds (class exists but no callers yet)

- [ ] **Step 8: Commit**

```bash
git add TaskManagementWebApi/Utilities/ResourceCapacityUtilities.cs TaskManagementWebApi/TaskManagementWebApi.csproj
git commit -m "feat(EV-003): add ResourceCapacityUtilities with 3-tier resolution and hours-based date calculation"
```

---

## Task 2: Register `ResourceCapacityUtilities` in Unity DI

**Files:**
- Modify: `TaskManagementWebApi/App_Start/UnityConfig.cs:54` (after `WorkloadCalculationUtilities` registration)

- [ ] **Step 1: Add registration line**

In `TaskManagementWebApi/App_Start/UnityConfig.cs`, add after line 54 (`container.RegisterType<ActivityCreationUtilities, ActivityCreationUtilities>();`):

```csharp
            container.RegisterType<ResourceCapacityUtilities, ResourceCapacityUtilities>();
```

- [ ] **Step 2: Verify the project builds**

Run: `msbuild TaskManagementWebApi/TaskManagementWebApi.csproj /t:Build /verbosity:minimal`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add TaskManagementWebApi/App_Start/UnityConfig.cs
git commit -m "feat(EV-003): register ResourceCapacityUtilities in Unity DI container"
```

---

## Task 3: Create WebApi Endpoint for Date Calculation

**Files:**
- Create: `TaskManagementWebApi/Controllers/ResourceCapacityController.cs`
- Modify: `TaskManagementBusinessLayer/BusinessLogic/ApplicationConstants/TaskManagementApi.cs`

The MVC layer needs to call `ResourceCapacityUtilities` via HTTP. This task creates the WebApi endpoint and the API URL constant.

- [ ] **Step 1: Create `ResourceCapacityController.cs`**

```csharp
using System;
using System.Web.Http;
using TaskManagementWebApi.Utilities;

namespace TaskManagementWebApi.Controllers
{
    /// <summary>
    /// Web API Controller for resource capacity calculations.
    /// Exposes ResourceCapacityUtilities methods for cross-layer access (MVC → WebApi).
    /// </summary>
    [RoutePrefix("ResourceCapacity")]
    public class ResourceCapacityController : TraceApiController
    {
        private readonly ResourceCapacityUtilities _resourceCapacityUtilities;

        public ResourceCapacityController(ResourceCapacityUtilities resourceCapacityUtilities)
        {
            _resourceCapacityUtilities = resourceCapacityUtilities;
        }

        /// <summary>
        /// Calculates end date from estimated days using the resource's 3-tier schedule.
        /// Convention: 1 day = 8 hours (universal). Hours are distributed across the resource's
        /// actual per-day schedule (Override → WeeklySchedule → DailyWorkingHours) minus absences.
        /// When resourceId is 0 or omitted, uses system default (8h/day Mon-Fri, no absences).
        /// </summary>
        [HttpGet]
        [Route("CalculateEndDateFromDays")]
        public IHttpActionResult CalculateEndDateFromDays(double estimatedDays, DateTime startDate, int resourceId = 0)
        {
            try
            {
                DateTime endDate;

                if (resourceId > 0)
                {
                    endDate = _resourceCapacityUtilities.CalculateEndDateFromDays(estimatedDays, startDate, resourceId);
                }
                else
                {
                    endDate = _resourceCapacityUtilities.CalculateEndDateFromDays(estimatedDays, startDate);
                }

                return Ok(endDate);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
```

- [ ] **Step 2: Add API URL constant to `TaskManagementApi.cs`**

In `TaskManagementBusinessLayer/BusinessLogic/ApplicationConstants/TaskManagementApi.cs`, add a new static class (after the last existing static class, before the closing brace of `TaskManagementApi`):

```csharp
        public static class ResourceCapacityApi
        {
            public const string CalculateEndDateFromDaysAction = "/ResourceCapacity/CalculateEndDateFromDays";
        }
```

- [ ] **Step 3: Add controller to `.csproj`**

In `TaskManagementWebApi/TaskManagementWebApi.csproj`, add after line 288 (`<Compile Include="Controllers\WorkAssignmentController.cs" />`):

```xml
    <Compile Include="Controllers\ResourceCapacityController.cs" />
```

- [ ] **Step 4: Verify both projects build**

Run: `msbuild TaskManagementWebApi/TaskManagementWebApi.csproj /t:Build /verbosity:minimal`
Run: `msbuild TaskManagementBusinessLayer/TaskManagementBusinessLayer.csproj /t:Build /verbosity:minimal`
Expected: Both build successfully

- [ ] **Step 5: Commit**

```bash
git add TaskManagementWebApi/Controllers/ResourceCapacityController.cs TaskManagementWebApi/TaskManagementWebApi.csproj
git add TaskManagementBusinessLayer/BusinessLogic/ApplicationConstants/TaskManagementApi.cs
git commit -m "feat(EV-003): add ResourceCapacity WebApi endpoint for cross-layer date calculation"
```

---

## Task 4: Refactor `WorkloadCalculationUtilities`

**Files:**
- Modify: `TaskManagementWebApi/Utilities/WorkloadCalculationUtilities.cs`

Replace `CalculateEndDate` body with delegation, rename `GetBusinessDays` → `GetAvailableHours`, and update workload percentage formulas to hours-based.

- [ ] **Step 1: Add `ResourceCapacityUtilities` dependency to constructor**

In `WorkloadCalculationUtilities.cs`, change the constructor and add the field:

```csharp
    public class WorkloadCalculationUtilities
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ResourceCapacityUtilities _resourceCapacityUtilities;

        // Use centralized constants from WorkAssignmentConstants class
        private const int PRIORITY_SPACING = WorkAssignmentConstants.PRIORITY_SPACING;
        private const int DEFAULT_PRIORITY = WorkAssignmentConstants.DEFAULT_PRIORITY;
        private const decimal WORKLOAD_GREEN_THRESHOLD = WorkAssignmentConstants.WORKLOAD_GREEN_THRESHOLD;
        private const decimal WORKLOAD_YELLOW_THRESHOLD = WorkAssignmentConstants.WORKLOAD_YELLOW_THRESHOLD;

        public WorkloadCalculationUtilities(IUnitOfWork unitOfWork, ResourceCapacityUtilities resourceCapacityUtilities)
        {
            _unitOfWork = unitOfWork;
            _resourceCapacityUtilities = resourceCapacityUtilities;
        }
```

- [ ] **Step 2: Replace `CalculateEndDate` body with delegation**

Replace the entire `CalculateEndDate` method (lines 176-219) with:

```csharp
        /// <summary>
        /// Calculates end date based on estimated days using resource-specific schedule.
        /// Delegates to ResourceCapacityUtilities for 3-tier resolution (Override → WeeklySchedule → DailyWorkingHours).
        /// Convention: 1 day = 8 hours (universal). Hours distributed across actual resource schedule.
        /// </summary>
        /// <param name="startDate">Activity start date</param>
        /// <param name="estimatedDays">Estimated duration in days (use request.EstimatedDays)</param>
        /// <param name="resourceId">Resource ID for schedule lookup</param>
        /// <returns>Calculated end date</returns>
        public DateTime CalculateEndDate(DateTime startDate, double estimatedDays, int resourceId)
        {
            return _resourceCapacityUtilities.CalculateEndDateFromDays(estimatedDays, startDate, resourceId);
        }
```

- [ ] **Step 3: Replace `GetBusinessDays` with `GetAvailableHours`**

Replace the entire `GetBusinessDays` method (lines 128-166) with:

```csharp
        /// <summary>
        /// Calculates total available working hours between two dates for a resource.
        /// Uses 3-tier schedule resolution (Override → WeeklySchedule → DailyWorkingHours) minus absences.
        /// Returns hours (decimal), not days — callers must use hours-based formulas.
        /// </summary>
        public decimal GetAvailableHours(DateTime startDate, DateTime endDate, int resourceId)
        {
            if (endDate <= startDate)
                return 0m;

            var dailyHours = _resourceCapacityUtilities.GetEffectiveHoursForDateRange(resourceId, startDate, endDate);
            return dailyHours.Values.Sum();
        }
```

- [ ] **Step 4: Update `CalculateWorkloadPercentage` — both overloads to hours-based**

Replace the first overload (lines 65-80) with:

```csharp
        /// <summary>
        /// Calculates workload percentage for a resource within a date range.
        /// Formula: (TotalRemainingHours / AvailableHours) * 100
        /// Uses hours-based calculation for accurate part-time resource workload.
        /// </summary>
        /// <param name="resource">Resource object</param>
        /// <param name="periodStart">Start of calculation period</param>
        /// <param name="periodEnd">End of calculation period</param>
        /// <returns>Workload percentage (can exceed 100% if over-allocated)</returns>
        public decimal CalculateWorkloadPercentage(Resource resource, DateTime periodStart, DateTime periodEnd)
        {
            if (resource == null || periodEnd <= periodStart)
                return 0m;

            double totalRemainingDays = GetTotalRemainingDays(resource.ResourceCode);

            return CalculateWorkloadPercentage(resource, periodStart, periodEnd, totalRemainingDays);
        }
```

Replace the second overload (lines 92-104) with:

```csharp
        /// <summary>
        /// Calculates workload percentage for a resource within a date range.
        /// Formula: (TotalRemainingHours / AvailableHours) * 100
        /// Use this overload when you already have totalRemainingDays pre-calculated to avoid redundant calculations.
        /// </summary>
        /// <param name="resource">Resource object</param>
        /// <param name="periodStart">Start of calculation period</param>
        /// <param name="periodEnd">End of calculation period</param>
        /// <param name="totalRemainingDays">Pre-calculated total remaining days</param>
        /// <returns>Workload percentage (can exceed 100% if over-allocated)</returns>
        public decimal CalculateWorkloadPercentage(Resource resource, DateTime periodStart, DateTime periodEnd, double totalRemainingDays)
        {
            if (resource == null || periodEnd <= periodStart)
                return 0m;

            decimal availableHours = GetAvailableHours(periodStart, periodEnd, resource.Id);

            if (availableHours <= 0)
                return 100m;

            // Convert remaining days to hours: 1 day = 8 hours (universal convention)
            double totalRemainingHours = totalRemainingDays * WorkAssignmentConstants.DEFAULT_WORKING_HOURS_PER_DAY;

            return (decimal)(totalRemainingHours / (double)availableHours * 100);
        }
```

- [ ] **Step 5: Update region name**

Change the region name from `#region Business Days Calculation` to `#region Capacity Calculation`.

- [ ] **Step 6: Verify the project builds**

Run: `msbuild TaskManagementWebApi/TaskManagementWebApi.csproj /t:Build /verbosity:minimal`
Expected: Build FAILS — `WorkAssignmentController` still references `GetBusinessDays`. This is expected and will be fixed in Task 5.

- [ ] **Step 7: Commit (work in progress — build broken until Task 5)**

```bash
git add TaskManagementWebApi/Utilities/WorkloadCalculationUtilities.cs
git commit -m "refactor(EV-003): WorkloadCalculationUtilities delegates to ResourceCapacityUtilities, hours-based formulas

WIP: WorkAssignmentController still references old GetBusinessDays - fixed in next commit"
```

---

## Task 5: Update `WorkAssignmentController`

**Files:**
- Modify: `TaskManagementWebApi/Controllers/WorkAssignmentController.cs:236-246`

- [ ] **Step 1: Update the workload calculation in `ValidateAssignment`**

In `WorkAssignmentController.cs`, find the block at approximately lines 236-246 and replace:

```csharp
                        response.CalculatedEndDate = _workloadCalculationUtilities.CalculateEndDate(request.StartDate, request.EstimatedDays, firstResource.Id);

                        // Calculate new workload after assignment (use Resource overload to avoid redundant DB query)
                        decimal currentWorkload = _workloadCalculationUtilities.CalculateWorkloadPercentage(firstResource, DateTime.Today, DateTime.Today.AddDays(30));

                        // Estimate additional workload from new assignment
                        double additionalDays = request.EstimatedDays;
                        int availableDays = _workloadCalculationUtilities.GetBusinessDays(DateTime.Today, DateTime.Today.AddDays(30), firstResource.Id);
                        decimal additionalPercentage = availableDays > 0 ? (decimal)(additionalDays / availableDays * 100) : 0;
```

with:

```csharp
                        response.CalculatedEndDate = _workloadCalculationUtilities.CalculateEndDate(request.StartDate, request.EstimatedDays, firstResource.Id);

                        // Calculate new workload after assignment (use Resource overload to avoid redundant DB query)
                        decimal currentWorkload = _workloadCalculationUtilities.CalculateWorkloadPercentage(firstResource, DateTime.Today, DateTime.Today.AddDays(30));

                        // Estimate additional workload from new assignment (hours-based for part-time accuracy)
                        double additionalHours = request.EstimatedDays * WorkAssignmentConstants.DEFAULT_WORKING_HOURS_PER_DAY;
                        decimal availableHours = _workloadCalculationUtilities.GetAvailableHours(DateTime.Today, DateTime.Today.AddDays(30), firstResource.Id);
                        decimal additionalPercentage = availableHours > 0 ? (decimal)(additionalHours / (double)availableHours * 100) : 0;
```

- [ ] **Step 2: Verify the project builds**

Run: `msbuild TaskManagementWebApi/TaskManagementWebApi.csproj /t:Build /verbosity:minimal`
Expected: Build succeeds (broken reference from Task 4 is now fixed)

- [ ] **Step 3: Commit**

```bash
git add TaskManagementWebApi/Controllers/WorkAssignmentController.cs
git commit -m "refactor(EV-003): WorkAssignmentController uses hours-based GetAvailableHours"
```

---

## Task 6: Refactor `TaskManagementServices` — MVC Side

**Files:**
- Modify: `GammaTaskManagement/Services/TaskManagementServices.cs`

This is the largest change. We add an API wrapper for the WebApi endpoint, simplify `CalculateActivityEndDate`, update the two Gantt update methods, and remove 9 dead private methods.

- [ ] **Step 1: Add method declaration to `ITaskManagementServices` interface**

In `GammaTaskManagement/Interfaces/Services/ITaskManagementServices.cs`, add near the other API method declarations (around line 163, near `GetAllResourceAbsencesByResourceIdApi`):

```csharp
        DateTime CalculateEndDateFromDaysApi(double estimatedDays, DateTime startDate, int resourceId = 0);
```

- [ ] **Step 2: Add the API wrapper method**

In `TaskManagementServices.cs`, find the `#region Gantt Update` section (around line 464). Before it, add a new API wrapper method. Follow the existing pattern from `GetAllResourceAbsencesByResourceIdApi` (line 1363):

```csharp
        public DateTime CalculateEndDateFromDaysApi(double estimatedDays, DateTime startDate, int resourceId = 0)
        {
            NameValueCollection parameters = new NameValueCollection();
            parameters.Add("estimatedDays", estimatedDays.ToString(System.Globalization.CultureInfo.InvariantCulture));
            parameters.Add("startDate", startDate.ToString("o"));
            parameters.Add("resourceId", resourceId.ToString());

            string responseJson = Invoke.getResponseJSON(TaskManagementWebApiBaseAddress, TaskManagementApi.ResourceCapacityApi.CalculateEndDateFromDaysAction, parameters);
            return JsonConvert.DeserializeObject<DateTime>(responseJson);
        }
```

Make sure `using System.Collections.Specialized;` is already at the top (it is — line 3).

- [ ] **Step 3: Simplify `CalculateActivityEndDate`**

Replace the entire `CalculateActivityEndDate` method (lines 486-544) with:

```csharp
        private DateTime CalculateActivityEndDate(Activity activity, int? resourceId = null, Nullable<DateTime> overrideStartDate = null)
        {
            DateTime startDate = overrideStartDate.HasValue ? overrideStartDate.Value : activity.StartDate.Value;
            double remainingDays = activity.RemainingTime;

            if (resourceId.HasValue)
            {
                return CalculateEndDateFromDaysApi(remainingDays, startDate, resourceId.Value);
            }
            else
            {
                return CalculateEndDateFromDaysApi(remainingDays, startDate);
            }
        }
```

- [ ] **Step 4: Update `UpdateAssignedActivitiesGanttTimeline`**

In `UpdateAssignedActivitiesGanttTimeline` (line 546), replace the method body. Change from passing `resourceAbsences` to passing `resource.Id`:

```csharp
        private async Task<bool> UpdateAssignedActivitiesGanttTimeline(DateTime selectedDate, IEnumerable<Activity> activities, IEnumerable<Resource> resources)
        {
            int k = 0;

            foreach (Resource resource in resources)
            {
                IEnumerable<Activity> resourceActivities = GetAllResourceActivitiesAmongActivityList(resource, activities);

                if (resourceActivities != null && resourceActivities.Count() > 0)
                {
                    IList<Activity> resourceActivityList = OrderActivityListTimeline(resourceActivities);

                    k = 0;
                    Activity firstActivity = resourceActivityList[k];

                    firstActivity.StartDate = selectedDate;
                    firstActivity.EndDate = CalculateActivityEndDate(firstActivity, resource.Id, selectedDate);
                    await getHttpResponseMessageFromUpdateActivity(firstActivity);

                    for (k = 1; k < resourceActivityList.Count; k++)
                    {
                        Activity activity = resourceActivityList[k];

                        activity.StartDate = resourceActivityList[k - 1].EndDate;
                        activity.EndDate = CalculateActivityEndDate(activity, resource.Id);
                        await getHttpResponseMessageFromUpdateActivity(activity);
                    }
                }
            }

            return true;
        }
```

- [ ] **Step 5: Update `UpdateUnassignedActivitiesGanttTimeline`**

Replace the method body (line 580). The only change is calling `CalculateActivityEndDate` without a resource ID (uses the unassigned overload):

```csharp
        private async Task<bool> UpdateUnassignedActivitiesGanttTimeline(DateTime selectedDate, IEnumerable<Activity> activities, IEnumerable<Department> departments)
        {
            int k = 0;

            foreach (Department department in departments)
            {
                IEnumerable<Activity> unassignedActivities = GetAllActivitiesAssignedOnlyToDepartmentAmongActivityList(department, activities);

                if (unassignedActivities != null && unassignedActivities.Count() > 0)
                {
                    IList<Activity> unassignedActivityList = OrderActivityListTimeline(unassignedActivities);

                    k = 0;
                    Activity firstActivity = unassignedActivityList[k];

                    firstActivity.StartDate = selectedDate;
                    firstActivity.EndDate = CalculateActivityEndDate(firstActivity, null, selectedDate);
                    await getHttpResponseMessageFromUpdateActivity(firstActivity);

                    for (k = 1; k < unassignedActivityList.Count; k++)
                    {
                        Activity activity = unassignedActivityList[k];

                        activity.StartDate = unassignedActivityList[k - 1].EndDate;
                        activity.EndDate = CalculateActivityEndDate(activity);
                        await getHttpResponseMessageFromUpdateActivity(activity);
                    }
                }
            }

            return true;
        }
```

- [ ] **Step 6: Remove 9 dead private methods**

Delete the entire `#region Absence Management` section (lines 350-462), which contains:
1. `GetAbsenceDaysList()` (line 352)
2. `GetResourceAbsencesInterferences()` (line 360)
3. `CountResourceAbsencesInterferences()` (line 369)
4. `CountAllResourceAbsencesInterferences()` (line 374)
5. `IsResourceAbsenceAlreadyPresent()` (line 386)
6. `UnifyResourceAbsences()` (line 396)
7. `ManageResourceAbsencesInterferences()` (line 450)

And from the `#region Gantt Update` section, remove:
8. `GetActivityFestivityDays()` (line 466)
9. `AddFestivitiesAndAbsenceDays()` (line 474)

- [ ] **Step 7: Remove unused `using` for `TaskManagementBusinessLayer.Utilities`**

In `TaskManagementServices.cs` line 17, remove:
```csharp
using TaskManagementBusinessLayer.Utilities;
```

This was needed for `DateTimeUtilities` which was used indirectly through `Activity` helper methods. After removing the Gantt methods that called those helpers, this `using` becomes unused.

**Important:** Only remove this `using` if it's confirmed unused by the compiler. Check the build output for warnings about unused usings — if something else in the file still needs it, keep it.

- [ ] **Step 8: Verify the MVC project builds**

Run: `msbuild GammaTaskManagement/GammaTaskManagement.csproj /t:Build /verbosity:minimal`
Expected: Build succeeds

- [ ] **Step 9: Commit**

```bash
git add GammaTaskManagement/Services/TaskManagementServices.cs GammaTaskManagement/Interfaces/Services/ITaskManagementServices.cs
git commit -m "refactor(EV-003): TaskManagementServices uses ResourceCapacity WebApi for Gantt date calculation

- CalculateActivityEndDate delegates to WebApi endpoint
- UpdateAssignedActivitiesGanttTimeline passes resource.Id
- Removed 9 dead private methods (absence management, festivity counting)"
```

---

## Task 7: Dead Code Cleanup

**Files:**
- Delete: `TaskManagementBusinessLayer/Utilities/DateTimeUtilities.cs`
- Modify: `TaskManagementBusinessLayer/BusinessLogic/Models/Activity.cs:171-203`
- Modify: `TaskManagementBusinessLayer/BusinessLogic/ViewModels/ActivityViewModel.cs:215-247`

- [ ] **Step 1: Delete `DateTimeUtilities.cs` and remove from `.csproj`**

Delete the entire file `TaskManagementBusinessLayer/Utilities/DateTimeUtilities.cs`.

In `TaskManagementBusinessLayer/TaskManagementBusinessLayer.csproj`, remove line 272:
```xml
    <Compile Include="Utilities\DateTimeUtilities.cs" />
```

- [ ] **Step 2: Remove helper methods from `Activity.cs`**

In `Activity.cs`, remove the entire `#region Methods` section (lines 171-203), which contains:
- `GetNumberOfWorkingDays()` (line 173)
- `GetNumberOfFestivityDays()` (line 178)
- `GetOverlappingResourceAbsences()` (line 183)

Also remove line 5 from `Activity.cs`:
```csharp
using TaskManagementBusinessLayer.Utilities;
```

- [ ] **Step 3: Remove helper methods from `ActivityViewModel.cs`**

In `ActivityViewModel.cs`, remove the entire `#region Methods` section (lines 215-247), which contains:
- `GetNumberOfWorkingDays()` (line 217)
- `GetNumberOfFestivityDays()` (line 222)
- `GetOverlappingResourceAbsences()` (line 227)

Also remove line 6 from `ActivityViewModel.cs`:
```csharp
using TaskManagementBusinessLayer.Utilities;
```

- [ ] **Step 4: Verify all projects build**

Run: `msbuild GammaTaskManagement.sln /t:Build /verbosity:minimal`
Expected: Full solution builds successfully. If any build error references `DateTimeUtilities` or removed methods, investigate — it means there's a caller we missed.

- [ ] **Step 5: Commit**

```bash
git add -u TaskManagementBusinessLayer/Utilities/DateTimeUtilities.cs
git add TaskManagementBusinessLayer/TaskManagementBusinessLayer.csproj
git add TaskManagementBusinessLayer/BusinessLogic/Models/Activity.cs
git add TaskManagementBusinessLayer/BusinessLogic/ViewModels/ActivityViewModel.cs
git commit -m "cleanup(EV-003): remove dead code - DateTimeUtilities.cs and Activity/ActivityViewModel helper methods

All methods were only called from Gantt calculation logic replaced by ResourceCapacityUtilities"
```

---

## Task 8: Full Solution Build Verification

**Files:** None (verification only)

- [ ] **Step 1: Clean and rebuild entire solution**

Run: `msbuild GammaTaskManagement.sln /t:Rebuild /verbosity:minimal`
Expected: Build succeeds with 0 errors

- [ ] **Step 2: Check for compiler warnings about unused usings**

Review build output for warnings. Remove any `using` directives flagged as unused in files modified during this feature.

- [ ] **Step 3: Verify no references to deleted code**

Run a search across the solution for any remaining references to removed code:

```bash
grep -r "DateTimeUtilities" --include="*.cs" .
grep -r "GetBusinessDays" --include="*.cs" .
grep -r "ManageResourceAbsencesInterferences\|UnifyResourceAbsences\|GetAbsenceDaysList\|GetActivityFestivityDays\|AddFestivitiesAndAbsenceDays" --include="*.cs" .
```

Expected: No matches (or only in this plan document / comments)

- [ ] **Step 4: Commit any cleanup fixes**

If Step 2 or 3 found issues, fix and commit:

```bash
git add -A
git commit -m "cleanup(EV-003): fix remaining unused usings and stale references"
```

---

## Summary of Commits

| # | Task | Message | Key Change |
|---|------|---------|------------|
| 1 | 1 | `feat(EV-003): add ResourceCapacityUtilities` | Core algorithm class + `.csproj` |
| 2 | 2 | `feat(EV-003): register ResourceCapacityUtilities in Unity DI` | DI wiring |
| 3 | 3 | `feat(EV-003): add ResourceCapacity WebApi endpoint` | Controller + API constant + `.csproj` |
| 4 | 4 | `refactor(EV-003): WorkloadCalculationUtilities delegates to ResourceCapacityUtilities` | WebApi caller updated (WIP build break) |
| 5 | 5 | `refactor(EV-003): WorkAssignmentController uses hours-based GetAvailableHours` | Fix build from Task 4 |
| 6 | 6 | `refactor(EV-003): TaskManagementServices uses ResourceCapacity WebApi` | MVC caller + interface + 9 methods removed |
| 7 | 7 | `cleanup(EV-003): remove dead code` | DateTimeUtilities + Activity helpers + `.csproj` |
| 8 | 8 | `cleanup(EV-003): fix remaining warnings` | Final cleanup (if needed) |
