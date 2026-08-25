# EV-002 Output Plan - Claude Development Plan

---

## EV-002 Design Approaches

Based on my exploration, I see **2 distinct approaches** for the data model of the weekly pattern + date overrides:

### Approach A: Two New Tables (Recommended)

**`ResourceWeeklySchedule`** - stores the recurring weekly pattern (7 rows per resource):
```
ResourceId | DayOfWeek (0-6) | WorkingHours (decimal)
```

**`ResourceScheduleOverride`** - stores date-specific overrides:
```
ResourceId | OverrideDate | WorkingHours (decimal) | Description
```

**Resolution logic**: For any given date:
1. Check `ResourceScheduleOverride` first (specific date wins)
2. Fall back to `ResourceWeeklySchedule` for that day-of-week
3. Fall back to `Resource.DailyWorkingHours` (the global default for the resource)

**Enhanced `ResourceAbsence`**: Add nullable `AbsenceHours` column (decimal). NULL = full-day absence.

**Pros**: Clean separation of concerns. Weekly pattern is compact (7 rows per resource). Date overrides are sparse (only store exceptions). Each table has a clear purpose.

**Cons**: Three tables to query when resolving effective hours for a date. Slightly more stored procedures.

### Approach B: Single Calendar Table

**`ResourceCalendar`** - one table for everything:
```
ResourceId | CalendarDate | WorkingHours | EntryType (WeeklyPattern/Override) | Description
```

Weekly patterns stored as recurring entries (day-of-week encoded in date), overrides as specific dates.

**Pros**: Single table to query. Simpler stored procedures.

