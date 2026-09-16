# OwnerWeb 当前进度记录

> 本文档是 OwnerWeb 的当前进度记录，用于同步项目已完成内容、正在处理的内容和新发现的问题。

## 已完成

- Vite + React 项目脚手架已创建。
- 首页、经历、项目、优势、联系等主要展示模块已实现。
- React Router 路由体系已建立。
- 项目详情页已实现，支持静态项目数据和项目多级评论。
- 项目内容模块已完成：`projects` 表、公开项目接口、后台项目增删改、视频/封面上传和删除二次确认均已实现。
- 后台项目管理标题栏布局已修复：标题保持单行，操作按钮按内容自适应宽度，窄屏时按钮可换行。
- 项目内容同步机制已修复：后台保存、上传或删除后会刷新 `ContentContext`，前端路由切换时重新拉取项目数据；动态请求禁用 HTTP 缓存。
- 个人优势模块已完成：`strengths` 表、公开优势接口、后台优势增删改和排序、前端优势页动态读取均已实现；`resume.js` 优势保留为静态兜底和初始种子。
- 站点基础内容模块已完成：`site_content` 表、公开读取接口、后台内容管理、Hero/身份联系/经历动态展示均已实现；后台保存后会同步刷新前端内容上下文。
- 公网部署适配已完成：支持持久化 `DB_DIR`/`UPLOAD_DIR`、受限 `CORS_ORIGIN`、`/api/health` 健康检查，并新增 Nginx 反向代理示例。
- 公网配置模拟验证完成：允许来源返回 CORS 许可头，不允许来源不返回许可头，健康检查返回 200；前端构建和 SQLite 数据检查通过。
- 导航栏品牌图标已完成：使用不含字母的芯片与电路走线 SVG，替换原 `LH` 文字标记，并保留响应式尺寸与悬停反馈。
- 前端 `ContentProvider` 已接管项目列表和详情数据；`resume.js` 保留静态兜底和初始种子，老项目未上传封面时继续使用 SVG 封面。
- 访客留言页已实现，独立保存访客留言并支持回复。
- 登录 / 注册页已实现。
- `AuthContext` 登录态管理已实现。
- 个人资料、头像上传、密码修改已实现。
- Express API 已实现认证、资料、留言和后台管理接口。
- SQLite `users`、`guestbook_comments`、`project_comments` 表已建立。
- 评论模型已重构：访客留言与项目评论分表保存，项目评论通过 `parent_id` 支持任意层级回复。
- 旧 `comments` 表已删除，本地 2 条旧留言已迁入 `guestbook_comments`，当前不再保留 `comments_legacy`。
- 评论接口已拆分为 `/api/guestbook-comments` 和 `/api/projects/:projectId/comments`，公开接口不再返回 `email` 与 `user_id`。
- 评论表已增加 `root_id`：新评论自动继承所属顶层线程，历史数据在启动时回填，公开接口同时返回 `root_id`。
- 评论头像已改为动态读取 `users.avatar` 并渲染真实图片；未上传头像时保留昵称首字兜底，上传新头像后旧评论也会同步更新。
- 用户页面已改名为账号设置，主路由为 `/settings`，旧 `/profile` 自动重定向；账号设置不再展示用户个人签名，后端也不再更新 `users.bio`。
- 管理后台评论列表已区分访客留言和项目评论来源，删除评论会连同子回复一起删除。
- 管理后台已实现评论管理和用户管理。
- `memory-bank/` 项目上下文文档已建立。
- 文档同步规则已写入 `AGENTS.md` 和 `TASKS.md`，项目变化必须同步维护 `memory-bank/`。
- 已明确三份核心文档定位：`ARCHITECTURE.md` 为项目结构说明，`TASKS.md` 为开发任务清单，`PROGRESS.md` 为当前进度记录。
- 上传 Gitee 前的安全与仓库整理已完成：新增 `.gitignore`、`README.md`、`server/.env.example`，关闭 Vite 自动打开浏览器，移除默认 JWT 密钥和管理员默认弱密码。
- 上传前验证已完成：`server/server.js` 和 `server/db.js` 语法检查通过，`npm run build` 构建成功；构建提示 `MCU3D` chunk 超过 500KB，已保留在性能优化任务中。
- 本地仓库首次提交已创建，当前等待配置 Gitee 远程仓库地址。
- Gitee 远程仓库已配置为 `https://gitee.com/soft-hardli/my-blog.git`，`master` 分支已推送并建立跟踪关系。
- 登录 / 注册页的密码显示切换按钮已从文字改为眼睛图标，并保留无障碍标签和悬停提示。
- 本地 API 环境已创建 `server/.env` 并配置随机 `JWT_SECRET`，新版访客留言和项目评论接口已启动验证。
- 项目评论已用临时测试账号完成三层回复链路验证，测试账号和测试评论已清理。
- 评论重构后已完成 `node --check`、`npm run build`、SQLite `integrity_check` 和 `foreign_key_check` 验证，结果均通过。
- 已用临时测试账号验证三层项目评论写入后 `root_id` 都指向同一顶层评论，测试数据已清理。
- 品牌图标成品稿已完成：新增 `public/brand-icon.svg`，以圆角方形芯片为主体，融合 die 方块、四向走线、45° 拐角、信号节点与红色焦点，深色底板适配导航栏和收藏栏场景；尚未替换导航 `BrandMark` 组件和站点 favicon。
- 站点品牌图标已替换为新版：导航 `BrandMark` 改用与 `public/brand-icon.svg` 一致的芯片设计（viewBox 256、自带深色底板），`nav-mark` 容器移除红色渐变底色、改为细高光描边与红色光晕悬停反馈，`index.html` 新增 SVG favicon；`npm run build` 验证通过，`MCU3D` 体积提示为既有已知问题。
- 个人介绍页 LH 徽章动效已完成：新增 `src/components/CoinBadge.jsx`（rAF 状态机：悬停匀速 3D 翻转、移出平滑回正、点击从当前角度快速旋转两圈并精确回正，重复点击无缝接管，遵循 `prefers-reduced-motion`）；圆形徽章已从 `public/portrait.svg` 拆为独立图层叠加在头像卡上，背景图保留网格与底部文字；`npm run build` 验证通过。
- LH 徽章立体化重构完成：背景图更名为 `public/portrait-bg.svg` 并更新 `Experience.jsx` 引用，解决浏览器旧缓存中静态徽章与新徽章重叠的问题；`CoinBadge` 重构为双面硬币结构（正面 LH、背面芯片纹样，`backface-visibility` 双面切换），中间层可见厚度边缘，地面投影随旋转角度实时变化；动效只作用于单一 `div` 合成层，修复直接对 SVG 做 3D 变换导致的上下抖动；`npm run build` 验证通过。
- 头像卡景深背景已完成：`Experience.jsx` 新增三层焦外图层（远景 blur 14px / 中景 8px / 近景 3px 的信号光斑与走线，共 7 个光斑 3 条走线）与硬币后聚焦光晕，鼠标在卡内移动时按层距产生 4~13px 视差（CSS 变量驱动 + transform 过渡），`prefers-reduced-motion` 下视差禁用；`npm run build` 验证通过。
- 头像卡背景方案已重做（焦外光斑方案弃用）：平面网格升级为一点透视 3D 网格空间——`.portrait-space` 以 `perspective-origin: 50% 39%` 将灭点对齐硬币中心，地板/天花板两组网格平面（rotateX 78 度）向观者缓慢流动（9s/格，reduced-motion 下停止），硬币正后方为细网格后墙与红色环境光；背景图更名为 `public/portrait-room.svg` 并移除其中平面网格，相关视差与光斑代码已清理；`npm run build` 验证通过。
- 头像卡空间升级为方形隧道：新增左右两组网格墙（rotateY 78 度，向灭点收缩并与地板/天花板合围），在 translateZ -60/-140/-200 处放置三重递缩方形线框，后墙改为 translateZ -260 的红色描边方形网格面板（70% 宽、30px 细格、半透明深色底），硬币仍居中于方形空间灭点；`npm run build` 验证通过。
- 头像卡空间按用户反馈重做为方形凹腔（网格隧道方案弃用）：移除全部网格线、流动动画与递缩线框，改为矩形正面挖出 82% 宽方形开口（细描边切口 + 外侧柔影），四壁为真实 90 度 3D 光影渐变平面（rotateX/rotateY -90/90 度，靠近切口微亮、深处渐隐），腔底 translateZ -220 深色方形背板 + 46% 宽红色微光晕；硬币从 70% 缩至 64% 居中悬浮于腔内，透视原点保持对齐硬币中心；`npm run build` 验证通过。
- 凹腔已扩充至整个矩形卡片：移除中部方形切口与 `.space-rim`，卡片自身边框成为切口边缘，四壁（rotateX/rotateY 90 度平面）从卡片四边向内收缩至透视灭点；背板改为 `inset: 0` 的整幅深色面板（translateZ -220），红色环境光圆心对齐硬币中心；`portrait-media` 改用 CSS 渐变作底，`public/portrait-room.svg` 已删除，底部装饰文字随背景图一并移除（姓名信息仍由动态 `portrait-meta` 承担）；`npm run build` 验证通过。
- 修复头像卡整体不显示的问题：上一步删除 `.portrait-media` 内的 `<img>` 后，容器失去唯一的高度来源（剩余子元素均为绝对定位），高度塌陷为 0；已为 `.portrait-media` 补充 `width: 100%` 与 `aspect-ratio: 4 / 5`，并清理失效的 `.portrait-media img` 规则；`npm run build` 验证通过，根因已记录到 `LEARNINGS.md`。
- 硬币位置与交互升级完成：硬币下移至 `top: 48%` 并以 `translateZ(-120px)` 深入腔体（与四壁共享 `.portrait-media` 的 460px 透视，视觉中心约落在 46%），宽度调整为 78% 以补偿透视缩放；悬停区域扩大到整块头像卡，`CoinBadge` 新增 `regionRef`，按鼠标位于硬币中心左/右决定旋转方向（左区向右转、右区向左转）；新增指针拖动旋转（0.6 度/像素，指针捕获、4px 阈值区分拖动与点击），松手后缓动回正且不误触发点击快转；`npm run build` 验证通过。
- 硬币深度感与表面 3D 化完成：硬币增加 7° 俯仰角（`rotateX(7deg)`），表面新增左上高光、右下暗部、116° 斜向反光带与内圈倒角阴影（`.coin-face::after`），不再呈现为与屏幕平行的贴片；原贴身投影移除，改为落在腔体地板的压缩投影（`.space-floor-shadow`，位于 `rotateX(-90deg)` 的地板平面内、深度 118px）；四壁渐变提亮到 0.10~0.11、淡出延至 72%，腔体轮廓更明确；鼠标移动时四壁与硬币按远近产生视差（场景 -8px、硬币 -3.5px，CSS 变量 + transform 过渡驱动）；正面 ONLINE 状态点与标签改为沿硬币内圈公转（16s/圈，标签反向旋转保持水平，reduced-motion 下停止）；`npm run build` 验证通过。
- 个人介绍页硬币替换为 three.js 真实金属硬币：新增 `src/components/Portrait3D.jsx`（@react-three/fiber），用程序化环境贴图产生真实镜面反射、LatheGeometry 圆角倒角，交互为「悬停上半上仰/下半下俯、悬停左右持续旋转、鼠标拖拽跟随旋转、移出回正」，反光质感对齐 Hero PCB 的 PBR 材质；`CoinBadge` 的 CSS 假高光方案弃用；`npm run build` 与 `wrangler` 无关，前端构建通过。
- 部署方案确定为 **GitHub + Cloudflare**：前端 Cloudflare Pages，后端 Cloudflare Workers + Hono + D1 + KV（全免费，KV 免费）。
- 后端从 Node/Express/SQLite 重写为 **Cloudflare Workers + Hono + D1 + KV**，接口与前端一一对齐（30+ 接口）：新增 `worker/schema.sql`、`worker/wrangler.toml`、`worker/src/index.js`、`worker/src/password.js`（PBKDF2，规避 Workers 免费版 10ms CPU 限制）；`wrangler deploy --dry-run` 打包成功。
- 后端模块化：`worker/src/index.js` 拆为 `src/lib/`（util、seed、auth）与 `src/routes/`（auth、profile、public、admin、media），入口统一挂载。
- 一键切换后端：新增 `scripts/backend.mjs`（检测 `server/` 用 Node、否则用 Worker，可用 `BACKEND` 强制）与 `scripts/dev.mjs`（同时启动后端与前端）；`vite.config.js` 自动读取检测结果设置 `/api` 代理端口；`package.json` 新增 `start`、`backend` 脚本。
- Node 后端归档：`server/` 完整复制到桌面 `OwnerWeb-backend-node/`（含 README，保留可回放），并从项目移除；同时移除失效的 CloudBase 容器文件 `Dockerfile`、`.dockerignore`。
- 敏感信息清理与 GitHub 推送：确认无硬编码密钥、历史未提交过 `.env`；完善 `.gitignore`（忽略 `.env`、`worker/.dev.vars`、`worker/.wrangler`、`worker/node_modules` 等）；`worker/wrangler.toml` 移除管理员邮箱，改由 secret 注入；`origin` 指向 GitHub（Gitee 保留为 `gitee`），`master` 已推送。
- README 已重写并推送：技术栈、项目结构、本地一键开发、环境变量与密钥、GitHub + Cloudflare 部署、文档索引。
- Cloudflare Worker 本地联调跑通：`wrangler dev`（本地模拟 D1/KV）+ `wrangler d1 execute --local --file=schema.sql` 初始化；验证通过 `/api/health`、`/api/content/site`、`/api/projects`（2 个）、`/api/strengths`（6 条）、邮箱注册、管理员登录、访客留言写入、管理员删除留言、用户列表；前端 `http://localhost:5173` 经 Vite 代理 `/api` 到 Worker 返回正常。
- 修复 Hono v4 鉴权缺陷：`jwtVerify` 需显式传 `'HS256'`，否则所有带 token 请求统一 401（详见 `LEARNINGS.md`）。
- 隐私与配置集中化：新增 `.env.local`（gitignore）与模板 `.env.local.example`；`scripts/gen-config.mjs`（`npm run config`）据 `.env.local` 生成 `worker/wrangler.toml`、`worker/.dev.vars`、`worker/.secrets.json`；`npm run start` 自动先执行 config；`worker/wrangler.toml` 不再纳入版本管理（保留 `.example`）；移除多余的 `.env.production`（Vite 会自动读取 `.env.local` 的 `VITE_` 变量）。
- 留言/评论展示优化：`CommentThread` 改为「顶层评论 + 其下全部回复扁平到同一缩进层级」，回复只缩进一次、更深层级不再叠加缩进，每条非顶层评论标注「回复 @谁」；留言列在桌面端居中（`.guestbook-col`，820px），分隔线改为整列宽（`.comment-thread` 底边线）；修复原先评论集中在左侧、分隔线只到页面中部的问题。后端 `root_id` 归组已联调验证。
- 分隔线补全：回复缩进由 `margin-left` 改为 `padding-left`，使两条评论之间的虚线铺满整列；项目详情页内容统一为居中列（`.project-detail` 960px），「核心实现」与「项目留言」之间的实线铺满该列。
- 免卡部署调整（R2 → KV + 视频外链）：Cloudflare R2 需绑卡才能开通，改用 **Cloudflare KV** 存头像/项目封面（免卡、免费，经 `/media/*` 读取）；**项目视频改为外链**（B站/YouTube/直链），新增智能播放器 `src/components/ProjectVideo.jsx`（自动识别 B站/YouTube 页面链接转 iframe、直链用 `<video>`）；后台项目表单的视频由「上传」改为「链接输入」；后端移除视频上传接口与 R2 绑定，`wrangler.toml` 生成 `[[kv_namespaces]]`（`CF_KV_ID`）；本地 `wrangler dev` 验证头像上传与 `/media` 读取通过。
- 移动端适配与性能优化：Hero PCB 标签尺寸从 2x 缩到约 1.5x（平面 `2.9×0.70`）、板外标注外移避免与线端圆圈重叠；窄屏（aspect < 1.3）隐藏板外标注，并在 Hero 增加 `.hero-quicklinks` 按钮导航（精选项目/个人经历/个人优势/访客留言/联系我）；Aurora 限制 DPR ≤ 1.5 并在离开视口或页面后台时暂停，MCU3D 限制 DPR ≤ 1.75；手机端导航换行、搜索整行、隐藏品牌文字。
- 细节修复：「返回首页」箭头由文字 `←` 改为 SVG 图标并加悬停滑动；账号设置页 `.info-block` 内的 `.field` 补充 16px 下边距，修复保存按钮与输入框无间隔。
- 「联系我」渠道卡片悬停样式：边框与文字同时变红，并在文字下方滑入一条红色下划线（超链接风格）。
- 修复 Hero PCB 上 SMD 电阻抖动：电阻端帽与本体共面导致 z-fighting，已将端帽在 y/z 方向加大 0.02 消除共面；把嵌进电解电容圆柱的一颗电阻移到 `(4.6, 1.4)`；电阻整体抬高到丝印面之上（y=0.29），避免与板面/丝印面共面。
- 修复本地 D1 中文乱码：此前用 PowerShell `Invoke-RestMethod` 测试保存站点内容时，请求体按非 UTF-8 编码导致本地 `site_content` 中文变 mojibake；已用 Node（UTF-8）从 `resume.js` 重写回正确的 profile/hero/experience/contact（项目、优势、评论未受影响，生产 D1 未被触碰）。根因与教训已记入 `LEARNINGS.md`。
- 仓库托管平台可自主选填（`3.27`）：后台「身份与联系」新增 Gitee / GitHub / GitCode 三个复选框，勾选后填写用户名与链接；数据存 `profile.repos`，后端 `normalizeSiteContentInput` 增加平台白名单校验，前端「联系我」渠道与「个人经历」联系方式按已选平台动态渲染并支持点击跳转，兼容旧 `github/githubUrl` 数据。
- 「联系我」区块标题可编辑（`3.28`）：`site_content` 新增 `contact_json` 列（本地已迁移，线上待执行 `ALTER TABLE`），后台新增「联系我」编辑区块（大标题 + 小标签），前端联系区读取动态值并以 `resume.js` 默认文案兜底。

