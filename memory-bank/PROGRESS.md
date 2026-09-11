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
- 部署方案确定为 **GitHub + Cloudflare**：前端 Cloudflare Pages，后端 Cloudflare Workers + Hono + D1 + R2（全免费，R2 免出网流量费）。
- 后端从 Node/Express/SQLite 重写为 **Cloudflare Workers + Hono + D1 + R2**，接口与前端一一对齐（30+ 接口）：新增 `worker/schema.sql`、`worker/wrangler.toml`、`worker/src/index.js`、`worker/src/password.js`（PBKDF2，规避 Workers 免费版 10ms CPU 限制）；`wrangler deploy --dry-run` 打包成功。
- 后端模块化：`worker/src/index.js` 拆为 `src/lib/`（util、seed、auth）与 `src/routes/`（auth、profile、public、admin、media），入口统一挂载。
- 一键切换后端：新增 `scripts/backend.mjs`（检测 `server/` 用 Node、否则用 Worker，可用 `BACKEND` 强制）与 `scripts/dev.mjs`（同时启动后端与前端）；`vite.config.js` 自动读取检测结果设置 `/api` 代理端口；`package.json` 新增 `start`、`backend` 脚本。
- Node 后端归档：`server/` 完整复制到桌面 `OwnerWeb-backend-node/`（含 README，保留可回放），并从项目移除；同时移除失效的 CloudBase 容器文件 `Dockerfile`、`.dockerignore`。
- 敏感信息清理与 GitHub 推送：确认无硬编码密钥、历史未提交过 `.env`；完善 `.gitignore`（忽略 `.env`、`worker/.dev.vars`、`worker/.wrangler`、`worker/node_modules` 等）；`worker/wrangler.toml` 移除管理员邮箱，改由 secret 注入；`origin` 指向 GitHub（Gitee 保留为 `gitee`），`master` 已推送。
- README 已重写并推送：技术栈、项目结构、本地一键开发、环境变量与密钥、GitHub + Cloudflare 部署、文档索引。
- Cloudflare Worker 本地联调跑通：`wrangler dev`（本地模拟 D1/R2）+ `wrangler d1 execute --local --file=schema.sql` 初始化；验证通过 `/api/health`、`/api/content/site`、`/api/projects`（2 个）、`/api/strengths`（6 条）、邮箱注册、管理员登录、访客留言写入、管理员删除留言、用户列表；前端 `http://localhost:5173` 经 Vite 代理 `/api` 到 Worker 返回正常。
- 修复 Hono v4 鉴权缺陷：`jwtVerify` 需显式传 `'HS256'`，否则所有带 token 请求统一 401（详见 `LEARNINGS.md`）。

## 进行中

- 项目进入「Cloudflare 上线」阶段：代码与配置已就绪，待用户创建 D1/R2、配置 secrets 并 `wrangler deploy`，以及创建 Pages 项目。
- 需要统一 API 响应格式和校验规则。
- 两套后端（Worker / Node）为同一套 API 的两种实现；本地用 `npm run start` 自动切换，线上以 Worker 为准。

## 待处理

见 `TASKS.md`。
