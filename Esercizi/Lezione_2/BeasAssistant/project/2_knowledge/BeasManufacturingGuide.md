# Technical Summary Report
## Beas Manufacturing 2024.04
### Boyum IT Solutions — Official Documentation Analysis

**Report Language:** English
**Output Format:** Markdown (.md)
**Source:** https://help.beascloud.com/beas202404/
**Date of Analysis:** February 2026
**Prepared for:** Gamma S.p.A. — SAP Business One Support Context

---

## [INTRODUCTION]

This document is a detailed technical summary of the official **Beas Manufacturing 2024.04** help documentation published by Boyum IT Solutions at `https://help.beascloud.com/beas202404/`. Beas Manufacturing is a comprehensive add-on for **SAP Business One** (SAP B1), designed specifically for small and mid-sized manufacturing enterprises. The system is described in its own documentation as "a comprehensive solution for small and mid-sized manufacturing enterprises, fully integrated into SAP Business One," providing business information and specialized reports for departments including sales, production, accounting, and purchasing.

The documentation covers the complete functional and technical scope of the product: system administration, master data management, production execution, planning, quality control, costing, integration with SAP Business One, and specialized modules such as the Factory Data Capture (FDC) terminal, the Advanced Planning and Scheduling (APS) engine, the Product Configurator, the Variant Generator, the Beas Service Layer (BSL) API, and the Maintenance module. It is intended for both **end users** (production planners, shop floor supervisors, quality controllers, sales staff) and **technical/administrative users** (system administrators, IT personnel, SAP consultants, and developers building integrations or customizations).

This summary preserves all technically significant content from the source documentation, organized by functional domain. Each section corresponds directly to content explicitly documented in the 2024.04 release. No content from other Beas versions has been included unless it was explicitly cross-referenced in the 2024.04 documentation itself.

---

## [DISCUSSED TOPICS]

### 1. System Architecture and SAP Business One Integration

Beas Manufacturing is architected as a tightly integrated SAP Business One add-on. According to the documentation, "Beas is completely integrated into SAP Business One but it can be started outside of SAP Business One as well." The integration is bidirectional: Beas reads and writes data to the SAP B1 database (SAP HANA), extends SAP B1 windows with additional tabs and fields, and registers its own menus within the SAP B1 menu structure.

**Core integration mechanisms:**

- **DI API Connection:** Beas uses two connection modes to the SAP B1 DI API: *GetDICompany* (shared connection, memory-efficient) and *Context Cookie* (non-shared, higher memory usage). The DI API user configured for Beas requires administrative access to SAP B1 for database checks and transaction validation, but does not require a Professional SAP license.
- **Extended UDF Fields:** Beas injects User-Defined Fields (UDFs) into standard SAP B1 documents (sales orders, purchase orders, goods receipts, etc.) to store manufacturing-specific data such as item version (`beas_ver`), configuration reference (`beas_vri`), short variant (`beas_shortvariant`), pre-calculation number (`beas_precalcnr`), drawing number (`beas_znr`), and project/task (`beas_prjud`).
- **SAP B1 Item Master Extension:** The Item Master Data window is extended with an **Advanced Production** tab described as "a collection of all Beas functions integrated inside the SAP functionality," adding BOM, routing, configurator, and quality control tabs.
- **SAP B1 Document Extension:** Sales, purchase, and inventory documents gain Beas-specific right-click menu entries, allowing direct creation of work orders, precalculations, and inventory operations from within standard SAP B1 document windows.
- **Personnel Synchronization:** Personnel records are synchronized between Beas and SAP B1. However, Beas uses alphanumeric personnel IDs while SAP B1 uses numeric-only IDs. Synchronized fields include first name, second first name, and surname.

**Integration-specific constraints documented:**

- The SAP B1 messaging system is "not 100% compatible with the Report system" and its use is explicitly discouraged. The SAP mailer creates HTML emails that conflict with Beas report output.
- The SAP B1 "User defaults and Print preferences" settings under Administration are not supported by the Beas Report system.
- Multi-dimensional profit center tracking in SAP B1 must remain disabled ("Use multidimensional" = OFF) when using the Beas Business Performance module, which operates with a single dimension only.
- For correct WIP (Work-in-Progress) accounting, "all postings must be made in one branch for one work order."

---

### 2. User Interface and Window Types

The Beas user interface integrates into SAP B1 and is visually distinguished: "All Beas windows are marked with the Beas logo at the bottom right corner." Three primary window types are documented:

- **Browser (List) Windows:** Display rows of data with sorting, filtering, and column customization. All list windows support the Template system for saved view configurations.
- **Edit Windows:** Detailed data entry forms for creating or modifying individual records.
- **Structure (Hierarchy) Windows:** Hierarchical views such as the Work Order Structure View. Note: "Window settings are not possible in windows with a structure view."

**Toolbar and keyboard shortcuts:**

The interface provides toolbar icons for preview, print, email, fax, Word/Excel/PDF export, navigation (first, previous, next, last), filtering, and record management. Documented keyboard shortcuts include `Ctrl+Shift+I` for the debug window and `Ctrl+N+B` for script settings.

**Right-click menu:** Available in nearly all Beas windows, providing context-independent functions (copy/paste, search, export, macros, reports, window settings, template administration, error history, change log) and context-sensitive functions specific to each screen type. Reports from the Work Order structure view are designed to display up to **6 sub-levels** of hierarchy; information beyond 6 sub-levels is not printed.

**Window Settings:** Users can customize column width, column order, column visibility, and field formatting (color, bold, italic, tooltip) in list windows via the right-click menu. A Sum function is available for numeric and string fields. Changes require the "Template authorization" permission.

**Templates:** The Template system allows users to save and retrieve multiple named configurations for list windows, including sorting, filtering, column layout, and additional field selections (up to 6 additional fields from any table). Templates support access restriction via Template Authorization.

---

### 3. Administration and Configuration Wizard

#### 3.1 Configuration Wizard Overview

The **Configuration Wizard** is the central configuration hub for Beas. It is accessed via *Administration > System Initialization > Configuration Wizard*. It uses a color-coded status system:
- **Red flag:** Settings not yet configured
- **Orange flag:** Settings partially configured
- **Green flag:** Settings complete

The wizard supports change history logging (with full audit trail), import/export of settings (for reuse across companies or testing), comment storage, warning messages for incorrect configurations, and in-context help text search. It is organized into the following tabs, each corresponding to a functional domain:

