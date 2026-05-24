# TaskManagement - Production Task Management Application

**ASP.NET MVC 5.2.7 / Web API 2 | .NET Framework 4.7.2 | Kendo UI 2018.1.221**

Production web application for comprehensive activity planning, resource management, and project tracking across multiple departments.

---

## Configuration Structure

This project uses modular configuration for optimal token efficiency and progressive disclosure:

- **CLAUDE.md** (this file) - Core principles, navigation hub, critical triggers
- **`.claude/enforcement-rules.md`** - Project-specific code quality and modularization rules
- **`.claude/architecture.md`** - System architecture, patterns, and design decisions
- **`.claude/technology-stack.md`** - Detailed framework and library information
- **`.claude/kendo-ui-guidelines.md`** - Kendo UI 2018.1.221 best practices summary
- **`.claude/functional-requirements.md`** - TICKET#22900 evolutionary features overview
- **`.claude/project-map.md`** - Complete file location index for navigation
- **`.claude/development-plan.md`** - TICKET#22900 implementation roadmap

---

## Core Development Principles

**Foundation**: All universal best practices (SOLID, DRY, SRP, Separation of Concerns) from `UniversalSoftwareDevelopmentBestPractices.md` apply to this project.

**Project-Specific Principles**:

1. **Production Stability First** - This is a live system serving multiple teams. Changes must preserve existing functionality and data integrity.

2. **Kendo UI 2018.1.221 Compliance** - All UI components must follow version-specific best practices. Read `.claude/kendo-ui-guidelines.md` when working with Kendo widgets.

3. **Italian Localization** - All dates, numbers, and UI text must respect `it-IT` culture. Always set `kendo.culture("it-IT")` for Kendo components.

4. **Token Minimization** - Keep files modular. Split any file approaching 500 lines. See `.claude/enforcement-rules.md` for thresholds.

5. **API-First Backend** - Backend is RESTful Web API. Frontend MVC communicates via services layer. Never bypass service abstraction.

---

## Context-Aware Reading Triggers

**When implementing features**, read in this order:
1. `.claude/functional-requirements.md` - Understand business requirements
2. `.claude/development-plan.md` - Check implementation strategy and dependencies
3. `.claude/architecture.md` - Review architectural patterns
4. `.claude/kendo-ui-guidelines.md` - If UI work involved

**When working with Kendo UI components**:
- Grid operations → Read `Kendo_Guidelines_Part2_Grid_DeepDive.md`
- Gantt modifications → Read `Kendo_Guidelines_Part3_Gantt_DeepDive.md`
- Form components (DropDownList, MultiSelect, DatePicker) → Read `Kendo_Guidelines_Part4_FormComponents.md`
- Performance issues → Read `Kendo_Guidelines_Part6_CrossCuttingConcerns.md`

**When fixing bugs**:
1. `.claude/project-map.md` - Locate relevant files
2. `.claude/architecture.md` - Understand component relationships
3. `.claude/enforcement-rules.md` - Verify code quality standards

**When refactoring**:
1. `.claude/enforcement-rules.md` - Review file size limits and modularization rules
2. `.claude/architecture.md` - Ensure pattern consistency
3. `UniversalSoftwareDevelopmentBestPractices.md` - Apply SOLID principles

**When reviewing code**:
1. `.claude/enforcement-rules.md` - Check against quality standards
2. `.claude/technology-stack.md` - Verify framework usage
3. `.claude/kendo-ui-guidelines.md` - Validate Kendo UI implementation

---

## Update Triggers

**Update `.claude/development-plan.md` when**:
- Completing tasks from TICKET#22900
- Discovering new dependencies between features
- Adjusting implementation priorities
- Identifying risks or blockers

**Update `.claude/project-map.md` when**:
- Adding new controllers, services, or views
- Creating new JavaScript utilities
- Restructuring directories
- Adding configuration files

**Update `.claude/enforcement-rules.md` when**:
- Discovering recurring code quality issues
- Establishing new team conventions
- Identifying patterns that should be enforced

---

## Critical Technology Constraints

**Kendo UI 2018.1.221 Specific**:
- Grid virtual scrolling + batch edit = known bug (use one or the other)
- MultiSelect has no native cascading (manual implementation required)
- Window component memory leaks in IE11 (destroy instances when done)
- Always use `.Encoded(true)` for XSS protection unless HTML rendering required

**Backend Constraints**:
- Unity container for DI (constructor injection only)
- Entity Framework + Dapper hybrid (EF for writes, Dapper for complex reads)
- FluentValidation for all request validation
- Enterprise Library for logging and exception handling

**Frontend Constraints**:
- Server-side Razor rendering (not SPA)
- All API calls through services layer (never direct from controllers)
- Italian culture for all dates (`kendo.culture("it-IT")`)
- HTTPS only, CSRF tokens required on all state-changing operations

---

## Quick Navigation

**Find Files**: Use `.claude/project-map.md` - complete file location index organized by feature area and file type.

**Current Work**: TICKET#22900 has 9 evolutionary features. See `.claude/development-plan.md` for phased implementation roadmap.

**Architecture Questions**: See `.claude/architecture.md` for MVC pattern, service layer, repository pattern, and DI configuration.

**Technology Details**: See `.claude/technology-stack.md` for framework versions, NuGet packages, and library capabilities.

**Code Quality Standards**: See `.claude/enforcement-rules.md` for file size limits, naming conventions, and modularization requirements.

---

## Essential Project Context

**Codebase Location**: `D:\GammaTaskManagement\GammaTaskManagement`

**Key Statistics**:
- 24 MVC Controllers + 24 Web API Controllers
- 100+ Razor Views
- 35+ JavaScript utility files
- 5 major service classes (largest: 4,123 lines)
- 20+ Kendo Grid instances
- 5 Gantt chart implementations

**User Roles** (5 roles, 28+ use cases):
- RDR (Responsabile di Reparto) - Department Manager
- OPR (Operatore Tecnico) - Technical Operator  
- DEV (Sviluppatore) - Developer/Admin
- QUA (Ufficio Qualità) - Quality Office
- SYS (Sistema) - Automated System

**Current Focus**: TICKET#22900 evolutionary features. **8/9 completed** (EV-001, EV-002, EV-003, EV-005, EV-006, EV-007, EV-008, EV-009). **Next**: EV-004 (Parallel Work Support in Gantt).

---

## For Detailed Information

- **Complete Project Overview**: `ProjectContext.md`
- **Backend Architecture**: `WebAPIBackEndAnalysis.md`
- **Frontend Architecture**: `FrontEndAnalysis_Part1_Overview.md` through `Part4`
- **Universal Best Practices**: `UniversalSoftwareDevelopmentBestPractices.md`
- **Configuration Best Practices**: `ClaudeCodeConfigurationBestPractices.md`
- **Modularization Guidance**: `ClaudeCodeModularizationBestPractices.md`

---

*Configuration optimized for token efficiency while maintaining complete project context accessibility.*
