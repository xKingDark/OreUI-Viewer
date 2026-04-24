// @ts-check
module.exports = /** @type {() => FacetTypeMap["vanilla.playerStatistics"]} */ () => ({
    loaded: true,
    load: (playerId) => {},
    // @ts-ignore: Temporarily ignore errors on this property until it is added into the facet type.
    unload: () => {},
    data: [
        {
            label: "Time played",
            icon: 0,//"/hbui/assets/IconClockGrey-ea564.png",
            valueRaw: 117365,
            valueDisplay: "81d 12h 5m",
            currentUserValueRaw: 265150,
            currentUserValueDisplay: "184d 3h 10m",
            currentUserValueNarration: "184 days 3 hours 10 minutes",
            valueNarration: "81 days 12 hours 5 minutes",
            name: "MinutesPlayed",
        },
        {
            label: "Blocks broken",
            icon: 1,//"/hbui/assets/IconPickaxeGrey-cb118.png",
            currentUserValueNarration: "213077",
            currentUserValueDisplay: "213,077",
            currentUserValueRaw: 213077,
            valueNarration: "521684",
            valueDisplay: "521,684",
            valueRaw: 521684,
            name: "BlockBrokenTotal",
        },
        {
            label: "Mobs defeated",
            icon: 2,//"/hbui/assets/IconSwordGrey-9087f.png",
            currentUserValueNarration: "6672",
            currentUserValueDisplay: "6,672",
            currentUserValueRaw: 6672,
            valueNarration: "4729",
            valueDisplay: "4,729",
            valueRaw: 4729,
            name: "MobKilled.IsMonster.1",
        },
        {
            label: "Distance travelled",
            icon: 3,//"/hbui/assets/IconBootsGrey-142a3.png",
            currentUserValueNarration: "700746505",
            currentUserValueDisplay: "700,746,505",
            currentUserValueRaw: 700746505,
            valueNarration: "1115130724",
            valueDisplay: "1,115,130,724",
            valueRaw: 1115130724,
            name: "DistanceTravelled",
        },
    ],
});

