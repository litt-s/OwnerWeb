# OwnerWeb 踩坑记录

开发过程中遇到的问题记录在这里。

格式建议：

```markdown
## YYYY-MM-DD 问题标题

现象：
原因：
解决：
以后注意：
```

## 2026-09-08 Agentrouter / GLM 只接受文本消息

现象：

通过 CC Switch local proxy 调用 Codex endpoint `/responses` 时，上游返回 HTTP 400，错误为 `messages.content.type 参数非法，取值范围 ['text']`。

原因：

Agentrouter 的 GLM 上游只接受 `text` 类型消息内容。一旦对话中混入图片、截图或浏览器自动化产生的非文本内容，请求就会失败，可能导致当前会话不可用。

解决：

- 所有对话输出保持纯文本。
- 不发送图片、截图或非文本消息。
- 不使用会注入截图的浏览器或 GUI 自动化工具。
- 需要用户查看网页时，只提供文本链接，由用户手动打开。

以后注意：

该规则已写入 `AGENTS.md` 和 `TECH_STACK.md`，属于本项目 AI 协作的强制规则。
