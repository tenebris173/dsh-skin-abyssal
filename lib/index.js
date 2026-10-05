//#region src/index.ts
/** Host loader entry for the browser-only ABYSSAL skin plugin. */
/**
 * 宿主半不做任何事：皮肤的全部观感副作用都发生在 client 半，
 * 由加载器在 activate 时下发的 SkinContext 驱动（公约 §4.2）。
 * 皮肤自己的外观设置由皮肤持久化（localStorage），因此不导出 Config。
 */
function apply() {}
//#endregion
export { apply };
