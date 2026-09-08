# Project Memory

## Critical Communication Rules (MUST FOLLOW)

- The upstream provider for this project (Agentrouter / GLM models) only accepts `text` content in messages.
  Any image, screenshot, or non-text content will cause an HTTP 400 error:
  `messages.content.type 参数非法，取值范围 ['text']`.
- NEVER send images, screenshots, or any non-text content in conversation.
- NEVER auto-open a browser or use GUI/browser automation tools (they can inject screenshots into the
  conversation and permanently break the session through the proxy).
- When a browser or webpage is needed, provide a plain text link and let the user open it manually.
- Keep all communication in this project strictly text-only.

## Documentation Sync Rule (MUST FOLLOW)

- `memory-bank/` is the authoritative project memory. It must stay synchronized with the actual project.
- After every code, dependency, configuration, route, page, UI, API, database, deployment, or acceptance-scope change, update the relevant `memory-bank/` documents before finishing the task.
- Update `memory-bank/PROGRESS.md` for every meaningful completed change or newly discovered pending issue.
- Update the matching document according to the change type:
  - `PRD.md`: product scope, target users, features, acceptance criteria.
  - `TECH_STACK.md`: dependencies, tooling, commands, environment variables, coding constraints.
  - `ARCHITECTURE.md`: 项目结构说明；记录目录职责、路由结构、请求链路、数据流和系统边界。
  - `DATA_MODEL.md`: tables, fields, validation rules, API list, authentication behavior.
  - `DESIGN.md`: visual rules, layout, interaction, responsive behavior, page flows.
  - `DEPLOY.md`: local startup, build, hosting, proxy, environment, online verification.
  - `TASKS.md`: 开发任务清单；记录后续任务、已完成任务和任务范围。
  - `LEARNINGS.md`: pitfalls, root causes, fixes, and future cautions.
  - `PROGRESS.md`: 当前进度记录；记录每次有意义的完成项、进行中事项和新发现的问题。
- Do this automatically as part of the change; do not wait for the user to request a documentation update.
