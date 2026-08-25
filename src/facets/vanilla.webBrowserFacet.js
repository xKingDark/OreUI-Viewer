// @ts-check
const { WebBrowserLink } = require("@ore-ui-types/enums");

/**
 * @param {string} uri
 */
function openUri(uri) {
    try {
        const { shell } = require("electron");
        shell.openExternal(uri);
        return;
    } catch (e) {
        console.error("Error opening URI via electron::shell:", uri, e);
    }
    window.open(uri, "_blank");
}

module.exports = /** @type {() => FacetTypeMap["vanilla.webBrowserFacet"]} */ () => ({
    openLink(linkId) {
        // TODO
        console.log("[EngineWrapper/VanillaWebBrowserFacet] openLink()", arguments);
        return null;
    },
    openLinkWithParams(linkId, param) {
        // TODO
        console.log("[EngineWrapper/VanillaWebBrowserFacet] openLinkWithParams()", arguments);
        switch (linkId) {
            case WebBrowserLink.XboxAccountProfile: {
                const playerProfile = globalThis.engine.facets?.["vanilla.playerProfile"]?.().playerProfiles.find((v) => v.data.xblName === param);
                if (!playerProfile) return null;
                openUri(playerProfile.data.url);
                break;
            }
        }
        return null;
    },
});