- 项目「仅登录用户可查看」（`3.29`）：`projects` 增加 `requires_login` 列；后台项目管理新增勾选框并在列表显示锁标识；公开项目接口使用可选登录中间件，未登录访客对受限项目只拿到锁定卡片（`locked: true`，正文/视频/仓库链接均不返回），详情接口对受限项目返回 `401`；前端 `ContentContext` 携带登录 token 拉取并在登录态变化时重取，锁定卡片显示「需登录」徽标，详情页显示登录引导。端到端验证通过（管理员开启 → 访客锁定 → 登录后完整 → 已还原）。
- 视频占位修复（`3.30`）：项目未填写视频链接时，详情页不再渲染视频区与「该项目还没有配置演示视频」占位块；填写链接后正常播放；对应 `.proj-video.no-video` 样式已移除。
- 修复 Hero PCB 拖动时标注被画布裁切：绕 Y 轴旋转时两侧标注会向外摆出画布边界被裁掉，已将宽屏相机取景宽度从 27 放宽到 32（`ResponsiveCamera`），为最坏约 35° 转角留出余量。
- 导航栏品牌区（图标 + 标题）点击返回首页：原来 `Link to="/"` 在已处于首页（已滚动）时不会回到顶部，改为携带 `state={{ scrollTo: '#top' }}`，复用 `Home` 的滚动逻辑，无论从其它页面还是首页内点击都能回到首页顶部。
- 手机端性能优化（`3.31`）：新增 `src/hooks/useRenderActive.js`（IntersectionObserver + visibilitychange，元素离屏或页面后台时把 `frameloop` 置为 `never` 暂停渲染）；Hero PCB（`MCU3D`）与个人介绍硬币（`Portrait3D`）在移动端把 DPR 上限降到 1.5、关闭抗锯齿，硬币几何分段 96→48；导航栏毛玻璃在窄屏（≤820px）模糊从 18px 降到 10px。

