/**
 * ABYSSAL（皮肤加载器版）集成冒烟测试 —— 在真实浏览器引擎里跑真实 bundle。
 *
 * 覆盖：模块外壳 → apply 登记皮肤 → activate 注入样式/主题/席位 →
 *       真实 CSS 层叠是否生效（getComputedStyle）→ 改档即时重算 → teardown 净场。
 *
 * 前置：Chrome 已用 --remote-debugging-port=9222 启动。
 * 用法：node tests/browser-smoke.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import http from 'node:http'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const bundle = readFileSync(process.env.SKIN_BUNDLE ?? path.join(here, '..', 'lib', 'client.js'), 'utf8')

// about:blank 是 opaque origin，localStorage 会 Access denied —— 用一个最小静态页建立真实源
const server = http.createServer((req, res) => {
  res.setHeader('content-type', 'text/html; charset=utf-8')
  res.end('<!doctype html><html lang="zh"><head><meta charset="utf-8"><title>abyssal-test</title></head><body></body></html>')
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}/`

const target = await (await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' })).json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
let seq = 0
const pending = new Map()
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id) }
})
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
const send = (method, params = {}) => new Promise((resolve) => {
  const id = ++seq; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params }))
})
const evaluate = async (expression) => {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (res.result?.exceptionDetails) {
    return { __exception: res.result.exceptionDetails.exception?.description ?? JSON.stringify(res.result.exceptionDetails).slice(0, 400) }
  }
  return res.result?.result?.value
}

await send('Page.enable')
await send('Runtime.enable')
await send('Page.navigate', { url: origin })
await new Promise((r) => setTimeout(r, 500))

// ---------- 1) 装模块外壳 + 假 React，然后加载真实 bundle ----------
const HARNESS = String.raw`
window.__calls = {
  effects: [], liveThemes: {}, themeRegisterIds: [], themeRegister: null, overrideCalls: 0, overrideSource: null, overrideCount: 0,
  slotsRegistered: [], slotInjectKeys: [], locale: null, registered: null,
  themeDisposed: false, overrideDisposed: false, unregistered: false,
};
window.__fakeReact = {
  createElement: function (type, props) { return { type: type, props: props || {}, children: [].slice.call(arguments, 2) }; },
  useState: function (init) { return [typeof init === 'function' ? init() : init, function () {}]; },
  useEffect: function () {},
};
window.__loaded = {};
window.__ModuleLoader__ = {
  load: function (bundle) {
    var requireShim = function (name) {
      if (name === 'react') return window.__fakeReact;
      if (name === 'react/jsx-runtime') return { jsx: function () { return null; }, jsxs: function () { return null; } };
      throw new Error('unexpected external: ' + name);
    };
    var exported = bundle.factory(requireShim);
    window.__loaded[bundle.id] = exported;
  },
};
true`

const HARNESS2 = String.raw`
(function () {
  var c = window.__calls;
  var liveThemes = c.liveThemes;
  var skinId = 'skins.abyssal';
  var ctx = {
    effect: function (fn, label) { c.effects.push(label); var d = typeof fn === 'function' ? fn() : undefined; return function () { if (typeof d === 'function') d(); }; },
    theme: {
      register: function (def) {
        // 忠实模拟宿主：同一个 theme id 重复注册会抛错（真机上会把整次激活回滚成 default）
        if (liveThemes[def.id]) throw new Error('theme "' + def.id + '" is already registered');
        liveThemes[def.id] = true;
        c.themeRegister = { id: def.id, colorScheme: def.colorScheme, tokens: Object.keys(def.tokens).length };
        c.themeRegisterIds.push(def.id);
        return function () { delete liveThemes[def.id]; c.themeDisposed = true; };
      },
      overrideTokens: function (source, table) { c.overrideCalls++; c.overrideSource = source; c.overrideCount = Object.keys(table).length; c.lastTable = table; return function () { c.overrideDisposed = true; }; },
    },
    slots: {
      inject: function (key, cb) { c.slotInjectKeys.push(key); cb(); return function () {}; },
      register: function (opts, comp) { c.slotsRegistered.push({ name: opts.name, id: opts.id, order: opts.order, label: typeof opts.label === 'function' ? opts.label() : opts.label }); c.component = comp; return function () {}; },
    },
    locale: {
      register: function (ns, dicts) { c.locale = { ns: ns, zh: Object.keys(dicts.zh).length, en: Object.keys(dicts.en).length }; return function () {}; },
      bind: function () { return function (key) { return key; }; },
    },
    uiSkinLoader: { registerSkin: function (reg) { c.registered = reg; return function () { c.unregistered = true; }; } },
  };
  var mod = window.__loaded['dsh-skin-abyssal'];
  mod.apply(ctx);

  var logs = [];
  var skinCtx = {
    logger: { debug: function () {}, info: function (m) { logs.push(m); }, warn: function (m, d) { logs.push('warn:' + m + JSON.stringify(d || {})); }, error: function () {} },
    signal: new AbortController().signal,
    slots: ctx.slots,
  };
  c.registered.activate(skinCtx);

  var styleNode = document.querySelector('style[data-skn-abyssal-style]');
  var cs = getComputedStyle(document.body);
  var afterActivate = {
    inject: mod.inject,
    register: { apiVersion: c.registered.apiVersion, id: c.registered.id, name: c.registered.name, hasActivate: typeof c.registered.activate === 'function', hasDeactivate: typeof c.registered.deactivate === 'function', preview: typeof c.registered.preview, tags: c.registered.tags },
    bodyAttr: document.body.getAttribute('data-skn-abyssal'),
    styleNode: !!styleNode,
    cssLen: styleNode ? styleNode.textContent.length : 0,
    themeRegister: c.themeRegister,
    override: { calls: c.overrideCalls, source: c.overrideSource, tokens: c.overrideCount },
    slots: c.slotsRegistered,
    slotInjectKeys: c.slotInjectKeys,
    locale: c.locale,
    effects: c.effects.length,
    computed: {
      brand: cs.getPropertyValue('--dsw-alias-brand-primary').trim(),
      radiusMd: cs.getPropertyValue('--dsw-radius-md').trim(),
      bgBase: cs.getPropertyValue('--dsw-alias-bg-base').trim(),
      sidebarFill: cs.getPropertyValue('--dsw-specific-sidebar-fill').trim(),
      neutral900: cs.getPropertyValue('--dsw-static-neutral-bluish-900').trim(),
      bodyBgImage: cs.backgroundImage.slice(0, 70),
      bodyBgColor: cs.backgroundColor,
    },
    settingsSectionRendered: !!(c.component && c.component()),
  };

  // 改档：localStorage + storage 事件（模拟另一标签页/面板写入）
  localStorage.setItem('dsh.skin.abyssal.preferences.v1', JSON.stringify({ palette: 'polar', accent: 'violet', radius: 'tight', glow: 'off', grain: false }));
  window.dispatchEvent(new StorageEvent('storage', { key: 'dsh.skin.abyssal.preferences.v1' }));
  var cs2 = getComputedStyle(document.body);
  var afterSwitch = {
    overrideCalls: c.overrideCalls,
    brand: cs2.getPropertyValue('--dsw-alias-brand-primary').trim(),
    radiusMd: cs2.getPropertyValue('--dsw-radius-md').trim(),
    bgBase: cs2.getPropertyValue('--dsw-alias-bg-base').trim(),
    bodyBgImage: cs2.backgroundImage.slice(0, 70),
    grainGone: styleNode ? styleNode.textContent.indexOf('feTurbulence') < 0 : null,
  };

  // 真机上的失败场景：皮肤被重新加载（模块重新求值），新实例在老实例还没拆掉时激活 ——
  // 此时 theme id 已被占用，宿主会抛错并把整次激活回滚成 default。这里必须靠兜底活下来。
  var retry = { threw: null, ids: [], active: false };
  var retryReg = null;
  var origRegisterSkin = ctx.uiSkinLoader.registerSkin;
  ctx.uiSkinLoader.registerSkin = function (reg) { retryReg = reg; return function () {}; };
  mod.apply(ctx);
  ctx.uiSkinLoader.registerSkin = origRegisterSkin;
  try {
    retryReg.activate(skinCtx);
  } catch (error) {
    retry.threw = String(error && error.message || error);
  }
  retry.ids = c.themeRegisterIds.slice();
  retry.active = !!document.querySelector('style[data-skn-abyssal-style]') && document.body.getAttribute('data-skn-abyssal') === '';
  retryReg.deactivate();

  c.registered.deactivate();
  var cs3 = getComputedStyle(document.body);
  var afterTeardown = {
    bodyAttr: document.body.getAttribute('data-skn-abyssal'),
    styleNode: !!document.querySelector('style[data-skn-abyssal-style]'),
    themeDisposed: c.themeDisposed,
    overrideDisposed: c.overrideDisposed,
    radiusMd: cs3.getPropertyValue('--dsw-radius-md').trim(),
    brand: cs3.getPropertyValue('--dsw-alias-brand-primary').trim(),
    logs: logs,
  };
  return JSON.stringify({ afterActivate: afterActivate, afterSwitch: afterSwitch, retry: retry, afterTeardown: afterTeardown });
})()`

await evaluate(HARNESS)
const loadResult = await evaluate(bundle)
if (loadResult && loadResult.__exception) { console.log('bundle 加载异常:', loadResult.__exception); process.exit(1) }

const raw = await evaluate(HARNESS2)
if (typeof raw !== 'string') { console.log('测试执行失败:', JSON.stringify(raw)); process.exit(1) }
const r = JSON.parse(raw)

let failures = 0
const tight = (value) => String(value).replace(/\s+/g, '')
const check = (name, cond, extra = '') => {
  if (cond) console.log('  ok   ' + name)
  else { failures++; console.log('  FAIL ' + name + (extra ? ' :: ' + extra : '')) }
}

console.log('皮肤登记')
check('导出 inject 服务清单', Array.isArray(r.afterActivate.inject) && r.afterActivate.inject.length === 4, JSON.stringify(r.afterActivate.inject))
check('apiVersion 匹配公约', r.afterActivate.register.apiVersion === 'dsh.ecosystem.ui-skin-loader/v1')
check('id / name 正确', r.afterActivate.register.id === 'skins.abyssal' && r.afterActivate.register.name === '深渊')
check('提供 activate/deactivate', r.afterActivate.register.hasActivate && r.afterActivate.register.hasDeactivate)
check('带内联 SVG 预览', r.afterActivate.register.preview === 'string')

console.log('激活副作用')
check('body 打上皮肤标记', r.afterActivate.bodyAttr === '')
check('注入自有 style 节点', r.afterActivate.styleNode && r.afterActivate.cssLen > 4000, 'cssLen=' + r.afterActivate.cssLen)
check('注册主题（dark + token 数 > 100）', r.afterActivate.themeRegister?.colorScheme === 'dark' && r.afterActivate.themeRegister?.tokens > 100, JSON.stringify(r.afterActivate.themeRegister))
check('叠 token 覆盖层（source = 皮肤 id）', r.afterActivate.override.source === 'skins.abyssal' && r.afterActivate.override.tokens > 100, JSON.stringify(r.afterActivate.override))
check('注册 settings.section 席位', r.afterActivate.slots.some((s) => s.name === 'settings.section' && s.id === 'skn-abyssal-settings'), JSON.stringify(r.afterActivate.slots))
check('等待 settings.section 槽位出现', r.afterActivate.slotInjectKeys.includes('settings.section'))
check('注册中英文字典', r.afterActivate.locale?.ns === 'skn-abyssal' && r.afterActivate.locale.zh > 10 && r.afterActivate.locale.en > 10, JSON.stringify(r.afterActivate.locale))
check('设置面板可渲染（React 组件产出元素）', r.afterActivate.settingsSectionRendered === true)

console.log('真实 CSS 层叠（getComputedStyle）')
check('强调色生效（薄荷绿）', r.afterActivate.computed.brand === '#4fe0be', r.afterActivate.computed.brand)
check('圆角密度生效（柔 = 14px）', r.afterActivate.computed.radiusMd === '14px', r.afterActivate.computed.radiusMd)
check('表面半透明生效', tight(r.afterActivate.computed.bgBase).startsWith('rgba(8,12,18,0.7'), r.afterActivate.computed.bgBase)
check('侧栏 specific 层被覆盖', tight(r.afterActivate.computed.sidebarFill).startsWith('rgba(18,25,35'), r.afterActivate.computed.sidebarFill)
check('中性灰阶被重映射', r.afterActivate.computed.neutral900 === '#090e14', r.afterActivate.computed.neutral900)
check('极光背景真的解析成功（关键回归）', r.afterActivate.computed.bodyBgImage.includes('radial-gradient'), r.afterActivate.computed.bodyBgImage)

console.log('改档即时重算')
check('覆盖层被再次提交', r.afterSwitch.overrideCalls === 2, 'calls=' + r.afterSwitch.overrideCalls)
check('强调色切到靛紫', r.afterSwitch.brand === '#8e86ff', r.afterSwitch.brand)
check('圆角切到紧档（9px）', r.afterSwitch.radiusMd === '9px', r.afterSwitch.radiusMd)
check('底色切到极地', tight(r.afterSwitch.bgBase).startsWith('rgba(7,13,17,0.7'), r.afterSwitch.bgBase)
check('颗粒可关闭', r.afterSwitch.grainGone === true)

console.log('重复激活兜底（宿主重试场景）')
check('不抛错', r.retry.threw === null, String(r.retry.threw))
check('第二次注册用带序号的 id 兜底', r.retry.ids.length === 2 && /-1$/.test(r.retry.ids[1]), JSON.stringify(r.retry.ids))
check('激活仍然生效（未被回滚）', r.retry.active === true)

console.log('teardown 净场')
check('body 标记摘除', r.afterTeardown.bodyAttr === null)
check('style 节点移除', r.afterTeardown.styleNode === false)
check('主题与覆盖层被 dispose', r.afterTeardown.themeDisposed === true && r.afterTeardown.overrideDisposed === true)
check('token 恢复（无残留）', r.afterTeardown.radiusMd === '' && r.afterTeardown.brand === '', 'radius=' + r.afterTeardown.radiusMd + ' brand=' + r.afterTeardown.brand)

console.log(failures === 0 ? '\n全部通过' : `\n${failures} 项失败`)
await send('Target.closeTarget', { targetId: target.id }).catch(() => {})
server.close()
process.exit(failures === 0 ? 0 : 1)