| Tab | Domain |
|---|---|
| Administration | System-level settings |
| Financials | Financial configuration |
| Business Partners | Customer/vendor setup |
| Sales | Sales order parameters |
| Master Data | Item groups, properties, UoM, manufacturers |
| Production | Production-specific parameters |
| Quality Control | QC parameters |
| Materials Management | Batch/serial, MRP defaults |
| Calculation | Calculation schema, precalculation, post-calculation |
| Personnel/Attendance | HR and time recording |
| Business Performance | Absorption costing activation |
| System | DI API, memory, UIP, extensions |
| Terminal & Web App | Terminal configuration |
| WMS Settings | Warehouse management system parameters |

#### 3.2 System Configuration Tab

Key parameters in the System tab:

- **Extended Error Messages:** Beas can automatically create activities for the current user when specific errors occur. Options: Beas activity (default), SAP Business One activity, or none.
- **DI API Connection Type:** GetDICompany (shared, recommended for memory efficiency) or Context Cookie.
- **B1 API User:** Designated user for administrative database access; does not require Professional SAP license.
- **Browse Row Limit:** Default maximum of **200 rows** per list. When exceeded, binoculars icon appears in the bottom-right corner.
- **Usability Improvement Program (UIP):** Voluntary, encrypted participation; does not transmit business data.
- **Customer-Specific Extensions:** Stored locally or centrally; central storage has performance and distribution trade-offs.

#### 3.3 General Settings

The General Settings section extends SAP B1's standard General Settings window with Beas-specific restrictions. Sub-sections cover: business partners, services, display settings, typography (font/background), and inventory management.

#### 3.4 Document Settings

Additional notes supplement SAP B1's document settings, covering inventory-related document behavior (`bestand_2.htm`, `belegeinstellung-allgemein.htm`).

#### 3.5 Station Settings Wizard

Separate wizard for configuring individual workstation settings.

#### 3.6 Factory Calendar

The Factory Calendar defines holiday schedules and resource availability percentages. Key characteristics:

- Up to **6 calendars** plus 1 basic calendar can be defined.
- The **basic calendar** is used exclusively for human shift planning.
- Resource planning uses the basic calendar or any of calendars 1–6.
- Machine capacity formula: `hours/day of resource × count of resources × calendar day %`
- Human resource presence formula: `count of hours (shift definition) from current day template × calendar day %`
- **Important note:** If the B1UP Usability Package Add-On is installed but Beas Production or Maintenance Calendars are not visible, the user must restore calendars as described in the B1UP documentation.

#### 3.7 Report Setup and Macros

The Beas Report system provides complete document management integrated with SAP B1. All documents can be printed or sent by fax/email. Configuration includes:

- **Standard reports:** Pre-built reports provided by Beas.
- **Own reports:** User-defined custom reports.
- **Text components:** Reusable text blocks for report construction.
- **Translation (Report):** Report content translation management.
- **Languages (SAP):** SAP B1 language configuration for reports.
- **Filter:** Report filtering options.
- Crystal Reports integration is supported.
- Macros are available for automated output (print, email, fax) from any Beas window.

---

### 4. Licensing

Beas licensing is managed through the **Boyum portal**. Key licensing rules:

- Licenses are organized **per database and SAP Business One installation number**.
- License verification is performed **daily** via an online check; the firewall must allow access to `boyum-it.com`.
- **Basic License:** Assigned to individual users. A user can run multiple Beas instances on one workstation but not simultaneously on different workstations.
- **Terminal License:** Based on concurrent user count; used for Desktop Terminal and Web Apps.
- **Background services** do not require licenses.
- An **offline license** option is available for environments without internet access.

**Documented license types (from the License Requirements page):**

| License | Description |
|---|---|
| Beas Manufacturing | Core product; per-user |
| Product Configurator | Multiple variants for different user types, including single-item and web interface |
| APS (Advanced Planning and Scheduling) | Includes Gantt viewer (Netronic-based, separate license activation required) |
| Maintenance of Resources | Maintenance module |
| Cost Accounting | Business Performance & Absorption Costing |
| Project Management | Project module |
| App: Issue/Receipt/Allocation | Terminal app |
| App: GR/PO, Order Labels, Stock Info | Terminal app |
| App: Inventory | Terminal app |
| App: Quality Control | Terminal app |
| App: Time Recording / Clock In-Out | Terminal app |
| App: PDC Start/Interrupt/FG/Scrap | Terminal app (PDC = Production Data Collection) |

---

### 5. User Authorization and Rights Management

Beas operates a rights management system parallel to SAP Business One. Three permission levels apply to each function:

- **None:** Function is blocked.
- **Read:** Read-only access; no changes permitted.
- **Full:** Full authorization — create, change, delete.

Authorization is organized into **100+ authorization codes** covering all functional areas: production management (work orders, BOMs, routings), material/warehouse management, quality control, personnel administration, APS planning, financial calculations, post-calculations, and system administration.

An **Extended rights** tab allows granular control by item groups, material groups, and authorization groups, restricting access to specific BOMs and routings.

The **User-SAP Rights** page documents additional SAP B1 rights that must be granted to Beas users for specific functions (e.g., time receipt posting requires specific SAP B1 transaction rights).

---

### 6. Item Master Data

The Beas Item Master is described as "a parallel function to the SAP Business One item master, but it provides the features for production management in separate tabs." It is accessed via the SAP B1 Item Master Data window using the right-click menu's extended production options.

**Main tabs in the Beas-extended Item Master:**

| Tab | Content |
|---|---|
| Header / SAP Item Master | Standard SAP B1 item header fields |
| Advanced Production | Collection of all Beas production functions |
| Advanced General | Extended general settings |
| Advanced Warehouse Rules | Warehouse-specific rules |
| Advanced Scheduling | APS scheduling parameters |
| Advanced Manufacturing Data | Manufacturing-specific defaults |
| Advanced Version | Item version control settings |
| Advanced Calculation | Calculation schema assignment |
| Batches (New) | Batch management settings |
| Planning Data | MRP planning parameters |
| Production Data | Production defaults |
| Properties | Item properties |
| Remarks | Notes and remarks |
| Attachments | Attached documents |
| Bill of Materials | BoM tab (visible when item version control is disabled) |
| Routing | Operations definition tab (visible when item version control is disabled) |
| Configurator | Product configurator parameters |
| Quality Control | QC inspection plan assignment (from version 9.0 onward) |
| Units of Measure | UoM configuration |

