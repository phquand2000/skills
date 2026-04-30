# CONTEXT.md Template

Write this to `history/<feature-slug>/CONTEXT.md`. Remove unused optional sections.
No TODOs, placeholders, or vague decisions.

```markdown
# <Feature Name> - Context

**Feature slug:** <slug>
**Date:** YYYY-MM-DD
**Exploring session:** complete
**Scope:** Quick | Standard | Deep
**Domain types:** SEE | CALL | RUN | READ | ORGANIZE

## Feature Boundary

<One concrete sentence describing what this feature delivers and where it ends.>

## Locked Decisions

These are fixed. Planning must implement them exactly.

- **D1:** <specific decision, not a preference>
  - Rationale: <optional, only if it changes implementation>
- **D2:** <specific decision>

### Agent's Discretion

<What the user delegated to the agent, with constraints. Remove if none.>

## Specific Ideas And References

- <Mockup/example/reference the user mentioned, and what it means.>

## Existing Code Context

From the quick scout. Downstream agents read these before planning.

### Reusable Assets

- `<path>` - <what it does and how it applies>

### Established Patterns

- <pattern> - <where used and what to reuse>

### Integration Points

- `<path>` - <what new work connects to>

## Canonical References

- `<path-or-url>` - <what this defines>

## Outstanding Questions

### Resolve Before Planning

- [ ] <question> - <why it blocks planning>

### Deferred To Planning

- [ ] <technical question> - <what investigation answers it>

## Deferred Ideas

- <out-of-scope idea> - <why deferred>

## Handoff Note

CONTEXT.md is the source of truth. Decision IDs are stable. Planning reads locked
decisions, code context, canonical references, and deferred-to-planning questions.
Validating and reviewing use locked decisions for coverage and UAT.
```
