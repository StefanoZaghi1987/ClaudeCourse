# EV-002 Planning Session - Q&A Log

---

## Clarifying Questions

### Q1: Weekly schedule scope

**Claude**: For the recurring weekly pattern, should Saturday and Sunday be configurable too (some resources might work weekends), or should weekends always be treated as non-working days as they are today?

**User**: Full week (Mon-Sun) (Recommended)

---

### Q2: Absence granularity approach

**Claude**: For absence/permission management with 30-minute granularity: should the current ResourceAbsence table be enhanced to support partial-day absences (adding start/end time or hours-absent fields), or should we create a separate new table for granular permissions/absences while keeping the existing ResourceAbsence for full-day absences?

**User**: Enhance ResourceAbsence (Recommended)

---

### Q3: UI placement

**Claude**: For the UI to manage the weekly pattern and date-specific overrides, where should these interfaces be placed? Currently, resource absences are managed from a separate page accessible via the Resource grid. Should the new schedule calendar be similarly accessible?

**User**: New tab/section in Resource detail page (Recommended)

---

### Q4: DailyWorkingHours range

**Claude**: For the DailyWorkingHours column on the Resource table (the default value): the task says range 0.0-24.0, but the development plan says 1.0-12.0. Which range should we use? Note: 0.0 would mean a resource can have 'no working hours' as default, which might conflict with the weekly pattern where you'd set specific days to 0.

**User**: 0.0 to 24.0 (task spec)

---

### Q5: Festivity partial-day support

**Claude**: For the AbsenceHours field being added to ResourceAbsence: when a festivity is created, the InsertFestivity stored procedure automatically creates ResourceAbsence records for ALL resources. Should festivity-generated absences continue to be full-day (AbsenceHours = resource's DailyWorkingHours), or should festivities also support partial-day configuration?

**User**: Full-day festivities (Recommended)

---

## Design Approach Selection

**Claude**: Which data model approach do you prefer for the weekly pattern + date overrides?

- **Approach A: Two New Tables (Recommended)** - ResourceWeeklySchedule (7 rows per resource) + ResourceScheduleOverride (sparse date exceptions). Resolution: Override > Weekly Schedule > Resource Default.
- **Approach B: Single Calendar Table** - One ResourceCalendar table mixing weekly patterns and overrides.

**User**: Approach A: Two tables (Recommended)

---

## Design Review Feedback

### Database Schema Review

**Claude**: Does the database schema design look correct? Any changes needed before I proceed to the data/service layer design?

**User**: 1.4 ResourceAbsence Enhancement: are AbsenceStartDate and AbsenceEndDate fields still needed? Can we remove them?

---

### ResourceAbsence Simplification

**Claude** presented two options:

- **Option A: Replace with single AbsenceDate** - Remove AbsenceStartDate/AbsenceEndDate, add AbsenceDate (one record per day). Multi-day absences = multiple records. Supports per-day hour variations. Requires data migration.
- **Option B: Keep range + add AbsenceHours** - Keep date range as-is, add AbsenceHours applying uniformly to all days. No migration needed but can't have different hours per day within one range.

**User**: Option A: Single AbsenceDate (Recommended)

---

### Data Layer Review

**Claude**: Does the data layer design (models, ViewModels, repositories, validators) look correct? Should I proceed to the API/Controller/UI design?

**User**: ResourceWeeklySchedule.cs and ResourceScheduleOverride.cs: what is ResourceDetails field needed for?

**Claude**: You're right - ResourceDetails is unnecessary in these models. It exists in ResourceAbsence because the absence grid displays all resources together and needs to show which resource each row belongs to. But since the weekly schedule and date override views will always be in the context of a specific resource (accessed from the Resource detail page), the resource identity is already known from the UI context. I'll remove ResourceDetails from both.

---

### API/Controller/UI Review

**Claude**: Does the API/Controller/UI design look correct? Any changes before I finalize the complete design document?

**User**: Looks good, finalize design

---

## Design Doc Redirection

**Claude** attempted to save the design to `docs/plans/YYYY-MM-DD-ev002-design.md`.

**User**: Update development-plan.md (located in .claude folder) with all business analysis decisions we made and with all information and details, about this plan, needed to start working in a new conversation.
