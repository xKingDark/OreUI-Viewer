const fs = require("node:fs");
const path = require("node:path");
const json5 = require("json5");
const { convertFile } = require("../../libs/vgmstream/worker-wrapper.js");

/**
 * @type {Map<number, HTMLAudioElement>}
 */
const currentlyPlayingSounds = new Map();

let nextSoundId = 0;

const vanillaRPSounds = {};

/**
 * @type {Record<string, string | null>}
 * @type {Record<`sounds/${string}`, string | null>} - This is the real type.
 */
const vanillaRPResolvedSoundPathsCache = {};
const vanillaResourcePacksDirs =
    globalThis.vanillaResourcePacksPath ?
        fs.existsSync(path.join(globalThis.vanillaResourcePacksPath, "sounds/sound_definitions.json")) ? false
        : fs.existsSync(globalThis.vanillaResourcePacksPath) ?
            fs
                .readdirSync(globalThis.vanillaResourcePacksPath, { withFileTypes: true })
                .filter((dirent) => dirent.isDirectory() && fs.existsSync(path.join(globalThis.vanillaResourcePacksPath, dirent.name, "sounds")))
                .toSorted((a, b) =>
                    a.name.startsWith("vanilla") && !b.name.startsWith("vanilla") ? 1
                    : b.name.startsWith("vanilla") && !a.name.startsWith("vanilla") ? -1
                    : a.name.startsWith("vanilla") && b.name.startsWith("vanilla") ?
                        a.name === "vanilla" ? 1
                        : b.name === "vanilla" ? -1
                        : -a.name.localeCompare(b.name)
                    :   a.name.localeCompare(b.name)
                )
        :   null
    :   null;

if (!fs.existsSync(__dirname + "/../../hbui/sound_definitions.json") && vanillaResourcePacksDirs) {
    try {
        if (fs.existsSync(path.join(globalThis.vanillaResourcePacksPath, "sounds/sound_definitions.json"))) {
            const soundDefinitions = json5.parse(fs.readFileSync(path.join(globalThis.vanillaResourcePacksPath, "sounds/sound_definitions.json")).toString());
            if ("sound_definitions" in soundDefinitions) {
                for (const [id, data] of Object.entries(soundDefinitions.sound_definitions)) {
                    vanillaRPSounds[id] = data /* {
                        ...data,
                        // sounds: data.sounds.map((sound) => ({ name: path.join(globalThis.vanillaResourcePacksPath, sound.name), ...sound })),
                        sounds: data.sounds.map((sound) => ({ name: sound.name, ...sound })),
                    } */;
                }
            }
        } else {
            // /**
            //  * @type {Record<string, string>}
            //  * @type {Record<`sounds/${string}`, string>} - This is the real type.
            //  */
            // const soundPaths = {};
            for (const dir of vanillaResourcePacksDirs) {
                try {
                    if (fs.existsSync(path.join(globalThis.vanillaResourcePacksPath, dir.name, "sounds/sound_definitions.json"))) {
                        const soundDefinitions = json5.parse(
                            fs.readFileSync(path.join(globalThis.vanillaResourcePacksPath, dir.name, "sounds/sound_definitions.json")).toString()
                        );
                        if ("sound_definitions" in soundDefinitions) {
                            for (const [id, data] of Object.entries(soundDefinitions.sound_definitions)) {
                                vanillaRPSounds[id] ??= data /* {
                                    ...data,
                                    sounds: data.sounds.map((sound) => ({ name: sound.name, ...sound })),
                                } */;
                            }
                        }
                        continue;
                    }
                } catch (e) {
                    console.error(e);
                }
            }
            // /**
            //  * @type {string[]}
            //  * @type {`sounds/${string}`[]} - This is the real type.
            //  */
            // const soundsToMap = [...new Set(Object.values(vanillaRPSounds).flatMap((v) => v.sounds.map((v) => v.name).filter((v) => v !== undefined)))];
            // for (const dir of vanillaResourcePacksDirs) {
            //     try {
            //         for (const file of soundsToMap) {
            //             if (file in soundPaths) continue;
            //             if (
            //                 ![".fsb", ".ogg", ".mp3", ".wav", ""].some((ext) =>
            //                     fs.existsSync(path.join(globalThis.vanillaResourcePacksPath, dir.name, `${file}${ext}`))
            //                 )
            //             ) {
            //                 continue;
            //             }
            //             soundPaths[file] ??= path.join(globalThis.vanillaResourcePacksPath, dir.name, file);
            //         }
            //     } catch (e) {
            //         console.error(e);
            //     }
            // }
            // console.log(soundPaths);
            // for (const [id, data] of Object.entries(vanillaRPSounds)) {
            //     vanillaRPSounds[id] = {
            //         ...data,
            //         sounds: data.sounds.map((sound) => ({ name: soundPaths[sound.name], ...sound })).filter((sound) => sound.name),
            //     };
            // }
        }
    } catch (e) {
        console.error(e);
    }
}

