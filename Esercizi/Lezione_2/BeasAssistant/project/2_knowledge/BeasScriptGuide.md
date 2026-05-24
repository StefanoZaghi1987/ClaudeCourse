# Technical Summary Report
## Beas Script 2024.04 — Complete Documentation Analysis
**Source:** https://help.beascloud.com/script202404/
**Output Language:** English
**Output Format:** Markdown (`.md`)
**Generated for:** Gamma S.p.A. — SAP Business One 10.00.240 SP 2402 HF1 / Beas Manufacturing 2024H.04.00.08
**Date:** 2026-02-25

---

## [INTRODUCTION]

This report is a detailed technical summary of the official **Beas Script 2024.04** documentation published by Boyum IT A/S at `https://help.beascloud.com/script202404/`. The documentation spans over 830 individual pages organized in a HM WebHelp help system and covers a fully integrated proprietary scripting language embedded within the **Beas Manufacturing** solution — a leading manufacturing add-on for SAP Business One (SAP B1).

Beas Script is a dedicated interpreter language designed to allow customization, automation, and extension of Beas Manufacturing and SAP Business One workflows — without requiring any additional development environment or external tooling. The script editor and interpreter are embedded directly within Beas itself, making the platform accessible to both technical developers and experienced business users.

The documentation is structured to serve two primary audiences: **business customizers and power users** who need to automate form behavior and business rules, and **software developers** who require deep integration with the Beas Manufacturing object model, the SAP Business One Data Interface Application Programming Interface (DI API), the SAP UI API, and the **Beas Service Layer (BSL)** — a modern OData-based REST interface. The technical domains covered include scripting language syntax, object models, event-driven programming, database interaction, manufacturing workflow integration, quality control automation, and external system connectivity.

---

## [DISCUSSED TOPICS]

### 1. Overview of Beas Script 2024.04 — Purpose, Audience, and Scope

**Beas Script** is described in the documentation as "a fully integrated, Beas interpreter language." It was created alongside the initial release of Beas Manufacturing and has been continuously developed since. The language has maintained backward compatibility exceeding 99% with all previous versions, making existing scripts highly portable across upgrades.

**Key strengths documented:**
- No supplementary tools or installations required — the script editor and interpreter are built into Beas Manufacturing
- Complete integration with the Beas object model, SAP Business One, and the underlying SAP HANA or MS SQL Server database
- Backward compatibility above 99% with all prior Beas Script versions
- Executes across multiple contexts: within Beas windows, in background user events, via terminal access, via web/REST services, and through B1UP (B1 Usability Package) universal functions

**Documented limitations:**
- Syntax is highly sensitive to spacing and line breaks — internal spaces within statements cause errors
- No built-in syntax validator; incorrect keywords are silently ignored rather than flagged
- No native multiline comment block support (`/* */` syntax is not available)
- Functions do not support parameters or multiple return values directly — variable exchange is used instead
- Macros are not supported; scripts are always window-based or event-based

The language runs exclusively within the Beas application ecosystem and is licensed under copyright to Boyum IT A/S. All SAP®, SAP Business One®, Crystal Report®, PowerBuilder®, and Microsoft® marks are property of their respective owners.

---

### 2. Scripting Language and Syntax Conventions

Beas Script is described as "based on old basic languages, PowerBuilder, and SQL." Its syntax is imperative and line-oriented, borrowing conventions from BASIC, PowerBuilder's PowerScript, and SQL.

#### 2.1 Core Syntax Rules

| Rule | Description |
|------|-------------|
| Statement separator | Each executable statement ends with a semicolon, or a line feed (newline) |
| Case sensitivity | Beas Script **is case sensitive**; all commands and identifiers must use **lowercase** |
| Property separator | Commands and properties are connected with the `=` sign |
| Multi-property separator | Properties within a statement are separated by commas (`,`) |
| Whitespace | Spaces are ignored at the beginning and end of lines; internal spaces within statements cause syntax errors |
| Line continuation | Long lines can be split using `&` at the end of the line |
| Tab character | The tab character serves as a placeholder |
| Comments | Single-line only, using `//` at the start of a line; comments cannot follow a command on the same line |

#### 2.2 Comments

Beas Script supports only **single-line comments** using `//`:
```
// This is a valid comment
messagebox="Hello World"
// messagebox="This line is commented out"
```
Multiline comment blocks (`/* */`) are **not supported**. Each line to be commented must be individually prefixed with `//`.

#### 2.3 Placeholder Syntax

Placeholders are the primary mechanism for reading variables and object properties at runtime. Their syntax is: `<Variable,Format>`.

- Placeholders start with `<` and end with `>`
- Four categories: variables, default placeholders, SAP fields, and object properties
- Example: `setvar=myDate=<today,yyyy/mm/dd>` — reads the current date formatted as Year/Month/Day
- When a variable does not exist, the placeholder renders as `<NoVariable>` unless prefixed with `var:`, which returns an empty string instead

#### 2.4 Multi-line Variable Definition

For variables containing multi-line content, Beas Script provides the `#define` / `#end` block:
```
#define ls_mytext
----------------------------
This is a long variable
with multi-line content
----------------------------
#end
```
The variable `ls_mytext` can then be referenced via `<ls_mytext>`.

---

### 3. Variable System — Types, Declarations, and Scope

#### 3.1 Supported Data Types

| Type | Keyword | Notes |
|------|---------|-------|
| String | `setvar` / `string` | All `setvar` variables are always stored as strings regardless of content |
| Decimal | `decimal` | Enables arithmetic operators; used for all numeric computation |
| Integer | `integer` | Integer type for loop counters and indexed operations |
| Boolean | `boolean` | True/false logical values |
| Datetime | `datetime` | For date and time operations |

#### 3.2 Variable Declaration Methods

| Method | Scope |
|--------|-------|
| `setvar=name=value` | Current window (form-wide); always string type |
| `decimal name` | Current function only |
| `string name` | Current function only |
| `datetime name` | Current function only |
| `boolean name` | Current function only |
| `instance decimal name` | Current window from declaration point onward |
| `instance string name` | Current window from declaration point onward |

> **Important constraint:** User events (`UserEvents`) only support variables declared with `setvar`, not typed declarations.

#### 3.3 Naming Conventions

Variable identifiers must:
- Begin with a letter (underscore prefix is discouraged)
- Contain only letters, digits, underscores, and dollar signs
- Use **lowercase** exclusively
- Be unique within scope
- Be case-sensitive (`y` and `Y` are treated as different identifiers)

#### 3.4 Arrays

Beas Script does not have native array syntax. Arrays are simulated through indexed variable names:
```
for ll_loop=1 to 3
  setvar=myArray[ll_loop]=<ll_loop>
next
```
This generates variables `myArray1`, `myArray2`, `myArray3`. Multi-dimensional arrays are supported by combining loop variables: `setvar=myvariable[mycounter1]_[mycounter2]=value`. The index **must** be a variable — literal numeric indexes (`myArray[1]`) do not work directly.

---

### 4. Operators and Functions

#### 4.1 Arithmetic Operators (Decimal Type)

Available for `decimal` type variables only: `+` (add), `-` (subtract), `*` (multiply), `/` (divide), `=` (assign). Brackets are supported.

For non-decimal (string) variables, arithmetic operators are unavailable. Values are combined through placeholder concatenation. The `num()` function must be used to convert strings to decimal values before arithmetic.

#### 4.2 Numeric Functions