- 注册邮箱校验加强（`3.32`）：新增 `worker/src/lib/email.js` —— 严格格式校验（长度/本地部分/点规则/TLD）、常见拼写错误域名提示（`gmail.con` 等）、一次性邮箱域名黑名单、Cloudflare DNS-over-HTTPS 域名 MX 校验（无 MX 且无 A 兜底则拒绝；DNS 异常放行）；注册接口接入，登录邮箱做小写规范化；前端 `AuthPage` 增加即时格式校验。注意：本地网络无法访问外部 DoH，MX 校验需在线上验证。
- 首页 PCB「精选项目」定位修复（`3.33`）：`Home` 不再直接依赖浏览器 `scrollIntoView` 的默认对齐，而是根据目标区块位置、固定导航栏实际高度和间距计算滚动位置，确保跳转后精选项目区块从导航栏下方开始显示；同步更新 `DESIGN.md` 与 `TASKS.md`。
- 首页区块间距优化（`3.34`）：将通用 `.section` 上下内边距从 `clamp(96px, 12vw, 180px)` 收紧为 `clamp(64px, 7vw, 112px)`，减少经历、精选项目、个人优势等区块交界处的大面积空白，并同步适配移动端。
- 首页留白与 Hero 首屏布局优化（`3.35`）：进一步将通用区块上下内边距收紧为 `clamp(48px, 5vw, 88px)`；Hero 改为锁定首屏高度，PCB 模型和上下内边距按视口高度缩放，降低小屏最小模型高度，避免 Hero 内容被撑出首屏。
- PCB 热点按标题定位（`3.36`）：首页滚动逻辑改为查找目标区块内的 `.section-head`，联系区使用 `.contact-title`，不再按区块外层起始位置定位，确保标题落在固定导航栏下方。
- Hero 下滑提示（`3.37`）：在 Hero 副标题下增加可点击的「向下滑动查看更多」提示和动态箭头，点击后进入个人经历区块；已加入移动端间距和 `prefers-reduced-motion` 适配。
- Hero 下滑提示样式调整（`3.38`）：文案改为居中的红色 `SCROLL TO EXPLORE`，箭头移动到文字下方，并增加顶部间距使整体下移少许。

