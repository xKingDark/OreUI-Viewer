// @ts-check
module.exports = /** @type {() => FacetTypeMap["vanilla.playerFollowingList"]} */ () => ({
    load(xuid) {
        return null;
    },
    playerList: [
        {
            xuid: "0",
            gamertag: "Test",
            description: "Hello, World!",
            isFollowingMe: true,
            isFollowedByMe: true,
            gamerIcon: "/src/assets/mcpreview.png",
            isOnline: false,
        },
    ],
    isLoading: false,
});
