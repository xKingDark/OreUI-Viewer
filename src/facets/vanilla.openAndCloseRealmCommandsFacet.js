// @ts-check
module.exports = /** @type {() => FacetTypeMap["vanilla.openAndCloseRealmCommandsFacet"]} */ () => ({
    status: 0,
    openRealm(realmId) {
        console.log("[EngineWrapper/VanillaOpenAndCloseRealmCommandsFacet] openRealm()", arguments);
        if (!["number", "bigint"].includes(typeof realmId)) return /** @type {null} */ (/** @type {unknown} */ (undefined));
        return null;
    },
    closeRealm(realmId) {
        console.log("[EngineWrapper/VanillaOpenAndCloseRealmCommandsFacet] openRealm()", arguments);
        if (!["number", "bigint"].includes(typeof realmId)) return /** @type {null} */ (/** @type {unknown} */ (undefined));
        return null;
    },
});