- 项目视频接入腾讯云 COS（`6.2`/`6.3`，待密钥验证）：新增 `worker/src/lib/cos.js`（COS PUT Object 预签名，HMAC-SHA1，签名 host）与接口 `POST /api/admin/projects/:id/video/sign`；后台项目编辑新增「上传视频到 COS」（XHR 直传 + 进度），上传后把 COS 直链写入 `video` 字段，保留手填外链；COS 配置（`COS_SECRET_ID`/`COS_SECRET_KEY`/`COS_BUCKET`/`COS_REGION`/`COS_VIDEO_PREFIX`/`COS_DOMAIN`）经 `.env.local` → `npm run config` 生成到 dev.vars/secrets；`DEPLOY.md` 增加 COS 控制台步骤（建桶公有读私有写、子账号密钥、CORS）。已 `wrangler secret bulk` + 部署 Worker。首次验证报 `403 SignatureDoesNotMatch`：经官方 `cos-nodejs-sdk-v5` 对齐确认**本项目签名与官方 SDK 逐字节一致**，判定为用户密钥不匹配；用户重填后本地 PUT/GET/DELETE 通过，但 Worker 仍 403——根因是误在 `worker/` 目录执行 `npm run config`（该目录无此脚本）导致 `.secrets.json` 未用新密钥重生成。在根目录重跑 `npm run config` → 上传 secrets → 部署后，端到端验证通过：**预签名 200 → 直传 200 → 公有读回读 200 → 删除 204**。

