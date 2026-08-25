# EV-002 - Configurable Working Hours per Resource

## Objective

Implement configurable daily working hours per resource to enable accurate Gantt planning. The solution must support:

1. Per-resource daily working hours with 8h default
2. Weekly schedule patterns (Mon-Sun) with Sat/Sun defaulting to 0h
3. Date-specific schedule overrides for irregular days
4. Granular absence management down to 30-minute increments (partial absences), replacing the current full-day-only model
5. A 3-tier effective hours resolution model: Override > Weekly Pattern > Resource Default

---

## Functional Requirements

### FR-1: Resource Default Working Hours

Each resource must have a configurable daily working hours value, defaulting to 8.0 hours. This represents the resource's standard daily work capacity. Valid range: 0.0 to 24.0 hours, in 30-minute increments (multiples of 0.5).

This field must be editable directly in the existing Resource management grid, using a numeric spinner with 0.5 step.

When this value is modified, the system must automatically update the weekday portion (Monday through Friday) of that resource's weekly schedule to the new value. Saturday and Sunday must NOT be modified. Before saving, the UI must warn the user with a confirmation dialog in Italian stating that weekday schedule customizations will be overwritten and that Saturday/Sunday will remain unchanged.

### FR-2: Weekly Schedule Pattern

Each resource must have a 7-day weekly schedule template defining working hours per day of the week (Monday through Sunday).

When a new resource is created, the weekly schedule is automatically initialized: Monday-Friday set to the resource's daily working hours, Saturday and Sunday set to 0.0.

The weekly schedule is managed via a dedicated "Working Calendar" page accessible from the Resource management grid (opens in a new browser tab). The page displays the resource's summary information (code, name, surname, department, daily working hours) at the top.

The weekly schedule grid shows one row per day of the week, ordered Monday through Saturday then Sunday last. Day names are displayed in Italian (Lunedi, Martedi, Mercoledi, Giovedi, Venerdi, Sabato, Domenica). Day names are computed server-side, not client-side. Only the WorkingHours column is editable; day name and day-of-week fields are read-only. The grid supports in-cell batch editing with Save/Cancel toolbar. No row creation or deletion (always exactly 7 rows). Sorting, paging, and filtering are disabled (row order comes from the server). Valid range: 0.0 to 24.0, in 0.5 increments.

### FR-3: Schedule Overrides (Calendar Exceptions)

The Working Calendar page also includes a second grid for date-specific schedule overrides. Each override specifies a particular date and the working hours for that date, with an optional description. This allows modeling irregular schedules such as shortened workdays, company events, or special working days.

The overrides grid supports full CRUD with in-cell batch editing. Fields: Date (required), Working Hours (required, 0.0-24.0 in 0.5 increments), Description (optional, max 500 characters), and a Delete button. Default sort: date descending. Default values for new rows: today's date and the resource's daily working hours. Standard paging, filtering (with Italian operator labels), sorting, column menu, resizable/reorderable columns, Excel export.

A duplicate override for the same resource and date must be rejected with an Italian error message: "Esiste gia un'eccezione calendario per la risorsa nella data indicata."

An informational alert above the grid explains: "Indicare le ore lavorative per date specifiche che differiscono dall'orario settimanale. Ore Lavorative = 0 indica un giorno non lavorativo."

### FR-4: Enhanced Absence Management

The existing absence management must be migrated from a date-range model (start date / end date) to a per-day model. Each absence record represents a single day. Existing multi-day absence ranges must be expanded into individual daily records during migration (end date is exclusive - not included in the expansion).

Each absence record gains a new optional AbsenceHours field:
- NULL (empty) = full-day absence (the resource does not work at all that day)
- Numeric value >= 0.5 = partial absence in hours (the resource is absent for that many hours)
- Minimum: 0.5 hours (30 minutes). An absence of 0 hours is meaningless and not allowed.
- Maximum: 24.0 hours
- Granularity: multiples of 0.5 (30-minute increments)

The absence grid must display the new single-date and AbsenceHours columns, replacing the old start/end date columns. An informational message explains the NULL vs partial absence semantics to users.

