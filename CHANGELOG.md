# 更新记录

## 1.0.10

- **新增"浅底可读性"派生逻辑**（防御性）：若将来加入浅色调色板，文字/标签/品牌类 token 会自动换成
  同色相压暗档，保证与背景 ≥4.5:1；当前四套底（深海/午夜/墨黑/极地）都是深色，逻辑不触发、观感不变。
- 新增 `tests/contrast.mjs`（31 项）：遍历每个强调色 × 深海/墨黑两种底，验证文字 token 对比度 ≥4.5:1。
- 断言总数：31 + 18 + 9 + 31 + 6 = **95 项**。

## 1.0.9

- **修好"控制台看不到皮肤"这类竞态**：皮肤不再在加载瞬间判断"有没有控制台"，改为
  `ctx.inject(["uiSkinLoader"], cb)` **显式等待**服务出现 —— 控制台迟到一步也不会被误判成"没装"，仍会正常登记托管。
- **没装控制台也能用**：等待 3 秒宽限后进入自立模式，自动应用外观，设置面板照常可用。
- **新增「皮肤」选择器**（设置面板），第一项是 **「原生（默认观感）」= 还原默认皮肤**：
  - 有控制台 → `switchTo("default")`（与控制台"还原默认观感"同一路径，持久化归它）；
  - 自立模式 → 关掉自己（`enabled=false`），立即卸下、长期保持原生，随时可切回。
- 统一接口补充 `isActive()` / `mode`。
- 新增 `tests/console-wait.mjs`（18 项，含"控制台迟到不许误判"回归闸门）与
  `tests/skin-selector.mjs`（9 项）并接入 CI；当前断言总数 **64 项**。

## 1.0.5

- **补上"依赖皮肤加载器"这件事的可见性**。本皮肤是纯观感包，靠 `inject: ["uiSkinLoader", …]` 等待
  第三方皮肤加载器（参考实现 `@dsh-eac/ui-skin-loader`）下发 SkinContext。此前若安装者没装加载器，
  插件会**安静挂起**——不报错、也没效果，容易被误判成"装失败"。现在：
  - 宿主半新增**依赖自检**：启动后延迟 4 秒确认 `uiSkinLoader` 是否可用，缺失时打印可操作提示；
  - `package.json` 增加 `dsh.skin.requires` 元数据（服务名 + 参考实现 + 说明）；
  - README 增加「前置要求」小节（含"没装会怎样"的对照表）；安装脚本增加装载前预检；
  - 新增 `tests/dependency-check.mjs`（6 项断言：缺服务必警告 / 有服务保持安静 / `ctx.get` 亦识别 / 卸载后不再触发），并接入 CI。
- 说明：加载器是第三方插件、不随本包分发，也不写进 npm 依赖（它在 registry 上不存在，声明成 peer 反而会让安装失败）。

## 1.0.4

- **修：宿主把应用切到亮色时，深渊会被"污染"**。宿主的亮暗开关是 `body[data-ds-dark-theme]`，
  它自己会在主题切换时重写这个属性；深渊是纯暗色皮肤，此前只在激活时置位一次，
  被宿主摘掉后宿主 light 分支的 `--dsw-specific-*` 等 token 就会漏进来（表面变浅、字色错位）。
  现在加了 `MutationObserver` 盯住该属性并复位到皮肤的期望值，teardown 时断开。
- 新增端到端扫测覆盖该场景（模拟 `prefers-color-scheme: light`），22 项全过。

## 1.0.3

- **命名空间去个人化（破坏性变更）**：包名统一为 `dsh-skin-abyssal`，皮肤 id 统一为
  `skins.abyssal`，主题 id 为 `skins-theme-abyssal`，cordis 行 id 同步调整；作者、版权署名
  与文档里的本机绝对路径一并去个人化（旧值带个人标识，此处不再复述）。
  **升级需重装一次**并把 profile 里 `activeSkin` 改为 `skins.abyssal`（README 有步骤）。
- **修：主题重复注册会把整次激活回滚成默认皮肤**。皮肤被重新加载（模块重新求值）后，
  新实例会在旧实例尚未拆除时注册同名主题，宿主抛
  `theme "..." is already registered; rolled back to default`。
  现在注册走 `registerThemeSafe`：重复 id 时自动改用带序号的 id 兜底，激活不再整体失败。
- 新增该场景的回归测试（把 fake theme API 改成"重复 id 必须抛错"，并模拟皮肤重载后
  第二个实例激活）。断言数 30 → 31。

## 1.0.2

弹窗与表面可读性修复（在真实 DSH 页面上实测定位）。

- **弹窗不再透出正文**：宿主设置弹窗的面板用的是 `--dsw-alias-bg-layer-2`，此前为
  `rgba(24,32,44,.54)`（半透明）。现提升浮层类表面：`bg-layer-2 → .97`、`bg-layer-3 → .90`、
  `bg-overlay → .97`、`bg-module-platform → .86`、`bg-multi-select → .70`；
  页面底色（`bg-base .70`）与页内卡片（`bg-layer-1 .58 → .72`）保留玻璃感。
- **浮层实色兜底规则**：`[role="dialog"] / [aria-modal="true"] / [role="menu|listbox|tooltip"]`
  强制 `rgba(24,32,44,.97)` + `backdrop-filter: blur(22px)`，不依赖宿主继续用哪个 token。
- **补齐宿主 specific 表面层**：新增 `--dsw-specific-input-major`（输入框）、
  `--dsw-specific-selector` / `-tip` / `-bubble` / `-bubble-highlight` / `-menu` / `-login-input`、
  `--dsw-menu-surface-fill`、`--dsw-linear-gradient-think` / `--dsw-linear-think-select`。
  此前这些表面留着宿主原值（输入框在暗色下偏灰、菜单不透）。
- **驱动宿主亮暗开关**：激活时置 `body[data-ds-dark-theme]`，退出时按原状还原；
  避免宿主 light 分支的 `--dsw-specific-*` 定义漏进来。

## 1.0.1

- 修 `lib/client.js` 的 `SyntaxError: Unexpected token '+'`（计算属性名需 `[ "data-" + ID ]`）。
- 补 `registerSkin` 载荷缺的 `preview` 字段。

## 1.0.0

- 首个版本：4 底色 × 5 强调色 × 3 圆角密度 × 3 极光强度 + 胶片颗粒；
  `theme.overrideTokens` 承载观感，`settings.section` 席位挂外观面板；
  30 项浏览器断言全过（后续版本增至 31）。
