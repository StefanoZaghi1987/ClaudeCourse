# Task: EV-002 - Configurable Working Hours per Resource

## Objective
Enable accurate planning by allowing configuration of individual resource working hours, so that Gantt calculations will reflect part-time schedules and absences accurately.
First of all, the solution must allow the users to configure daily working hours per resource, with 8h as default value.
In particular, for any single resource, daily working hours can vary day by day: this means that the solution must allow to configure and to manage those day-by-day variations, like managing a real time-resource scheduling calendar.
Secondly, the solution must allow to manage holidays and absences in a more structured way. Actually, it allows only to manage daily absences, while we need to manage permissions and absences down to 30 minutes granularity.

## Requirements
- manage resource daily working hours by adding a `DailyWorkingHours` column to `Resource` table. This will represent the default value per resource
- allow to configure daily working hours per resource, with 8h as default value
- allow to configure and to manage daily working hours day-by-day variations, like managing a real time-resource scheduling calendar
- allow to manage holidays and absences in a more structured way, managing permissions and absences down to 30 minutes granularity
- database changes must be managed with SQL migration / modification scripts
- don't implement any unit test: manual testing only

## Context
Read "development-plan.md" and "TICKET#22900 - TaskManagement - modifiche per U.T. - FunctionalAnalysis.md#ev-002-configurable-working-hours-per-resource".
You can find some details about actual implementation in .claude folder, but its content may be outdated.
Detailed aspects of the actual implementation must be inferred by analyzing the codebase.

## Constraints
- configuration persisted in database
- configuration interfaces accessible from resource management
- changes take effect immediately for new Gantt calculations
- historical work data unchanged.

---

**Planning Phase Required:**
1. Review development-plan.md structure
2. Create detailed plan before implementation
3. Get plan approval before coding.