| Function | Description |
|----------|-------------|
| `max(a,b,...)` | Returns the maximum value among arguments |
| `min(a,b,...)` | Returns the minimum value among arguments |
| `numadd(a,b,...)` | Adds multiple values |
| `sub(a,b)` | Subtracts b from a |
| `mul(a,b)` | Multiplies a by b |
| `dif(a,b)` | Divides a by b |
| `mod(a,b)` | Returns remainder of Euclidean division (`a % b = a - floor(a/b) * b`) |
| `percent(a,b)` | Calculates percentage of actual vs. related values |
| `round(v,type,dec)` | Rounds value; type: -1 (none), 0 (standard), 1 (always up), 2 (always down), 3 (to multiple) |

#### 4.3 String Functions

| Function | Description |
|----------|-------------|
| `trim(var)` | Removes trailing spaces from the right |
| `charadd(v1,v2,...)` | Concatenates multiple placeholders |
| `lower` | Converts to lowercase |
| `upper` | Converts to uppercase |
| `ulower` | Converts first letter to uppercase |
| `replace(var,from,to)` | Substitutes characters within a variable |
| `intoken(var,start,end)` | Returns substring between two token markers |
| `pos(var1,var2)` | Returns position of var2 within var1 |
| `len(var)` | Returns length of variable |
| `right(var,n)` | Extracts n rightmost characters |
| `left(var,n)` | Extracts n leftmost characters |
| `mid(var,start,length)` | Extracts substring from position |
| `cr2crlf` | Converts CR characters to CR-LF |
| `crlf2cr` | Converts CR-LF to CR |
| `ctlf2space` | Replaces all CR-LF with spaces (removes line breaks) |

#### 4.4 Datetime Functions

| Function | Description |
|----------|-------------|
| `eom()` / `bom()` | End/beginning of month |
| `eoy()` / `boy()` | End/beginning of year |
| `month(date)` | Extracts month component |
| `day(date)` | Extracts day component |
| `dayofweek(date)` | Returns day-of-week number |
| `weekstring(date)` | Returns week as string |
| `CalendarWeek(date)` | ISO 8601 calendar week |
| `CalendarYearWeek(date)` | Calendar year+week combined |
| `relativedate(date,n)` | Adds/subtracts n days |
| `workday(date,n)` | Calculates business day offset |
| `add_month(date,n)` | Adds n months to date |
| `monthname(date)` | Returns month name as text |
| `dayname(date)` | Returns day name as text |
| `dbdatetime(val)` | Converts to database-compatible datetime format |
| `week2date(week)` | Converts week notation back to calendar date |

Built-in date placeholders include: `today` (current date, server timezone), `now` (current time), `heute x` (today ± x days), and `heute_bis` (noon timestamp).

---

### 5. Control Flow Statements

#### 5.1 If Statement

The `if` statement supports two syntactic variants:

**Variant 1 — Equality with assignments:**
```
if=<val1>=<val2>=<yes_condition>=<no_condition>
```

**Variant 2 — Full conditional with logical operators:**
```
if <val1> <operator> <val2> <or/and> <val3> <operator> <val4> then
  <assignment>
else
  <assignment>
end if
```

Functions can also be called in the first parameter of an `if` statement.

#### 5.2 For-Next Loop

```
for <loopname> = <start> to <end> [step <stepvalue>]
  [code block]
next
```

- Supports optional `step` parameter (default 1, use `-1` for countdown)
- Nested `for-next` loops are supported
- Supports special data types `DATUM` (DateTime) and `MONAT` (Month) as loop boundaries
- Placeholders can be used within loop body

#### 5.3 Function Definitions

**Local functions** (visible only within the current script):
```
function myLocalFunc
  // script
end function
```

**Global functions** (window-wide scope):
```
global function myGlobalFunc
  // script
end global
```

Global functions registered with standard event names (e.g., `form_loaded`, `dw_1_update`) are automatically called when those events fire. Functions do not support parameters; data is exchanged via variables. Return values use `return success` (→ 1), `return failure` (→ -1), or fall through (→ 0). The `<return>` placeholder reads the return value.

#### 5.4 Other Statements

| Statement | Purpose |
|-----------|---------|
| `goto` | Jump to a labeled position in the script |
| `return` | Exit current function |
| `timeout` | Set execution timeout |
| `task` | Execute a background task |
| `include` | Include an external script file |
| `declare` | Instantiate an object |
| `destroy` | Destroy a declared object instance |
| `transfer` | Transfer control or data |
| `setglobal` / `setlocal` | Set global/local variable scope |
| `setsetup` | Write settings to the database |
| `sendkeys` | Simulate keyboard input |
| `setpointer` | Control pointer/cursor |
| `jscript` | Execute JavaScript |
| `shell2` | Execute a shell command |
| `sql2` | Execute a SQL block |
| `sqlscript` | Execute SQL script file |

---

### 6. Object Model — Objects, Classes, Properties, and Methods

Beas Script exposes a rich object model organized hierarchically. Objects are either always available (singletons) or must be explicitly instantiated using `declare`.

#### 6.1 Core Singleton Objects

**`system`** — Represents the Beas application itself.

Key properties and methods:

| Member | Description |
|--------|-------------|
| `system.windows.name` / `.id` | Lists active windows |
| `system.window.current` / `.parent` | Access window hierarchy |
| `system.user` | Current logged-in user ID |
| `system.superuser` | Returns 1 if user is administrator |
| `system.authorization.check=id` | Checks permission: 1=full, 2=read-only, -1=none |
| `system.authorization.load` | Refreshes authorization cache |
| `system.license.[property]` | License information (counts, modes, IDs: BEAS_APS, BEAS_PROJECT, BEAS_MTC, etc.) |
| `system.translation=:init` | Loads language translation tables |
| `system.translation=:$<phrase>` | Translates a phrase |
| `system.store.variable` | Public cross-task variables |
| `system.setup.variable` | Database-persisted settings |
| `system.msetup.variable` | Cached database settings |
| `system.counter=value` | Increments a counter |
| `system.homefolder` / `.tempfolder` / `.logfolder` | Path properties |
| `system.debug` | Debug activation and level (0–2) |
| `system.version` / `.versionnumber` | Beas version information |
| `system.wms_installed` | WMS installation flag |
| `system.ishana` / `.ismssql` | Database type detection |

---

**`sqlca`** — Provides access to the current SQL database connection.

Key properties and methods:

| Member | Description |
|--------|-------------|
| `sqlca.select` | Execute SELECT queries; results via `sqlca.result.x` or `INTO` clause |
| `sqlca.commit` | Commit current transaction |
| `sqlca.delete` | Execute DELETE statement |
| `sqlca.update` | Execute UPDATE statement |
| `sqlca.execute` | Execute arbitrary SQL |
| `sqlca.function` | Execute stored SQL function |
| `sqlca.sqlcode` | Error code: 0=success, 100=not found, -1=syntax error |
| `sqlca.sqlerrtext` | Error message text |
| `sqlca.result.x` | Result of last SELECT (x = column number) |
| `sqlca.isconnected` | Connection status |
| `sqlca.ishana` / `.ismssql` | Database type flags |
| `sqlca.dbname` | Database name |
| `sqlca.servername` | Server name |
| `sqlca.userid` | Current user ID |
| `sqlca.datetime` | Datetime format for SQL |
| `sqlca.concat` | Concatenation helper |
| `sqlca.uppercase` | Uppercase conversion for SQL |
| `sqlca.udf_fieldname` | User-defined field name resolution |

