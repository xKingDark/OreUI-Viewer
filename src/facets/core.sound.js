const fs = require("node:fs");

/**
 * @type {Map<number, HTMLAudioElement>}
 */
const currentlyPlayingSounds = new Map();

let nextSoundId = 0;

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
        try {
            /**
             * @type {typeof import("../../hbui/sound_definitions.json")}
             */
            const soundDefinitions = require(__dirname + "/../../hbui/sound_definitions.json", { encoding: "utf-8" });
            console.log(soundDefinitions, sound);
            if (soundDefinitions[sound] && soundDefinitions[sound].sounds.length != false) {
                const soundDefinition = soundDefinitions[sound];
                const audio = new Audio(soundDefinition.sounds[Math.floor(Math.random() * soundDefinition.sounds.length)].name);
                audio.volume = volume ?? 1;
                audio.preservesPitch = false;
                audio.playbackRate = pitch ?? 1;
                currentlyPlayingSounds.set(nextSoundId++, audio);
                audio.play().then(() => {
                    currentlyPlayingSounds.delete(nextSoundId - 1);
                });
            }
        } catch (e) {
            console.error(e);
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

