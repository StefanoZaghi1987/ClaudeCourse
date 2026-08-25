# Claude Plugins & Features — Research & Guide Generation Prompt

> **Purpose:** This prompt instructs Claude to autonomously research, analyze, and produce a comprehensive Italian-language Word document (.docx) covering Claude plugins management and latest features across Claude Desktop, Claude Code, and Claude Cowork.
> **Language of the prompt:** English
> **Language of the output document:** Italian
> **Output format:** Downloadable Word Document (.docx)

---

## ⚠️ CRITICAL EXECUTION RULES — READ BEFORE STARTING

Before beginning any task, acknowledge that you have read and understood the following rules. These rules govern your entire execution and cannot be bypassed:

**A. SEQUENTIAL EXECUTION IS MANDATORY**
You must complete tasks in the exact order listed (1 → 2 → 3 → 4). Do not start a task until the previous one is fully completed and verified.

**B. NO TASK MAY BE SKIPPED**
You must execute every single task and every single sub-task listed. Omitting any task — even a minor one — is not acceptable.

**C. VERIFICATION AFTER EACH TASK**
After completing each task, you must explicitly verify your output before proceeding:
- State what you found/produced
- Confirm it meets the task requirements
- If verification fails, revise and re-verify before continuing
- At the end, provide a final summary confirming all tasks were completed successfully

**D. ASK BEFORE ASSUMING**
If any requirement, task, or instruction is unclear, ask a clarifying question before proceeding. Do not make assumptions about ambiguous points.

**E. NO UNVERIFIED ASSUMPTIONS**
Every factual statement about Claude's features, plugins, or capabilities must be grounded in information retrieved from official or otherwise certified and reliable sources during this session. Do not rely on training knowledge alone — verify through web research.

**F. OUTPUT DEPTH**
The final document must be detailed and exhaustive. Each relevant aspect must have its own dedicated section. Superficial or incomplete sections are not acceptable.

**G. DOCUMENT REQUIREMENTS (for Task 4)**
- Written entirely in **Italian**
- Maximum length: **50 pages**
- Every topic must be explained clearly and in full detail
- Both theoretical and practical perspectives must be covered for each topic
- Practical examples suitable for sharing during training sessions must be included
- The entire document must be generated in a single step — do not skip paragraphs or topics
- Output format: downloadable **Word Document (.docx)**

---

## TASK 1 — Latest Claude Features: Documentation Analysis & Understanding

### 1.1 Web Research
Use your web search and web fetch tools to access the official Claude documentation and recent announcements regarding the **latest features and improvements** introduced in Claude, Claude Desktop, Claude Code, and Claude Cowork.

Target sources to search and read:
- https://docs.anthropic.com (official documentation)
- https://www.anthropic.com/news (official announcements and changelog)
- https://www.anthropic.com/claude (product pages)
- Any other official or highly reliable sources returned by your search

Search queries to execute (adapt as needed):
- "Claude latest features 2025 2026 site:anthropic.com"
- "Claude Desktop new features changelog"
- "Claude Code latest improvements"
- "Anthropic Claude release notes"

### 1.2 Analysis
After completing your research, analyze and synthesize:
- What are the most recently introduced features across all Claude platforms?
- Which features are relevant to professional and enterprise use cases?
- What improvements have been made to existing capabilities?
- Are there new interaction paradigms, tools, or modalities introduced?

### ✅ Task 1 Verification
Before proceeding to Task 2, explicitly confirm:
- How many sources were consulted
- Which specific recent features were identified
- That all findings are grounded in retrieved documentation, not assumptions

---

## TASK 2 — Plugins Management: Deep Documentation Analysis & Understanding

### 2.1 Web Research
Use your web search and web fetch tools to access the official Claude documentation regarding **plugin management** across:
- **Claude Desktop** (also called claude.ai) — personal plugins, organization plugins, plugin admin controls
- **Claude Code** — skills, agents, hooks, plugin-like extensions
- **Claude Cowork** — plugin capabilities specific to the Cowork desktop application

