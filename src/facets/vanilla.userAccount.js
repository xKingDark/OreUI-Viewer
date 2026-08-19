// @ts-check
module.exports = () => ({
    hasPremiumNetworkAccess: true,
    isLoggedInWithMicrosoftAccount: true,
    isTrialAccount: false,
    hasValidCrossPlatformSkin: true,
    isBanned: false,
    banReason: "",
    banExpiration: "",
    showPremiumNetworkUpsellModal: () => {},
    userPermissions: {
        multiplayer: {
            denyReasons: [],
            allowed: true,
        },
        addFriends: {
            denyReasons: [],
            allowed: true,
        },
        viewProfiles: {
            denyReasons: [],
            allowed: true,
        },
    },
    isSignedInPlatformNetwork: true,
    signOutOfMicrosoftAccount: () => {},
    manageMicrosoftAccount: () => {},

    signInPlatformNetworkTaskResult: null,
    signInPlatformNetworkTaskState: 0,
    accountUnlinkState: 0,
    currentXuid: "2535447190358939",
    currentPlatformId: "",
    isMarketplacePassSubscriptionActive: false,
    isRealmsPlusSubscriptionActive: true,
    isSignInInProgress: false,
    updateMultiplayerPrivilegeUsingSystemModal() {},
    unlinkMicrosoftAccount() {},
    clearAccountUnlinkState() {},
    signInToPlatformNetwork() {},
    resetSignInPlatformNetwork() {},
});