All SQL must be written in **HANA SQL syntax**. An internal SQL Runtime Converter handles dialect translation for MSSQL compatibility.

---

**`tools`** — A collection of utility functions.

| Member | Description |
|--------|-------------|
| `tools=addtolibrarylist` | Add to library list |
| `tools=beep` | Emit a system beep |
| `tools=changelog` | Write to the `beas_aenderung` changelog table |
| `tools=globalreplace` | Global search and replace |
| `tools=lock` | Lock/unlock a resource |
| `tools=playsound` | Play an audio file |
| `tools=min2time` | Convert minutes to time string |
| `tools=link2url` | Open a URL |
| `tools=protocol` | Write to the Beas protocol log |
| `tools=sleep` | Pause execution (milliseconds) |
| `tools=shell` | Open file/URL with default OS handler |
| `tools=sqltransfer` | SQL-based data transfer |
| `tools=string2array` | Convert string to array |
| `tools=translate` | Translate text via language tables |
| `tools=token` | Tokenize a string |
| `tools=varpush` / `tools=varpop` | Push/pop variables to/from a stack |
| `tools=xml2array` | Convert XML to array |
| `tools=errorlog=read` | Read accumulated error log entries into `error[x]` variables |
| `tools=errorlog=reset` | Clear the error log |

---

**`file`** — File system operations.

| Member | Description |
|--------|-------------|
| `file=filecopy` | Copy a file |
| `file=filemove` | Move a file |
| `file=fileexists` | Check file existence (returns 1/0) |
| `file=filelength` | Get file size (up to 2 GB) |
| `file=filesave` | Save variable content to disk |
| `file=filesaveudf8` | Save variable in ANSI encoding |
| `file=filedelete` | Delete a file |
| `file=fileload` | Load file content into variable (supports UTF-16 LE/BE encoding) |
| `file=createdirectory` | Create a new directory |
| `file=directoryexists` | Check directory existence |
| `file=getdirectory` | Open directory browser dialog |
| `file=directoryread` | Enumerate directory contents via datastore |
| `file=getfile` | Open file chooser dialog |
| `file=getfilesavename` | Open save-as dialog |
| `file=shell` | Open file/URL with system default |
| `file=run` | Launch an executable |
| `file=runandwait` | Launch executable and wait for completion |
| `file=rundll` | Execute via rundll32.exe |
| `file=runbeas` | Launch a parallel Beas instance |

---

#### 6.2 Form and UI Objects

**`form` (SBO context)** — Properties and methods for SAP Business One forms accessed from within Beas GUI.

| Member | Description |
|--------|-------------|
| `form=mode` | Form mode: 0=Find, 1=OK, 2=Update, 3=Add, 4=View, 5=Print |
| `form=title` | Get/set form title |
| `form=move` | Reposition window (x/y coordinates) |
| `form=x` / `form=y` | Get/set form position |
| `form=height` / `form=width` | Get/set form dimensions |
| `form=freeze` | Freeze/unfreeze the form (y/n) |
| `form=click=<item>` | Programmatically fire item click event |
| `form=formuid` | Returns the form's unique identifier (UID) |
| `form=formtypeex` | Returns form type number (e.g., 149, 150) |
| `form=formtypecount` | Returns the form type ordinal (0, 1, 2...) |

When executing within an SAP form, the `beasgui` prefix is optional: `form=click=114` and `beasgui=form=click=114` are equivalent.

---

**`dw_1` through `dw_7`** — DataWindow objects (visual form components, up to 7 per form).

| Member | Description |
|--------|-------------|
| `dw_1.retrieve` | Load data into the DataWindow (up to 10 parameters) |
| `dw_1.update` | Persist changes to the database |
| `dw_1.reset` | Clear the DataWindow |
| `dw_1.rowcount` | Returns total rows loaded |
| `dw_1.maxrow` | Defines maximum retrievable rows |
| `dw_1.setfilter` | Apply filter conditions |
| `dw_1.filter` | Activate the filter |
| `dw_1.setsort` | Define sort order |
| `dw_1.sort` | Apply the sort |
| `dw_1.visible` | Show/hide the DataWindow |
| `dw_1.enabled` | Enable/disable user interaction |
| `dw_1.multiselect` | Allow multi-row selection |
| `dw_1.selectrow` / `.deselectrow` | Manual row selection |
| `dw_1.insertrow` / `.deleterow` | Add/remove rows |
| `dw_1.rowmove` | Reorder rows |
| `dw_1.item.[column].value` | Access a field value in the current row |
| `dw_1.setrow=n` | Move to row n |
| `dw_1.bsl=EntityName` | Populate DataWindow from BSL entity |

DataWindows support export to HTML, XHTML, XML (with DTD/schema), and XSL-FO formats.

---

**`datastore`** (declared object) — In-memory data container for multi-row SQL results.

Used when multiple result rows are needed from SQL queries:
```
declare=dtw=ue_datastorevalues
dtw=add=item=select top 5 "ItemCode","ItemName" from "OITM" order by "ItemCode"
for ll_row=1 to <dtw.rowcount>
  dtw.setrow=<ll_row>
  // access dtw.[fieldname]
next
destroy dtw
```

DataWindows retrieve results via `.rowcount`, `.setrow`, and `.[fieldname]` property accessors. Field names are always accessed in **lowercase**.

---

**`sbodiapi`** — Global DI API connection accessor.

| Member | Description |
|--------|-------------|
| `sbodiapi=connect` | Build DI API connection (no-op if already connected) |
| `sbodiapi=disconnect` | Terminate connection |
| `sbodiapi=get=<variable>` | Fetch value from OADM table (SAP 8.8/9.0) |
| `sbodiapi=exchangerate=<currency>` | Get currency exchange rate |

---

**`bmenu`** — Menu construction object (visible only in `beasmenu.src`).

**`printobject`** — Print/Crystal Reports object for printing documents and work orders.

**`form_properties`** — Form-level properties for save, mode, resize, tab management.

---

### 7. Event System — Available Events, Triggers, and Context

Beas Script distinguishes between two major event categories: **Window Events** (form-based, synchronous) and **User Events** (background, non-window-based).

#### 7.1 Window Events (Beas Forms)

Declared as global functions. Only one function per event is permitted; defining a duplicate overwrites the previous one. All form events fire only when **NOT** in preview or search mode.

| Event | Trigger |
|-------|---------|
| `form_opened` | Form frame opened — fires only once |
| `form_preload` | Before `dw_1` initialization when switching tabs |
| `form_readsql` | Validates SQL commands behind DataWindows |
| `dw_1_load` | Directly after data retrieval into `dw_1` |
| `form_load` | After form data is loaded |
| `form_loaded` | After the form has fully loaded |
| `form_show` | Completes the window opening sequence |
| `form_resize` | When the form is resized |
| `form_rowfocuschange` | When row focus changes |
| `form_new` | When a new record is created |
| `form_update` | When the update button is clicked |
| `form_close` | When the form is closed |
| `form_delete` | When a record is deleted |
| `etab_firstredraw` | First redraw of a tabsheet |
| `etab_redraw` | Redraw of a tabsheet |
| `etab_tabchanged` | Tab change within internal tabs |
| `dw_x_click` | Click on DataWindow x (1–7) |
| `dw_x_itemchanged` | Item value changed in DataWindow x |
| `dw_x_update` | Update triggered on DataWindow x |
| `dw_master_item_button_[obj]_click` | Button click in master DataWindow |

#### 7.2 SAP GUI Events (BEASGUI / SBO Forms)

