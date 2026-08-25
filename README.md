# AI4Everyone — A Complete Training Course on Claude Desktop & Claude Code

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Materials: Italian](https://img.shields.io/badge/materials-Italian-informational)](#-in-italiano)
[![Lessons: 6 · ~14h](https://img.shields.io/badge/lessons-6_·_~14h-success)](#-curriculum)

A **complete, reuse-ready course kit** on Claude Desktop and Claude Code: lesson manuals,
trainer guides, hands-on exercises, prompt templates, full Spec-Driven Development (SDD)
walkthrough transcripts, and battle-tested Claude Code configurations (agents, rules,
skills, MCP servers).

The course was designed and delivered in Spring 2026 as six remote sessions (~14 hours
total) for a mixed audience of colleagues — from beginners to intermediate users — with a
70% practical / 30% theoretical split. Everything you need to **learn from it or teach
it** is in this repository.

> **Note:** all materials are written in Italian; code and prompts are reusable as-is.

## 📂 What's inside

| Path | Content |
|---|---|
| [`docs/Materiale didattico/`](docs/Materiale%20didattico) | **The course materials**: user manuals for lessons 1–6, trainer guides (chapters 1–7 + plugins), the full topic list, the SDD methodology deck, complete SDD walkthrough transcripts, and reusable utilities (see below). |
| [`Esercizi/`](Esercizi) | **Hands-on exercises** for each lesson — from Excel data analysis with Claude Desktop to building an MCP server in TypeScript. |
| [`project/`](project) | **Dogfooding**: this very course was designed, written, and produced *with* Claude Code. This folder contains the project configuration and the full chain of generation prompts, chapter by chapter. |

## 🗓 Curriculum

| # | Date | Topics | Manual | Exercises |
|---|---|---|---|---|
| 1 | Mar 6, 2026 | Claude Desktop: interface, operating modes, chat & search, artifacts, plans & token limits | [Prima Lezione](docs/Materiale%20didattico/Manuali/Manuale_Prima_Lezione.pdf) | [AMSMonitoring](Esercizi/Lezione_1/AMSMonitoring), [IssueReportAnalysis](Esercizi/Lezione_1/IssueReportAnalysis) |
| 2 | Mar 20, 2026 | TCOF framework, context window, memory management, Claude Projects | [Seconda Lezione](docs/Materiale%20didattico/Manuali/Manuale_Seconda_Lezione.pdf) | [BeasAssistant](Esercizi/Lezione_2/BeasAssistant) |
| 3 | Mar 30, 2026 | RAG & memory recap, metaprompting, Claude Code introduction & installation | [Terza Lezione](docs/Materiale%20didattico/Manuali/Manuale_Terza_Lezione.pdf) | [ContextIsAllYouNeed](Esercizi/Lezione_3/ContextIsAllYouNeed) |
| 4 | Apr 10, 2026 | CLAUDE.md as static memory, Claude Code working modes & effort, plugins, SDD fundamentals | [Quarta Lezione](docs/Materiale%20didattico/Manuali/Manuale_Quarta_Lezione.pdf) | [ShoppingList — Lite workflow](Esercizi/Lezione_4/ShoppingList_LiteWorkflow) |
| 5 | Apr 17, 2026 | SDD in Claude Code: traditional vs advanced workflow (brainstorming → spec → plan → execute → review) | [Quinta Lezione](docs/Materiale%20didattico/Manuali/Manuale_Quinta_Lezione.pdf) | [ShoppingList — 3 workflows compared](Esercizi/Lezione_5) |
| 6 | May 5, 2026 | Plugin architecture, Skills anatomy & usage, MCP servers | [Sesta Lezione](docs/Materiale%20didattico/Manuali/Manuale_Sesta_Lezione.pdf) | [GammaBotMCP](Esercizi/Lezione_6/GammaBotMCP), [MathMCP](Esercizi/Lezione_6/MathMCP) |

Trainer companions: [topic list](docs/Materiale%20didattico/Elenco_Argomenti.pdf) and
[trainer guides](docs/Materiale%20didattico/Guida%20formatore) (chapters 1–7 + plugins).

## 🧪 The exercises

- **AMSMonitoring** *(L1)* — Claude Desktop as a senior SAP B1/HANA consultant: analyze an
  infrastructure alert report and produce a management-ready Markdown report.
- **IssueReportAnalysis** *(L1)* — analyze a bot test-session issue report from two
  viewpoints (board vs. tech lead). *The two Excel data files from these exercises are
  intentionally not included (real company data); the prompts and the classroom output
  reports are.*
- **BeasAssistant** *(L2)* — build a domain assistant for a manufacturing ERP: project
  configuration, knowledge-base guides, and generation prompts.
- **ContextIsAllYouNeed** *(L3)* — metaprompting as a creative exercise: iterate a song
  about context engineering (lyrics + audio).
- **ShoppingList, three ways** *(L4–L5)* — the same offline-first PWA built with
  progressively richer Claude Code workflows (**Lite → Intermediate → Advanced**), so the
  workflow itself — not the app — is the lesson. Specs, plans, and `.claude/`
  configurations included for each variant.
- **MCP servers** *(L6)* — [GammaBotMCP](Esercizi/Lezione_6/GammaBotMCP/Guida_Configurazione_MCP_GammaBot.md):
  wiring real MCP servers into Claude Desktop; [MathMCP](Esercizi/Lezione_6/MathMCP):
  a complete TypeScript MCP server with vitest tests.

## ♻️ Reusable assets

- **SDD walkthrough transcripts** — two full, numbered end-to-end sessions
  ([ConfigurableWorkingHours](docs/Materiale%20didattico/Presentazioni/TaskManagement%20-%20ConfigurableWorkingHours),
  [Gantt algorithm](docs/Materiale%20didattico/Presentazioni/TaskManagement%20-%20Modified%20Gantt%20Date%20Calculation%20Algorithm)):
  original prompt → Q&A → specification → development plan → execution → review →
  optimized spec. Ideal for seeing the whole methodology in action.
- **Prompt templates** — ready-to-use prompts for Claude and Claude Code
  ([Utilities/Prompt Templates](docs/Materiale%20didattico/Utilities/Prompt%20Templates)):
  brainstorming, planning-mode execution, subagent-driven development.
- **Claude Code configuration** — working examples of
  [agents](docs/Materiale%20didattico/Utilities/Claude%20Code%20Configuration/agents)
  (code-reviewer, spec-reviewer, implementation-plan-reviewer), rules, and a skill.
- **Best-practice docs** — Claude Code configuration, enforcement, modularization, and
  referencing best practices ([Utilities/Generazione Claude.md](docs/Materiale%20didattico/Utilities/Generazione%20Claude.md/docs)).

## 🐕 Dogfooding

The `project/` folder is the course's own production line: the project configuration
(`ProjectContext`, `ProjectDescription`, `ProjectInstructions`) and the numbered prompts
that generated every chapter guide. The course teaches Claude Code workflows *and* was
built with them — the meta-lesson is in the repo.

## 🇮🇹 In italiano

**AI4Everyone** è il kit completo di un corso di formazione su **Claude Desktop e Claude
Code**, erogato nella primavera 2026 in sei sessioni (~14 ore) con approccio 70% pratico /
30% teorico. Il repository contiene i manuali utente delle sei lezioni, le guide per il
formatore, gli esercizi pratici (dall'analisi di report Excel allo sviluppo di un server
MCP in TypeScript), i template di prompt, trascrizioni complete di sessioni di
Spec-Driven Development e le configurazioni Claude Code riutilizzabili (agent, regole,
skill, plugin). Il corso è stato inoltre progettato e prodotto con Claude Code stesso:
nella cartella `project/` si trova l'intera catena di prompt di generazione.

## 📄 License & attribution

Released under the [Apache 2.0 License](LICENSE). If you reuse the kit to run your own
course, an attribution to this repository is appreciated.