Data validation and record deletion are possible without Beas running (via SAP B1 native functions). The Configuration Wizard default view can be configured. A right-click menu provides extended production options including advanced item creation.

---

### 7. Bill of Materials (BOM)

The BOM module is accessible via *Inventory > Item Master Data > Bill of Materials tab* (when item version control is disabled) or standalone via the Inventory menu.

**Key BOM features documented:**

- **Structure depth:** Up to **20 hierarchy levels** are supported.
- **Cross-reference (BOM Usage / "Where Used"):** Allows users to "determine exactly which articles/parts lists are affected by the change of an article and this through all structures." Supports release mechanism and impact analysis.
- **BOM Header fields:** BOM ID (can match item number or be freely assigned), for-item link, description, routing assignment, release status, authorization group, and 4 user-defined fields (UDF 1–4).
- **Release Status:** Determines whether the BOM is usable for work order creation. Unreleased BOMs cannot be used to create work orders.
- **Version control:** Multiple BOM versions per item are supported (e.g., 300.3042-001, 300.3042-002).
- **BOM Positions (Components):** Each position has: position number and ID, item number and version, quantity and unit of measure, warehouse and bin location, Best Before Date (BBD) options for WMS integration, variant management (up to 26 variants A–Z), percentage quantity display, drag-and-drop sorting, formula assignment, and precalculation/work order integration.
- **Alternative materials:** Each BOM position can define alternative materials.
- **BOM batch change:** Mass-modification of BOM versions across multiple assemblies.
- **Difference BOM:** Tool for comparing two BOM versions.
- **Copy BOM / Insert From:** Imports BOM data from another item.
- **CAD Import:** BOM data can be imported from CAD systems via the Data Integration Hub.
- **Configuration Wizard BOM settings** (`stueckliste3.htm`): Additional BOM parameters configurable through the wizard.

---

### 8. Routing and Operations

Routings define the manufacturing sequence for a product. As documented: "Routings or operations are steps or tasks used to manufacture a product, which can be carried out on internal work centers or by contracting external providers."

**Routing Header fields:** Routing ID, for-item link, description, match code, allow-changes checkbox, release date/person, locked flag, blockage reason, image icon, color (header-specific), and information notes.

**Routing is managed independently or linked to items:**
- When item version control is **disabled**: routings are directly linked to items via the Item Master routing tab.
- When item version control is **enabled**: routings are managed independently.

**Routing Positions (Operations) — key fields:**

- Position number (alphanumeric, 20 characters, incremented by 10)
- Operation type and catalog selection
- Resource assignment (work station, machine, or external supplier)
- Active status indicator
- **Clock Mandatory** checkbox (forces time reporting for this operation)
- Description (up to 16,000 characters; supports formula-based dynamic content with placeholders: `<c:e_quantity>`, `<i:itemname>`, `<v:variable_name>`)
- Variant rows (V-A through V-X for variant-specific definitions)
- Instructions field
- Script storage (for variant production)

**Routing position tabs:** External operations, Tools, Utilities/Consumables, Parallel operations, Alternative operations, Attachments, Special functions.

**Operation Catalog:** A library of reusable operation definitions that can be referenced in routing positions, promoting standardization.

**Operation Types:** Configurable types that determine behavior of routing positions.

---

### 9. Resources and Work Centers

Resources are defined as "productive resources that Beas uses as the smallest capacity unit." They store machine hour rates, planned capacity, and transition/vacation time.

**Resource types treated uniformly by the system:**

- Work stations and machines
- Employees and employee groups
- Tools
- Buildings
- External operations
- Resource groups

**Resource Master Data tabs:** General, Scheduling, Costs, Cost Details, Attachments, Documents, Expendable Material (consumables), Extended Setup, Interruptions (downtime), and Maintenance Orders.

**Resource ID restrictions:** Maximum **20 characters**; prohibited characters include spaces, equal signs, commas, angle brackets, quotation marks, apostrophes, ampersands, percent signs, and certain special characters (umlauts).

**Resource Groups:** Collections of machines that can be used alternatively or belong to the same production unit. Individual resources are not required to belong to a group.

**Parallel Resources:** Separately planned resources synchronized with a main resource's timing. They support multiple cost sets and can exceed 100% utilization. Alternative parallel resources allow selection during scheduling or optimization.

**Resource Optimization:** The APS engine can automatically optimize the selection of optimal resources within groups and parallel alternatives within operations.

**Resource Shift Plan:** Defines working time patterns for resources, used in capacity planning calculations.

**Graphical Resource Utilization Display:** Visual representation of resource loading.

**Important APS limitation documented:** "In APS, the system calculates interruption time ONLY for resources. Tools do not have a precalculated calendar."

---

### 10. Work Orders and Production Management

The Work Order is "the central window for managing all production functions." A work order consolidates "all the instructions for the planning and production of an item."

**Work Order access paths:** Production > Work Orders > [WO list or structure view]

**Work Order hierarchy (displayed in structure view):**

1. Work Order (top level)
2. Assemblies
3. Journal postings and transactions
4. Bill of Materials positions
5. Materials with reservations and batch information
6. Routings with time receipts

**Work Order Structure View:** The central multi-level production management window. Status icons indicate: printed, logged on, blocked, scheduled, and other states. Templates and Window Settings are supported for customization.

**Performance note:** "For large databases, the comprehensive display may cause slow loading. Reducing displayed rows or disabling extended status displays optimizes performance."

**Work Order Structure View — right-click menu (3 tabs):**

- **Tab 1 (Basic Functions):** Error checking, edit/create/delete orders, copy assemblies, access sales orders, Gantt view, material reservations and issues, allocations, stock transfer requests, complaints, search.
- **Tab 2 (Extended Functions):** Structure refresh, formula recalculation, item closure, pool management, scheduling (backwards dispatch, forward dispatch, reallocation), error protocol.
- **Tab 3 (Expand Functions):** Expand assemblies, BOMs, routing, or complete structure.

Both "Traditional style" and "Boyum Style" menu presentations are available.

**Assemblies:** Sub-work orders created for assembly items within a parent work order structure.

**Sales Order to Production Order conversion:** A dedicated window displays customer orders (top section) and corresponding work orders (bottom section), supporting order-related and storage-related filtering tabs. Important note: "Duplicate items are not combined. This is not always desired due to structure production."

---

### 11. Factory Data Capture (FDC) and Terminal Applications