Scripts for SAP Business One forms are named using the pattern `sbo_xxx.src`, where `xxx` corresponds to the **SAP Business One FormType** number.

| Event | Trigger |
|-------|---------|
| `form_opened` | SAP form opened |
| `form_loaded` | SAP form fully loaded |
| `preitempressed` | Before item pressed — return `false` to cancel SAP standard |
| `itempressed` | After item is pressed |
| `itemchanged` | When grid/field data changes |
| `print` | Print icon click |
| `rightclick` | Right-click context menu |
| `windowevent_printpreview` | Print preview |
| `windowevent_print` | Print |
| `windowevent_deactivate` | Form deactivated |
| `windowevent_close` | Form closed |
| `windowevent_open` | Form opened |
| `windowevent_activate` | Form activated |

**Pre-events**: If a pre-event returns `Success`, the SAP standard behavior **and all following add-ons are bypassed**. This is the mechanism for overriding SAP default behavior.

Two extension modes are supported:
- `OVERWRITE` — executes custom logic **before** Beas system scripts
- `EXTENSION` — executes custom logic **after** Beas system scripts

#### 7.3 User Events (Background Events)

User events execute in the background without a window context. Variables defined within user events are isolated in sandboxes; only "changeable" variables persist outside event scope. Visual components (e.g., `messagebox`) do not work in server-mode events (e.g., MRP background).

**Addon Events:**

| Event | Trigger |
|-------|---------|
| `ue_addon_install` | Addon installation |
| `ue_addon_start` | Addon startup |

**Beas Menu Events:**

| Event | Trigger |
|-------|---------|
| `ue_beasmenu_start` | Beas menu starts |
| `ue_beasmenu_poststart` | After Beas menu starts |
| `ue_beasmenu_initmenu` | Menu initialization |
| `ue_beasmenu_stopbeasgui` | Beas GUI stops |
| `ue_beasmenu_menuid` | Specific menu item triggered |

**APS (Advanced Planning & Scheduling) Events:**

| Event | Trigger |
|-------|---------|
| `ue_aps_startcalculation` | APS calculation begins |
| `ue_aps_endcalculation` | APS calculation completes |
| `ue_aps_startworkorderposition` | Processing a work order position starts |
| `ue_aps_endworkorderposition` | Work order position processing ends |
| `ue_aps_startworkorderpositionstep` | Step within a position starts |
| `ue_aps_endworkorderpositionstep` | Step ends |
| `ue_aps_startcalcroutingpositionbackward` | Backward routing calculation starts |
| `ue_aps_middlecalcroutingpositionbackward` | Mid-point of backward routing |
| `ue_aps_endcalcroutingpositionbackward` | Backward routing ends |
| `ue_aps_startcalcroutingpositionforward` | Forward routing calculation starts |
| `ue_aps_middlecalcroutingpositionforward` | Mid-point of forward routing |
| `ue_aps_endcalcroutingpositionforward` | Forward routing ends |
| `ue_aps_calcroutingoverlapping` | Overlapping detection in forward calculations |

**MRP (Material Requirements Planning) Events:**

| Event | Trigger |
|-------|---------|
| `ue_mrp_start` | MRP calculation begins (can inject additional data) |
| `ue_mrp_end` | MRP calculation ends |

> ⚠️ When MRP runs in background/server mode, visual components (`messagebox`, etc.) are not available.

**Stock Management Events:**

| Event | Trigger |
|-------|---------|
| `ue_stockmanagement_goodsreceiptpo` | Goods Receipt PO created |
| `goodsreceiptline` | Per-line event during Goods Receipt |
| `goodsreceiptpobeforecreate` | Before Goods Receipt PO is created |
| `ue_stockmanagement_goodsreceiptpoend` | Goods Receipt PO completed |
| `ue_stockmanagement_goodsreceiptporollback` | Goods Receipt PO rolled back |
| `ue_stockmanagement_allocationline` | Per-line event during allocation |
| `ue_stockmanagement_allocationend` | Allocation completed |
| `ue_stockmanagement_transferline` | Per-line event during transfer |
| `ue_stockmanagement_transferend` | Transfer completed |
| `ue_stockmanagement_issueline` | Per-line event during goods issue |
| `ue_stockmanagement_issueend` | Goods issue completed |
| `ue_stockmanagement_receiptline` | Per-line event during goods receipt |
| `ue_stockmanagement_receiptend` | Goods receipt completed |
| `ue_stockmanagement_getbatchnumber` | Batch number determination |
| `ue_stockmanagement_getserialnumber` | Serial number determination |
| `ue_stockmanagement_binissuedropdown` | Bin location dropdown on issue |
| `ue_stockmanagement_binreceiptdropdown` | Bin location dropdown on receipt |
| `ue_stockmanagement_receiptcostingcode` | Costing code modification on receipt |
| Rollback variants | Available for allocation, transfer, issue, receipt |

**Work Order Management Events:**

These events cover the full lifecycle of a Beas work order.

| Event Category | Events |
|----------------|--------|
| Pre-calculation | `precalculation`, `precalculationcopyinit`, `precalculationcopyversion`, `precalculationcopyend` |
| Post-calculation | `ue_workordermanagement_postcalculation` |
| Creation | `ue_workordermanagement_salesorder2workorder`, `createworkorder`, `createdocentry`, `createworkorderposition`, `createworkorderbom`, `createworkorderpositionend`, `createworkorderpositioncomplete`, `createworkorderend` |
| Copy | `copyworkorderbom`, `copyworkorderpositionend` |
| Refresh | `refreshworkorderposition`, `refreshworkorderpositionend` |
| Delete | `deleteworkorder`, `deleteworkorderend`, `deleteposition`, `deletebom` |
| Close | `closeworkorderposition`, `closeworkorderpositionend`, `closebom`, `closebomend`, `closeoperation`, `closeoperationend` |
| Reopen | `reopenbom`, `reopenbomend`, `reopenoperation`, `reopenoperationend` |
| Other | `rightmouseclick`, `manualbatchdetermination`, `alternativemateriallist`, `replaceitem` |
| Reservation Process | `setres_reservation`, `setres_allocation`, `setres_issuewo`, `setres_externalissue` |
| Issue Process | `issuestart`, `issueline`, `issueend` |
| Receipt Process | `receiptstart`, `pricevaluation`, `getprice`, `getprice_negativposition`, `receipt`, `receiptline`, `receiptend` |
| Time Recording | `strukturinit`, `timerecordingstart`, `timerecordingend` |
| WIP Clearing | `wipclearstart`, `wipclearvariance`, `wipclearcreatestart`, `wipclearcreateend`, `wipclearend` |

`timerecordingend` exposes: `ojdt_transid` (journal entry ID), `ojdt_transid_storno` (reversal journal ID), `e_itemstampid` (bucket number).

**QC Management Events:**

| Event | Trigger |
|-------|---------|
| `ue_qcmanagement_qcplandetermination` | Determines which QC plan applies; result can be overwritten |
| `ue_qcmanagement_qcordercreate` | QC order creation begins |
| `ue_qcmanagement_qcordercreateend` | QC order successfully created |
| `ue_qcmanagement_print` | Controls QC printing |
| `qcopening` | Random test released; provides `e_qcorder`, `e_docentry`, `e_sample` |

**Configurator Event:**

| Event | Trigger |
|-------|---------|
| `checkconfigbeforenewload` | Fired before a new configurator is loaded |

**FDC (Factory Data Capture) Event:**

