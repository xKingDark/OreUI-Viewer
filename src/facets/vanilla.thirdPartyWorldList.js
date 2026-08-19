// @ts-check
module.exports = /**
 @type {() => Extract<FacetTypeMap["vanilla.thirdPartyWorldList"], {thirdPartyWorlds: unknown}> & Extract<FacetTypeMap["vanilla.thirdPartyWorldList"], {creatorExperiences: unknown}>}
 */ () => ({
    fetchThirdPartyWorldsTaskState: 2,
    thirdPartyServersStatus: 0,
    thirdPartyWorlds: [
        {
            id: "1" /* "id1" */,
            name: "Test Featured Server",
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
            id: "2" /* "id1" */,
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
            id: "3" /* "id1" */,
            name: "Test Featured Experience",
            ping: "12",
            capacity: 5000,
            playerCount: 1200,
            pingStatus: 1,
            image: "/src/assets/mcpreview.png",
            msgOfTheDay: "Welcome to the best server ever!",
            description: "This is a test description for the featured experience server.",
        },
    ],
});