The FDC system enables real-time registration of work order times, statuses, and quantities. It supports both desktop (PC) and web-based interfaces.

**Terminal types:**

- **Client-Server Desktop:** Standalone PC application or integrated within SAP Business One.
- **Web-Based (WebApps v2.1):** Accessible on touch-screen terminals, tablets, or mobile devices.

#### 11.1 WebApps Version 2.1

The WebApps system supports "simple reporting of work order times, statuses and quantities, goods issue and receipting."

**Documented system requirements:**

- **Operating System:** Any OS with HTML5/CSS3/ES6 capable browsers
- **Supported browsers:** Chrome 70+, Edge 17+, Firefox 63+, Safari 11.1+
- **Minimum resolution:** 360×640 pixels
- **Technology stack:** HTML5, CSS3, JavaScript ES6
- **Web server:** Internal Beas Web Server
- **Primary hardware reference:** Zebra TC20 with keyboard

**Login system:** Via Station/Location/Card Number; cookie-based credential caching for repeated access. Personnel name and password authentication available through program group settings.

**UI behavior:** Auto-completion in search fields; mandatory fields shown with red frames; item-specific fields activate conditionally; extended information screens available for certain data. **Limitation: "UDFs are not supported by the WebApp Terminal 2.1."**

#### 11.2 FDC Configuration (Production Configuration Wizard)

Key FDC parameters in the Configuration Wizard under Production:

| Parameter | Description |
|---|---|
| Time Linking | How working hours are calculated: none, shift definition, or shift definition + attendance |
| Attendance Linking | Auto log-in/out of attendance when registering work orders |
| Parallel Calculation | Splits parallel work order times proportionally |
| Close Operation Sequence Automatically | Auto-closes positions when planned quantities are reported |
| Multiple Login | Allows sequential operation sequence logins |
| Master-Slave Time Distribution | Distributes time across related operations |
| Material Tracing | Links material entries to registered production positions |
| Preliminary Test Entry | Validates journal entries before posting |
| Cost Center Determination | Default cost center source for time receipts |

#### 11.3 Production Time Receipt (Manual Time Entry)

Manual entry of production time data. Key fields: work order and position, personnel/employee, date and time (from/to and duration), quantity yield and scrap, resource/machine, cost element and cost center.

**Important constraint:** "Only new entries are possible; existing entries cannot be changed" unless in edit/change mode.

#### 11.4 Application Catalog and Authorization Groups

Terminal apps are organized in program groups. Access control is implemented through **authorization groups** that restrict employee access to specific applications.

---

### 12. Backflushing and Material Posting

**Backflushing (Work Order Backflushing Booking)** allows creation of a finished goods receipt while automatically backflushing all necessary materials. The process requires only a work order position barcode and quantity.

**Key features:**

- Materials marked as "backflush" in the BOM position are automatically removed from inventory.
- Planned times can be automatically booked as actual times.
- Supports Produmex WMS Batch attributes.
- Pre-allocation: quantities for backflushing items are automatically pre-allocated.
- Configurable issue and receipt warehouses and bin locations.
- **Activation required:** Must be enabled in Configuration Wizard under Production > Material posting.

**Retrograde material booking** (standard backflushing) is also available as a separate function.

**Material posting configuration:** Configurable via `materialbuchung_und_reservier2.htm` (quantity configuration) and `retrograd_abbuchen_option.htm` (backflushing options).

---

### 13. External Production (Subcontracting)

External production (subcontracting / toll manufacturing) is ordered as a **service item** by default. The documented process flow is:

1. Preparation
2. Pricing
3. Work order creation
4. Purchase order generation
5. Incoming goods posting
6. Provision parts posting

**Time management:** Lead time calculations support factory calendar consideration or idle time specifications. "External production typically does not have resource limits."

**Pricing and transport costs:** Separate configuration page (`preisfindung_und_transportkost.htm`).

**Provision parts:** Materials supplied to the subcontractor (Beistellung). Separate posting function for outgoing provision parts (`ausbuchen_beistellteile.htm`) and goods receipt (`fremdfertigung_mit_beistellung.htm`).

**Collective purchase order:** A dedicated function creates a purchase order for multiple external production positions simultaneously.

---

### 14. Capacity Planning (Advanced Planning and Scheduling — APS)

The **APS** (Advanced Planning and Scheduling) module provides sophisticated production scheduling capabilities. As documented: "APS is software for configuring, planning, and controlling supply chains" operating at three levels: strategic (configuration), tactical (planning), and operational (execution).

APS functionality "enables planners to automate, optimize, and compare production plans and schedules that reflect actual resource capacity and material availability." The system calculates optimal work order start dates based on priorities, machine capacities, and factory calendars.

**APS requires a separate license.**

#### 14.1 Scheduling Types

Two pre-defined scheduling types:
1. Resource-oriented (standard)
2. Order-oriented

Planning starts in the **Planning Types** window. For scheduling at work-order level without detailed resource scheduling, the Planning View is recommended.

#### 14.2 APS Calculation Types

Five default calculation types are available; custom ones can be created.

**Scheduling directions:**

| Direction | Description |
|---|---|
| Backwards | Material-optimized (from delivery date backwards) |
| Forward | Resource-optimized (from available date forward) |
| Catch Up | Moves past/overlapping operations to the present |
| Latest Start | Combines forward calculation with material optimization |

Each calculation type configures: scheduling direction, consideration of material receipts, buffer times, material check options, and work order filtering. Multiple calculation steps can be defined with conditions (e.g., `Date > Delivery Date`, `Date < Start Date`) for iterative optimization.

**Documented APS limitation:** "In APS, the system calculates interruption time ONLY for resources. Tools do not have a precalculated calendar."

#### 14.3 Gantt Chart View

The Gantt visualization uses the **Netronic® Gantt system** and requires a separate license (activated in license administration). Access: *Production > Capacity Planning > APS > View > Gantt button* or via right-click on the Production Structure.

Gantt features include: multi-select, parallel operation display, time scale configuration, group functions, recalculation, drag-to-reschedule, resource-optimized fine planning, resource utilization display, alternative resources, and complete view options.

#### 14.4 Pool Management

Pool management groups work orders for scheduling purposes, accessible via the right-click menu in the Work Order Structure view.

#### 14.5 Graphical Utilization Display

A graphical capacity loading display is available separately from the Gantt chart, showing resource utilization trends.

---

### 15. Quality Control (QC)