- 后台视频区提示：新项目未保存时，视频上传区域显示红色提示「新项目需要先『保存项目』，视频上传功能才会启用（上传接口要求项目已存在）」；`.editor-note.warn` 样式新增。

- 修复封面上传失败：`src/api.js` 之前只处理 JSON `body`，忽略了 `uploadProjectMedia` 传入的 `form`，导致 multipart 请求发出空 body，Worker 解析失败、前端只显示「请求失败」；已在 `api()` 增加 `form`（FormData）分支，不手动设 `Content-Type`（由浏览器补 boundary）。线上 `POST /api/admin/projects/:id/cover` 经 Pages 代理实测返回 200。

- 封面上传进度条：`services/projects.js` 新增 `uploadProjectCover`（XHR，可拿上传进度），后台「项目封面」区域新增进度条（`.upload-progress`），上传中显示百分比、成功后显示封面预览；视频上传同步加了同款进度条；封面上传在项目未保存时禁用。

- TASKS 核对与补齐（本轮）：逐项核对未完成任务并补齐——
  - `1.1` 统一错误格式（确认）、`1.6` 昵称（≤30 字）与头像（仅 PNG/JPG/WebP/GIF、≤2MB、base64 校验）后端校验。
  - `2.1`/`2.2`/`2.3` `/settings` 与 `/admin` 路由守卫 + 登录态 loading（未登录跳 `/auth`，非管理员无权）；`2.4` 后台删除评论/用户、封禁用户加行内二次确认；`2.5` 留言/用户列表/资料保存 loading；`2.6` 统一错误展示。
  - `3.1` 确认 `public/videos` 已不存在（改 COS/外链）；`3.2` 视频加载失败提示；`3.3`/`3.4` 移动端检查与后台表格；`3.5` 可访问性标签；`3.6` 动画性能与 reduced-motion。
  - `4.2` 新增 `scripts/test-api.mjs`（`npm run test:api`，线上 13/13 通过）；`4.3`/`4.4` 手工与生产验证。
  - `5.8`/`5.10` 部署与上线验证确认；`5.9` 环境变量已完成、自定义域名待备案。
  - `5.9` 已确认完成：`API_ORIGIN` 环境变量已配；自定义域名为可选项，决定继续使用免费的 `ownerweb.pages.dev`（长期有效、无需备案）。
