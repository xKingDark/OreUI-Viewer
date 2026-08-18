class WorkerWrapper {
    constructor(url) {
        this.url = url;
        this.symbol = 0;

        this.allEvents = new Map();
        this.loadWaiters = new Set();

        this.worker = null;
        this.loaded = false;
        this.loadError = null;

        this.conversionCount = 0;
        this.maxConversions = Infinity /* 100 */;
        this.retireRequested = false;

        this.restartPromise = null;
        this.poisoned = false;

        this.createWorker();
    }

    createWorker() {
        this.loaded = false;
        this.loadError = null;
        this.poisoned = false;

        this.worker = new Worker(this.url);

        this.worker.addEventListener("message", (event) => {
            this.messageEvent(event.data);
        });

        this.worker.addEventListener("error", (event) => {
            console.error(`Error loading ${this.url}`, event);

            const error = new Error(event.message || `Worker failed: ${this.url}`);

            this.loadError = error;

            this.messageEvent({
                subject: "load",
                error: error,
            });
        });

        this.loadPromise = this.on("load").then(
            () => {
                this.loaded = true;
                return this.worker;
            },
            (error) => {
                this.loadError = error;
                throw error;
            }
        );
    }

    send(subject, ...content) {
        return this.load().then(async () => {
            /*
             * Don't start a new conversion on a worker that has reached
             * its retirement threshold.
             */
            if (this.retireRequested && this.isConversion(subject)) {
                await this.restartWorker();
            }

            return new Promise((resolve, reject) => {
                const symbol = ++this.symbol;

                const request = {
                    symbol,
                    subject,
                    content,
                    resolve,
                    reject,
                    retries: 0,
                    conversion: this.isConversion(subject),
                };

                this.allEvents.set(symbol, request);

                try {
                    this.worker.postMessage({
                        symbol,
                        subject,
                        content,
                    });
                } catch (error) {
                    this.allEvents.delete(symbol);
                    reject(error);
                }
            });
        });
    }

    messageEvent(data) {
        if (data.subject === "load") {
            const waiters = Array.from(this.loadWaiters);
            this.loadWaiters.clear();

            if (data.error) {
                const error = new Error(data.error.message || data.error);

                for (const i in data.error) {
                    error[i] = data.error[i];
                }

                waiters.forEach((waiter) => waiter.reject(error));
            } else {
                waiters.forEach((waiter) => waiter.resolve(this.worker));
            }

            return;
        }

        const key = data.symbol || data.subject;
        const request = this.allEvents.get(key);

        if (!request) {
            return;
        }

        /*
         * A WASM exception poisons the entire WASM instance.
         *
         * Do NOT reject just this request. All requests currently
         * using this worker need to be retried on a fresh instance.
         */
        if (
            data.error &&
            (data.error.type === "wasm" ||
                data.error.name === "RuntimeError" ||
                String(data.error.message || data.error).includes("memory access out of bounds"))
        ) {
            this.handleWasmCrash(data.error);
            return;
        }

        this.allEvents.delete(key);

        if (data.error) {
            const error = new Error(data.error.message || data.error);

            for (const i in data.error) {
                error[i] = data.error[i];
            }

            request.reject(error);
        } /* else {
            if (request.conversion) {
                this.conversionCount++;

                if (this.conversionCount >= this.maxConversions) {
                    this.retireRequested = true;
                }
            }

            request.resolve(data.content);
        } */ else {
            if (request.conversion) {
                this.conversionCount++;

                if (this.conversionCount >= this.maxConversions) {
                    this.retireRequested = true;
                }
            }

            const content = data.content;

            if (content?.wavdata) {
                content.url = URL.createObjectURL(
                    new Blob([content.wavdata], {
                        type: "audio/x-wav",
                    })
                );

                delete content.wavdata;
            }

            request.resolve(content);
        }

        this.maybeRetire();
    }

    async handleWasmCrash(error) {
        /*
         * Only handle one crash. Multiple requests may receive
         * errors while the worker is being replaced.
         */
        if (this.poisoned) {
            return;
        }

        this.poisoned = true;

        console.error("WASM worker crashed; replacing worker and retrying pending requests", error);

        /*
         * Save every request currently associated with this worker.
         * They all need to be retried because the WASM instance is
         * no longer trustworthy.
         */
        const pending = Array.from(this.allEvents.values());

        this.allEvents.clear();

        const oldWorker = this.worker;

        this.worker = null;
        this.loaded = false;

        if (oldWorker) {
            oldWorker.terminate();
        }

        /*
         * Start a completely fresh Worker, which gives us a completely
         * fresh Emscripten runtime and WASM heap.
         */
        try {
            await this.restartWorker();
        } catch (restartError) {
            for (const request of pending) {
                request.reject(restartError);
            }

            return;
        }

        /*
         * Retry every request that was in flight on the poisoned
         * worker. Each request gets at most one automatic retry.
         */
        for (const request of pending) {
            if (request.retries >= 1) {
                request.reject(this.makeWasmError(error));
                continue;
            }

            request.retries++;

            this.allEvents.set(request.symbol, request);

            try {
                this.worker.postMessage({
                    symbol: request.symbol,
                    subject: request.subject,
                    content: request.content,
                });
            } catch (postError) {
                this.allEvents.delete(request.symbol);
                request.reject(postError);
            }
        }
    }

    makeWasmError(error) {
        const output = new Error(error.message || String(error));

        output.name = error.name;
        output.type = "wasm";
        output.stack = error.stack;

        for (const i in error) {
            output[i] = error[i];
        }

        return output;
    }

    async restartWorker() {
        if (this.restartPromise) {
            return this.restartPromise;
        }

        this.restartPromise = (async () => {
            const oldWorker = this.worker;

            this.worker = null;
            this.loaded = false;
            this.loadError = null;

            if (oldWorker) {
                oldWorker.terminate();
            }

            this.createWorker();

            await this.load();

            this.conversionCount = 0;
            this.retireRequested = false;
        })();

        try {
            await this.restartPromise;
        } finally {
            this.restartPromise = null;
        }
    }

    maybeRetire() {
        if (!this.retireRequested) {
            return;
        }

        /*
         * Don't terminate while conversions are still running.
         */
        const activeConversions = Array.from(this.allEvents.values()).some((request) => request.conversion);

        if (!activeConversions) {
            this.restartWorker();
        }
    }

    isConversion(subject) {
        return subject === "vgmstream" || subject === "convertFile" || subject === "convertDir";
    }

    load() {
        if (this.loaded) {
            return Promise.resolve(this.worker);
        }

        if (this.loadError) {
            return Promise.reject(this.loadError);
        }

        return this.loadPromise;
    }
    on(type) {
        if (type === "load") {
            return new Promise((resolve, reject) => {
                this.loadWaiters.add({ resolve, reject });
            });
        }

        return new Promise((resolve, reject) => {
            var addedType = this.allEvents.get(type);

            if (!addedType) {
                addedType = new Set();
                this.allEvents.set(type, addedType);
            }

            addedType.add({
                resolve,
                reject,
            });
        });
    }
}

