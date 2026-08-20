// @ts-check
module.exports = /** @type {() => FacetTypeMap["vanilla.externalServerWorldList"]} */ () => ({
    externalServerWorlds: [
        {
            id: "1" /* "external-id1" */,
            name: "Test External Server",
            // @ts-expect-error
            ping: 500,
            capacity: 5000,
            playerCount: 1,
            msgOfTheDay: "The best server ever!",
            image: "",
            pingStatus: 3,
            description: "",
        },
    ],
    addExternalServerWorld: () => {},
    editExternalServerWorld: () => {},
    removeExternalServerWorld: () => {},
    addedServerId: 1,
});