/**
 * Gets the real path for a sound from the vanilla resource packs from the given relative asset path.
 *
 * @param {string} name The asset path relative to the pack root.
 * @returns {string | undefined} The real path, or `undefined` if the sound file was not found.
 */
function resolveVanillaRPSound(name) {
    if (vanillaRPResolvedSoundPathsCache[name]) return vanillaRPResolvedSoundPathsCache[name];
    if (vanillaResourcePacksDirs === false) {
        try {
            for (const ext of [".fsb", ".ogg", ".mp3", ".wav", ""]) {
                const soundPath = path.join(globalThis.vanillaResourcePacksPath, `${name}${ext}`);
                if (!fs.existsSync(soundPath)) continue;
                vanillaRPResolvedSoundPathsCache[name] ||= soundPath;
                return soundPath;
            }
        } catch (e) {
            console.error(e);
        }
    }
    for (const dir of vanillaResourcePacksDirs) {
        try {
            for (const ext of [".fsb", ".ogg", ".mp3", ".wav", ""]) {
                const soundPath = path.join(globalThis.vanillaResourcePacksPath, dir.name, `${name}${ext}`);
                if (!fs.existsSync(soundPath)) continue;
                vanillaRPResolvedSoundPathsCache[name] ||= soundPath;
                return soundPath;
            }
        } catch (e) {
            console.error(e);
        }
    }
    return undefined;
}

/**
 * Converts an FSB audio file.
 *
 * @param {string} filePath The file path.
 * @returns {Promise<string>} A promise resolving with a blob URL of the converted audio data in WAV format.
 */
async function convertFSBAudio(filePath) {
    return (await convertFile(new File([await require("node:fs/promises").readFile(filePath)], path.basename(filePath)))).url;
}

/**
 * Creates an {@link HTMLAudioElement} element from an FSB audio file.
 *
 * @param {string} filePath The file path.
 * @returns {Promise<HTMLAudioElement>}
 */
async function createFSBAudio(filePath) {
    return new Audio(await convertFSBAudio(filePath));
}

/**
 * Converts an FSB audio file and adds it to a provided {@link HTMLAudioElement}.
 *
 * @param {string} filePath The file path.
 * @param {HTMLAudioElement} audio The {@link HTMLAudioElement} instance.
 * @returns {Promise<HTMLAudioElement>} A promise that resolves with the provided {@link HTMLAudioElement} once the FSB audio file has been converted.
 */
function createFSBAudioSync(filePath, audio) {
    return convertFSBAudio(filePath).then((url) => ((audio.src = url), audio));
}

