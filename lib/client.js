/**
 * 深渊 ABYSSAL — DSH UI 皮肤（皮肤加载器公约 dsh.ecosystem.ui-skin-loader/v1）
 * ============================================================================
 *
 * 设计语言
 *   1. 单光源：整屏只有一组极光（左下强调色、右上靛紫、右下冷青），面板用半透明表面透出它。
 *   2. 发丝线分层：rgba(158,196,255,.10) 1px 描边 + 3% 白表面，不靠阴影堆叠。
 *   3. 强调色纪律：强调色只给「当前 / 可点 / 运行中」；成功/警告/危险保持独立语义色。
 *   4. 仪表感：元数据用等宽字体；数字 tabular。
 *
 * 生命周期纪律（公约 §4.3 / R8）
 *   - activate 里产生的每一项副作用都进 disposers，teardown 逆序撤销；
 *   - deactivate / skinCtx.signal abort / 皮肤 fiber 意外 dispose 三条路汇入同一个幂等 teardown；
 *   - 退出后逐像素不可观测：主题覆盖层 dispose、自有 style 节点移除、body 标记摘除、席位与订阅撤除。
 *   - 不读不写上游私有 DOM/class：只用自有 data-* 选择器 + 宿主公开的 --dsw-* 设计 token。
 *
 * 设置：皮肤自治（localStorage），改档即时重算 token 覆盖层 + 样式表，无需重载页面。
 */
