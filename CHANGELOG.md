# 更新记录

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