module.exports = () => ({
    /**
     * Plays a sound.
     *
     * @param {string} sound The sound to play. Should be a key from `sound_definitions.json`.
     * @param {number} volume The volume to play the sound at.
     * @param {number} pitch The pitch to play the sound at.
     * @returns {number} The ID used to fade out the sound or check if the sound is playing.
     */
    play: (sound, volume, pitch) => {
        console.log(`[EngineWrapper/SoundFacet] Sound ${sound} requested.`);
        if (!fs.existsSync(__dirname + "/../../hbui/sound_definitions.json")) {
            try {
                if (!vanillaResourcePacksDirs) throw new Error("[EngineWrapper/SoundFacet] No sound sources available.");
                const soundDefinition = vanillaRPSounds[sound];
                const sounds = soundDefinition?.sounds.filter((sound) => vanillaRPResolvedSoundPathsCache[sound.name] !== null);
                if (soundDefinition && sounds.length != false) {
                    /**
                     * @type {string | undefined}
                     */
                    let soundPath;
                    while (sounds.length && soundPath === undefined) {
                        const index = Math.floor(Math.random() * sounds.length);
                        const soundName = sounds[index].name;
                        soundPath = resolveVanillaRPSound(soundName);
                        if (soundPath === undefined) sounds.splice(index, 1);
                    }
                    if (soundPath === undefined) return;
                    // console.log(sound, soundPath);
                    const audio = soundPath.endsWith(".fsb") ? new Audio() : new Audio(`local-file:${soundPath}`);
                    audio.volume = volume ?? 1;
                    audio.preservesPitch = false;
                    audio.playbackRate = pitch ?? 1;
                    const soundId = nextSoundId++;
                    currentlyPlayingSounds.set(soundId, audio);
                    if (soundPath.endsWith(".fsb")) {
                        createFSBAudioSync(soundPath, audio).then(() => {
                            audio.play().then(() => {
                                currentlyPlayingSounds.delete(soundId);
                            });
                        });
                    } else {
                        audio.play().then(() => {
                            currentlyPlayingSounds.delete(soundId);
                        });
                    }
                    return soundId;
                }
            } catch (e) {
                console.error(e);
            }
        } else {
            try {
                /**
                 * @type {typeof import("../../hbui/sound_definitions.json")}
                 */
                const soundDefinitions = require(__dirname + "/../../hbui/sound_definitions.json", { encoding: "utf-8" });
                // console.log(soundDefinitions, sound);
                if (soundDefinitions[sound] && soundDefinitions[sound].sounds.length != false) {
                    const soundDefinition = soundDefinitions[sound];
                    const soundPath = soundDefinition.sounds[Math.floor(Math.random() * soundDefinition.sounds.length)].name;
                    const audio = soundPath.endsWith(".fsb") ? new Audio() : new Audio(soundPath);
                    audio.volume = volume ?? 1;
                    audio.preservesPitch = false;
                    audio.playbackRate = pitch ?? 1;
                    const soundId = nextSoundId++;
                    currentlyPlayingSounds.set(soundId, audio);
                    if (soundPath.endsWith(".fsb")) {
                        createFSBAudioSync(__dirname + "/../.." + soundPath, audio).then(() => {
                            audio.play().then(() => {
                                currentlyPlayingSounds.delete(soundId);
                            });
                        });
                    } else {
                        audio.play().then(() => {
                            currentlyPlayingSounds.delete(soundId);
                        });
                    }
                    return soundId;
                }
            } catch (e) {
                console.error(e);
            }
        }
    },
    /**
     * Fades out a sound.
     *
     * @param {number} id The ID of the sound to fade out.
     * @param {number} duration The duration to fade out the sound in seconds.
     * @returns {null} Returns `null`.
     */
    fadeOut(id, duration) {
        if (!currentlyPlayingSounds.has(id)) {
            return null;
        } else {
            const audio = currentlyPlayingSounds.get(id);
            const startingVolume = audio.volume;
            const interval = setInterval(() => {
                audio.volume -= startingVolume / duration;
                if (audio.volume <= 0) {
                    audio.volume = 0;
                    audio.pause();
                    currentlyPlayingSounds.delete(id);
                    clearInterval(interval);
                }
            }, 1000);
            return null;
        }
    },
    /**
     * Checks if a sound is currently playing.
     *
     * @param {number} id The ID of the sound to check.
     * @returns {boolean | undefined} Returns `true` if the sound is currently playing, `false` if it is not, or `undefined` if the id parameter is invalid.
     */
    isPlaying(id) {
        return typeof id === "number" ? currentlyPlayingSounds.has(id) : undefined;
    },
});