**Cons**: Mixing two concepts (patterns vs overrides) in one table. Weekly patterns need special handling (they aren't real dates). Harder to bulk-update a weekly pattern. More rows over time as overrides accumulate.

### My Recommendation: Approach A

Approach A follows the existing codebase patterns better (separate entities with clear responsibilities, like Resource/ResourceAbsence/Festivity are already separate tables). It's cleaner to maintain, and the resolution logic is straightforward — it naturally maps to a 3-tier fallback: override > weekly schedule > resource default.

---

## Section 1 — Database Schema

### 1.1 Resource Table Enhancement

Add `DailyWorkingHours` column (default hours for the resource):

```sql
ALTER TABLE [dbo].[Resource] ADD [DailyWorkingHours] DECIMAL(4,2) NOT NULL DEFAULT 8.0;
-- Constraint: 0.0 to 24.0
ALTER TABLE [dbo].[Resource] ADD CONSTRAINT CK_Resource_DailyWorkingHours
    CHECK (DailyWorkingHours >= 0.0 AND DailyWorkingHours <= 24.0);
```

### 1.2 ResourceWeeklySchedule Table (new)

7 rows per resource, one per day of week:

```sql
CREATE TABLE [dbo].[ResourceWeeklySchedule](
    [Id] [bigint] IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ResourceId] [int] NOT NULL,           -- FK to Resource
    [DayOfWeek] [int] NOT NULL,            -- 0=Sunday, 1=Monday, ..., 6=Saturday
    [WorkingHours] [decimal](4,2) NOT NULL DEFAULT 8.0,
    CONSTRAINT CK_RWS_DayOfWeek CHECK (DayOfWeek >= 0 AND DayOfWeek <= 6),
    CONSTRAINT CK_RWS_WorkingHours CHECK (WorkingHours >= 0.0 AND WorkingHours <= 24.0),
    CONSTRAINT UQ_RWS_ResourceDay UNIQUE (ResourceId, DayOfWeek)
);
```

Default initialization: When a resource is created, insert 7 rows with Mon-Fri = `Resource.DailyWorkingHours`, Sat-Sun = 0.

### 1.3 ResourceScheduleOverride Table (new)

Sparse date-specific overrides:

```sql
CREATE TABLE [dbo].[ResourceScheduleOverride](
    [Id] [bigint] IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ResourceId] [int] NOT NULL,
    [OverrideDate] [date] NOT NULL,
    [WorkingHours] [decimal](4,2) NOT NULL,
    [Description] [nvarchar](500) NULL,
    CONSTRAINT CK_RSO_WorkingHours CHECK (WorkingHours >= 0.0 AND WorkingHours <= 24.0),
    CONSTRAINT UQ_RSO_ResourceDate UNIQUE (ResourceId, OverrideDate)
);
```

### 1.4 ResourceAbsence Enhancement (Updated after Q&A)

Replace date range model with single AbsenceDate + optional AbsenceHours:

```sql
-- Step 1: Add new columns
ALTER TABLE [dbo].[ResourceAbsence] ADD [AbsenceDate] [date] NULL;
ALTER TABLE [dbo].[ResourceAbsence] ADD [AbsenceHours] [decimal](4,2) NULL;

-- Step 2: Migrate existing data (expand date ranges into individual rows)
-- For each existing row, generate one row per day in the range
;WITH DateExpansion AS (
    SELECT Id, ResourceId, AbsenceStartDate AS CurrentDate, AbsenceEndDate, AbsenceDescription
    FROM [dbo].[ResourceAbsence]
    UNION ALL
    SELECT Id, ResourceId, DATEADD(DAY, 1, CurrentDate), AbsenceEndDate, AbsenceDescription
    FROM DateExpansion
    WHERE DATEADD(DAY, 1, CurrentDate) < AbsenceEndDate
)
-- Insert expanded rows and update originals...

-- Step 3: Drop old columns, make AbsenceDate NOT NULL
ALTER TABLE [dbo].[ResourceAbsence] DROP COLUMN [AbsenceStartDate];
ALTER TABLE [dbo].[ResourceAbsence] DROP COLUMN [AbsenceEndDate];
ALTER TABLE [dbo].[ResourceAbsence] ALTER COLUMN [AbsenceDate] [date] NOT NULL;

-- Step 4: Constraints and indexes
ALTER TABLE [dbo].[ResourceAbsence] ADD CONSTRAINT CK_RA_AbsenceHours
    CHECK (AbsenceHours IS NULL OR (AbsenceHours >= 0.5 AND AbsenceHours <= 24.0));
CREATE UNIQUE INDEX UQ_RA_ResourceDate ON [dbo].[ResourceAbsence](ResourceId, AbsenceDate);
```

**Final ResourceAbsence schema**:
- `Id` (bigint, PK)
- `ResourceId` (int, FK)
- `AbsenceDate` (date, NOT NULL)
- `AbsenceHours` (decimal(4,2), NULL — NULL = full day)
- `AbsenceDescription` (nvarchar(MAX), NULL)

### 1.5 Effective Hours Resolution Logic

For any resource on any date:
```
1. If ResourceScheduleOverride exists for (ResourceId, Date) → use its WorkingHours
2. Else if ResourceWeeklySchedule exists for (ResourceId, DayOfWeek) → use its WorkingHours
3. Else → use Resource.DailyWorkingHours (the default)
4. Then subtract any ResourceAbsence.AbsenceHours for that date
   (NULL AbsenceHours = full day, so effective = 0)
```

---

## Section 2 — Data Layer (Models, ViewModels, Repositories)

### 2.1 Model Changes

**Resource.cs** — add:
```csharp
[Display(Name = "Ore Lavorative Giornaliere")]
public decimal DailyWorkingHours { get; set; } = 8.0m;
```

**ResourceAbsence.cs** — replace AbsenceStartDate/EndDate with:
```csharp
[Display(Name = "Data Assenza")]
public DateTime AbsenceDate { get; set; }

[Display(Name = "Ore di Assenza")]
public decimal? AbsenceHours { get; set; }
```

**New model: ResourceWeeklySchedule.cs** (updated after Q&A — ResourceDetails removed)
```csharp
public class ResourceWeeklySchedule
{
    public int Id { get; set; }
    public int ResourceId { get; set; }
    public int DayOfWeek { get; set; }      // 0=Sunday..6=Saturday
    public string DayOfWeekName { get; set; } // computed display field
    public decimal WorkingHours { get; set; }
}
```

**New model: ResourceScheduleOverride.cs** (updated after Q&A — ResourceDetails removed)
```csharp
public class ResourceScheduleOverride
{
    public int Id { get; set; }
    public int ResourceId { get; set; }
    public DateTime OverrideDate { get; set; }
    public decimal WorkingHours { get; set; }
    public string Description { get; set; }
}
```

### 2.2 ViewModel Changes

Matching ViewModels for each new model, plus updates to existing `ResourceViewModel` and `ResourceAbsenceViewModel`.

### 2.3 Repository Changes

New repositories following existing Dapper + stored procedure pattern:
- `ResourceWeeklyScheduleRepository` (CRUD + GetByResourceId)
- `ResourceScheduleOverrideRepository` (CRUD + GetByResourceId + GetByResourceIdAndDateRange)

Updated repositories:
- `ResourceRepository` — InsertResource/UpdateResource add `DailyWorkingHours` parameter
- `ResourceAbsenceRepository` — All SPs updated for new schema (AbsenceDate, AbsenceHours)

### 2.4 FluentValidation

New validators:
- `ResourceWeeklyScheduleViewModelValidator` — DayOfWeek 0-6, WorkingHours 0.0-24.0
- `ResourceScheduleOverrideViewModelValidator` — OverrideDate required, WorkingHours 0.0-24.0

Updated validators:
- `ResourceViewModelValidator` — add DailyWorkingHours validation (0.0-24.0)
- `ResourceAbsenceViewModelValidator` — replace StartDate/EndDate rules with AbsenceDate + AbsenceHours rules

---

## Section 3 — API & Controller Layer

### 3.1 Web API Controllers

**ResourceController.cs** — No new endpoints needed; existing GetResource/UpdateResource endpoints already return/accept the full Resource model. The new `DailyWorkingHours` field flows through automatically via Dapper mapping.

**New: ResourceWeeklyScheduleController.cs** (Web API)
```
RoutePrefix: "ResourceWeeklySchedule"
- GET GetByResourceId(int ResourceId) → returns 7 rows
- POST InsertResourceWeeklySchedule(ResourceWeeklySchedule)
- POST UpdateResourceWeeklySchedule(ResourceWeeklySchedule)
- POST InitializeWeeklySchedule(int ResourceId, decimal defaultHours)
```

**New: ResourceScheduleOverrideController.cs** (Web API)
```
RoutePrefix: "ResourceScheduleOverride"
- GET GetByResourceId(int ResourceId) → returns all overrides
- GET GetByResourceIdAndDateRange(int ResourceId, DateTime start, DateTime end)
- POST InsertResourceScheduleOverride(ResourceScheduleOverride)
- POST UpdateResourceScheduleOverride(ResourceScheduleOverride)
- POST DeleteResourceScheduleOverrideById(int Id)
```

**ResourceAbsenceController.cs** — Update existing endpoints to handle new schema (AbsenceDate, AbsenceHours).

### 3.2 MVC Controllers

**ResourceManagementController.cs** — Add action to navigate to the new Working Calendar page:
```csharp
public ActionResult ResourceWorkingCalendarPage(int id) // resource Id
```

**New: ResourceWorkingCalendarController.cs** (MVC)
- `WeeklyScheduleGrid(int resourceId)` — Kendo Grid read
- `WeeklyScheduleGrid_Update` — Batch update
- `ScheduleOverrideGrid(int resourceId)` — Kendo Grid read
- `ScheduleOverrideGrid_Create/Update/Destroy` — CRUD

**ResourceAbsenceManagementController.cs** — Update for new schema.

### 3.3 AutoMapper Config

Add mappings:
```csharp
config.CreateMap<ResourceWeeklySchedule, ResourceWeeklyScheduleViewModel>();
config.CreateMap<ResourceWeeklyScheduleViewModel, ResourceWeeklySchedule>();
config.CreateMap<ResourceScheduleOverride, ResourceScheduleOverrideViewModel>();
config.CreateMap<ResourceScheduleOverrideViewModel, ResourceScheduleOverride>();
```

---

## Section 4 — UI Design

### 4.1 Resource Grid Enhancement

Add column to the existing Resource grid:
- **"Ore/Giorno"** column showing `DailyWorkingHours` with `Format("{0:N1}")`
- Editable via Kendo NumericTextBox (min=0, max=24, step=0.5)

Add a new command button in the Resource grid: **"Calendario"** (navigates to the Working Calendar page).

### 4.2 Working Calendar Page (new)

**Route**: `/ResourceManagement/ResourceWorkingCalendarPage/{resourceId}`

**Layout**: Two Kendo Grids stacked:

**Grid 1: "Orario Settimanale" (Weekly Schedule)**
- 7 rows (one per day: Lunedì, Martedì, Mercoledì, Giovedì, Venerdì, Sabato, Domenica)
- Columns: Giorno | Ore Lavorative
- In-cell editing with NumericTextBox (min=0, max=24, step=0.5)
- No create/delete — always exactly 7 rows

**Grid 2: "Eccezioni Calendario" (Schedule Overrides)**
- Columns: Data | Ore Lavorative | Descrizione
- Full CRUD (create/update/delete)
- DatePicker for OverrideDate, NumericTextBox for WorkingHours
- Filterable by date range

### 4.3 Absence Grid Enhancement

Update the existing ResourceAbsence grid:
- Replace `AbsenceStartDate`/`AbsenceEndDate` columns with:
  - **"Data Assenza"** (AbsenceDate) — DatePicker
  - **"Ore di Assenza"** (AbsenceHours) — NumericTextBox (min=0.5, max=24, step=0.5, nullable)
- Add help text: "Lasciare vuoto per assenza giornata intera" (Leave empty for full-day absence)

### 4.4 Festivity Impact

Update `InsertFestivity` SP to create absences with:
- `AbsenceDate` = festivity date (instead of StartDate/EndDate pair)
- `AbsenceHours` = NULL (full day)

Update `DeleteFestivity` SP to match on `AbsenceDate` instead of date range.

---

## Summary (final message)

**Key design decisions captured**:
- 3-tier schedule resolution: Override > Weekly Pattern > Resource Default
- Full week (Mon-Sun) configurable with Sat/Sun defaulting to 0h
- ResourceAbsence simplified from date ranges to single `AbsenceDate` + nullable `AbsenceHours` (30-min granularity)
- Two new tables: `ResourceWeeklySchedule` (7 rows/resource) + `ResourceScheduleOverride` (sparse date exceptions)
- Hours range: 0.0 to 24.0
- Festivities remain full-day (AbsenceHours = NULL)
- New "Calendario Lavorativo" page accessible from Resource grid

**Implementation scope**: 13 files to create, 19 files to modify, organized into 4 phases (Database/Data Layer, API/Service Layer, UI Layer, Integration). Detailed task checklist with 22 implementation tasks.

**All information needed to start implementation in a new conversation** is now in `.claude/development-plan.md`, including:
- Complete SQL schema definitions
- Model/ViewModel field specifications
- Repository method signatures
- Controller endpoint designs
- UI grid specifications
- Full file paths for all files to create and modify
- Key existing files reference table
