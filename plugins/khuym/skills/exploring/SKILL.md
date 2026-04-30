---
name: exploring
description: >-
  Use when a feature request needs user-facing decisions captured in
  history/<feature>/CONTEXT.md before Khuym planning. Clarifies fuzzy scope
  without implementation research or bead creation.
metadata:
  version: '1.0'
  ecosystem: khuym
  position: '2 of 9 - after using-khuym, before planning'
  dependencies: []
---

# Exploring Skill

If `.khuym/onboarding.json` is missing or stale, stop and invoke `khuym:using-khuym`.

Exploring turns fuzzy intent into locked decisions in `history/<feature>/CONTEXT.md`.

## Hard Gates

- Ask one question at a time; wait for the user before asking the next.
- Do not answer your own question.
- Do not research implementation, propose architecture, create beads, or write code.
- Do not invoke planning. End by handing the user to `khuym:planning`.

## Flow

1. **Scope**
   - Classify: `Quick`, `Standard`, or `Deep`.
   - Read `history/learnings/critical-patterns.md` and `.khuym/state.json` if present.
   - If the request spans independent subsystems, pick one and defer the rest.

2. **Domain**
   - Classify each applicable type:
     - `SEE`: user-visible surface
     - `CALL`: API, CLI, webhook, SDK, service interface
     - `RUN`: job, script, service, or pipeline
     - `READ`: docs, emails, reports, notifications
     - `ORGANIZE`: data model, file layout, taxonomy, config
   - Load `references/gray-area-probes.md` and choose only relevant probes.

3. **Gray Areas**
   - Generate 2-4 unstated product decisions that would make planning guess.
   - Do a quick scout only:
     ```bash
     rg "<feature-keyword>" src app packages --glob "*.{ts,tsx,js,jsx,py,md}" | head -20
     ```
   - Read 2-3 relevant files; cite existing patterns in questions.
   - Exclude implementation choices, performance tuning, and new scope.

4. **Socratic Locking**
   - Ask one concise question per message, preferably single-choice.
   - Start broad, then narrow into constraints.
   - After each decision, confirm it and assign a stable ID: `D1`, `D2`, `D3`.
   - For scope creep: mark it as deferred and return to the current question.

5. **Context Assembly**
   - Write `history/<feature-slug>/CONTEXT.md` from `references/context-template.md`.
   - Include boundary, domain types, locked decisions, scout paths, refs, questions, and deferred ideas.
   - Use concrete language. No placeholders, TODOs, or vague preferences.
   - Spawn one fresh reviewer with no history. Check completeness, contradictions, vague decisions, missing IDs, and blockers. Max two loops.

6. **State And Handoff**
   - Update `.khuym/state.json`:
     ```json
     {
       "active_skill": "exploring",
       "feature_slug": "<feature>",
       "phase": "exploring-complete",
       "summary": "Exploring complete. CONTEXT.md is ready for planning.",
       "next_action": "Invoke khuym:planning.",
       "focus": "history/<feature>/CONTEXT.md"
     }
     ```
   - Tell the user:
     ```text
     Decisions captured. CONTEXT.md written to `history/<feature>/CONTEXT.md`.
     CONTEXT.md is the source of truth for downstream agents.
     Invoke khuym:planning to research, propose phases/stories, and wait for approval.
     ```

Anti-patterns: bundled questions, deep implementation analysis, architecture proposals, beads, code, or skipping decision locking.

References: `references/gray-area-probes.md`, `references/context-template.md`.
