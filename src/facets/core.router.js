/* eslint-disable no-undef */
const url = new URL(__internal_Config__.pathname, "http://localhost/");
/**
 * @type {{ pathname: string; hash: string; search: string; state: string }[]}
 */
let list = JSON.parse(sessionStorage.getItem("__internal_OreUIViewer_lastRouterList__") ?? "null") ?? [
    {
        pathname: url.pathname,
        hash: url.hash,
        search: url.search,
        state: "",
    },
];
let listB = [...list];
let location = list[Number(sessionStorage.getItem("__internal_OreUIViewer_lastRouterListIndex__") ?? 0)];
let index = Number(sessionStorage.getItem("__internal_OreUIViewer_lastRouterListIndex__") ?? 0);
let lastAction = String(sessionStorage.getItem("__internal_OreUIViewer_lastRouterAction__") ?? "REPLACE");

function saveUpdatedRouterList() {
    sessionStorage.setItem("__internal_OreUIViewer_lastRouterList__", JSON.stringify(list));
    sessionStorage.setItem("__internal_OreUIViewer_lastRouterListIndex__", index);
    sessionStorage.setItem("__internal_OreUIViewer_lastRouterAction__", lastAction);
}

module.exports = () => ({
    history: {
        get length() {
            return list.length;
        },
        get action() {
            return lastAction;
        },
        get location() {
            return location;
        },
        get index() {
            return index;
        },
        list,
        goBack() {
            if (list.length <= 1) return;
            console.log("[EngineWrapper/RouterFacet] Going back.");

            if (index > 0) index--;
            location = list[index];
            list.splice(index + 1, Infinity);
            saveUpdatedRouterList();

            // window.engine.bindings["facet:updated:core.router"]?.forEach((f) => f?.(window.engine.facets["core.router"]({})));
            triggerUpdateSubscriptions(window.engine.facets["core.router"]({}));
        },
        goForward() {
            console.log("[EngineWrapper/RouterFacet] Going forward.");

            if (index < listB.length - 1) index++;
            location = listB[index];
            list.splice(0, Infinity, ...listB.slice(0, index + 1));
            saveUpdatedRouterList();

            // window.engine.bindings["facet:updated:core.router"]?.forEach((f) => f?.(window.engine.facets["core.router"]({})));
            triggerUpdateSubscriptions(window.engine.facets["core.router"]({}));
        },
        go(distance) {
            const newDistance = Math.min(Math.max(index + distance, 0), list.length - 1);
            if (newDistance === index) return;

            index = newDistance;
            if (newDistance >= 0) {
                location = listB[index];
                list.splice(0, Infinity, ...listB.slice(0, index + 1));
                saveUpdatedRouterList();
            } else {
                location = list[index];
                list.splice(index + 1, Infinity);
                saveUpdatedRouterList();
            }

            // window.engine.bindings["facet:updated:core.router"]?.forEach((f) => f?.(window.engine.facets["core.router"]({})));
            triggerUpdateSubscriptions(window.engine.facets["core.router"]({}));
        },

        replace(path, action) {
            const url = new URL(path, "http://localhost/");
            if (list[index].pathname === url.pathname && list[index].search === url.search && list[index].hash === url.hash) return;

            lastAction = action ?? "REPLACE";
            list.splice(index + 1 - (lastAction === "REPLACE"), Infinity); //_ Remove all entries after the current index
            list.push({ pathname: url.pathname, hash: url.hash, search: url.search, state: "" });
            index = list.length - 1;
            location = list[index];
            listB = [...list];
            saveUpdatedRouterList();

            if (lastAction === "REPLACE") console.log(`[EngineWrapper/RouterFacet] Replacing path (${path})`);
            else console.log(`[EngineWrapper/RouterFacet] Pushing path (${path})`);
            // window.engine.bindings["facet:updated:core.router"]?.forEach((f) => f?.(window.engine.facets["core.router"]({})));
            triggerUpdateSubscriptions(window.engine.facets["core.router"]({}));
        },

        push(path) {
            this.replace(path, "PUSH");
        },
    },
});
/**
 * @param {ReturnType<typeof module.exports>} value
 */
function triggerUpdateSubscriptions(value) {
    for (const callback of updateSubscriptions) {
        try {
            callback(value)?.catch((e) => {
                console.error("[Facet::core.router::triggerUpdateSubscriptions] Error on async callback:", callback, value, e);
            });
        } catch (e) {
            console.error("[Facet::core.router::triggerUpdateSubscriptions] Error on callback:", callback, value, e);
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