| Event | Trigger |
|-------|---------|
| `ue_fdc_additionalholiday` | Additional holiday definition |

---

### 8. Script Types and Categories

Beas Script code is organized into functional categories based on context and purpose:

| Category | Description | File/Location |
|----------|-------------|---------------|
| **Window scripts** | Attached to Beas form windows; event-driven | `.src` files per window |
| **SAP form scripts** | Attached to SAP Business One form types | `sbo_[FormType].src` |
| **User event scripts** | Background, non-window events | Registered in event system |
| **Menu scripts** | Menu construction and behavior | `beasmenu.src` |
| **Global functions** | Window-wide reusable code | Declared in window scripts |
| **BSL scripts** | Beas Service Layer API calls | Inline or declared objects |
| **DI API scripts** | SAP Business One DI API interaction | `declare=obj=ue_api_sbo` |
| **Database scripts** | Direct HANA SQL execution | Via `sqlca` object |
| **B1UP scripts** | Executed from B1UP universal functions | Via `ue_b1up` object |

---

### 9. Integration with Beas Manufacturing

Beas Script provides deep integration with all core Beas Manufacturing modules through a combination of user events, declared API objects, and database views.

#### 9.1 Work Order Management API (`ue_api_wobom2`, and event-based)

The work order lifecycle is fully scriptable. Scripts can intercept and modify:
- Work order creation from sales orders
- Bill of Materials (BOM) copying and modification
- Routing position calculation (forward and backward scheduling)
- Issue and receipt processes
- Time recording start and end
- WIP (Work In Process) clearing
- Work order closure and reopening

#### 9.2 Batch and Serial Number Management

Dedicated API objects:
- `api_batchnumber` — Batch number operations
- `api_bom` — BOM operations with version control
- `api_routing` — Routing header operations
- `api_time` — Time recording (work order time, attendance, arrival/leaving)
- `api_chilcat` — Child catalog operations

Batch number reservation is scriptable via `reservation` objects with full allocation, transfer, and issue support.

#### 9.3 Production Planning: APS and MRP

The **APS** (Advanced Planning and Scheduling) calculation is fully hooked at every stage via dedicated events (see Section 7.3). Scripts can inject custom scheduling logic at each routing position step.

**MRP** (Material Requirements Planning) supports pre- and post-calculation hooks. Additional data can be inserted into MRP results during the start event.

#### 9.4 Database Views for Manufacturing Data

Beas exposes the following read-optimized database views:

| View | Content |
|------|---------|
| `BEASV_WORKORDER` | All work orders from `BEAS_FTHAUPT`; includes status, times, priorities |
| `BEASV_WORKORDER_POS` | Work order positions |
| `BEASV_WORKORDER_BOM` | Work order bill of materials |
| `BEASV_WORKORDER_ROUTING` | Work order routing data |
| `BEASV_RESOURCE_UTILIZATION` | Resource utilization data |
| `BEASV_INTERRUPTIONS` | Production interruptions |
| `BEASV_ITEM_PRODUCTION` | Item production information |
| `BEASV_ITEM_SALES_ORDER` | Item sales order linkage |
| `BEASV_INVENTORY_HISTORY` | Inventory history |

`BEASV_WORKORDER` includes: document entry/number, dates, customer details, lock/closed/print status, priority, work time totals (minutes from `BEAS_ARBZEIT`), reserved times (`BEAS_RESOURCEN`), receipt count, first position ItemCode, scheduling mode, project/task codes, branch/BPLid, and four user-defined free fields (UDF1–UDF4).

#### 9.5 Database Procedures

| Procedure | Purpose |
|-----------|---------|
| `beas_binbooking` | Bin location booking operations |
| `beas_invhistory` | Inventory history management |
| `beas_poollist` | Pool list management |
| `SBO_SP_TransactionNotification` | SAP-triggered procedure; Beas inserts validation code after `-- ADD YOUR CODE HERE`; marked with `-- beasarea` / `-- /beasarea` delimiters |

#### 9.6 Key Database Tables Referenced

The database model is organized around three primary areas:

**Items:** `OITM` → routing (`BEAS_APL`) → resources (`BEAS_APL_WKZ`), work centers (`BEAS_APLATZ`), operations (`BEAS_AG`); also BOMs (`BEAS_STL`), units of measure (`BEAS_ME`).

**Work Orders:** `BEAS_FTHAUPT` (header) → positions, BOMs, routing, goods receipts, goods issues, time recordings.

**Quality Control:** `BEAS_QSARTIKELHAUPT` (article QC specifications), `BEAS_QSFTHAUPT` (work order QC measurements), with linkages to articles, samples, positions, and tools. QC order numbers follow the format `Pxx/yy/zz`; receipt entries `Exx/yy`, issue entries `Ixx/y`, cost entries `Cxx/yy`.

---

### 10. Integration with SAP Business One

#### 10.1 DI API (Data Interface Application Programming Interface)

The **SAP Business One DI API** provides a programmatic interface to SAP Business One through fully functional business objects. Beas Script accesses DI API functionality via the `ue_api_sbo` declared object:

```
declare=[objectname]=ue_api_sbo
```

> ⚠️ **Critical constraint:** Only **one DI API object** is permitted at a time. Creating multiple simultaneous instances causes conflicts with special variables. The object must be destroyed after use to prevent "bad mirror effects."

**DI API Methods available via `ue_api_sbo`:**

| Method | Description |
|--------|-------------|
| `add` | Add a new business object record |
| `cancel` | Cancel the current action |
| `close` | Close the current object |
| `savetofile` | Save business object to a file |
| `savexml` | Save as XML |
| `getasxml` | Retrieve as XML |
| `getbusinessobject` | Get a business object by type |
| `getbusinessobjectfromxml` | Reconstruct object from XML |
| `getbykey` | Retrieve by primary key |
| `update` | Update an existing record |
| `connect_extern` | Connect to an external SAP system |
| `starttransaction` | Begin a DI API transaction |
| `endtransaction` | Commit or rollback a transaction |
| `debug` | Enable DI API debug mode |
| `silent` | Suppress DI API dialogs |

**DI API Properties:**

| Property | Description |
|----------|-------------|
| `connect` | Connection management |
| `companyinfo` | Company information |
| `admininfo` | Administration information |
| `getnewobjectkey` | Retrieve new object key after add |

**Return values:** `ret_code` = -1 (error) or 1 (success); `ret_text` = error/success description; `getlasterror` = detailed error information.

**Supported SAP Business Objects accessible via DI API:**

- Document (sales orders, purchase orders, invoices, goods receipts/issues, etc.)
- BusinessPartners, ContactEmployees, CustomerEquipmentCard
- Items, Item Prices, Warehouse Info
- BatchNumbers, SerialNumbers
- Messages, Recipients, MultiLanguageTranslations
- PickLists, ServiceCalls, ServiceContracts, ServiceTypes
- GeneralService, SpecialLines, Forecast

The `sbodiapi` singleton also provides lightweight access: reading OADM fields (`sbodiapi=get=maincurncy`), checking exchange rates (`sbodiapi=exchangerate=<currency>`).

#### 10.2 UI API (User Interface Application Programming Interface)

The **SAP Business One UI API** is accessed through Beas Script's BEASGUI framework. The recommended approach is:

1. Open the debug window (Level 1) and launch the target SAP form to observe triggered events
2. Use global functions (not deprecated `windowevents`) to respond to SAP form events
3. Use the `form_clicked()` event for adding or modifying interface elements

**UI API integration objects:**

