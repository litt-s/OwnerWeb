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

## 必读文档

- `memory-bank/PRD.md`
- `memory-bank/DESIGN.md`
- `memory-bank/TECH_STACK.md`
- `memory-bank/DATA_MODEL.md`
- `memory-bank/ARCHITECTURE.md`
- `memory-bank/TASKS.md`
- 部署相关任务阅读 `memory-bank/DEPLOY.md`

## 执行规则
- 每次给出需求或任务时先将整个任务做出拆分，询问拆分的任务是否合理，合理就把拆分的任务做编号写进`TASKS.md`,写入后就直接开始执行任务
- 每次只执行 `TASKS.md` 中的一个编号任务。
- 不要顺手实现后续任务。
- 不要实现 `TASKS.md` 之外的功能。
- 如果任务不合理，先修改文档，再写代码。
- 页面和交互对齐 `DESIGN.md`。
- 数据字段、接口入参出参、校验规则对齐 `DATA_MODEL.md`。
- 文件职责、模块边界和数据流对齐 `ARCHITECTURE.md`。

## 文档修改规则

当任务是完善 `memory-bank/` 中的文档时：

- 必须阅读目标文档全文，不要只搜索 `TODO`。
- 优先补全所有 `TODO`。
- 如果已有内容和当前 `PRD.md`、原型或课堂项目边界不一致，必须同步修改非 `TODO` 内容。
- 如果已有内容是通用规则，且没有和当前项目冲突，应该保留。
- 不要擅自新增课堂范围之外的功能。
- 修改完成后说明补全了哪些 `TODO`、修改了哪些非 `TODO` 内容，以及为什么修改。

## 完成规则

每完成一个任务后：

- 更新 `memory-bank/PROGRESS.md`。
- 如果改动架构，同步更新 `memory-bank/ARCHITECTURE.md`。
- 如果改动数据字段或接口，同步更新 `memory-bank/DATA_MODEL.md`。
- 回复中说明修改了哪些文件、如何验证、是否还有未完成项。

## 禁止事项

- 不要删除 `design/` 和 `memory-bank/`。
- 不要把管理员密码或 token 密钥写入前端代码。
- 不要提交 `.env` 或 `.env.local`。
- 不要让前端直接操作数据库，必须通过云函数。
- 不要把接口调用散落在页面组件里，统一通过 `src/services/` 封装。


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
