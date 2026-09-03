// @ts-check
const { PlayerPermissionsAbility, PlayerPermissionsActionState, PlayerPermissionLevel } = require("@ore-ui-types/enums");

module.exports = /** @type {() => FacetTypeMap["vanilla.playerPermissions"]} */ () => ({
    kickCommandState: PlayerPermissionsActionState.Success,
    operatorCommandsRevokedFlag: false,
    selectedPlayerPermissionsChangedFlag: false,
    selectedPlayerLeftFlag: false,
    playerPermissionsMissingFlag: false,
    playerIdInvalidFlag: false,
    playerPermissionLevel: PlayerPermissionLevel.Operator,
    canEditPermissions: true,
    canKickPlayer: true,
    isWorldTemplateOptionsLocked: false,
    areCheatsEnabled: true,
    playerPermissionList: [
        { abilityIndex: PlayerPermissionsAbility.Build, isEnabled: true },
        { abilityIndex: PlayerPermissionsAbility.Mine, isEnabled: true },
        { abilityIndex: PlayerPermissionsAbility.DoorsAndSwitches, isEnabled: true },
        { abilityIndex: PlayerPermissionsAbility.OpenContainers, isEnabled: true },
        { abilityIndex: PlayerPermissionsAbility.AttackPlayers, isEnabled: true },
        { abilityIndex: PlayerPermissionsAbility.AttackMobs, isEnabled: true },
        { abilityIndex: PlayerPermissionsAbility.OperatorCommands, isEnabled: true },
        { abilityIndex: PlayerPermissionsAbility.Teleport, isEnabled: true },
    ],
    loadPlayerPermissions() {
        return null;
    },
    requestSavePermissions() {
        return null;
    },
    setPlayerPermissionLevel() {
        return null;
    },
    setPlayerPermission() {
        return null;
    },
    kickPlayer(_player) {
        return null;
    },
    enableCheats() {
        return null;
    },
    clearErrorFlag(errorFlag) {
        return null;
    },
});