window.__ModuleLoader__.load({
	id: "dsh-skin-abyssal",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		var React = require("react");

		//#region 身份
		var SKIN_ID = "skins.abyssal";
		var SKIN_NAME = "深渊";
		var THEME_ID = "skins-theme-abyssal";
		var CSS_PREFIX = "skn-abyssal";
		var BODY_ATTR = "data-skn-abyssal";
		var STYLE_ATTR = "data-skn-abyssal-style";
		var SECTION_ID = CSS_PREFIX + "-settings";
		var LOCALE_NS = "skn-abyssal";
		var STORAGE_KEY = "dsh.skin.abyssal.preferences.v1";

		/** 加载器控制台卡片用的内联预览（渐变 id 带 skn-abyssal 前缀，防文档级冲突）。 */
		var PREVIEW_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 180\" role=\"img\" aria-label=\"深渊\">"
			+ "<defs>"
			+ "<linearGradient id=\"skn-abyssal-pv-bg\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#080c12\"/><stop offset=\"1\" stop-color=\"#05070a\"/></linearGradient>"
			+ "<radialGradient id=\"skn-abyssal-pv-a\" cx=\".12\" cy=\"1\" r=\".7\"><stop offset=\"0\" stop-color=\"#4fe0be\" stop-opacity=\".34\"/><stop offset=\"1\" stop-color=\"#4fe0be\" stop-opacity=\"0\"/></radialGradient>"
			+ "<radialGradient id=\"skn-abyssal-pv-b\" cx=\".92\" cy=\"0\" r=\".6\"><stop offset=\"0\" stop-color=\"#8e86ff\" stop-opacity=\".3\"/><stop offset=\"1\" stop-color=\"#8e86ff\" stop-opacity=\"0\"/></radialGradient>"
			+ "</defs>"
			+ "<rect width=\"320\" height=\"180\" fill=\"url(#skn-abyssal-pv-bg)\"/>"
			+ "<rect width=\"320\" height=\"180\" fill=\"url(#skn-abyssal-pv-a)\"/>"
			+ "<rect width=\"320\" height=\"180\" fill=\"url(#skn-abyssal-pv-b)\"/>"
			+ "<rect x=\"0\" y=\"0\" width=\"86\" height=\"180\" fill=\"#0b1119\" opacity=\".72\"/>"
			+ "<rect x=\"85.5\" y=\"0\" width=\".8\" height=\"180\" fill=\"#9ec4ff\" opacity=\".12\"/>"
			+ "<rect x=\"8\" y=\"32\" width=\"70\" height=\"18\" rx=\"9\" fill=\"#4fe0be\" opacity=\".18\" stroke=\"#4fe0be\" stroke-opacity=\".45\"/>"
			+ "<rect x=\"8\" y=\"62\" width=\"70\" height=\"14\" rx=\"6\" fill=\"#4fe0be\" opacity=\".14\"/>"
			+ "<g fill=\"#9aa9b8\" opacity=\".55\"><rect x=\"14\" y=\"90\" width=\"52\" height=\"4\" rx=\"2\"/><rect x=\"14\" y=\"104\" width=\"60\" height=\"4\" rx=\"2\"/><rect x=\"14\" y=\"118\" width=\"44\" height=\"4\" rx=\"2\"/></g>"
			+ "<rect x=\"104\" y=\"48\" width=\"204\" height=\"24\" rx=\"10\" fill=\"#8e86ff\" opacity=\".1\"/>"
			+ "<rect x=\"110\" y=\"54\" width=\"2\" height=\"12\" rx=\"1\" fill=\"#8e86ff\" opacity=\".8\"/>"
			+ "<rect x=\"104\" y=\"80\" width=\"204\" height=\"22\" rx=\"9\" fill=\"#ffffff\" opacity=\".05\" stroke=\"#9ec4ff\" stroke-opacity=\".14\"/>"
			+ "<rect x=\"104\" y=\"108\" width=\"204\" height=\"22\" rx=\"9\" fill=\"#f5c97b\" opacity=\".08\" stroke=\"#f5c97b\" stroke-opacity=\".3\"/>"
			+ "<rect x=\"104\" y=\"142\" width=\"204\" height=\"22\" rx=\"9\" fill=\"#ffffff\" opacity=\".04\" stroke=\"#9ec4ff\" stroke-opacity=\".14\"/>"
			+ "<rect x=\"282\" y=\"145\" width=\"18\" height=\"16\" rx=\"7\" fill=\"#4fe0be\"/>"
			+ "<text x=\"160\" y=\"176\" text-anchor=\"middle\" font-family=\"sans-serif\" font-size=\"10\" letter-spacing=\".26em\" fill=\"#65747f\">ABYSSAL</text>"
			+ "</svg>";
		//#endregion

		//#region 预设：底色 / 强调色 / 圆角密度 / 极光强度
		var PALETTES = {
			abyss: { label: "深海", void: "#05070a", surface: "8,12,18", panel: "18,25,35", panel2: "24,32,44", hair: "158,196,255", ink: ["#e9eff5", "#9aa9b8", "#65747f", "#4a5761"], aurora: ["79,224,190", "142,134,255", "87,200,245"] },
			midnight: { label: "午夜", void: "#04060f", surface: "7,10,22", panel: "16,21,38", panel2: "22,28,48", hair: "150,170,255", ink: ["#e6ebff", "#9aa6cf", "#66708f", "#4a5270"], aurora: ["90,120,255", "142,134,255", "79,224,190"] },
			ink: { label: "墨黑", void: "#070708", surface: "11,12,14", panel: "20,21,24", panel2: "27,28,32", hair: "212,215,224", ink: ["#ecedf0", "#a3a7b0", "#6d717a", "#4d515a"], aurora: ["120,140,180", "150,160,180", "90,110,150"] },
			polar: { label: "极地", void: "#04090c", surface: "7,13,17", panel: "14,23,28", panel2: "20,31,37", hair: "140,220,220", ink: ["#e6f2f2", "#96b0b2", "#617b7d", "#455c5e"], aurora: ["90,220,210", "120,190,255", "79,224,190"] },
		};
		var ACCENTS = {
			mint: { label: "薄荷绿", c: "#4fe0be", hi: "#8ff5dd", lo: "#2fae93", rgb: "79,224,190" },
			cyan: { label: "冷青", c: "#57c8f5", hi: "#9be0ff", lo: "#2f9bc9", rgb: "87,200,245" },
			violet: { label: "靛紫", c: "#8e86ff", hi: "#c0bbff", lo: "#6a61d8", rgb: "142,134,255" },
			amber: { label: "琥珀", c: "#f5c97b", hi: "#ffe6b8", lo: "#c99a4a", rgb: "245,201,123" },
			coral: { label: "珊瑚", c: "#ff8fa6", hi: "#ffc2ce", lo: "#d95f78", rgb: "255,143,166" },
		};
		var RADII = {
			soft: { label: "柔", xs: "6px", sm: "10px", md: "14px", lg: "18px", xl: "22px", panel: "30px" },
			balanced: { label: "均衡", xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "20px", panel: "28px" },
			tight: { label: "紧", xs: "3px", sm: "6px", md: "9px", lg: "12px", xl: "14px", panel: "18px" },
		};
		var GLOWS = {
			strong: { label: "强", k: 1.45 },
			soft: { label: "柔", k: 1.0 },
			off: { label: "关", k: 0 },
		};
		var SUCCESS = "79,214,160";
		var WARN = "245,201,123";
		var WARN_HEX = "#f5c97b";
		var DANGER = "255,126,157";
		var INFO = "87,200,245";
		var DEFAULTS = { enabled: true, palette: "abyss", accent: "mint", radius: "soft", glow: "soft", grain: true };
		//#endregion

		//#region 颜色工具 + token 表
		function rgba(rgb, a) { return "rgba(" + rgb + "," + a + ")"; }
		function hexRgb(hex) {
			var h = String(hex).replace("#", "");
			var full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h;
			var n = parseInt(full, 16);
			return ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255);
		}
		function toTriplet(color) { var t = String(color); return t.indexOf(",") >= 0 ? t : hexRgb(t); }
		function mix(a, b, t) {
			var x = toTriplet(a).split(",").map(Number);
			var y = toTriplet(b).split(",").map(Number);
			return "#" + x.map(function (v, i) { return Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0"); }).join("");
		}
		function shade(hex, toHex, amount) { return mix(hex, toHex, amount); }

		/** 宿主大量组件直读中性灰阶（--dsw-static-neutral(-bluish)-*），不重映射会留原生灰。 */
		function neutralRamp(p) {
			var ink1 = p.ink[0], ink2 = p.ink[1], ink3 = p.ink[2];
			var steps = {
				"1000": p.void,
				"950": mix(p.surface, p.void, 0.35),
				"900": mix(p.surface, p.panel, 0.12),
				"875": mix(p.surface, p.panel, 0.45),
				"850": mix(p.panel, p.panel2, 0.35),
				"800": p.panel,
				"750": mix(p.panel, p.panel2, 0.8),
				"700": mix(p.panel2, ink3, 0.45),
				"600": mix(p.panel2, ink3, 0.82),
				"500": mix(ink3, ink2, 0.45),
				"400": mix(ink3, ink2, 0.85),
				"300": ink2,
				"200": mix(ink2, ink1, 0.5),
				"150": mix(ink2, ink1, 0.8),
				"100": ink1,
				"75": mix(ink1, "#ffffff", 0.35),
				"60": mix(ink1, "#ffffff", 0.55),
				"50": mix(ink1, "#ffffff", 0.7),
				"00": "#ffffff",
			};
			var out = {};
			Object.keys(steps).forEach(function (step) {
				out["--dsw-static-neutral-bluish-" + step] = steps[step];
				out["--dsw-static-neutral-" + step] = steps[step];
			});
			return out;
		}

		/** 一整套 token 覆盖（键 = 完整 CSS 变量名）。表面与前景成对给出，避免对比度反转。 */
		function tokenTable(p, a, r) {
			var deep = shade(a.c, p.void, 0.72);
			var table = Object.assign({
				// 表面：半透明是玻璃拟态的关键
				"--dsw-alias-bg-base": rgba(p.surface, 0.7),
				"--dsw-alias-bg-layer-1": rgba(p.panel, 0.72),
				"--dsw-alias-bg-layer-2": rgba(p.panel2, 0.97),   // 弹窗/浮层面板：必须够实，否则正文透上来
				"--dsw-alias-bg-layer-3": rgba(p.panel2, 0.9),
				"--dsw-alias-bg-overlay": rgba(p.surface, 0.97),
				"--dsw-alias-bg-module-platform": rgba(p.panel, 0.86),
				"--dsw-alias-bg-multi-select": rgba(p.panel2, 0.7),
				"--dsw-alias-bg-skeleton": rgba("255,255,255", 0.05),
				"--dsw-alias-bg-mask-1": rgba("0,0,0", 0.22),
				"--dsw-alias-bg-mask-2": rgba("0,0,0", 0.12),
				"--dsw-alias-bg-mask-3": rgba("0,0,0", 0.46),
				"--dsw-alias-bg-document-preview": rgba(p.panel2, 0.6),
				"--dsw-alias-bg-document-selection": rgba(a.rgb, 0.22),
				// 边界
				"--dsw-alias-border-l1": rgba(p.hair, 0.1),
				"--dsw-alias-border-l2": rgba(p.hair, 0.16),
				"--dsw-alias-border-l3": rgba(p.hair, 0.24),
				"--dsw-alias-border-l4": rgba(p.hair, 0.32),
				"--dsw-alias-border-l2-darkmode-thin": rgba(p.hair, 0.14),
				"--dsw-alias-border-inverted": rgba(p.hair, 0.3),
				"--dsw-alias-border-inverted2": rgba(p.hair, 0.18),
				"--dsw-alias-settings-card-stroke": rgba(p.hair, 0.12),
				"--dsw-alias-settings-card-fill": rgba("255,255,255", 0.05),
				// 文字与品牌
				"--dsw-alias-label-primary": p.ink[0],
				"--dsw-alias-label-primary-foreground": p.void,
				"--dsw-alias-label-primary-inverted": p.void,
				"--dsw-alias-label-primary-bluish": shade(a.hi, p.ink[0], 0.55),
				"--dsw-alias-label-primary-dimmed": rgba(hexRgb(p.ink[0]), 0.62),
				"--dsw-alias-label-secondary": p.ink[1],
				"--dsw-alias-label-tertiary": p.ink[2],
				"--dsw-alias-label-caption": p.ink[3],
				"--dsw-alias-label-dimmed": p.ink[2],
				"--dsw-alias-label-deep-diving": a.hi,
				"--dsw-alias-brand-primary": a.c,
				"--dsw-alias-brand-primary-invert": p.void,
				"--dsw-alias-brand-text": a.hi,
				"--dsw-alias-link": a.c,
				// 交互面
				"--dsw-alias-interactive-bg-hover": rgba(p.hair, 0.07),
				"--dsw-alias-interactive-bg-active": rgba(p.hair, 0.11),
				"--dsw-alias-interactive-bg-hover-accent": rgba(a.rgb, 0.14),
				"--dsw-alias-interactive-bg-hover-danger": rgba(DANGER, 0.14),
				"--dsw-alias-interactive-bg-hover-solid": rgba("255,255,255", 0.08),
				// 按钮
				"--dsw-alias-button-primary-fill": a.c,
				"--dsw-alias-button-primary-hover": a.hi,
				"--dsw-alias-button-primary-dimmed": rgba(a.rgb, 0.42),
				"--dsw-alias-button-elevated-fill": rgba("255,255,255", 0.07),
				"--dsw-alias-button-floating-fill": rgba(p.panel2, 0.92),
				"--dsw-alias-button-floating-hover": rgba(p.panel2, 0.98),
				"--dsw-alias-button-ghost-active-fill": rgba(p.hair, 0.1),
				"--dsw-alias-button-ghost-active-border": rgba(a.rgb, 0.36),
				"--dsw-alias-button-ghost-active-hover": rgba(p.hair, 0.14),
				"--dsw-alias-button-info-fill": a.c,
				"--dsw-alias-button-info-hover": a.hi,
				"--dsw-alias-button-tool-bar-fill": rgba("255,255,255", 0.05),
				"--dsw-alias-button-tool-bar-fill-invisible": "transparent",
				"--dsw-alias-button-tool-bar-hover": rgba("255,255,255", 0.09),
				"--dsw-alias-button-contrast-fill": rgba(hexRgb(p.ink[0]), 0.92),
				// 状态语义
				"--dsw-alias-state-success-primary": rgba(SUCCESS, 0.95),
				"--dsw-alias-state-success-secondary": rgba(SUCCESS, 0.5),
				"--dsw-alias-state-success-tertiary": rgba(SUCCESS, 0.16),
				"--dsw-alias-state-error-primary": rgba(DANGER, 0.95),
				"--dsw-alias-state-error-secondary": rgba(DANGER, 0.5),
				"--dsw-alias-state-warn-primary": rgba(WARN, 0.95),
				"--dsw-alias-state-warn-secondary": rgba(WARN, 0.5),
				"--dsw-alias-state-warn-tertiary": rgba(WARN, 0.16),
				"--dsw-alias-state-warn-label": shade(WARN_HEX, p.ink[0], 0.35),
				"--dsw-alias-state-business-primary": rgba(INFO, 0.9),
				"--dsw-alias-state-business-tertiary": rgba(INFO, 0.16),
				"--dsw-alias-state-idle-primary": p.ink[2],
				// 代码与 diff
				"--dsw-alias-code-diff-added": rgba(SUCCESS, 0.16),
				"--dsw-alias-code-diff-deleted": rgba(DANGER, 0.16),
				"--dsw-alias-file-diff-added-bg": rgba(SUCCESS, 0.1),
				"--dsw-alias-file-diff-added-gutter": rgba(SUCCESS, 0.2),
				"--dsw-alias-file-diff-added-marker": rgba(SUCCESS, 0.85),
				"--dsw-alias-file-diff-deleted-bg": rgba(DANGER, 0.1),
				"--dsw-alias-file-diff-deleted-gutter": rgba(DANGER, 0.2),
				"--dsw-alias-file-diff-deleted-marker": rgba(DANGER, 0.85),
				// Markdown
				"--dsw-alias-markdown-code-block": rgba("3,5,9", 0.62),
				"--dsw-alias-markdown-code-block-banner": rgba("255,255,255", 0.035),
				"--dsw-alias-markdown-inline-code": rgba(a.rgb, 0.1),
				"--dsw-alias-markdown-tag": rgba(a.rgb, 0.14),
				"--dsw-alias-markdown-citation": rgba(a.rgb, 0.85),
				"--dsw-alias-markdown-placeholder": p.ink[3],
				"--dsw-alias-markdown-code-segment-selected": rgba(a.rgb, 0.2),
				"--dsw-alias-markdown-code-segment-unselected": rgba(p.hair, 0.08),
				// 菜单 / 提示 / 开关
				"--dsw-alias-menu-group-header-fill": rgba("255,255,255", 0.03),
				"--dsw-alias-menu-icon": p.ink[1],
				"--dsw-alias-tooltip-bg": rgba(p.surface, 0.96),
				"--dsw-alias-tooltip-key-bg": rgba("255,255,255", 0.08),
				"--dsw-alias-toast-bg": rgba(p.panel, 0.95),
				"--dsw-alias-toast-label": p.ink[0],
				"--dsw-alias-switch-thumb": p.ink[0],
				"--dsw-alias-turn-trigger-bg": rgba("255,255,255", 0.05),
				"--dsw-alias-turn-trigger-bg-hover": rgba(p.hair, 0.1),
				"--dsw-alias-onboarding-accent": a.c,
				"--dsw-alias-onboarding-card-fill": rgba("255,255,255", 0.04),
				"--dsw-alias-onboarding-secondary-fill": rgba("255,255,255", 0.06),
				"--dsw-alias-onboarding-checkbox-border": rgba(p.hair, 0.28),
				// 滚动条
				"--dsw-alias-scrollbar-bg-l1": rgba(p.hair, 0.07),
				"--dsw-alias-scrollbar-bg-l2": rgba(p.hair, 0.1),
				"--dsw-alias-scrollbar-hover-l1": rgba(a.rgb, 0.3),
				"--dsw-alias-scrollbar-hover-l2": rgba(a.rgb, 0.38),
				// 侧栏（specific 层）
				"--dsw-specific-sidebar-fill": rgba(p.panel, 0.62),
				"--dsw-specific-sidebar-nav-item-active": rgba(a.rgb, 0.16),
				"--dsw-specific-sidebar-nav-item-hover": rgba(p.hair, 0.1),
				"--dsw-specific-sidebar-nav-item-active-accent": rgba(a.rgb, 0.45),
				// 其它 specific 表面 + 菜单 + 思考条渐变（不覆盖会留在宿主的 scheme 分支里）
				"--dsw-specific-input-major": rgba(p.panel, 0.72),
				"--dsw-specific-selector": rgba(p.panel, 0.6),
				"--dsw-specific-tip": rgba(a.rgb, 0.14),
				"--dsw-specific-bubble": rgba(a.rgb, 0.12),
				"--dsw-specific-bubble-highlight": rgba(a.rgb, 0.22),
				"--dsw-specific-menu": rgba(p.panel2, 0.94),
				"--dsw-specific-login-input": rgba(p.panel, 0.7),
				"--dsw-menu-surface-fill": rgba(p.panel2, 0.94),
				"--dsw-linear-gradient-think": "linear-gradient(180deg," + rgba(p.panel, 0.9) + " 20.19%," + rgba(p.panel, 0) + " 100%)",
				"--dsw-linear-think-select": "linear-gradient(180deg," + rgba(p.panel, 0.9) + " 20.19%," + rgba(p.panel, 0) + " 100%)",
				// 圆角密度
				"--dsw-radius-xs": r.xs,
				"--dsw-radius-sm": r.sm,
				"--dsw-radius-md": r.md,
				"--dsw-radius-lg": r.lg,
				"--dsw-radius-xl": r.xl,
				"--dsw-radius-panel": r.panel,
				// 静态色阶跟随强调色（宿主 color-mix 焦点环等会读）
				"--dsw-static-blue-50": rgba(a.rgb, 0.08),
				"--dsw-static-blue-100": rgba(a.rgb, 0.14),
				"--dsw-static-blue-300": rgba(a.rgb, 0.34),
				"--dsw-static-blue-400": rgba(a.rgb, 0.6),
				"--dsw-static-blue-450": a.c,
				"--dsw-static-blue-500": a.c,
				"--dsw-static-blue-600": shade(a.c, "#000000", 0.18),
				"--dsw-static-blue-800": deep,
				"--dsw-static-blue-900": shade(a.c, p.void, 0.82),
				"--dsw-static-deepseek-100": rgba(a.rgb, 0.14),
				"--dsw-static-deepseek-200": rgba(a.rgb, 0.22),
				"--dsw-static-deepseek-300": rgba(a.rgb, 0.34),
				"--dsw-static-deepseek-400": rgba(a.rgb, 0.6),
				"--dsw-static-deepseek-450": a.c,
				"--dsw-static-deepseek-500": a.c,
				"--dsw-static-deepseek-600": shade(a.c, "#000000", 0.18),
				"--dsw-static-deepseek-800": deep,
				"--dsw-static-deepseek-900": shade(a.c, p.void, 0.82),
			}, neutralRamp(p));
			return table;
		}

		function overrideTable(table) {
			var out = {};
			Object.keys(table).forEach(function (name) { out[name] = { light: table[name], dark: table[name] }; });
			return out;
		}
		//#endregion

		//#region 样式表组装
		var GRAIN_URI = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E"
			+ "%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E"
			+ "%3Crect width='160' height='160' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E\")";

		function bodyBackground(p, a, g, grain) {
			var k = g.k, layers = [], sizes = [];
			if (k > 0) {
				layers.push(
					"radial-gradient(1200px 700px at 10% 98%, " + rgba(a.rgb, (0.30 * k).toFixed(3)) + ", transparent 62%)",
					"radial-gradient(1000px 640px at 94% 4%, " + rgba(p.aurora[1], (0.26 * k).toFixed(3)) + ", transparent 60%)",
					"radial-gradient(920px 560px at 76% 104%, " + rgba(p.aurora[2], (0.19 * k).toFixed(3)) + ", transparent 62%)",
					"radial-gradient(1100px 420px at 50% -12%, " + rgba(p.aurora[0], (0.10 * k).toFixed(3)) + ", transparent 68%)");
				sizes.push("auto", "auto", "auto", "auto");
			}
			layers.push("linear-gradient(180deg, " + rgba(p.surface, 0.35) + " 0%, " + rgba(hexRgb(p.void), 0.1) + " 40%, " + rgba(p.surface, 0.5) + " 100%)");
			sizes.push("auto");
			if (grain) { layers.push(GRAIN_URI); sizes.push("160px 160px"); }
			return [
				"background-color:" + p.void,
				"background-image:" + layers.join(","),
				"background-size:" + sizes.join(","),
				"background-repeat:" + sizes.map(function () { return "no-repeat"; }).join(","),
				"background-attachment:fixed",
			].join(";");
		}

		function chromeCss(p, a) {
			return [
				"body[" + BODY_ATTR + "]{color-scheme:dark;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}",
				"body[" + BODY_ATTR + "] ::selection{background:" + rgba(a.rgb, 0.28) + ";color:" + p.ink[0] + "}",
				"body[" + BODY_ATTR + "] ::-webkit-scrollbar{width:10px;height:10px}",
				"body[" + BODY_ATTR + "] ::-webkit-scrollbar-track{background:transparent}",
				"body[" + BODY_ATTR + "] ::-webkit-scrollbar-thumb{background:" + rgba(p.hair, 0.1) + ";border:3px solid transparent;background-clip:padding-box;border-radius:999px}",
				"body[" + BODY_ATTR + "] ::-webkit-scrollbar-thumb:hover{background:" + rgba(a.rgb, 0.4) + ";background-clip:padding-box}",
				"body[" + BODY_ATTR + "] ::-webkit-scrollbar-corner{background:transparent}",
				"body[" + BODY_ATTR + "] [role=\"dialog\"],body[" + BODY_ATTR + "] [aria-modal=\"true\"]{background-color:" + rgba(p.panel2, 0.97) + "!important;backdrop-filter:blur(22px) saturate(1.15);-webkit-backdrop-filter:blur(22px) saturate(1.15)}",
			].join("");
		}

		/** 皮肤设置面板（settings.section 席位）的样式。 */
		function sectionCss(p, a) {
			var s = "[" + SECTION_ID + "]";
			return [
				"[data-" + SECTION_ID + "]{display:flex;flex-direction:column;gap:10px;max-width:620px}",
				"[data-" + SECTION_ID + "] h3{margin:0;font-size:15px;font-weight:600;color:" + p.ink[0] + "}",
				"[data-" + SECTION_ID + "] p{margin:0;font-size:12px;line-height:1.6;color:" + p.ink[2] + "}",
				"[data-" + SECTION_ID + "] ." + CSS_PREFIX + "-row{display:flex;align-items:center;gap:12px;padding:9px 0;border-top:1px solid " + rgba(p.hair, 0.12) + "}",
				"[data-" + SECTION_ID + "] ." + CSS_PREFIX + "-rowText{flex:1;min-width:0}",
				"[data-" + SECTION_ID + "] ." + CSS_PREFIX + "-label{font-size:13px;color:" + p.ink[0] + "}",
				"[data-" + SECTION_ID + "] ." + CSS_PREFIX + "-desc{font-size:11px;line-height:1.5;color:" + p.ink[2] + ";margin-top:2px}",
				"[data-" + SECTION_ID + "] select{min-width:104px;padding:6px 10px;border-radius:" + "10px" + ";font-size:13px;color:" + p.ink[0] + ";background:" + rgba(p.panel2, 0.9) + ";border:1px solid " + rgba(p.hair, 0.2) + ";outline:none}",
				"[data-" + SECTION_ID + "] select:focus{border-color:" + rgba(a.rgb, 0.7) + "}",
				"[data-" + SECTION_ID + "] input[type=checkbox]{width:18px;height:18px;accent-color:" + a.c + "}",
				"[data-" + SECTION_ID + "] ." + CSS_PREFIX + "-actions{display:flex;gap:8px;padding-top:4px}",
				"[data-" + SECTION_ID + "] button{padding:7px 14px;border-radius:10px;font-size:13px;cursor:pointer;color:" + p.ink[0] + ";background:" + rgba(p.hair, 0.08) + ";border:1px solid " + rgba(p.hair, 0.2) + "}",
				"[data-" + SECTION_ID + "] button:hover{background:" + rgba(a.rgb, 0.16) + ";border-color:" + rgba(a.rgb, 0.45) + "}",
				"[data-" + SECTION_ID + "] ." + CSS_PREFIX + "-swatch{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:middle}",
			].join("");
		}

		function buildCss(state) {
			var p = PALETTES[state.palette], a = ACCENTS[state.accent], r = RADII[state.radius], g = GLOWS[state.glow];
			var table = tokenTable(p, a, r);
			var decls = Object.keys(table).map(function (name) { return name + ":" + table[name] + "!important"; }).join(";");
			return [
				"/* " + SKIN_NAME + " ABYSSAL — injected by activate(), removed by deactivate() */",
				"body[" + BODY_ATTR + "]{" + decls + ";" + bodyBackground(p, a, g, state.grain) + "}",
				chromeCss(p, a),
				sectionCss(p, a),
			].join("\n");
		}
		//#endregion

		//#region 设置存储（皮肤自治：localStorage + 订阅）
		function normalize(raw) {
			var src = raw && typeof raw === "object" ? raw : {};
			function pick(table, key, fallback) { return Object.prototype.hasOwnProperty.call(table, key) ? key : fallback; }
			return {
				palette: pick(PALETTES, src.palette, DEFAULTS.palette),
				accent: pick(ACCENTS, src.accent, DEFAULTS.accent),
				radius: pick(RADII, src.radius, DEFAULTS.radius),
				glow: pick(GLOWS, src.glow, DEFAULTS.glow),
				grain: src.grain === undefined ? DEFAULTS.grain : src.grain === true,
				enabled: src.enabled === undefined ? DEFAULTS.enabled : src.enabled === true,
			};
		}
		function readSettings() {
			try {
				var raw = window.localStorage.getItem(STORAGE_KEY);
				return normalize(raw ? JSON.parse(raw) : null);
			} catch (error) { return normalize(null); }
		}
		var settingsListeners = [];
		function emitSettings() {
			settingsListeners.slice().forEach(function (fn) { try { fn(); } catch (error) { /* 单个监听者出错不影响其它 */ } });
		}
		function writeSettings(patch) {
			var next = normalize(Object.assign({}, readSettings(), patch));
			try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (error) { /* 隐私模式等：内存值仍生效 */ }
			emitSettings();
			return next;
		}
		function subscribeSettings(fn) {
			settingsListeners.push(fn);
			return function () { settingsListeners = settingsListeners.filter(function (item) { return item !== fn; }); };
		}
		//#endregion


		/** 注册 locale + 「设置 → <皮肤>」席位（自立模式与加载器模式共用）。 */
		function registerSection(ctx, standalone) {
			// 立即注册（locale + 设置席位），返回一个幂等的拆卸函数
			var disposeLocale = ctx.locale.register(LOCALE_NS, LOCALE_DICTS);
			var t = ctx.locale.bind(LOCALE_NS);
			var disposeSeat = ctx.slots.inject("settings.section", function () {
				return ctx.slots.register(
					{ name: "settings.section", id: SECTION_ID, order: 92, label: function () { return t("nav.label"); } },
					createAppearanceSection(t, standalone));
			});
			return function () {
				try { disposeSeat(); } catch (error) { /* 忽略 */ }
				try { disposeLocale(); } catch (error) { /* 忽略 */ }
			};
		}

		//#region 激活会话
		/** 一次激活的全部副作用；teardown 幂等，可被 deactivate / abort / fiber dispose 三路触发。 */
		function createActivation(ctx) {
			var session = null;

			function activate(skinCtx) {
				if (session !== null) session.teardown();
				session = startSession(ctx, skinCtx);
			}
			function deactivate() {
				if (session !== null) { session.teardown(); session = null; }
			}
			// fiber 意外 dispose 的安全网（R8）
			ctx.effect(function () { return function () { deactivate(); }; }, "skn-abyssal: session safety net");
			return { activate: activate, deactivate: deactivate, isActive: function () { return session !== null; } };
		}

		/** theme.register 对重复 id 会抛错。上一次 activate 若没清理干净，
		 *  这里换一个带序号的 id 兜底，避免整次激活被宿主回滚成 default。 */
		var themeSeq = 0;
		function registerThemeSafe(ctx, def) {
			try {
				return ctx.theme.register(def);
			} catch (error) {
				themeSeq += 1;
				return ctx.theme.register(Object.assign({}, def, { id: def.id + "-" + themeSeq }));
			}
		}


		function startSession(ctx, skinCtx) {
			var dom = document;
			var torn = false;
			var disposers = [];
			var state = readSettings();
			skinCtx.logger.info("abyssal: activating", { skin: SKIN_ID, settings: state });
			// 深渊是纯暗色皮肤：驱动宿主的亮暗开关，避免宿主的 light 分支 token 漏进来。
			// 宿主在主题切换时会自己重写这个属性（实测：应用切到亮色它会摘掉），
			// 所以还要盯着它并复位，否则 light 分支的 --dsw-specific-* 会漏进来。
			var hadDarkAttr = dom.body.hasAttribute("data-ds-dark-theme");
			dom.body.setAttribute("data-ds-dark-theme", "");
			var darkGuard = new MutationObserver(function () {
				if (!dom.body.hasAttribute("data-ds-dark-theme")) dom.body.setAttribute("data-ds-dark-theme", "");
			});
			darkGuard.observe(dom.body, { attributes: true, attributeFilter: ["data-ds-dark-theme"] });
			disposers.push(function () { darkGuard.disconnect(); });
			dom.body.setAttribute(BODY_ATTR, "");

			// 1) 主题：注册自有主题（携带当前档位的 token）+ 叠 token 覆盖层（观感的实际承载）
			var table = tokenTable(PALETTES[state.palette], ACCENTS[state.accent], RADII[state.radius]);
			var disposeTheme, disposeOverride;
			try {
				disposeTheme = registerThemeSafe(ctx, { id: THEME_ID, colorScheme: "dark", tokens: table });
				disposeOverride = ctx.theme.overrideTokens(SKIN_ID, overrideTable(table));
			} catch (error) {
				if (disposeTheme) disposeTheme();
				dom.body.removeAttribute(BODY_ATTR);
				if (!hadDarkAttr) dom.body.removeAttribute("data-ds-dark-theme");
				throw error;
			}
			disposers.push(disposeTheme, disposeOverride);

			// 2) 自有 style 节点
			var styleNode = dom.createElement("style");
			styleNode.setAttribute(STYLE_ATTR, "");
			styleNode.textContent = buildCss(state);
			dom.head.appendChild(styleNode);
			disposers.push(function () { styleNode.remove(); });

			// 3) 设置订阅：改档即时重算（覆盖层同 source 再调 = 替换该层）
			var offSettings = subscribeSettings(function () {
				if (torn) return;
				state = readSettings();
				var nextTable = tokenTable(PALETTES[state.palette], ACCENTS[state.accent], RADII[state.radius]);
				try {
					ctx.theme.overrideTokens(SKIN_ID, overrideTable(nextTable));
				} catch (error) {
					skinCtx.logger.warn("abyssal: token override failed", { error: String(error) });
				}
				styleNode.textContent = buildCss(state);
				skinCtx.logger.debug("abyssal: appearance updated", state);
			});
			disposers.push(offSettings);

			// 跨标签页同步
			var onStorage = function (event) { if (event.key === STORAGE_KEY) emitSettings(); };
			window.addEventListener("storage", onStorage);
			disposers.push(function () { window.removeEventListener("storage", onStorage); });

			// 4) locale + 设置席位 —— 自立模式下由 apply 层注册（否则关掉开关就再也开不回来）
			if (skinCtx.standalone !== true) {
				disposers.push(registerSection(ctx, false));
			}

			var onAbort = function () { teardown(); };
			skinCtx.signal.addEventListener("abort", onAbort);

			function teardown() {
				if (torn) return;
				torn = true;
				skinCtx.signal.removeEventListener("abort", onAbort);
				for (var i = disposers.length - 1; i >= 0; i--) {
					try { disposers[i](); } catch (error) { skinCtx.logger.warn("abyssal: teardown step failed", { error: String(error) }); }
				}
				dom.body.removeAttribute(BODY_ATTR);
				skinCtx.logger.info("abyssal: deactivated — all side effects unwound");
			}
			return { teardown: teardown };
		}
		//#endregion

		//#region 设置面板组件
		var LOCALE_DICTS = {
			zh: {
				"settings.restore": "还原原生皮肤",
				"settings.restore.desc": "立即卸下本皮肤并恢复宿主原生外观。装了控制台时，同时请它把当前皮肤切回「默认观感」。",
				"settings.enabled": "启用本皮肤",
				"settings.enabled.desc": "当前以自立模式运行（未检测到皮肤控制台）。关闭后立即恢复原生界面，可随时再打开。",
				"settings.taken": "另一款自立皮肤正在运行",
				"settings.taken.desc": "%s 正占用自立模式。点右侧按钮改用它，页面会刷新。",
				"settings.switch": "改用本皮肤",
				"nav.label": "深渊",
				"settings.title": "深渊 ABYSSAL",
				"settings.desc": "深海底玻璃拟态：整屏只有一组极光作光源，面板半透明透出它；圆角密度直接覆盖宿主的 --dsw-radius-*，全应用一起变。",
				"settings.palette": "底色",
				"settings.palette.desc": "整片海底的基调，决定表面、发丝线与文字色阶。",
				"settings.accent": "强调色",
				"settings.accent.desc": "只给「当前 / 可点 / 运行中」用的生物荧光色。",
				"settings.radius": "圆角密度",
				"settings.radius.desc": "柔＝玻璃卡片感，均衡＝宿主原生，紧＝工具面板感。",
				"settings.glow": "背景极光",
				"settings.glow.desc": "单光源的强弱；关掉即纯色深海底（更冷静、也更省电）。",
				"settings.grain": "胶片颗粒",
				"settings.grain.desc": "消除大面积渐变的色带，让深色更「实」。",
				"settings.reset": "恢复默认观感",
			},
			en: {
				"settings.restore": "Restore native look",
				"settings.restore.desc": "Remove this skin immediately and go back to the host's built-in appearance. With a skin console installed, it is asked to switch back to the default look too.",
				"settings.enabled": "Enable this skin",
				"settings.enabled.desc": "Running standalone (no skin console detected). Turn off to restore the native UI instantly.",
				"settings.taken": "Another standalone skin is active",
				"settings.taken.desc": "%s holds standalone mode. Use the button to take over; the page reloads.",
				"settings.switch": "Use this skin",
				"nav.label": "ABYSSAL",
				"settings.title": "ABYSSAL",
				"settings.desc": "Deep-sea glass: one bioluminescent light source behind translucent surfaces. Corner radius overrides the host's --dsw-radius-*, so the whole app follows.",
				"settings.palette": "Palette",
				"settings.palette.desc": "The seabed tone: surfaces, hairlines and the text ramp.",
				"settings.accent": "Accent",
				"settings.accent.desc": "Reserved for current / clickable / running states.",
				"settings.radius": "Corner radius",
				"settings.radius.desc": "Soft = glass cards, Balanced = host native, Tight = tool panels.",
				"settings.glow": "Aurora",
				"settings.glow.desc": "Strength of the single light source; off = plain deep sea.",
				"settings.grain": "Film grain",
				"settings.grain.desc": "Removes banding in large dark gradients.",
				"settings.reset": "Reset appearance",
			},
		};

		var OPTION_TABLES = { palette: PALETTES, accent: ACCENTS, radius: RADII, glow: GLOWS };

		/** 档位说明的中文/英文 key。 */
		var ROW_DEFS = [
			{ key: "palette", labelKey: "settings.palette", descKey: "settings.palette.desc" },
			{ key: "accent", labelKey: "settings.accent", descKey: "settings.accent.desc" },
			{ key: "radius", labelKey: "settings.radius", descKey: "settings.radius.desc" },
			{ key: "glow", labelKey: "settings.glow", descKey: "settings.glow.desc" },
		];


		/** 「还原原生皮肤」行：两种模式都显示。 */
		function buildRestoreRow(t) {
			return React.createElement("div", { className: CSS_PREFIX + "-row", key: "restore-native" },
				React.createElement("div", { className: CSS_PREFIX + "-rowText" },
					React.createElement("div", { className: CSS_PREFIX + "-label" }, t("settings.restore")),
					React.createElement("div", { className: CSS_PREFIX + "-desc" }, t("settings.restore.desc"))),
				React.createElement("button", {
					type: "button",
					onClick: function () { restoreNative(); },
				}, t("settings.restore")));
		}

		/** 自立模式专属行：启用开关；若被别的自立皮肤占用则给接管按钮。 */
		function buildStandaloneRows(state, setState, t) {
			var owner = readStandaloneOwner();
			if (owner !== "" && owner !== SKIN_ID) {
				return React.createElement("div", { className: CSS_PREFIX + "-row", key: "standalone-taken" },
					React.createElement("div", { className: CSS_PREFIX + "-rowText" },
						React.createElement("div", { className: CSS_PREFIX + "-label" }, t("settings.taken")),
						React.createElement("div", { className: CSS_PREFIX + "-desc" }, String(t("settings.taken.desc")).split("%s").join(owner))),
					React.createElement("button", {
						type: "button",
						onClick: function () { writeStandaloneOwner(SKIN_ID); window.location.reload(); },
					}, t("settings.switch")));
			}
			return React.createElement("div", { className: CSS_PREFIX + "-row", key: "standalone-enabled" },
				React.createElement("div", { className: CSS_PREFIX + "-rowText" },
					React.createElement("div", { className: CSS_PREFIX + "-label" }, t("settings.enabled")),
					React.createElement("div", { className: CSS_PREFIX + "-desc" }, t("settings.enabled.desc"))),
				React.createElement("input", {
					type: "checkbox",
					checked: state.enabled !== false,
					"aria-label": t("settings.enabled"),
					onChange: function (event) { setState(writeSettings({ enabled: event.target.checked })); },
				}));
		}

		function createAppearanceSection(t, standalone) {
			return function AbyssalAppearanceSection() {
				var statePair = React.useState(readSettings);
				var state = statePair[0], setState = statePair[1];
				React.useEffect(function () {
					var off = subscribeSettings(function () { setState(readSettings()); });
					return off;
				}, []);

				var rows = ROW_DEFS.map(function (def) {
					var table = OPTION_TABLES[def.key];
					var options = Object.keys(table).map(function (value) {
						return React.createElement("option", { key: value, value: value }, table[value].label);
					});
					return React.createElement("div", { className: CSS_PREFIX + "-row", key: def.key },
						React.createElement("div", { className: CSS_PREFIX + "-rowText" },
							React.createElement("div", { className: CSS_PREFIX + "-label" }, t(def.labelKey)),
							React.createElement("div", { className: CSS_PREFIX + "-desc" }, t(def.descKey))),
						React.createElement("select", {
							value: state[def.key],
							"aria-label": t(def.labelKey),
							onChange: function (event) {
								var patch = {}; patch[def.key] = event.target.value; setState(writeSettings(patch));
							},
						}, options));
				});

				var grainRow = React.createElement("div", { className: CSS_PREFIX + "-row", key: "grain" },
					React.createElement("div", { className: CSS_PREFIX + "-rowText" },
						React.createElement("div", { className: CSS_PREFIX + "-label" }, t("settings.grain")),
						React.createElement("div", { className: CSS_PREFIX + "-desc" }, t("settings.grain.desc"))),
					React.createElement("input", {
						type: "checkbox",
						checked: state.grain === true,
						"aria-label": t("settings.grain"),
						onChange: function (event) { setState(writeSettings({ grain: event.target.checked })); },
					}));

				var standaloneRows = standalone === true ? buildStandaloneRows(state, setState, t) : null;
				var restoreRow = buildRestoreRow(t);

				var reset = React.createElement("div", { className: CSS_PREFIX + "-actions" },
					React.createElement("button", {
						type: "button",
						onClick: function () { setState(writeSettings(DEFAULTS)); },
					}, t("settings.reset")));

				return React.createElement("div", { ["data-" + SECTION_ID]: "" },
					React.createElement("h3", null, t("settings.title")),
					React.createElement("p", null, t("settings.desc")),
					rows,
					grainRow,
					standaloneRows,
					restoreRow,
					reset);
			};
		}
		//#endregion

		//#region 皮肤登记：有控制台则登记托管，无控制台则自立运行
		exports.inject = ["theme", "slots", "locale"]; // 不再要求 uiSkinLoader：没有它也能用


		var STANDALONE_OWNER_KEY = "dsh.skin.standalone.owner.v1";
		function readStandaloneOwner() {
			try { return window.localStorage.getItem(STANDALONE_OWNER_KEY) || ""; } catch (error) { return ""; }
		}
		function writeStandaloneOwner(id) {
			try { window.localStorage.setItem(STANDALONE_OWNER_KEY, id); } catch (error) { /* 隐私模式：忽略 */ }
		}

		/** 找控制台：直接属性或 ctx.get 都认；都没有就自立运行。 */
		function findConsole(ctx) {
			try {
				var direct = ctx.uiSkinLoader;
				if (direct && typeof direct.registerSkin === "function") return direct;
				var viaGet = ctx.get ? ctx.get("uiSkinLoader") : null;
				if (viaGet && typeof viaGet.registerSkin === "function") return viaGet;
			} catch (error) { /* 服务不可用 → 自立 */ }
			return null;
		}

		/** 统一对外接口：window.__dshSkins[<skinId>]，控制台或脚本都能驱动。 */
		function exposeSkinApi(api) {
			var bag = window.__dshSkins;
			if (!bag || typeof bag !== "object") { bag = {}; window.__dshSkins = bag; }
			bag[SKIN_ID] = api;
			return function () { try { if (bag[SKIN_ID] === api) delete bag[SKIN_ID]; } catch (error) { /* 忽略 */ } };
		}

		/** 自立模式下的 SkinContext 替身（加载器不在时自己造一个）。 */
		function standaloneSkinContext(ctx) {
			return { logger: ctx.logger || console, signal: new AbortController().signal, slots: ctx.slots, standalone: true };
		}

		/** 由 apply 注入的「还原原生皮肤」实现；未激活时为空。 */
		var restoreNativeImpl = null;
		function restoreNative() {
			if (typeof restoreNativeImpl !== "function") return null;
			try { return restoreNativeImpl(); } catch (error) { return null; }
		}

		exports.apply = function apply(ctx) {
			var activation = createActivation(ctx);
			var disposers = [];
			var consoleApi = findConsole(ctx);

			// 「还原原生皮肤」：控制台模式请它切回 default（持久化归它），自立模式关开关
			restoreNativeImpl = function () {
				if (consoleApi !== null) {
					try { activation.deactivate(); } catch (error) { /* 忽略 */ }
					writeSettings({ enabled: true });
					try {
						if (typeof consoleApi.switchTo === "function") return consoleApi.switchTo("default");
					} catch (error) { /* 控制台不支持切换：已本地卸下 */ }
					return null;
				}
				writeSettings({ enabled: false });
				try { activation.deactivate(); } catch (error) { /* 忽略 */ }
				return null;
			};

			var payload = {
				apiVersion: "dsh.ecosystem.ui-skin-loader/v1",
				id: SKIN_ID,
				name: SKIN_NAME,
				version: "1.0.7",
				author: "tenebris173",
					description: "近黑深海底 + 单一生物荧光光源 + 只透光不加厚边的玻璃；底色 / 强调色 / 圆角密度 / 极光强度均可切换。",
					tags: ["dark", "glassmorphism", "deep-sea", "switchable"],
					settingsHint: "设置 → 皮肤 → 深渊 → 外观",
				preview: PREVIEW_SVG,
				activate: function (skinCtx) { activation.activate(skinCtx); },
				deactivate: function () { activation.deactivate(); },
			};

			if (consoleApi !== null) {
				// —— 有控制台：登记托管（互斥切换 / 卡片墙 / 持久化都由它负责）——
				disposers.push(consoleApi.registerSkin(payload));
				disposers.push(exposeSkinApi({
					mode: "console", skinId: SKIN_ID, version: "1.0.7",
					activate: function (skinCtx) { activation.activate(skinCtx || standaloneSkinContext(ctx)); },
					deactivate: function () { activation.deactivate(); },
					isActive: function () { return activation.isActive(); },
					getSettings: readSettings,
					setSettings: writeSettings,
					restoreNative: restoreNative,
				}));
			} else {
				// —— 无控制台：自立运行 ——
				var session = null;
				var sync = function () {
					var owner = readStandaloneOwner();
					if (owner !== "" && owner !== SKIN_ID) {
						// 已被另一款自立皮肤占用：不抢（面板里给接管按钮）
						if (session !== null) { session.teardown(); session = null; }
						return;
					}
					if (owner === "") writeStandaloneOwner(SKIN_ID);
					var want = readSettings().enabled !== false;
					if (want && session === null) session = startSession(ctx, standaloneSkinContext(ctx));
					else if (!want && session !== null) { session.teardown(); session = null; }
				};
				disposers.push(registerSection(ctx, true));
				sync();
				disposers.push(subscribeSettings(sync));
				var onOwnerChange = function (event) { if (event.key === STANDALONE_OWNER_KEY) sync(); };
				window.addEventListener("storage", onOwnerChange);
				disposers.push(function () { window.removeEventListener("storage", onOwnerChange); });
				disposers.push(function () { if (session !== null) { session.teardown(); session = null; } });
				disposers.push(exposeSkinApi({
					mode: "standalone", skinId: SKIN_ID, version: "1.0.7",
					activate: function () { writeStandaloneOwner(SKIN_ID); sync(); },
					deactivate: function () { if (session !== null) { session.teardown(); session = null; } },
					isActive: function () { return session !== null; },
					getSettings: readSettings,
					setSettings: writeSettings,
					restoreNative: restoreNative,
				}));
			}

			ctx.effect(function () {
				return function () {
					for (var i = disposers.length - 1; i >= 0; i--) {
						try { disposers[i](); } catch (error) { /* 单步失败不影响其余清理 */ }
					}
					restoreNativeImpl = null;
				};
			}, "skn-abyssal: dispose registration + standalone session");
		};
		//#endregion

		return module.exports;
	},
});
