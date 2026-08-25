# EV-003: Modified Gantt Date Calculation Algorithm — Optimal Implementation Prompt

> **Purpose**: This prompt, given to Claude Code, should produce the complete EV-003 implementation. It describes the desired system behavior as a functional specification — what the system must do, not how to build it.

---

## Task

Implement EV-003: Modify the Gantt date calculation so that activity completion dates reflect each resource's actual working capacity, instead of assuming every resource works 8 hours per day.

Read the design spec at `specs/EV-003_Modified_Gantt_Date_Calculation_Algorithm.md` for full context.

## Problem

The current Gantt date calculation assumes every resource works 8 hours/day on a fixed Monday-Friday schedule. A 16-hour task assigned to a 4h/day part-time resource is calculated as 2 business days (16/8), when it should take 4 business days (16/4). This produces unrealistic timelines and missed deadlines for any resource that doesn't work a standard full-time schedule.

EV-002 already established per-resource working hour configuration (weekly schedules, date-specific overrides, daily defaults, and absences with partial-day support), but the Gantt calculation doesn't use any of it yet.

## Functional Requirements

### FR-1: Hours-Based Date Calculation

The system must calculate activity end dates by distributing the required work hours across the resource's actual daily capacity, day by day, until all hours are consumed.

**Work hour conversion**: The system stores effort estimates in days. One day equals 8 working hours, regardless of the resource's schedule. This is a universal conversion constant that decouples effort estimation from individual resource capacity.

**Example**: A task estimated at 2 days = 16 hours. For a resource working 4h/day, this takes 4 working days. For a resource working 8h/day, it takes 2 working days. The effort is the same; the calendar duration differs.

### FR-2: Three-Tier Schedule Resolution

For any resource on any given date, the system must determine the scheduled working hours using the following priority:

1. **Date-specific override**: If an override exists for the resource on that exact date, use its working hours. This handles exceptional days (e.g., a resource working on a Saturday, or taking a half-day on a normally full day).

2. **Weekly schedule pattern**: If no override exists, use the resource's weekly schedule for that day of the week (Monday through Sunday). This handles regular patterns like "works 4 hours on Fridays" or "doesn't work Wednesdays."

3. **Resource default**: If no weekly schedule entry exists for that day, use the resource's daily working hours default (typically 8.0). This is the catch-all fallback.

**After resolving the scheduled hours, subtract absences**:
- If any absence on that date is a full-day absence (no hours specified), the entire day is unavailable — effective hours = 0.
- If absences are partial, subtract the total absent hours from the scheduled hours. Multiple partial absences on the same date are summed (e.g., 2h medical + 1h personal = 3h absent).
- The effective hours can never be negative — clamp to zero.

### FR-3: End Date Convention (Exclusive)

The calculated end date must be **exclusive**: it represents the day AFTER the last working day. This means:
- An activity ending on Friday has EndDate = Saturday (the following day)
- Activity chaining works by setting the next activity's start date equal to the previous activity's end date, with no gap and no overlap

This convention is required by the Gantt chart component and must be consistently applied.

### FR-4: Unassigned Activities

Activities not assigned to any specific resource must use a default schedule: 8 hours/day, Monday through Friday, skipping public holidays (festivities). Resource-specific absences do not apply (there is no resource). Weekend days (Saturday and Sunday) are always non-working days for unassigned activities.

### FR-5: Manual Recalculation Only

Gantt dates are recalculated exclusively when the user clicks the "Update Gantt" button. Creating, editing, or deleting activities must NOT trigger automatic recalculation. This keeps CRUD operations lightweight and predictable.

### FR-6: Activity Chaining

When recalculating, activities for each resource are processed sequentially in their existing priority/timeline order:
- The first activity starts on the selected date (chosen by the user in the "Update Gantt" action)
- Each subsequent activity starts on the day the previous activity ends (using the exclusive end date)
- This produces a continuous chain with no idle gaps between activities

### FR-7: Batch Processing Per Resource

All activities for a single resource must be calculated together in one operation, not individually. The system must:
- Load the resource's schedule data (weekly pattern, overrides, absences) once
- Calculate all activity dates sequentially using the pre-loaded data
- Avoid redundant data lookups per activity

Similarly, all unassigned activities for a department are calculated together with festivities loaded once.

### FR-8: Safety Guard

If the algorithm iterates more than 730 calendar days (2 years) without consuming all remaining hours, it must stop and report an error. This prevents infinite loops caused by misconfigured resources that have zero working capacity on every day. The error message should be in Italian and explain that no working capacity was found within the limit.

The 730-day limit (rather than 365) accommodates part-time resources whose tasks may legitimately span more than one calendar year.

### FR-9: Workload Percentage Accuracy

The workload percentage calculation (used in the Work Assignment Wizard) must also use the resource's actual working capacity. The formula changes from days-based to hours-based:

- **Before**: totalRemainingDays / availableBusinessDays * 100
- **After**: (totalRemainingDays × 8) / availableWorkingHours * 100

Where `availableWorkingHours` is the sum of the resource's effective daily hours over the calculation period (typically 30 days), resolved using the same 3-tier logic.

### FR-10: Backward Compatibility

For full-time resources with standard schedules (8h/day, Monday-Friday, no overrides, no absences), the new algorithm must produce identical results to the old one. The change should be invisible to users whose resources already had correct dates.

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Activity has zero remaining time | End date equals start date (no work to distribute) |
| Activity has negative remaining time | Treat as zero with a warning logged |
| Resource has no working capacity on any day | Safety guard triggers at 730 days; error reported |
| Absence hours exceed scheduled hours for a day | Effective hours clamped to zero (not negative) |
| Full-day and partial absences on same date | Full-day takes precedence — entire day unavailable |
| Multiple partial absences on same date | Sum all partial absence hours before subtracting |
| Override grants working hours on a weekend | Resource works that day (override takes priority over weekly schedule) |
| Override sets zero hours on a weekday | That day is non-working (override takes priority) |
| Task finishes partway through a day | Activity ends on that day — partial use of a day still counts |
| Public holiday for unassigned activities | Day is skipped entirely (treated as non-working) |

## What Must NOT Change

- The "Update Gantt" button behavior and user workflow remain identical
- Activity ordering/priority logic is unchanged
- The effort estimation unit (days) is unchanged for users
- No user-facing interface changes
- No changes to how activities are created, edited, or deleted
- The `RemainingTime` computation (which already uses the 8-hour convention) is unchanged
- Original estimated dates (`EstimatedStartDate` / `EstimatedEndDate`) remain untouched — only the Gantt-calculated `StartDate` / `EndDate` are affected

## Integration with EV-002

This feature depends entirely on the working hour configuration infrastructure built by EV-002:
- `Resource.DailyWorkingHours` — the per-resource default (Tier 3)
- `ResourceWeeklySchedule` — 7-row weekly pattern per resource (Tier 2)
- `ResourceScheduleOverride` — date-specific exceptions (Tier 1)
- `ResourceAbsence` — full-day (NULL hours) and partial absences (with hours specified)

The calculation must respect all of these, using the 3-tier priority described in FR-2.

## Constraints

- The MVC frontend layer communicates with the backend API layer exclusively via HTTP. Schedule resolution logic must live in the API layer and be exposed as an endpoint for the frontend service layer to call.
- Date-range-filtered queries must exist for absences and festivities, since loading ALL absences for a resource regardless of date range would be wasteful for resources with years of absence history.
- The system must handle the pre-fetch estimation problem: the end date is unknown before calculation starts, so the system must estimate the date range for data pre-loading and extend it if the calculation runs past the estimate.