| Object | Purpose |
|--------|---------|
| `bs-form` | SAP form manipulation |
| `bs-item` | SAP form item (field/control) manipulation |
| `bs-create-objects` | Dynamic creation of buttons, labels, etc. |
| `bs-right-click` | Context menu customization |

**Programmatic object creation:**
```
// Create a button at calculated position
beasgui=create=button,myBtn,"Click Me",<xpos>,<ypos>,<width>,<height>
```

The `beasgui` prefix is active only in SAP environment context. All form type numbers (e.g., 149 for Sales Order) can be used to target specific forms via `sbo_149.src`.

---

### 11. Beas Service Layer (BSL) — OData Interface

The **Beas Service Layer (BSL)** is a modern middleware layer that serves as both an internal Beas API and an external HTTP/REST service. It is fully integrated into the Beas core — no separate service installation is required.

#### 11.1 Architecture

BSL combines three internal components: an **OData Server**, a **WEB Server**, and an **HTTP Server**. Data is primarily transferred as JSON, with additional support for XML, CSV, and HTML.

> BSL is **not** fully OData-standard compliant and is **incompatible** with Microsoft products, Crystal Reports, and standard OData-consuming tools.

#### 11.2 Supported OData Versions

BSL partially supports OData versions 2, 3, and 4, with response structure differences:
- **OData2:** Results in `"results"` array
- **OData4:** Results in `"value"` array

#### 11.3 Query Options

| Query Option | Purpose |
|-------------|---------|
| `$filter` | Filter records |
| `$expand` | Expand navigation properties |
| `$select` | Select specific fields |
| `$orderby` | Sort results |
| `$top` | Limit result count |
| `$skip` | Skip N results (pagination) |
| `$inlinecount` | Include total count |
| `$count` | Count only |
| `$format` | Output format (json, xml, csv, html) |
| `$batch` | Batch multiple requests |
| `$union` | Union multiple entity sets |
| `$groupby` | Group results |
| `$metadata` | Retrieve entity model metadata |

**Beas-specific extensions:**

| Option | Purpose |
|--------|---------|
| `$mask` | Field masking |
| `$branch` | Branch/BPL filtering |
| `$transaction` | Transaction context |
| `$ProgramId` | Web program group ID |
| `$AppId` | Application ID |

#### 11.4 BSL Usage from Beas Script

**Placeholder (inline GET):**
```
messagebox=<bsl.item("0815")/ItemName/$value>
```

**Instance object (for POST/performance):**
```
instance bsl b
b.post=Workorder={"WorkorderPos":[{"ItemCode":"FP","Quantity":2}]}
if <b.ret_code> = 1 then
  messagebox=Success: WO <b.ret_text>
end if
```

**DataWindow population:**
```
dw_1.bsl=Item
```

**Dropdown population:**
```
item.WhsCode.dropdown.bsl=WareHouse?$filter=Transaction="IncomingGoods"
```

**Error handling:** `<object.ret_code>` and `<object.ret_text>` — empty string returned on syntax error.

> ⚠️ **Important:** When using `b.post`, only variable references should be used directly. Placeholder conversion only occurs when the string does **not** start with `{`.

#### 11.5 BSL Authentication

Authentication is required for external (HTTP) BSL access:

| Parameter | Description |
|-----------|-------------|
| `User` | Web user, personnel user, or card number |
| `Pwd` | User password |
| `ServicePwd` | Service password (from Administration → Utilities → Beas Manage Server → Extended → BSL Service) |
| `StationId` / `StationPwd` | Station identification |
| `LocationId` | Location for print solutions |
| `ProgramId` | Web program group |
| `AppId` | Application ID |
| `LanguageId` | Language code (E=English, D=German, etc.) |
| `notFoundCode` | Custom HTTP error code (default 404) |

Login endpoint: `ODATA4/Login` (POST); Logout: `ODATA4/Logout`.

> ⚠️ **Security note:** Internal deployment is the standard approach. External access requires HTTPS proxy protection. No granular permission controls currently exist in BSL.

#### 11.6 BSL Customization

BSL can be extended with:
- Custom objects (`bslnewobject`)
- Custom columns (`bslnewcolumn`)
- Custom functions (`bslnewfunction`)

---

### 12. B1UP (B1 Usability Package) Integration

The **B1 Usability Package (B1UP)** integration is accessed via the `ue_b1up` declared object and the dynamic code feature.

#### 12.1 B1UP Object Methods

| Syntax | Description |
|--------|-------------|
| `object=ue_b1up=search=S001` | Open a B1UP Search window for record S001 |
| `object=ue_b1up=uf=UF001` | Execute B1UP Universal Function UF001 |
| `object=ue_b1up=ufedit=UF001` | Open the editor for Universal Function UF001 |
| `object=ue_b1up=common=ActionCode,ActionText,Parameter` | Execute existing B1UP commands |

> **Limitation:** It is not possible to send parameters directly to a universal function.

#### 12.2 Dynamic Code (B1UP → Beas)

From within B1UP universal functions, Beas variables and script can be accessed:

- Access Beas variables: `[BEAS: beas_variable_name]`
- Execute Beas scripts: `ExecuteBeasScript(<BeasScript in one line>)`
- SQL with Beas data: `WHERE knd_id = '$[BEAS:dw_1.item.knd_id.value]'`

#### 12.3 B1UP Functions Available from Beas Script

| Function | Description |
|----------|-------------|
| `beasfunctioncalculateaps` | Trigger APS recalculation from B1UP |
| `beasfunctioncalculatemrp` | Trigger MRP recalculation from B1UP |
| `beasfunctionprintworkorder` | Trigger work order printing from B1UP |
| `b1upexecutebeasscript` | Execute Beas Script code |
| `b1upopenform` | Open a Beas or SAP form |

---

### 13. Database Interaction (SAP HANA)

#### 13.1 SQL Syntax Requirements

All SQL in Beas Script must use **HANA SQL syntax**. An internal **SQL Runtime Converter** handles dialect translation for backward compatibility with MSSQL deployments.

> ⚠️ **Critical best practice:** Always use the `dbstring` format converter for placeholders in SQL WHERE clauses: `<dw_1.item.itemcode.value,dbstring>`. This produces properly quoted and escaped SQL values (e.g., `N'FP'` in MSSQL) — preventing Unicode issues, injection vulnerabilities, and apostrophe-related errors.

#### 13.2 SQL SELECT Patterns

**Single-row result:**
```
setvar=ls_itemcode=RM
sqlca.select "ItemName","OnHand" from "OITM" where "ItemCode"=<ls_itemcode,dbstring>
messagebox=Name: <sqlca.result.1>, Stock: <sqlca.result.2>
```

**Single-row result with INTO:**
```
sqlca.select "ItemName","OnHand" into ls_itemname,ls_stock from "OITM" where "ItemCode"=<ls_itemcode,dbstring>
```

**Multi-row result via datastore:**
```
instance datastore d
d.select "OnHand" from "OITM" where "OnHand" > 0
for ll_row=1 to <d.rowcount>
  d.setrow=<ll_row>
  // d.onhand  (field names in lowercase)
next
destroy d
```

#### 13.3 Error Handling

```
sqlca.select "ItemName" from "OITM" where "ItemCode"=<ls_code,dbstring>
setvar=ll_sqlcode=<sqlca.sqlcode>  // Store before any further calls
if <ll_sqlcode> = 100 then
  messagebox=error$$Entry not found
end if
if <ll_sqlcode> = -1 then
  messagebox=error$$SQL Error: <sqlca.sqlerrtext>
end if
```

