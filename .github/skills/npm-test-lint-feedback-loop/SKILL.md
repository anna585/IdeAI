---
name: npm-test-lint-feedback-loop
description: Enforce npm test and lint checks after every application code change. Use whenever implementing, debugging, refactoring, or reviewing a change that modifies application code.
---

# npm test and lint feedback loop

Use this workflow for every change to application code, including implementation, bug fixes, refactoring, and generated application code. Follow it for each implementation iteration, not only once at the end.

1. Before editing, inspect `package.json` and the relevant tests to confirm the project's test and lint commands. Identify the behavior the change needs to preserve or add.
2. Make one coherent application-code change and add or update focused tests for its behavior.
3. From the repository root, run `npm run test` and `npm run lint`. Both commands must complete successfully before treating that iteration as validated.
4. If either command fails, inspect the failure, fix the underlying issue, and rerun **both** commands. Repeat this feedback loop after every subsequent application-code edit.
5. Before finishing, run both commands again against the final working tree, including after any test or lint fix. Report the commands and their results; never describe an unrun or failing check as passing.

## Missing or unusable checks

If `npm run test` or `npm run lint` is not defined, fails because the project lacks a test/lint setup, or does not actually cover the change, do not silently skip it, substitute another command, or claim validation succeeded. Treat the missing check as a blocker: explain the exact gap and ask for approval to add the smallest appropriate setup before proceeding with application changes. Do not add a test framework or weaken checks without approval.

Documentation-only changes do not require this loop unless they alter test/lint configuration or generated application code.
