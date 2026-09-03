// @ts-check
module.exports = /** @type {() => FacetTypeMap["vanilla.playerPrivacy"]} */ () => ({
    loaded: true,
    data: { viewTargetProfile: true },
    load(xuid) {
        console.log("Player privacy data loaded", arguments);
        return null;
    },
});
