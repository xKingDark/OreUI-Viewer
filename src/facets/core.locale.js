/* global __internal_Config__ */
const fs = require("node:fs");
const path = require("node:path");
let translations = {
    // Default experimental toggle translations that aren't includes in the Ore UI lang files.
    "createWorldScreen.experimentalgameplay": "Experiments",
    "createWorldScreen.experimentalgameplayinfo": "§7Try out features that are under development. Can't be turned off after world creation.",
    "createWorldScreen.experimentalbiomes": "Custom biomes",
    "createWorldScreen.experimentalbiomesDescription": "Create custom biomes and change world generation",
    "createWorldScreen.experimentalCreatorFeatures": "Upcoming Creator Features",
    "createWorldScreen.experimentalCreatorFeaturesDescription": "Includes actor properties and adjustable fog parameters",
    "createWorldScreen.experimentalCreatorCameraFeatures": "Experimental Creator Camera Features",
    "createWorldScreen.experimentalCreatorCameraFeaturesDescription": "Enables the use of the latest custom camera features",
    "createWorldScreen.experimentalGameTest": "Beta APIs",
    "createWorldScreen.experimentalGameTestDescription": 'Use "-beta" versions of API modules in add-on packs',
    "createWorldScreen.experimentalVillagerTradesRebalance": "Villager Trade Rebalancing",
    "createWorldScreen.experimentalVillagerTradesRebalanceDescription": "Contains updated trades for villagers for the purpose of rebalancing",
    "createWorldScreen.experimentalDataDrivenJigsawStructures": "Data-Driven Jigsaw Structures",
    "createWorldScreen.experimentalDataDrivenJigsawStructuresDescription": "Loads Jigsaw Structures from the behavior pack worldgen folder",
    "createWorldScreen.experimentalDeferredTechnicalPreview": "Render Dragon Features for Creators",
    "createWorldScreen.experimentalDeferredTechnicalPreviewDescription":
        "Enable the deferred rendering pipeline. Requires a PBR-enabled resource pack and compatible hardware.",
};
if (__internal_Config__.use_translation) {
    console.log("[EngineWrapper/LocaleFacet] Loading " + __internal_Config__.locale + ".lang file...");

    let locdat = "";

    if (fs.existsSync(globalThis.textsPath + __internal_Config__.locale + ".lang")) {
        locdat = fs.readFileSync(globalThis.textsPath + __internal_Config__.locale + ".lang").toString();
    } else {
        // Use a separate variable to keep track of whether the lang file was found, so that an error is not thrown if all found lang files are empty.
        let langFileFound = false;
        for (const dir of fs
            .readdirSync(globalThis.textsPath, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .toSorted((a, b) =>
                a.name.startsWith("vanilla") && !b.name.startsWith("vanilla")
                    ? 1
                    : b.name.startsWith("vanilla") && !a.name.startsWith("vanilla")
                    ? -1
                    : a.name.startsWith("vanilla") && b.name.startsWith("vanilla")
                    ? a.name === "vanilla"
                        ? 1
                        : b.name === "vanilla"
                        ? -1
                        : -a.name.localeCompare(b.name)
                    : a.name.localeCompare(b.name)
            )) {
            if (fs.existsSync(path.join(globalThis.textsPath, dir.name, "texts", __internal_Config__.locale + ".lang"))) {
                locdat += fs.readFileSync(path.join(globalThis.textsPath, dir.name, "texts", __internal_Config__.locale + ".lang")).toString() + "\n";
                langFileFound = true;
                continue;
            }
            if (fs.existsSync(path.join(globalThis.textsPath, dir.name, __internal_Config__.locale + ".lang"))) {
                locdat += fs.readFileSync(path.join(globalThis.textsPath, dir.name, __internal_Config__.locale + ".lang")).toString() + "\n";
                langFileFound = true;
                continue;
            }
        }
        if (!langFileFound) throw new ReferenceError(`Locale file "${__internal_Config__.locale}.lang" not found.`);
    }
    locdat.replaceAll(/##[^\n\r]*/g, "");
    for (const item of locdat.split(/[\n\r]+/g)) translations[item.split("=")[0]] = item.split("=").slice(1).join("=")?.replace("\r", "");
}

module.exports = () => ({
    locale: __internal_Config__.locale,
    translate: (id) => (__internal_Config__.use_translation ? translations[id]?.split("#")[0]?.trim() : id),
    translateWithParameters: (id, params) => {
        if (__internal_Config__.use_translation) {
            let translation = translations[id];
            if (/%\d+|$s/g.test(translation)) {
                for (let i = 1; i <= params.length; i++) {
                    translation = translation?.replaceAll("%" + i + "$s", params[i - 1]);
                }
            } else translation = translation?.replaceAll("%s", params[0]);

            return translation?.split("#")[0]?.trim();
        } else return id;
    },

    formatDate: (timestampInSeconds) => new Date(timestampInSeconds * 1000).toLocaleDateString(),
    getHowLongAgoAsString: () => "0 seconds ago",
});

