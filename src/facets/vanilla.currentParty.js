// @ts-check
module.exports = /** @type {() => FacetTypeMap["vanilla.currentParty"]} */ () => ({
    pendingInvites: [],
    pendingInvitees: [],
    leader: { xuid: "", pfid: "" },
    members: [],
    privacy: 1,
    partyId: "",
    isInParty: false,
    leaderXuid: "",
    shouldShowJoinDestination: false,
    destinationName: "",
});