Target sources:
- https://docs.anthropic.com/en/docs/claude-code (Claude Code docs)
- https://support.claude.ai (support documentation)
- https://docs.anthropic.com (main docs)
- Anthropic GitHub repositories (https://github.com/anthropics)

Search queries to execute:
- "Claude plugins management official documentation"
- "Claude Desktop plugins install manage site:anthropic.com OR site:support.claude.ai"
- "Claude Code skills agents hooks documentation"
- "Claude Cowork plugins features"

### 2.2 Deep Analysis
After completing your research, deeply analyze and synthesize:

**For Claude Desktop:**
- What is the plugin architecture? (Personal plugins vs. Organization plugins)
- What are the available access control options? (Installed by default / Available for install / Restricted)
- How does an administrator manage plugins at the organization level?
- How does a user install, enable, disable, and remove plugins?
- What is the difference between official plugins (by Anthropic & Partners) and custom/personal plugins?

**For Claude Code:**
- What is the role of Skills, Agents, and Hooks in Claude Code's extension model?
- How do Claude Code plugins (skills/agents) differ conceptually from Claude Desktop plugins?
- What is the relationship between skills and slash commands (e.g., `/brainstorming`, `/dispatching-parallel-agents`)?
- How are skills triggered — automatically, manually via slash commands, or both?

**For Claude Cowork:**
- What plugin or skill capabilities are available in Claude Cowork?
- How does Cowork's plugin model differ from Claude Desktop?
- What unique integrations does Cowork support?

### ✅ Task 2 Verification
Before proceeding to Task 3, explicitly confirm:
- Key differences identified between plugin models across the three platforms
- Sources consulted and their reliability
- That no assumptions were made about undocumented features

---

## TASK 3 — Most Relevant Plugins: Exhaustive Deep Analysis

### 3.1 Web Research
Use your web search and web fetch tools to access documentation, GitHub repositories, and official marketplace listings for all major plugins available for Claude Desktop, Claude Code, and Claude Cowork.

Search queries to execute:
- "Claude Desktop plugins list Operations Design Engineering site:anthropic.com"
- "Claude Cowork plugins marketplace official"
- "Claude Code Superpowers skills library site:github.com/anthropics"
- "Claude Code Feature dev skill documentation"
- "Claude plugins brand voice HR productivity enterprise search"

### 3.2 Claude Desktop & Cowork Plugins — Deep Analysis

For **each** of the following official plugins (by Anthropic & Partners), analyze and document:
- Full description and purpose
- Target audience and use cases
- Key features and capabilities
- How it is activated (default install vs. manual install)
- How it is used in practice (automatic trigger, manual invocation, or both)
- Practical examples of tasks it enables
- Limitations or considerations

Plugins to analyze:
| Plugin | Category |
|---|---|
| **Operations** | Workflow & process management |
| **Design** | Visual and UX design assistance |
| **Engineering** | Software development workflows |
| **Data** | Data analysis and manipulation |
| **Productivity** | Personal and team productivity |
| **Enterprise search** | Knowledge and document retrieval |
| **Brand voice** | Brand identity and communications |
| **Human resources** | HR workflows and documentation |
| **Common room** | Community and collaboration |
| **Product management** | Product strategy and planning |
| *(Any additional plugins discovered during research)* | |

### 3.3 Claude Code Plugins — Deep Analysis

For **each** of the following Claude Code skills/plugins, analyze and document:
- Full description and purpose
- What problem it solves in the development workflow
- How it is triggered (slash command, automatic detection, or both)
- Detailed explanation of its skills and agents
- Practical usage examples for developers
- When to use it vs. when not to use it

Skills/Plugins to analyze:
| Skill/Plugin | Slash Command(s) |
|---|---|
| **Superpowers** (by Anthropic) | `/brainstorming`, `/dispatching-parallel-agents`, `/executing-plans`, `/finishing-a-development-branch`, `/receiving-code-review`, `/requesting-code-review` |
| **Claude code setup** | To be identified |
| **Claude md management** | To be identified |
| **Code review** | To be identified |
| **Code simplifier** | To be identified |
| **Feature dev** | To be identified |
| **Agent sdk dev** | To be identified |
| **Firecrawl** | To be identified |
| **Frontend design** | To be identified |
| **Figma** | To be identified |
| **Huggingface skills** | To be identified |
| **Sentry** | To be identified |
| *(Any additional skills discovered during research)* | |

Also analyze the **Hooks** system in Claude Code:
- What are Hooks and how do they differ from Skills and Agents?
- How are Hooks configured and triggered?
- What are practical use cases for Hooks?

### 3.4 Trigger Mechanism Analysis
For each plugin/skill identified, explicitly document:
- **Trigger type:** Automatic (Claude activates it based on context) | Manual (user must invoke it) | Both
- **Invocation method:** Slash command, natural language, configuration-based, event-based
- **Context requirements:** What conditions must be present for the plugin to activate?
- **Output type:** What does the plugin produce?

### ✅ Task 3 Verification
Before proceeding to Task 4, explicitly confirm:
- Complete list of all plugins analyzed (Desktop + Cowork + Code)
- Trigger mechanisms documented for each
- Sources consulted
- No gaps or missing plugins from those listed above

---

## TASK 4 — Output Document: Comprehensive Italian Guide on Claude Plugins

### 4.1 Document Generation Instructions

Using all information gathered and analyzed in Tasks 1–3, generate a comprehensive, exhaustive guide on Claude plugins. The guide must be:

- **Written entirely in Italian**
- **Maximum 50 pages**
- **Format: downloadable Word Document (.docx)**
- **Generated completely in a single step — do not truncate, summarize, or skip any section**

### 4.2 Document Structure

The document must follow this structure exactly. Each section must be fully written — no placeholders, no "to be expanded," no skipped content:

---

**TITOLO: Guida Completa ai Plugin di Claude Desktop, Claude Code e Claude Cowork**

**SOTTOTITOLO: Gestione, utilizzo e applicazioni pratiche per un uso professionale avanzato**

---

#### SEZIONE 0 — Introduzione al Documento
- Scopo e destinatari della guida
- Come usare questa guida durante la formazione
- Prerequisiti consigliati

#### SEZIONE 1 — Panoramica delle Ultime Funzionalità di Claude
- Novità più recenti introdotte nelle piattaforme Claude (Desktop, Code, Cowork)
- Miglioramenti e nuovi paradigmi di interazione
- Rilevanza per l'uso professionale e aziendale
- Tabella sinottica delle principali novità

#### SEZIONE 2 — Architettura dei Plugin in Claude: Concetti Fondamentali
- Cosa sono i plugin in Claude e a cosa servono
- Differenza concettuale tra plugin in Claude Desktop, Claude Code e Claude Cowork
- Modello di estensibilità: plugin ufficiali vs. plugin personalizzati
- Ruolo dei plugin nell'ecosistema Claude

#### SEZIONE 3 — Gestione dei Plugin in Claude Desktop
- Struttura dei plugin: plugin personali vs. plugin organizzativi
- Ruoli e permessi: utente vs. amministratore
- Controllo degli accessi: "Installed by default", "Available for install", "Restricted"
- Come installare, abilitare, disabilitare e rimuovere un plugin
- Gestione amministrativa dei plugin a livello organizzazione
- Plugin ufficiali Anthropic & Partners: panoramica
- Come aggiungere plugin personalizzati (personal plugins)
- Esercizio pratico: configurazione di un plugin in Claude Desktop

#### SEZIONE 4 — I Plugin Ufficiali di Claude Desktop e Cowork
*(Una sottosezione dedicata per ciascun plugin)*

Per ogni plugin, la sottosezione deve contenere:
- Descrizione e scopo
- A chi è destinato e in quali contesti è utile
- Funzionalità principali
- Modalità di attivazione e utilizzo (automatica, manuale o entrambe)
- Esempi pratici da condividere in aula
- Limitazioni e considerazioni d'uso

Plugin da trattare (una sottosezione ciascuno):
- 4.1 Operations
- 4.2 Design
- 4.3 Engineering
- 4.4 Data
- 4.5 Productivity
- 4.6 Enterprise Search
- 4.7 Brand Voice
- 4.8 Human Resources
- 4.9 Common Room
- 4.10 Product Management
- 4.11 Altri plugin rilevanti scoperti durante la ricerca

#### SEZIONE 5 — Il Modello di Estensione di Claude Code: Skills, Agents e Hooks
- Architettura di Claude Code: come funzionano le estensioni
- Cos'è una Skill: definizione, struttura e funzionamento
- Cos'è un Agent: definizione, struttura e funzionamento
- Cos'è un Hook: definizione, struttura e funzionamento
- Differenze tra Skills, Agents e Hooks: quando usare ciascuno
- Il meccanismo dei comandi slash (slash commands) in Claude Code
- Trigger automatici vs. invocazione manuale
- Esercizio pratico: esplorare le skill disponibili in Claude Code

#### SEZIONE 6 — Le Skill e i Plugin Principali di Claude Code
*(Una sottosezione dedicata per ciascun plugin/skill)*

Per ogni skill/plugin, la sottosezione deve contenere:
- Descrizione e scopo nel workflow di sviluppo
- Skills incluse e loro funzionamento dettagliato
- Agents inclusi (se presenti) e loro funzionamento
- Slash commands disponibili e loro utilizzo
- Modalità di trigger (automatico, manuale, entrambi)
- Esempio pratico di utilizzo con output atteso
- Quando usarlo vs. quando non usarlo
- Best practice d'uso

Skill/Plugin da trattare (una sottosezione ciascuno):
- 6.1 Superpowers (Anthropic) — analisi dettagliata di tutte le sue slash commands
- 6.2 Claude Code Setup
- 6.3 Claude MD Management
- 6.4 Code Review
- 6.5 Code Simplifier
- 6.6 Feature Dev
- 6.7 Agent SDK Dev
- 6.8 Firecrawl
- 6.9 Frontend Design
- 6.10 Figma
- 6.11 Huggingface Skills
- 6.12 Sentry
- 6.13 Altri skill/plugin rilevanti scoperti durante la ricerca

#### SEZIONE 7 — Plugin e Cowork: Caratteristiche Specifiche
- Claude Cowork e il suo modello di estensione
- Differenze rispetto a Claude Desktop nella gestione dei plugin
- Integrazioni specifiche disponibili in Cowork
- Casi d'uso pratici per team non tecnici

#### SEZIONE 8 — Best Practice per la Gestione e l'Uso dei Plugin
- Come scegliere i plugin giusti per il proprio contesto di lavoro
- Strategie di configurazione per team eterogenei
- Combinare più plugin per workflow avanzati
- Errori comuni da evitare
- Governance dei plugin in contesti enterprise
- Sicurezza e privacy nell'uso dei plugin

#### SEZIONE 9 — Workflow Pratici con i Plugin: Casi d'Uso Reali
- Workflow 1: Sviluppo software con Claude Code e Superpowers
- Workflow 2: Gestione documentazione con Operations e Productivity
- Workflow 3: Design collaborativo con Design e Figma
- Workflow 4: Analisi dati con Data e Enterprise Search
- Workflow 5: HR e comunicazione interna con Human Resources e Brand Voice

#### SEZIONE 10 — Riepilogo, Risorse e Riferimenti
- Tabella sinottica di tutti i plugin (Desktop + Code + Cowork)
- Link alle risorse ufficiali
- Suggerimenti per l'approfondimento autonomo
- Glossario dei termini tecnici

---

### 4.3 Stylistic and Formatting Requirements
- Use professional, clear Italian appropriate for a business training context
- Include practical examples formatted as dedicated callout boxes where relevant
- Use tables to compare features and trigger mechanisms across plugins
- Use numbered lists for step-by-step procedures
- Use bullet points for feature lists
- Every major section must begin with a brief introduction paragraph
- Avoid excessive technical jargon — explain technical terms when first introduced

### ✅ Task 4 Verification
After generating the document, confirm:
- All sections from the structure above are present and complete
- Document is written in Italian
- No sections were truncated or skipped
- Practical examples are included throughout
- Document is provided as a downloadable .docx file

---

## FINAL SUMMARY

After completing all four tasks, provide a structured final summary in this format:

```
RIEPILOGO FINALE DELL'ESECUZIONE
=================================
✅ Task 1 — Latest Features Research: [brief summary of findings]
✅ Task 2 — Plugin Management Research: [brief summary of findings]
✅ Task 3 — Individual Plugin Analysis: [number of plugins analyzed, list]
✅ Task 4 — Document Generated: [page count, sections included]

Fonti principali consultate:
- [source 1]
- [source 2]
- [...]

Note e osservazioni:
- [any caveats, limitations, or important notes]
```

---

*Prompt version: 1.0 — Created for Claude Desktop Training Course*
*Target platform: Claude Desktop (claude.ai) with web search enabled*
*Output language: Italian | Output format: .docx*