| `sqlca.sqlcode` | Meaning |
|-----------------|---------|
| `0` | Success |
| `100` | Entry not found |
| `-1` | SQL syntax error |

#### 13.4 Transaction Management

Explicit transaction control via `sqlca.commit` and DI API transaction methods (`starttransaction`, `endtransaction`).

---

### 14. Error Handling Mechanisms

Error handling in Beas Script is primarily manual — there is no automatic exception handling mechanism. Developers are expected to check return codes and error properties after each operation.

#### 14.1 SQL Error Handling

After any `sqlca` operation, check `sqlca.sqlcode` immediately and store it in a variable before performing other operations (which would overwrite the value):
```
setvar=ll_sqlcode=<sqlca.sqlcode>
```

#### 14.2 Function Return Values

Functions return via `return success` (1), `return failure` (-1), or fall through (0). Callers check `<return>`:
```
myFunction()
if <return> = -1 then
  messagebox=error$$Function failed
end if
```

#### 14.3 Error Logging

The `tools=errorlog` system accumulates error messages during script execution:
```
tools=errorlog=read
// Now: error[1], error[2]...error[n] variables populated
// And: <errorcount> contains the number of messages
setvar=ls_allerrors=
for ll_e=1 to <errorcount>
  setvar=ls_allerrors=<ls_allerrors> <error[ll_e]>
next
tools=errorlog=reset
```

#### 14.4 BSL Error Handling

BSL operations expose `<object.ret_code>` (1=success, -1=error) and `<object.ret_text>` (error description). On syntax errors, an empty string is returned by default.

#### 14.5 DI API Error Handling

The `ue_api_sbo` object returns `ret_code` (-1 or 1), `ret_text`, and `getlasterror` for detailed diagnostic information.

#### 14.6 Tracing and Debugging

The built-in **tracing system** records mouse/keyboard actions, screenshots, and settings:

| Mode | Description |
|------|-------------|
| 0 | Off |
| 1 | Text only |
| 2 | Text with expanded details |
| 3 | Text + screenshots |
| 4 | Text + variable data |

Tracing methods: `copyrecord`, `createzip`, `reset`, `setmaxstack`, `getlastentry`, `getrow/setrow`, `goback`, `getmode`, `add`, `setup`, `printscreen`, `error`, `message`, `view`, `viewextern`.

The **System Information debug view** (accessible via View → System Information or Ctrl+Shift+I) allows filtering by `windowevent` to observe triggered SAP events in real-time.

---

### 15. Best Practices and Recommendations

The following best practices are documented or strongly implied by the official documentation:

1. **Always use `dbstring` format converter** for all placeholder values in SQL WHERE clauses to ensure Unicode safety and injection prevention.

2. **Store `sqlca.sqlcode` immediately** after any SQL operation before making further calls, to avoid the error code being overwritten.

3. **Always destroy declared objects** after use (especially DI API and BSL instances) to prevent memory issues and "mirror effects."

4. **Use only one DI API object at a time** — multiple simultaneous DI API instances cause system instability.

5. **Use global functions instead of deprecated `windowevents`** for SAP UI API integration.

6. **Use lowercase for all SQL column access** when reading from datastore results — field names are lowercased internally.

7. **Practice, practice, code** — The documentation explicitly states: "The only way to become a clever programmer is to: Practice. Practice. Practice. Code. Code. Code!"

8. **Use the `declare/destroy` pattern** for all object instantiation — never leave instances undestroyed.

9. **Avoid internal spaces in statements** — they cause syntax errors since the language does not strip internal whitespace.

10. **Always use error handling** — The documentation explicitly states: "Good development has always good error handling."

11. **Script editor is the primary development tool** — accessible via Tools → Customizing Tools → Script editor, or Ctrl+N+S (outside SAP B1) / Ctrl+N+U (within Beas forms).

12. **Pre-events for SAP override** — Use pre-events carefully, as returning `Success` will bypass **all** other add-ons and SAP standard behavior.

---

### 16. Known Limitations and Version-Specific Constraints

The following limitations are explicitly documented for Beas Script 2024.04:

| Limitation | Description |
|-----------|-------------|
| No syntax validation | Incorrect keywords are silently ignored; no compile-time errors |
| No native parameter passing | Functions cannot receive parameters — only variable exchange is possible |
| No multiline comment blocks | Only `//` line-by-line comments; `/* */` is unsupported |
| Case sensitivity | All commands and identifiers must be lowercase; case errors silently fail |
| Window-based execution | Scripts always execute within the context of a current window (except user events) |
| No macro support | Macro script creation is not supported |
| Single DI API instance | Only one DI API object at a time; multiple instances cause instability |
| No formal disconnect | DI API `disconnect` destroys the object rather than formally disconnecting |
| BSL not fully OData-compliant | Incompatible with Microsoft products, Crystal Reports, standard OData tools |
| No granular BSL permissions | BSL currently has no per-user permission controls |
| UserEvent variable scope | Only `setvar`-declared variables can be used in user events (typed declarations not supported) |
| Array index must be variable | Direct literal numeric index (`array[1]`) does not work; a counter variable is required |
| BSL POST placeholder rule | Placeholder conversion only works when the POST string does **not** start with `{` |
| MRP visual components | `messagebox` and other visual components are unavailable when MRP runs in background server mode |
| For-next step sensitivity | The `step` parameter behaves specifically with `DATUM` and `MONAT` types |
| Function return value | Only one return variable (`<return>`) is available per function |

---

### 17. Full API Reference Summary

#### 17.1 Singleton Objects

| Object | Purpose |
|--------|---------|
| `system` | Application-level properties, user, license, paths, debug |
| `sqlca` | Database connection, SQL execution, error handling |
| `tools` | Utility functions collection |
| `file` | File system operations |
| `sbodiapi` | Lightweight SAP DI API accessor (OADM, exchange rates) |
| `bmenu` | Menu construction (beasmenu.src only) |

#### 17.2 Declarable Objects (via `declare=name=objecttype`)

| Object Type | Purpose |
|-------------|---------|
| `ue_datastorevalues` | Multi-row SQL result datastore |
| `datastore` | General-purpose in-memory data container |
| `ue_api_sbo` | Full SAP Business One DI API access |
| `bsl` | Beas Service Layer instance |
| `ue_b1up` | B1 Usability Package functions |
| `api_batchnumber` | Batch number operations |
| `api_bom` | BOM operations |
| `api_routing` | Routing operations |
| `api_time` | Time recording operations |
| `api_chilcat` | Child catalog operations |
| `api_itemcode` | Item code operations |
| `api_relationshipmap` | Relationship map |
| `api_xgantt4` | Gantt chart (scheduling visualization) |
| `api_maintenance` | Maintenance operations |
| `api_interruption` | Interruption handling |
| `excel` | Excel file integration |
| `calendar` | Calendar operations |
| `bitmap` | Bitmap/image handling |
| `crypt` | Encryption/decryption |
| `email` | Email sending |
| `ftp` | FTP operations |
| `zip` | ZIP archive operations |
| `terminal` | Terminal emulation |
| `regexpression` | Regular expression support |
| `reservation` | Reservation management |
| `pricing` | Pricing operations |
| `newitem` | New item creation |
| `memory` | Memory management |

#### 17.3 Window/Form Events Reference

See Section 7 for the complete event reference organized by category.

#### 17.4 BSL Entity Collections (Partial)