// var cliWorker = new WorkerWrapper("local-file:" + __dirname + "/cli-worker.js");
var cliWorker = new WorkerWrapper(new URL(location.protocol + location.host + "/__vgmstream__/cli-worker.js?dirname=" + encodeURIComponent(__dirname)).toString());

function vgmstream(...args) {
    return cliWorker.send("vgmstream", ...args);
}

/**
 * @param {string} name The virtual file path.
 * @param {Buffer | Uint8Array} data The file data to write.
 * @returns {Promise<void>} A promise that resolves when the file has been written.
 */
function writeFile(name, data) {
    return cliWorker.send("writeFile", name, data);
}

/**
 * @param {string} name The virtual file path.
 * @returns {Uint8Array} The file contents.
 */
function readFile(name) {
    return cliWorker.send("readFile", name);
}

/**
 * @param {string} name The virtual file path.
 * @returns {unknown} // TODO
 */
function deleteFile(name) {
    return cliWorker.send("deleteFile", name);
}

/**
 * @param {File} file The file to convert.
 * @returns {Promise<{ inputFilename: string; outputFilename: string; url: string; }>} The converted file data.
 */
async function convertFile(file) {
    // return convertDir([file], file.name);
    return await cliWorker.send("convertFile", file.bytes ? await file.bytes() : new Uint8Array(await file.arrayBuffer()), file.name);
}

/**
 * @param {FileList | File[]} files The file to convert.
 * @param {string} inputFilename A filename.
 * @returns {Promise<{ inputFilename: string; outputFilename: string; url: string; }>} The converted file data.
 */
function convertDir(files, inputFilename) {
    return cliWorker.send("convertDir", files, inputFilename);
}

function workerError(error) {
    if (error.type === "wasm") {
        error.message = "The WebAssembly application crashed while decoding this file";
    } else if (error.stderr) {
        error.message = "Could not convert file: {}".format(error.stderr.trim());
    }
    alert(error.message);
    return error;
}

module.exports = {
    WorkerWrapper,
    cliWorker,
    vgmstream,
    writeFile,
    readFile,
    deleteFile,
    convertFile,
    convertDir,
    workerError,
};
