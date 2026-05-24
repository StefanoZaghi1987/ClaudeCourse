# Task: EV-003 - Modified Gantt Date Calculation Algorithm

## Objective
Improve Gantt date calculation logic by using resource-specific working hours.
Gantt date calculation must resolve effective working hours per day using hours-based calculations and 3-tier resolution: Override → WeeklySchedule → DailyWorkingHours default.
The new logic must also take into account weekends and correctly manage partial absences, full-day absences and festivities (which are represented as full-day absences).
Current hardcoded 8-hour assumption causes completion dates to be wrong for part-time resources, leading to unrealistic timelines and missed deadlines.
Gantt date calculations must become accurate for all resources, paying attention to part-time resources.

## Requirements
- Gantt date calculation must resolve effective working hours per day using hours-based calculations and 3-tier resolution: Override → WeeklySchedule → DailyWorkingHours default
- Gantt date calculations must become accurate for all resources, so also part-time resources show accurate completion dates
- calculation logic accounts for partial absences
- calculation logic accounts for weekends and holidays
- remove hardcoded checks and logic
- for unassigned activities, Gantt date calculations will be based on 8 working hours per day (Mon-Fri)

## Context
Read "development-plan.md", then read the design spec ("specs/EV-003_Modified_Gantt_Date_Calculation_Algorithm.md") and the implementation plan ("specs/EV-003_Implementation_Plan.md").
You can find other information in "TICKET#22900 - TaskManagement - modifiche per U.T. - FunctionalAnalysis.md#ev-003-modified-gantt-date-calculation-algorithm".
You can find some details about actual implementation in .claude folder, but its content may be outdated.
Detailed aspects of the actual implementation must be inferred by analyzing the codebase.

**EV-002 Infrastructure Available**:
- `Resource.DailyWorkingHours` — per-resource default (decimal, 0.0-24.0)
- `ResourceWeeklySchedule` — 7 rows per resource (Mon-Sun), `WorkingHours` per day
- `ResourceScheduleOverride` — date-specific overrides with `WorkingHours`
- `ResourceAbsence.AbsenceHours` — NULL=full-day, numeric=partial (>= 0.5, multiples of 0.5)
- 3-tier resolution: Override → WeeklySchedule → DailyWorkingHours default

## Constraints
- integration with EV-002 - Configurable Working Hours
- Gantt diagram must be manually recalculated using "Update Gantt" button (no automatic recalculation triggers)

---

**Planning Phase Required:**
1. Review development_plan.md structure
2. Review design spec ("specs/EV-003_Modified_Gantt_Date_Calculation_Algorithm.md") and implementation plan ("specs/EV-003_Implementation_Plan.md") structure
3. Create detailed plan before implementation
4. Get plan approval before coding
5. Use superpowers:subagent-driven-development to implement this plan