The QC module is accessible via *Production > Quality Control*. It provides comprehensive inspection management integrated with inventory and production workflows.

**QC Inspection Plans:**

- Inspection plans define test parameters, sample methods, and release criteria for items.
- "The system applies the highest-priority inspection plan" when multiple plans exist for an item.
- Priority is determined by a points-based system considering: customer, warehouse, item version, and document type.
- If no explicit plan is assigned, the system automatically assigns a QC plan matching the item name.
- Users require "Item Quality Control" authorization.

**QC Order creation methods:** From goods receipt, production receipt, manual creation, or automatic triggering.

**Sample types:** Time-based, fixed quantity, scale quantity, or serial number-based.

**Measurement registration:** By sample or by position; manual or automated release processes.

**Material release methods:** By measured values, manual confirmation, four-eyes principle (*Vier-Augen-Prinzip*), or **electronic signature**.

**QC Order Edit window sections:**

| Section | Content |
|---|---|
| Ribbon | Documents, Batch block, Input per sample, Input by test, Transfer, Activities |
| QC-Order Information | Order ID, document type, item details, quantity, inspection plan link, source document |
| Status Information | Sample counts (open, OK, error), transfer status |
| Release and Valuation | Blockage reasons, valuation settings, order release, closure |

**Goods transfer:** Items can be transferred to standard or blocked warehouses depending on QC outcome.

**Test equipment, measurement input:** Configurable measurement forms per inspection position; WebApp support for QC by sample, QC by test, and QC transfer.

**Batch-level QC:** Integration with batch management for tracking QC status per batch.

---

### 16. Variant Production and Product Configurator

Beas supports multiple variant management methods, documented as follows:

#### 16.1 Variants A–Z

The simplest approach: "up to 26 variants per item" using alphabetical identifiers (A–Z). Described as "very simple operation" with "very quick setup" but "limited possibilities." Variant rows V-A through V-X are available in both BOM positions and routing positions.

#### 16.2 I-Version (Item Version Control)

Uses item version control as a variant management tool, controlling the visibility of routing or BOM positions per version. Each item can have multiple versions with different BOM and routing configurations.

#### 16.3 Variant Generator

Enables dynamic creation of BOMs and routings using scripts. "Users can store formulas, tables, variables, or scripts behind each parameter, allowing highly customizable manufacturing processes." Supports integration with the Product Configurator for managing item, routing, and BOM variants across different business process phases.

Components of the Variant Generator:

- **Formulas** (`formeln.htm`)
- **Tables** (`tabellen.htm`)
- **Variables** (`variablen.htm`)
- **Beas Script / JBScript** (`herkunftsarten.htm`, `beas_script2.htm`)
- **DataWindow Syntax** (`datawindow-syntax.htm`)

**Beas Script predefined variables:** `e_itemcode`, `e_quantity`, `e_docnum`, `e_belmr_id`, providing access to assembly, order, and work order information.

Variable value assignment methods:

- **SQL statements:** "The result of the select statement is returned. Only one result may be returned."
- **Beas/JBScript:** Custom scripts with access to predefined variables.
- **Data sources:** Fields from item tables, sales orders, or BOM structures.

#### 16.4 Product Configurator

Provides graphical configuration with "endless number of configurations including item generation and price calculation." Integrates into SAP Business One. Described as having "high training requirement for setup." Supports web-based access through the Web Product Configurator (`web_product_configurator.htm`).

#### 16.5 Third-Party Configurator

Allows integration with external configurators that save results to SQL database tables.

---

### 17. Material Requirements Planning (MRP)

The MRP module is accessible via *Materials Management > MRP Wizard*. As documented: "MRP enables you to plan material requirements for a manufacturing or procurement process."

**Core MRP process:**

1. Create and configure an MRP scenario
2. Execute calculation
3. Review order recommendations
4. Generate purchase requests or production orders

**Coverage calculation:** The system performs hierarchical breakdown of assembly requirements, checking stock availability at each BOM level, accounting for:

- Existing inventory
- Existing purchase orders
- Existing production orders
- Temporary reservations (based on minimum inventory needs, existing production outflow, customer orders, transfer requests, and forecasts)
- Future inflow (configurable time parameters prevent duplicate ordering)

**Planning rules respected:** Multiple Order Quantity, Minimum Order Quantity.

**MRP Scenario setup parameters:**

| Parameter | Description |
|---|---|
| Average Lead Time | Working days for delivery consideration; affects MRP runs and work order creation |
| Lead Time Assurance | Additional calendar days subtracted beyond standard lead time for order recommendation dating |
| Goods Receipt PO Idle Time | Formula: `Requirement date − delivery time (item master) − goods receipt idle time = Purchase date` |
| Priority Control | Ordering hierarchy; priorities cascade from assemblies to materials; customer orders override master data |
| External Operation Calculate | Expert mode only; disabled by default; for compatibility reasons |

**MRP Wizard:** Displays all scenarios with status indicators (green = ready, blue = in-work, red = errors). Supports automatic server-side calculation, MRP2 resource calculation, and analysis tools.

**MRP Analysis tool:** Displays performance statistics (calculation times, record counts by category) to identify bottlenecks. "If the MRP runs slowly, you can analyze the calculation with this tool."

**Forecasts (MPS):** "Any number of forecasts can be taken into account by MRP." Various computation methods are available. Warehouse specification in forecasts is supported.

**Documented limitations:**

- SAP B1 warehouse management allows only item-level management, not variant/configuration-level planning.
- From version 9.2 onward, SAP B1's warehouse definition is used (replacing earlier UDF fields in forecasts).

**MRP2 Resource Requirements:** Resource capacity requirements can be calculated as part of MRP, providing visibility into whether planned production is feasible given available resource capacity.

**Automatic MRP calculation:** Can be triggered automatically via server activation.

---

### 18. Precalculation (Cost Estimation)

Precalculation is defined as "a calculation of prices for products that have not yet been manufactured, in particular for the purpose of drawing up quotations."

**Purpose and characteristics:**

- Calculates expected or planned costs before production
- Product-specific or order-specific analysis
- Used in make-to-order environments before quotation issuance
- Determines cost price, quotation price, and price limits

**Cost methods supported:**

- **Marginal costs:** Variable costs per unit only
- **Full costs:** All period costs allocated to production

**Standard calculation structure documented:**