- 评论分页与线程懒加载（`1.11`）：公开评论接口改为顶层评论 keyset 分页（`limit` 默认 10/上限 50、`cursor` 为上页最后 id，按 `id ASC`），返回 `{ comments, hasMore, nextCursor }`，每条顶层评论带 `replyCount`；新增 `GET /api/guestbook-comments/:rootId/replies` 与 `GET /api/projects/:projectId/comments/:rootId/replies` 按需加载整条线程；前端 `CommentThread` 改为「分页 + 查看 N 条回复/收起/加载更多评论」。线上验证通过（3 条顶层分两页、嵌套回复计数与懒加载正确，测试数据已清理）。TASKS 全部完成（`1.11` 为最后一项）。

- 文档：按当前线上版本重写 `memory-bank/PRD.md`——补充顶部导航（品牌图标 + Li的个人博客 + 站内搜索 + 后台入口 + 登录态/联系我）、首页五大区块与 3D PCB 热点、各一级页面与后台五个页签的布局，以及线上已实现能力（COS 视频、仓库平台选填、联系我标题可编辑、项目登录可见、评论分页与线程懒加载、邮箱 MX 校验、移动端优化）；「暂不做」移除分页、保留验证码/找回密码等。

## 进行中

- 项目进入「Cloudflare 上线」阶段：代码与配置已就绪，待用户创建 D1/KV、配置 secrets 并 `wrangler deploy`，以及创建 Pages 项目。
- 需要统一 API 响应格式和校验规则。
- 两套后端（Worker / Node）为同一套 API 的两种实现；本地用 `npm run start` 自动切换，线上以 Worker 为准。

## 待处理

见 `TASKS.md`。
