/* eslint-disable no-undef */
const url = new URL(__internal_Config__.pathname, "http://localhost/");
/**
 * @type {{ pathname: string; hash: string; search: string; state: string }[]}
 */
let list = JSON.parse(sessionStorage.getItem("__internal_OreUIViewer_lastRouterList__") ?? "null") ?? [
    {
        pathname: url.pathname,
        hash: "",
        search: url.search,
        state: "",
    },
];
let listB = list;
let location = list[Number(sessionStorage.getItem("__internal_OreUIViewer_lastRouterListIndex__") ?? 0)];
let index = Number(sessionStorage.getItem("__internal_OreUIViewer_lastRouterListIndex__") ?? 0);

function saveUpdatedRouterList() {
    sessionStorage.setItem("__internal_OreUIViewer_lastRouterList__", JSON.stringify(list));
    sessionStorage.setItem("__internal_OreUIViewer_lastRouterListIndex__", index);
}

module.exports = () => ({
    history: {
        length: 0,
        action: "REPLACE",
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
            list = list.slice(0, index + 1);
            saveUpdatedRouterList();

            window.engine.bindings["facet:updated:core.router"]?.forEach((f) => f?.(window.engine.facets["core.router"]({})));
        },
        goForward() {
            console.log("[EngineWrapper/RouterFacet] Going forward.");

            if (index < listB.length - 1) index++;
            location = listB[index];
            list = listB.slice(0, index + 1);
            saveUpdatedRouterList();

            window.engine.bindings["facet:updated:core.router"]?.forEach((f) => f?.(window.engine.facets["core.router"]({})));
        },
        go(distance) {
            const newDistance = Math.min(Math.max(index + distance, 0), list.length - 1);
            if (newDistance === index) return;

            index = newDistance;
            if (newDistance >= 0) {
                location = listB[index];
                list = listB.slice(0, index + 1);
                saveUpdatedRouterList();
            } else {
                location = list[index];
                list = list.slice(0, index + 1);
                saveUpdatedRouterList();
            }

            window.engine.bindings["facet:updated:core.router"]?.forEach((f) => f?.(window.engine.facets["core.router"]({})));
        },

        replace(path, action) {
            const url = new URL(path, "http://localhost/");
            if (list[index].pathname == url.pathname) return;

            this.action = action ?? "REPLACE";
            list.splice(index + 1 - (this.action === "REPLACE"), list.length - index); // Remove all entries after the current index
            list.push({ pathname: url.pathname, hash: "", search: url.search, state: "" });
            index = list.length - 1;
            location = list[index];
            listB = list;
            saveUpdatedRouterList();

            if (this.action == "REPLACE") console.log(`[EngineWrapper/RouterFacet] Replacing path (${path})`);
            else console.log(`[EngineWrapper/RouterFacet] Pushing path (${path})`);
            window.engine.bindings["facet:updated:core.router"]?.forEach((f) => f?.(window.engine.facets["core.router"]({})));
        },

        push(path) {
            this.replace(path, "PUSH");
        },
    },
});

