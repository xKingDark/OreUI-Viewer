// @ts-check
/** @type {{ [type in 0 | 1 | 2 | 3]: { [id: string]: FacetTypeMap["vanilla.networkWorldDetails"]["networkDetails"] } }} */
const networkWorldDetailsDataMap = {
    // Featured Server
    [0]: {
        "3b73ca98-1652-42b6-a89b-2a4ba52be7e3": {
            id: "3b73ca98-1652-42b6-a89b-2a4ba52be7e3",
            name: "Test Featured Server",
            ping: "12",
            capacity: 5000,
            playerCount: 1200,
            pingStatus: 1,
            imagePath: "/src/assets/mcpreview.png",
            description: "This is a test featured server, it has some random activities that will be happening along the day, we have events 24/7.",
            newsTitle: "Big news here!",
            newsDescription:
                "We have some big news here, we will going under maintenance the 07/07 and the server will not be available that day. Everything done that day will be discarded",
            type: 0,
            activities: [
                {
                    title: "Random activity!",
                    subtitle: "Subtitle",
                    description: "This activity includes some random events that will happening along the day, we have event 24/7",
                    imagePath: "/hbui/assets/1_1_ratio-fd8f8.png",
                },
            ],
            address: "play.test.com",
            port: 19132,
            isSupportedForPartyTravel: false,
        },
        "1a76b314-88ac-4bca-995d-d62cdb0bc730": {
            id: "1a76b314-88ac-4bca-995d-d62cdb0bc730",
            name: "Test Creator Experience",
            ping: "12",
            capacity: 5000,
            playerCount: 1200,
            pingStatus: 1,
            imagePath: "/src/assets/mcpreview.png",
            description: "This is a test creator experience server, it has some random activities that will be happening along the day, we have events 24/7.",
            newsTitle: "Big news here!",
            newsDescription:
                "We have some big news here, we will going under maintenance the 07/07 and the server will not be available that day. Everything done that day will be discarded",
            type: 0,
            activities: [
                {
                    title: "Random activity!",
                    subtitle: "Subtitle",
                    description: "This activity includes some random events that will happening along the day, we have event 24/7",
                    imagePath: "/hbui/assets/1_1_ratio-fd8f8.png",
                },
            ],
            address: "play.creator.test.com",
            port: 19132,
            isSupportedForPartyTravel: true,
        },
        "8cdd4d88-d9b1-4afc-b5da-d747da6ec52c": {
            id: "8cdd4d88-d9b1-4afc-b5da-d747da6ec52c",
            name: "Test Featured Experience",
            ping: "12",
            capacity: 5000,
            playerCount: 1200,
            pingStatus: 1,
            imagePath: "/src/assets/mcpreview.png",
            description: "This is a test featured experience server, it has some random activities that will be happening along the day, we have events 24/7.",
            newsTitle: "Big news here!",
            newsDescription:
                "We have some big news here, we will going under maintenance the 07/07 and the server will not be available that day. Everything done that day will be discarded",
            type: 0,
            activities: [
                {
                    title: "Random activity!",
                    subtitle: "Subtitle",
                    description: "This activity includes some random events that will happening along the day, we have event 24/7",
                    imagePath: "/hbui/assets/1_1_ratio-fd8f8.png",
                },
            ],
            address: "play.featured.test.com",
            port: 19132,
            isSupportedForPartyTravel: false,
        },
        "e6dfa9cd-11ce-4567-9c57-3c697866631a": {
            id: "e6dfa9cd-11ce-4567-9c57-3c697866631a",
            name: "Test Gatherings Server",
            ping: "-1",
            capacity: 0,
            playerCount: 0,
            pingStatus: 0,
            imagePath: "/src/assets/mcpreview.png",
            description: "This is a test gatherings server, it has some random activities that will be happening along the day, we have events 24/7.",
            newsTitle: "Big news here!",
            newsDescription:
                "We have some big news here, we will going under maintenance the 07/07 and the server will not be available that day. Everything done that day will be discarded",
            type: 0,
            activities: [
                {
                    title: "Random activity!",
                    subtitle: "Subtitle",
                    description: "This activity includes some random events that will happening along the day, we have event 24/7",
                    imagePath: "/hbui/assets/1_1_ratio-fd8f8.png",
                },
            ],
            address: "",
            port: 19132,
            isSupportedForPartyTravel: true,
        },
    },
    // External Server
    [1]: {
        1: {
            id: "1",
            name: "Test External Server",
            ping: "500",
            capacity: 5000,
            playerCount: 1,
            imagePath: "",
            pingStatus: 3,
            description: "",
            newsTitle: "",
            newsDescription: "",
            type: 1,
            activities: [],
            address: "www.8crafter.com",
            port: 19132,
            isSupportedForPartyTravel: false,
        },
    },
    // Realm
    [2]: {},
    // LAN Server
    [3]: {},
};
/** @type {FacetTypeMap["vanilla.networkWorldDetails"]["networkDetails"]} */
const fallbackNetworkWorldDetails = {
    isSupportedForPartyTravel: false,
    activities: [],
    newsDescription: "",
    newsTitle: "",
    type: 0,
    capacity: 0,
    playerCount: 0,
    pingStatus: 0,
    imagePath: "",
    ping: "",
    port: 0,
    address: "",
    description: "",
    name: "",
    id: "",
};
/** @type {FacetTypeMap["vanilla.networkWorldDetails"]["networkDetails"]} */
let activeNetworkDetails = JSON.parse(JSON.stringify(fallbackNetworkWorldDetails)); /* {
    name: "Test Featured Server",
    ping: "0",
    imagePath: "/hbui/assets/10_3_ratio-16d67.png",
    pingStatus: 1,
    playerCount: 1,
    capacity: 5000,
    newsTitle: "Big news here!",
    newsDescription:
        "We have some big news here, we will going under maintenance the 07/07 and the server will not be available that day. Everything done that day will be discarded",
    description: "This is a test featured server, it has some random activities that will be happening along the day, we have events 24/7.",
    type: 0,
    activities: [
        {
            title: "Random activity!",
            subtitle: "Subtitle",
            description: "This activity includes some random events that will happening along the day, we have event 24/7",
            imagePath: "/hbui/assets/1_1_ratio-fd8f8.png",
        },
    ],
    address: "play.test.com",
    port: 19132,
    id: "id-1",
}; */
let hasLoadedDetails = false;
module.exports = /** @type {() => FacetTypeMap["vanilla.networkWorldDetails"]} */ () => ({
    networkDetails: activeNetworkDetails,
    hasLoadedDetails,
    loadNetworkWorldDetails(id, type) {
        if (typeof id !== "string") return undefined;
        if (!Number.isFinite(type)) return undefined;
        console.log(`[Facet::vanilla.networkWorldDetails::loadNetworkWorldDetails] Loading network world details for ID ${id} and type ${type}`);
        if (!(type in networkWorldDetailsDataMap)) return null;
        if (!(id in networkWorldDetailsDataMap[type])) {
            if (type > 1) return null;
            activeNetworkDetails = JSON.parse(JSON.stringify(fallbackNetworkWorldDetails));
        } else activeNetworkDetails = JSON.parse(JSON.stringify(networkWorldDetailsDataMap[type][id]));
        hasLoadedDetails = true;
        this.networkDetails = activeNetworkDetails;
        this.hasLoadedDetails = hasLoadedDetails;
        triggerUpdateSubscriptions(this);
        return null;
    },
});
/**
 * @param {ReturnType<typeof module.exports>} value
 */
function triggerUpdateSubscriptions(value) {
    for (const callback of updateSubscriptions) {
        try {
            callback(value)?.catch((e) => {
                console.error("[Facet::vanilla.networkWorldDetails::triggerUpdateSubscriptions] Error on async callback:", callback, value, e);
            });
        } catch (e) {
            console.error("[Facet::vanilla.networkWorldDetails::triggerUpdateSubscriptions] Error on callback:", callback, value, e);
        }
    }
}
/** @type {((value: ReturnType<typeof module.exports>) => Promise<void> | void)[]} */
const updateSubscriptions = [];
/**
 * @param {(value: ReturnType<typeof module.exports>) => Promise<void> | void} callback
 */
module.exports.observe = (callback) => {
    if (updateSubscriptions.includes(callback)) return;
    updateSubscriptions.push(callback);
};
/**
 * @param {(value: ReturnType<typeof module.exports>) => Promise<void> | void} callback
 */
module.exports.unobserve = (callback) => {
    if (!updateSubscriptions.includes(callback)) return;
    updateSubscriptions.splice(updateSubscriptions.indexOf(callback), 1);
};
