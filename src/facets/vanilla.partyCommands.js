// @ts-check
module.exports = /** @type {() => FacetTypeMap["vanilla.partyCommands"]} */ () => ({
    acceptInviteState: {
        hasError: false,
        error: undefined,
        loading: false,
        clearError(...args) {
            console.log("[EngineWrapper/PartyCommandsFacet] acceptInviteState.clearError()", args);
            return null;
        },
    },
    joinPartyState: {
        hasError: false,
        error: undefined,
        loading: false,
        clearError(...args) {
            console.log("[EngineWrapper/PartyCommandsFacet] joinPartyState.clearError()", args);
            return null;
        },
    },
    createPartyState: {
        hasError: false,
        error: undefined,
        loading: false,
        clearError(...args) {
            console.log("[EngineWrapper/PartyCommandsFacet] createPartyState.clearError()", args);
            return null;
        },
    },
    sendInvite(...args) {
        console.log("[EngineWrapper/PartyCommandsFacet] sendInvite()", args);
    },
    cancelInvite(...args) {
        console.log("[EngineWrapper/PartyCommandsFacet] cancelInvite()", args);
    },
    acceptInvite(...args) {
        console.log("[EngineWrapper/PartyCommandsFacet] acceptInvite()", args);
    },
    ignoreInvite(...args) {
        console.log("[EngineWrapper/PartyCommandsFacet] ignoreInvite()", args);
    },
    setPartyPrivacy(...args) {
        console.log("[EngineWrapper/PartyCommandsFacet] setPartyPrivacy()", args);
    },
    createParty(...args) {
        console.log("[EngineWrapper/PartyCommandsFacet] createParty()", args);
    },
    leaveParty(...args) {
        console.log("[EngineWrapper/PartyCommandsFacet] leaveParty()", args);
    },
    removeMember(...args) {
        console.log("[EngineWrapper/PartyCommandsFacet] removeMember()", args);
    },
    setLeader(...args) {
        console.log("[EngineWrapper/PartyCommandsFacet] setLeader()", args);
    },
    joinParty(...args) {
        console.log("[EngineWrapper/PartyCommandsFacet] joinParty()", args);
    },
    setPrivacy(...args) {
        console.log("[EngineWrapper/PartyCommandsFacet] setPrivacy()", args);
    },
    travelToDestination(...args) {
        console.log("[EngineWrapper/PartyCommandsFacet] travelToDestination()", args);
    },
});