IMPORTANT: Multiple absence records per resource per day are intentionally allowed (no uniqueness constraint on resource+date). This supports scenarios like a morning doctor appointment and an afternoon personal leave recorded as separate entries.

### FR-5: Festivity Integration

When a new festivity (public holiday) is created:
1. Upgrade any existing partial absences on that date to full-day absences (clear AbsenceHours)
2. Create full-day absence records for all resources that don't already have an absence on that date

When a festivity is deleted:
1. Delete ONLY full-day absence records whose description matches the festivity name and whose date matches
2. Preserve any partial absences - they represent real absences that happened to coincide with the holiday

When a new resource is created, automatically create full-day absence records for all existing festivities (from current year forward).

Festivities remain full-day only (AbsenceHours always NULL for festivity-generated absences).

### FR-6: Resource Lifecycle Integration

Resource creation must be transactional: create the resource, initialize the 7-day weekly schedule, and create absence records for all festivities, all within a single transaction.

Resource deletion must clean up all associated weekly schedule records and schedule overrides in addition to existing cleanup.

### FR-7: 3-Tier Effective Hours Resolution

The data model must support this resolution logic for determining a resource's effective working hours on any given date:
1. Check for a schedule override for that resource and date - if found, use its working hours
2. Otherwise, check the weekly schedule for that resource and day of week - if found, use its working hours
3. Otherwise, use the resource's default daily working hours
4. Then subtract any absence hours for that date: NULL absence = effective hours become 0; numeric absence = effective = scheduled minus absent, clamped to minimum 0

NOTE: This resolution logic is a data model specification only. The actual calculation algorithm will be implemented in a subsequent feature (EV-003: Modified Gantt Date Calculation Algorithm). This feature only creates the data infrastructure to support it.

---

## Data Schema Requirements

### New Entity: ResourceWeeklySchedule
- ResourceId (FK to Resource), DayOfWeek (integer 0-6, 0=Sunday through 6=Saturday), WorkingHours (decimal, 2 decimal places)
- Constraints: DayOfWeek 0-6, WorkingHours 0.0-24.0, unique combination of ResourceId and DayOfWeek
- A computed display field DayOfWeekName provides Italian day names

### New Entity: ResourceScheduleOverride
- ResourceId (FK to Resource), OverrideDate (date), WorkingHours (decimal, 2 decimal places), Description (string, max 500, optional)
- Constraints: WorkingHours 0.0-24.0, unique combination of ResourceId and OverrideDate

### Modified Entity: Resource
- New field: DailyWorkingHours (decimal, 2 decimal places, default 8.0, valid 0.0-24.0)

### Modified Entity: ResourceAbsence
- Remove: AbsenceStartDate, AbsenceEndDate
- Add: AbsenceDate (date, required), AbsenceHours (decimal, nullable, valid NULL or 0.5-24.0)
- Migration: expand existing date ranges into individual daily records
- NO unique constraint on (ResourceId, AbsenceDate)

---

## UI Requirements

### Italian Localization
- All labels, messages, confirmation dialogs, and filter operator labels in Italian
- Date format: dd/MM/yyyy
- Number format: Italian culture
- Day names in Italian

### Working Calendar Page
- Page title: "Calendario Lavorativo - [Name] [Surname]"
- Opens in new browser tab from Resource grid (no Back button needed)
- Contains resource summary table, weekly schedule grid, and overrides grid
- Weekly schedule grid: read-only structure, only WorkingHours editable
- Overrides grid: full CRUD with all standard grid features

### Editor Behavior
- WorkingHours fields: numeric spinner, step 0.5, min 0, max 24, 1 decimal place
- AbsenceHours fields: numeric spinner, step 0.5, min 0.5, max 24, 1 decimal place

### Validation Error Persistence
- All grids must preserve user data on server-side validation errors (existing pattern)

---

## Constraints

- Database changes via SQL migration script
- All dependent SQL views with SCHEMABINDING must be properly handled (drop/recreate chain)
- Changes take effect immediately for new Gantt calculations
- Historical work data unchanged
- No unit tests: manual testing only
- All hours fields enforce 30-minute granularity (multiples of 0.5)
- Follow existing application architecture and patterns throughout all layers