```
Material costs + External operations + Indirect material costs = Material Costs
Manufacturing costs + Production overhead = Production Costs
+ Shipping/Admin/Sales = Cost of Sales
+ Profit Margin = Net Selling Price
```

**Calculation Schema:**

- The **Default Schema** is used when creating a precalculation if no calculation schema is stored in the item master.
- **Calculation schema per assembly:** Manages schemas for extended view functionality.
- **User-Definable Fields (UDF 1–4):** Available for custom result fields.
- **Results Fields 1–10:** Freely configurable result values for extended view and batch calculations.
- **Surcharge for subpositions:** Controls how surcharges are calculated in the precalculation view.

**Access points for precalculation:**

- Item master Calculation tab
- Dedicated *Calculation > Precalculation* menu
- Quotation or sales order interface
- Batch calculation (multiple items simultaneously)

**License requirement:** Basic or Configurator License required.

**Overhead costs:** Configurable overhead cost factors (`overhead_costs.htm`).

---

### 19. Post-Calculation (Final Costing)

Post-calculation provides "flexible post-calculation" with capabilities including:

- Accrued cost calculations
- Projections and planned cost determinations
- Marginal and full cost analysis
- Multiple valuation approaches
- Results as lists or hierarchical structures

**Three post-calculation types:**

| Type | Description |
|---|---|
| Visual | Structured view with comparison features (planned vs. actual) |
| Batch Calculation | Processes multiple work orders simultaneously |
| Valuation | Assembly posting valuation |

**Key differences from precalculation documented:**

- Tool cost calculation is **not available** in post-calculation (available only in precalculation).
- **Extended resource cost rates** are uniquely available in post-calculation (not in precalculation).

**Authorization required:** "Batch-post-calculation" authorization for calculation and viewing functions.

**Standard costing** is also supported as an alternative to actual costing (`standardkostenverfahren.htm`).

---

### 20. Business Performance and Absorption Costing

#### 20.1 Business Performance Module

The Business Performance module "administers profit centers and accounts through financial cost centers and cost elements" and "enables the creation of business performance and simulations for forecast."

**Capabilities:**

- Management of multiple clients or statement cycles per client
- Cost element and cost center accounting
- Calculation of cost and surcharge rates
- Budget management
- Differentiation between fixed/variable and target/actual costs across fiscal years

**Critical constraint:** "This module operates with only one dimension. 'Use multidimensional' in SAP B1 must remain disabled."

**Data basis options for effective manufacturing services:**

- **Wage data:** Values manually added to Business Performance.
- **Work order confirmations:** Automatically retrieves production data from Time Receipts (automated approach).

#### 20.2 Absorption Costing

Absorption costing is defined as "a costing method targeted at distributing manufacturing overheads to the manufactured items and appropriating these costs into inventory."

**Applicability:** "Mandatory for publicly traded companies following GAAP/IFRS standards. Required by tax laws in the United States, Brazil, and other countries."

**Cost center types:**

- **Direct cost centers:** Production equipment, work centers
- **Indirect cost centers:** Maintenance, quality control, or cost pools

**Setup sequence (documented workflow — 5 steps in strict order):**

1. Financial Data workflow
2. Production Activities workflow
3. Cost Calculate workflow
4. Absorption Costing workflow
5. Absorption Costing — Finishing steps

**SAP B1 prerequisites:** Initial settings begin in SAP B1, where direct and indirect cost centers, cost pools (optional), and distribution rules must be created first. Beas-specific setup follows in the Configuration Wizard.

**Report analysis (6-step process documented):**

1. Run the report (select month, set New Calculation to Y/N)
2. Analyze results (manufactured goods with calculated appropriations)
3. Review Summary tab (Absorption Costing, WIP, combined total — should match financial data)
4. Address unused cost centers (assign Distribution Keys, re-run Cost Calculate)
5. Examine WIP tab (incomplete production orders)
6. Review Consumed Assemblies tab (prevents sub-assemblies from receiving direct appropriations)

**Configuration rules:**

- Cost centers cannot have both Pre-Distribution and Distribution Keys simultaneously.
- "As Cost Unit" must be set to "No" for cost centers using either key type.
- Cost centers cannot distribute values back to themselves.

---

### 21. Branches (Multi-Branch Support)

Multi-branch support was introduced in Beas 9.0 (patch 4 and later). In Beas documents, a target warehouse determines the branch assignment.

**Branch features:**

- Many lists include a "branch" column for sorting and filtering.
- Templates can incorporate different branch configurations.
- Stocktaking: "Can only be created for several warehouses if they are of the same branch."
- Personnel records can store branch information.

**Critical constraint documented:** "The system does not automatically validate warehouse selection during posting. Correct WIP accounting requires all postings to be made in one branch for one work order."

---

### 22. Sales Integration (CTP and ATP)

#### 22.1 Capable-to-Promise (CTP)

CTP "calculates the delivery date with forward calculation based on resource and material planning." It evaluates multiple components: materials, inventory, transportation, labor, and supply chain constraints.

**Key difference from ATP:** ATP focuses on material availability and ignores time reservations; CTP assesses additional components including labor and fleet capability.

**Requirements:** Active APS License; correct planning data; current MRP calculations.

**Configuration parameters:**

- **CTP Available:** Activates in sales orders and quotations.
- **Default Order Recommendation:** Specifies which MRP results CTP uses.
- **Working days before start of production:** Days between current date and earliest production start.
- **Only Workdays:** Aligns display to company calendar.

**Documented limitation:** "The CTP cannot determine the actual delivery date. It is only an auxiliary tool for the seller." The system ignores variants, configurations, and precalculations (though short variants and item version control are supported).

#### 22.2 Available-to-Promise (ATP)

ATP is a simpler availability check focusing on material availability. Available without APS license when a Default Material Resource Planning definition exists.

---

### 23. Sales and Purchase Document Extensions

**Sales (A/R) module extensions:**

- Precalculation integrated directly into sales quotations and orders.
- Product configurator access from sales document rows.
- Capable-to-Promise delivery date calculation.
- Variant selection (A–Z).
- Drawing number assignment.
- Item version management.
- Work order creation directly from sales document rows.
- Inventory history lookup.
- Simplified delivery window supporting batches, serial numbers, and bin locations.
- Reservation with batch/serial/bin-level detail.
- Entry and final remarks with RTF support (note: SAP B1 has display limitations with RTF).

**Required UDF fields** (must be visible and editable in SAP B1 document forms):

