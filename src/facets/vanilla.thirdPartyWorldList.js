// @ts-check
const { FacetTaskState } = require("@ore-ui-types/enums");

module.exports = /** @type {() => UnionToIntersection<FacetTypeMap["vanilla.thirdPartyWorldList"]>} */ () => ({
    fetchThirdPartyWorldsTaskState: FacetTaskState.DONE,
    thirdPartyServersStatus: 0 /* ThirdPartyServersStatus */ /* TODO: Switch this to the enum when the module update containing it is released. */,
    thirdPartyWorlds: [
        {
            id: "3b73ca98-1652-42b6-a89b-2a4ba52be7e3",
            name: "Test Featured Server",
            // @ts-ignore
            ping: 12,
            capacity: 5000,
            playerCount: 1200,
            pingStatus: 1,
            image: "/src/assets/mcpreview.png",
            msgOfTheDay: "Welcome to the best server ever!",
            description: "This is a test description for the featured server.",
        },
    ],
    creatorExperiences: [
        {
            id: "1a76b314-88ac-4bca-995d-d62cdb0bc730",
            name: "Test Creator Experience",
            ping: "12",
            capacity: 5000,
            playerCount: 1200,
            pingStatus: 1,
            image: "/src/assets/mcpreview.png",
            msgOfTheDay: "Welcome to the best server ever!",
            description: "This is a test description for the creator experience server.",
        },
    ],
    featuredExperiences: [
        {
            id: "8cdd4d88-d9b1-4afc-b5da-d747da6ec52c",
            name: "Test Featured Experience",
            ping: "12",
            capacity: 5000,
            playerCount: 1200,
            pingStatus: 1,
            image: "/src/assets/mcpreview.png",
            msgOfTheDay: "Welcome to the best server ever!",
            description: "This is a test description for the featured experience server.",
        },
        {
            id: "e6dfa9cd-11ce-4567-9c57-3c697866631a",
            name: "Test Gatherings Server",
            ping: "-1",
            capacity: 0,
            playerCount: 0,
            pingStatus: 0,
            image: "/src/assets/mcpreview.png",
            msgOfTheDay: "",
            description: "This is a test description for the gatherings server.",
        },
    ],
});