The BSL exposes entity collections including (non-exhaustive):

**Administration:** `InterruptionReason`, `Branch`, `BatchAttributeValues`, `ItemGroup`, `Location`, `MaterialGroup`, `UoM`, `UoMConversion`, `UnitGroup`, `ProductionType`, `ScrapReason`, `TimeType`, `WorkOrderPriority`

**Business Partners:** `BusinessPartner`, `ItemArea`, `Item` (with GET, PUT, version, warehouse, UoM list, batch attributes), `BatchNumber`, `SerialNumber`, `WarehouseStock`

**Warehouse Management:** `Warehouse`, `WarehouseArea`, `BinLocation`, `WarehouseStock`

**Production:** `TimeReceipt`, `TimeReceiptRunning`, `WorkOrder`, `WorkOrderPos`, `WorkOrderBom`, `WorkOrderRouting`, `WorkOrderRoutingParallel`, `SerialNumberReservation`, `Reservation`, `Backflush`

**Quality Control:** `QCOrder` (with create, release, transfer, samples, measurements, attachments), `QCInspectionPlan`, `QCValidation`, `QCBlockReason`

**Personnel:** `Employee`

**Transaction Documents:** `ReceiptWO`, `IssueWO`

**System:** `PrintService`, `Protocol`, `RequestAnswerService`, `System`, `Tool`

---

### 18. Sample Scripts and Use Cases Analysis

#### 18.1 Hello World

```
messagebox="Hello World"
```
First script demonstrating the `messagebox` statement — the fundamental output mechanism in Beas Script.

#### 18.2 Field Validation (dw_1_update Event)

```
// Event: dw_1_update — validates matchcode field length
global function dw_1_update
setvar=ll_length=%len(<dw_1.item.matchcode.value>)
if <ll_length> <> 3 then
  messagebox=Lenght is not 3 characters.
end if
end global
```

#### 18.3 SQL Query with Error Handling

```
setvar=ls_itemcode=0815
sqlca.select "ItemName","OnHand" from "OITM" where "ItemCode"=<ls_itemcode,dbstring>
setvar=ll_sqlcode=<sqlca.sqlcode>
if <ll_sqlcode> = 100 then
  messagebox=error$$Entry not found
end if
if <ll_sqlcode> = 0 then
  messagebox=Name: <sqlca.result.1>, Stock: <sqlca.result.2>
end if
```

#### 18.4 Create Work Order via BSL

```
instance bsl b
b.post=Workorder={"WorkorderPos":[{"ItemCode":"FP","Quantity":2}]}
if <b.ret_code> = 1 then
  messagebox=Work order created: <b.ret_text>
else
  messagebox=error$$Creation failed: <b.ret_text>
end if
destroy b
```

#### 18.5 Create Receipt Document via BSL (5 Serial Numbers)

```
instance bsl b
setvar=ls_json=
for ll_i=1 to 5
  setvar=ls_json=<ls_json>{"ItemCode":"FP","WhsCode":"01","DistNumber":"SN-<ll_i>","Quantity":1},
next
b.post=Receipt=<ls_json>
messagebox=Code: <b.ret_code> Text: <b.ret_text>
destroy b
```

#### 18.6 Multi-row Datastore Loop

```
instance datastore d
d.select "ItemCode","ItemName" from "OITM" where "OnHand" > 0
setvar=ls_result=
for ll_row=1 to <d.rowcount>
  d.setrow=<ll_row>
  setvar=ls_result=<ls_result> <d.itemcode>|<d.itemname>
next
messagebox=<ls_result>
destroy d
```

#### 18.7 B1UP Integration

```
// Execute a B1UP Universal Function
declare=b1=ue_b1up
b1=ue_b1up=uf=UF001
destroy b1
```

#### 18.8 DI API — Create a SAP Document

```
declare=b1=ue_api_sbo
// [set document properties via b1 object]
b1=add
if <b1.ret_code> = -1 then
  messagebox=error$$<b1.ret_text>
end if
destroy b1
```

---

### 19. Version 2024.04 — New and Changed Features

Based on the official documentation for Beas Script 2024.04, the following version-specific notes are documented:

- **BSL (Beas Service Layer)** continues to expand its accessible entity set — the documentation notes that "not all objects are currently accessible; functionality expands with each version."
- **`changelog` tool** (`tools=changelog`) writes to the `beas_aenderung` table and supports the `reasonrequirement=1` flag for mandatory reason fields on change entries.
- **Automatic scheduling indicator** in `BEASV_WORKORDER` was introduced in **version 9.3 PL 2+** (flagged in the view documentation as version-specific).
- **BSL Authorization** now supports `notFoundCode` customization (override of default HTTP 404 code) as a login parameter.
- **Work Order time recording events** (`timerecordingend`) expose new output variables: `ojdt_transid`, `ojdt_transid_storno`, `e_itemstampid`.
- The documentation explicitly states backward compatibility "exceeds 99%" with all prior Beas Script versions.

> ⚠️ The documentation does not provide an exhaustive changelog for version 2024.04 specifically. For a full diff of changes between release builds, consult the Boyum IT Solutions release notes or contact Boyum IT support directly. The `changelog.htm` page in the documentation refers to the Beas Script `changelog` API tool (for writing audit log entries), not a product release changelog.

---

## [SUMMARY]

**Beas Script 2024.04** is a mature, fully integrated proprietary scripting language embedded within the Beas Manufacturing ERP add-on for SAP Business One. Created alongside Beas's initial release and maintaining 99%+ backward compatibility, it provides a powerful yet accessible customization platform for manufacturing ERP environments — requiring no external development tools, as the editor and interpreter are built into the Beas application.

The language is imperative, line-oriented, and case-sensitive (lowercase required), with syntax derived from BASIC, PowerBuilder, and SQL. Its most distinctive feature is the **placeholder system** (`<variable,format>`) for accessing runtime data, combined with an **event-driven programming model** that hooks into over 80 documented events across Beas Manufacturing, SAP Business One, APS, MRP, stock management, work order lifecycle, and quality control. Scripts interact with the SAP HANA database via the `sqlca` object using native HANA SQL syntax, and with SAP Business One via the DI API and UI API. The **Beas Service Layer (BSL)** provides a modern OData-inspired REST interface for both internal scripting and external HTTP/web integration.

Key takeaways for the Gamma S.p.A. implementation context (SAP B1 10.00.240 / Beas 2024H / B1UP 2024.05):
- **Work order automation** is extensively supported through 40+ dedicated work order management events covering the full production lifecycle.
- **BSL integration** enables modern JSON-based API interaction with Beas and SAP B1 data from within scripts, web applications (PHP, C#, JavaScript), and external systems.
- **B1UP interoperability** allows bidirectional execution: calling B1UP universal functions from Beas Script, and executing Beas Script code from within B1UP.
- **Error handling is entirely manual** — every script should explicitly check `sqlca.sqlcode`, `ret_code`, and `<return>` values; the built-in error log (`tools=errorlog`) provides runtime accumulation.
- **Key development constraints** include: one DI API instance at a time, no function parameters (variable exchange only), no native syntax checker, and strict lowercase requirement.

The documentation spans 833 pages across 14 major topic domains, constituting one of the most comprehensive scripting API references available for Beas Manufacturing customization and SAP Business One integration.

---

*Report generated from: https://help.beascloud.com/script202404/*
*Copyright of original documentation: © Boyum IT A/S. All rights reserved.*
*This report is a technical summary for internal use at Gamma S.p.A.*