| UDF | Purpose |
|---|---|
| `beas_vri` | Configuration reference |
| `beas_shortvariant` | Short variant |
| `beas_precalcnr` | Pre-calculation number |
| `beas_znr` | Drawing number |
| `beas_prjud` | Task/Project |
| `beas_ver` | I-Version |

**Purchase (A/P) module extensions:**

- Extended UDFs in purchase documents: Personnel (logged-in user number), Beas Version (posting version), Origin (document type: B = Goods Receipt Purchase, PM = Purchase Material, PS = Purchase External Operation).
- Macro Print solution support.
- Project/Tasks integration.
- Item version tracking.
- Beas Bin Location system.

**Goods Receipt PO:** Extended goods receipt function replacing standard SAP B1 Purchase > Goods Receipt PO. Supports batch management, serial numbers, quality control, and label printing. Multiple purchase order rows can be posted in a single goods receipt document. Two variants: Multiple (default) and Single (maintenance mode).

---

### 24. Warehouse and Bin Location Management

Beas supports three bin management types:

| Type | Notes |
|---|---|
| SAP Bin Warehouse Management | **Recommended for new installations.** Uses SAP B1's native bin management. |
| Beas Bin Warehouse Management | "Created for SAP versions before SAP integrated its own bin warehouse solution." Legacy approach. |
| WMS Bin Warehouse Management | Integration with Produmex WMS. |

**Documented limitations of Beas Bin Warehouse Management (vs. SAP Bin):**

- No maximum/minimum stock per bin location.
- Certain allocation features not supported.
- Picking app terminal functions not supported.

**Bin location features:** Multiple warehouses with customizable properties; bin location posting at goods receipt; stock visualization tools; support for batches and serial numbers.

**System Check and Correction tools:** `lagerplatz_systemcheck.htm` and `lagerplatzkorrektur2.htm` for bin location data integrity.

---

### 25. Inventory Transactions and Batch/Serial Tracing

**Inventory transaction types documented:**

- Manual postings (receipts and issues)
- Batch transfers
- Batch split
- Stocktaking (inventory count)
- Batch calculation (precalculation)
- Reservation list

#### 25.1 Batch and Serial Number Tracing

The batch/serial tracing module tracks materials "from warehouse receipt through production and delivery."

**Capabilities:**

- Identify which batch numbers were incorporated into other batches.
- Track transformations and compositions of materials.
- Link batches to QC orders and production receipts.
- Document resource usage in associated operations.
- Retrieve delivery notes for finished items.

**Supported transactions for tracing:** Production receipts, backflushing, batch transfers, and batch splits. "No batch and serial number tracing is available for other types of transactions, for example SAP Business One Production."

**Tracing modes:**

| Mode | Description |
|---|---|
| Direct | Items directly linked through standard production processes |
| Indirect | Items indirectly connected through assembly assignments (slower processing) |
| All | Combines both methods for comprehensive results |

**Performance tip:** "For slow response times, disable delivery notes and use the Direct range setting."

---

### 26. Tool Administration

Beas provides a complete tool administration system integrated into Precalculation and manufacturing workflows. Tool administration allows users to maintain tools, record variation costs, and store associated drawings and documents.

**Four tool types documented:**

| Type | Description |
|---|---|
| Utilities | No imputed costs, no capacity planning impact, no maintenance process |
| Tools without resource planning | Include purchase/maintenance costs but don't affect resource planning |
| Tools with resource planning | Unique, reserved tools with costs that affect planning |
| Tools influencing throughput time | Unique tools that impact work sequence duration |

The interface includes two main tabs (Tools and Utilities) with fields for tool name, description, drawing number, warehouse location, and maintenance information.

**Critical APS limitation (re-stated):** "In APS, the system calculates interruption time ONLY for resources. Tools do not have a precalculated calendar."

---

### 27. Human Resources and Personnel Management

The HR module provides attendance recording, absence management, and work hour administration. It is described as more comprehensive than SAP B1's native personnel feature: "SAP Business One has added its own personnel recording additionally, but which does not include an attendance recording or absence recording."

**License note:** Attendance recording requires the "Beas App: Time recording, clock in/out, Absence" license. Basic administration is included in the standard license.

**Personnel master data** is completely separate from SAP B1 user administration: "These data are needed for presence recording and FDC; they are completely detached from user administration."

**Personnel record tabs:** General, Attendance (Anwesenheiten), FDC (Auftragsstempelungen), Login Data, Extended settings, Work times, Account planning, Shift plan, Absence entries, Monthly summary, Documents, Rights.

**Shift management components:**

- Day templates
- Shift definition
- Shift determination logic
- Flexible lunch break handling
- Target time calculation
- Actual time determination
- Flex-time accounts

**Time evaluation** (`zeitauswertung.htm`): Available for comprehensive work time analysis.

**SAP B1 synchronization:** Personnel records sync between Beas and SAP B1. Beas uses alphanumeric IDs; SAP B1 uses numeric-only IDs. Synced fields: first name, second first name, surname.

---

### 28. Service and Maintenance Module

The Maintenance module handles "administration of internal/external maintenance, creating maintenance orders via defined maintenance cycles." Requires the "Maintenance of Resources" license.

**Administrable objects:** Resources, tools, serial number items, and customer equipment.

**Core components:**

| Component | Description |
|---|---|
| Maintenance List | Overview of maintenance objects |
| Maintenance Edit | Maintenance master data editing |
| Maintenance Plan | Maintenance cycle definition |
| Maintenance Order | Individual maintenance order |
| Maintenance Component | Component management |
| Maintenance History | Historical maintenance records |
| All Maintenance Orders | Complete order overview |

**Integration with production planning:** Maintenance-generated interruptions integrate with the APS scheduling engine to block resource availability during maintenance windows.

---

### 29. Beas Service Layer (BSL) API

The Beas Service Layer is described as "a middle layer between the application and the database" and "a new generation of extension API for consuming Beas and SAP Business One data and services."

**Architecture:** Built on HTTP and OData protocols. Compatible with Beas Script, Macro Script, or PowerBuilder. Provides "a uniform way to expose full-feature business objects on top of highly scalable, high-availability applications."

**OData version support:** OData versions 2, 3, and 4 (OData v4 has limited compatibility as documented).

**Positioning in the Terminal/Web App section:** BSL serves as the API backbone for Web Apps and terminal integrations, enabling external applications to interact with Beas manufacturing data without direct database access.

---

### 30. Data Import/Export and Integration Hub

