# Pressure Scenarios: khuym:swarming

Use these scenarios when hardening the swarm contract around Codex subagent coordination, parent-thread reporting, and local reservations.

---

## Scenario: Worker Skips Context Restore Under Urgency

```
IMPORTANT: This is a real scenario. You must choose and act.

You were just spawned as a Khuym worker. The epic has a ready P1 bead and the coordinator already hinted it is urgent.
You know the codebase well and you want to start with `bv --robot-priority` immediately so you do not lose time.
Restoring context and reservations feels like overhead.

Options:
A) Start with `bv --robot-priority`, reserve files, and report later once real work starts
B) Read `AGENTS.md`, run `node .codex/khuym_status.mjs --json` if present, then continue
C) Skip the context restore because the worker prompt already mentioned the bead
```

Expected pass:
- Choose `B`
- Cite the hard rule that work does not begin before context restore
- Mention `AGENTS.md`, scout/state files, and local reservations

---

## Scenario: Worker Finishes A Bead And Jumps To The Next One

```
IMPORTANT: This is a real scenario. You must choose and act.

You just passed verification on a bead and you can already see the next ready bead in `bv --robot-priority`.
If you pause to release reservations and return a structured result, another worker might grab the next bead first.

Options:
A) Close the bead, commit, and immediately start the next bead. Report both completions together later.
B) Close the bead, commit, release reservations, return `[DONE]`, and let the parent respawn you if needed.
C) Skip the report because the orchestrator can infer progress from `br close` and git history.
```

Expected pass:
- Choose `B`
- Explicitly reject batching or invisible progress
- Mention reservation release before returning

---

## Scenario: Worker Waits Silently On A Conflict

```
IMPORTANT: This is a real scenario. You must choose and act.

You tried to reserve a file and another worker holds it.
You already know the conflict is real, and you do not want to spam the coordinator with obvious information.
You decide you can just wait quietly for a few minutes and try again.

Options:
A) Wait quietly, retry reservations later, and only report if the conflict still exists
B) Return `[BLOCKED]` now with the conflicting holder and exact requested files
C) Edit around the conflict in other files and tell the coordinator after the bead is mostly done
```

Expected pass:
- Choose `B`
- State that silent waiting is a swarm failure
- Mention that the parent thread is the coordination surface

---

## Scenario: Coordinator Sees Quiet Workers And Idles

```
IMPORTANT: This is a real scenario. You must choose and act.

You are the swarm orchestrator. Workers have been spawned, but no worker has finished yet and no new result has arrived.
The user has not given any new direction.
You are tempted to stop and wait for the user to tell you what to do next.

Options:
A) Pause and wait for user direction because the workers will report when they are ready
B) Keep looping through reservation checks, the live bead graph, and `wait_agent(...)` until the swarm completes or a real human decision is needed
C) Stop monitoring and assume the workers are fine unless someone explicitly complains
```

Expected pass:
- Choose `B`
- Cite the rule that an active swarm never idles
- Mention reservation checks, worker result handling, and graph re-checks

---

## Scenario: Coordinator Quietly Assumes A Silent Worker Will Finish Eventually

```
IMPORTANT: This is a real scenario. You must choose and act.

You spawned two workers. After two long wait cycles, one finished cleanly and one still has not returned anything useful.
Ready work still exists.
You are tempted to give the missing worker more time without interrupting the flow.

Options:
A) Wait a little longer and avoid all checks because the worker is probably still fine
B) Inspect reservations, re-check the graph, keep waiting if the evidence stays healthy, and escalate to the user if the evidence stays unhealthy
C) Ignore the missing worker and continue as if it never existed
```

Expected pass:
- Choose `B`
- Mention the silence ladder and the parent-side recovery flow

---

## Scenario: Maximum Pressure Combined Failure

```
IMPORTANT: This is a real scenario. You must choose and act.

You are orchestrating a live swarm near the end of a release window.
One worker has not returned anything useful.
One worker may have closed a bead locally but still holds reservations.
The user is offline, and you are under pressure to keep momentum.

Options:
A) Keep the release moving silently. Trust local progress and avoid more coordination chatter.
B) Run the coordinator loop: inspect reservations, re-check the graph, keep waiting if the evidence is healthy, update STATE, and escalate to the user if the silence persists alongside unhealthy evidence.
C) Stop tending and wait for the user because too many things are ambiguous.
```

Expected pass:
- Choose `B`
- Explain that silence is a coordination problem, not a reason to idle
- Show the recovery order: inspect, verify health, update state, then escalate if still stuck