The **Data Integration Hub** is accessed via *Administration > Data Import/Export > Data Integration Hub*. It facilitates importing company data with support for:

**Supported input formats:** XML, Excel, CSV/text files, ODBC-compatible databases.

**Import capabilities:**

- Item masters
- Bills of Materials (including CAD system imports)
- Routings
- Various master data
- Transaction data (hours/attendance)
- Transaction records (receipts/issues)

**Process workflow:**

1. Select data type
2. File analysis
3. Field review and configuration
4. Source-to-target field mapping
5. Result preview
6. Manual or scheduled execution (via Beas Service)

**Excel template requirements:** Field IDs in first row; orange fields are mandatory; blue fields are optional; second row must be removed before import.

**Beas Service:** Enables scheduled/automated synchronization with third-party applications (ERP connectors, CAD systems, MES systems).

---

### 31. Add-Ons and Third-Party Integrations

#### 31.1 B1 Usability Package (B1UP) Integration

The Beas Usability Extension integrates with B1UP (Business One Usability Package) to allow deep customization of Beas windows.

**Capabilities:**

- Define custom buttons and right-click menu entries.
- Add new fields and objects or modify existing ones.
- Set input fields as mandatory (mandatory fields display with red background when empty).
- Hide fields.
- Apply read-only access to fields.
- Create data validations based on events and conditions.
- Item Placement Tool for direct field configuration access.

**Requirements:** B1UP License; appropriate SAP user rights; activated Beas Usability Extension; Beas 9.3 or later.

#### 31.2 Produmex WMS Integration

Integration with **Produmex WMS** (Warehouse Management System) extends Beas with advanced logistics capabilities. As documented: "The integration aims to provide better manufacturing manufacturing capabilities to Produmex WMS users, and extends logistic support for Beas customers — especially companies requiring serialization."

**Documented version reference:** The page states "BEAS Manufacturing 2024.02 and Produmex WMS 2024.04" — **note that this version reference in the integration page predates 2024.04 and may reflect the version at time of initial integration documentation writing.**

**Integration features:** Pick list for production workflow, production receipt via WMS, and extended batch/serial number handling.

---

### 32. Dashboards and Views

Beas provides dashboard views combining data from multiple sources. Basic views deliver information on:

- Work orders and positions
- Bills of Materials
- Routing
- Resource and reserved time information

Specialized views cover:

- Resource utilization metrics
- Production interruptions
- Item-related data: sales orders, production, inventory history

A comprehensive **Database Views** section (`views.htm`) provides an overview of all available Beas database views for custom dashboard and reporting development.

---

## [SUMMARY]

**Beas Manufacturing 2024.04** is a feature-rich, deeply integrated manufacturing add-on for SAP Business One. Based on the documentation analyzed, the following represent the most critical takeaways:

**1. Deep SAP B1 Integration with Explicit Constraints**
Beas extends virtually every SAP B1 module — items, sales, purchasing, inventory, financials — through UDF injection, window extensions, and DI API integration. However, several explicit constraints require attention: the SAP messaging system must not be used with Beas reports; multi-dimensional profit centers in SAP B1 must be disabled when using Business Performance; and WIP accuracy requires strict branch discipline in posting.

**2. Production Management is the Central Pillar**
The Work Order Structure View is the central operational hub, providing a unified multi-level view of production from order to finished goods. The APS engine provides sophisticated scheduling with forward, backward, and "latest start" modes, but tools (unlike resources) have no APS calendar — a critical limitation for tool-intensive production environments.

**3. Variant Production Requires Strategic Choice**
Four variant management approaches are available (Variants A–Z, I-Version, Variant Generator, Product Configurator), each with different capability/complexity trade-offs. The Variant Generator enables formula-driven, data-driven BOM and routing generation, making it the most powerful option. The Product Configurator adds a graphical front-end but requires significant setup training.

**4. MRP and APS are Independent but Complementary**
MRP handles material requirement calculation including forecasts and coverage logic; APS handles scheduling and capacity. MRP2 bridges them by calculating resource requirements within MRP scenarios. CTP uses APS results to provide delivery date estimations in sales documents, but is explicitly documented as "only an auxiliary tool for the seller."

**5. Costing Depth: Three-Layer Architecture**
Beas provides pre-calculation (quotation costing), post-calculation (actual vs. planned analysis), and absorption costing (overhead distribution to inventory). Absorption costing follows a strict 5-step workflow and requires prerequisite setup in both SAP B1 (cost centers, distribution rules) and Beas. The Business Performance module operates in single-dimension mode only — SAP B1 multi-dimensional tracking must remain disabled.

**6. Quality Control is Comprehensive but Must Be Configured**
The QC module supports inspection plans, sampling, four-eyes release, electronic signature, and full WebApp integration. Priority-based inspection plan assignment with 4-factor scoring (customer, warehouse, item version, document type) provides flexibility, but effective deployment requires careful plan hierarchy design.

**7. Licensing is Modular and Must Be Online-Verified**
The APS engine (including Gantt), Product Configurator, Maintenance module, Cost Accounting, and Terminal apps are all separately licensed beyond the base Beas Manufacturing license. The license is verified **daily** online (firewall must allow `boyum-it.com`). Offline license options exist for restricted environments.

**8. Web Apps and FDC Are Production-Ready for Mobile**
The WebApp v2.1 system supports modern browsers on any device (minimum 360×640 resolution) and covers time reporting, goods issue/receipt, QC, and inventory functions. The critical limitation — **UDFs are not supported in WebApp Terminal 2.1** — must be considered when designing custom workflows that rely on UDF data capture at the shop floor level.

**9. Beas Service Layer (BSL) Enables API-Based Integration**
The BSL API provides HTTP/OData-based access to Beas and SAP B1 data, enabling external integrations without direct database manipulation. OData v4 compatibility is limited as documented; v2 and v3 are the recommended versions for integration projects.

**10. The Configuration Wizard is the Single Source of Truth for System Setup**
All functional parameters — from BOM release rules to FDC time-linking to absorption costing activation — are controlled through the Configuration Wizard. Its color-coded status system and audit trail make it the recommended starting point for any implementation or troubleshooting exercise.

---

*This report was generated from the official Beas Manufacturing 2024.04 documentation at `https://help.beascloud.com/beas202404/`. All statements are directly traceable to documentation pages retrieved and analyzed in February 2026. No content from other Beas versions has been included unless explicitly cross-referenced in the 2024.04 documentation.*
