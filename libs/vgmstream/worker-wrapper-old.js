class WorkerWrapper {
    constructor(url) {
        this.symbol = 0;
        this.allEvents = new Map();
        this.worker = new Worker(url);
        this.worker.addEventListener("message", (event) => this.messageEvent(event.data));
        this.worker.addEventListener(
            "error",
            (event) => (
                console.error(`Error loading ${url}`, event),
                this.messageEvent({
                    subject: "load",
                    error: `Error loading ${url}`,
                })
            )
        );
        this.on("load").then(
            () => {
                this.loaded = true;
            },
            (error) => {
                alert(error);
            }
        );
    }
    send(subject, ...content) {
        return this.load().then(() => {
            return new Promise((resolve, reject) => {
                var symbol = ++this.symbol;
                this.on(symbol).then(resolve, reject);
                return this.worker.postMessage({
                    symbol: symbol,
                    subject: subject,
                    content: content,
                });
            });
        });
    }
    messageEvent(data) {
        var addedType = this.allEvents.get(data.symbol || data.subject);
        if (addedType) {
            addedType.forEach((callback) => {
                if (data.error) {
                    var error = new Error(data.error.message || data.error);
                    for (var i in data.error) {
                        error[i] = data.error[i];
                    }
                    callback.reject(error);
                } else {
                    callback.resolve(data.content);
                }
            });
            this.allEvents.delete(data.subject);
        }
    }
    load() {
        if (this.loaded) {
            return Promise.resolve(this.worker);
        } else if (this.loadError) {
            return Promise.reject();
        } else {
            return this.on("load");
        }
    }
    on(type) {
        return new Promise((resolve, reject) => {
            var addedType = this.allEvents.get(type);
            if (!addedType) {
                addedType = new Set();
                this.allEvents.set(type, addedType);
            }
            addedType.add({
                resolve: resolve,
                reject: reject,
            });
        });
    }
}

var cliWorker = new WorkerWrapper("local-file:" + __dirname + "/cli-worker.js");

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
 * @returns {unknown} // TODO
 */
async function convertFile(file) {
    // return convertDir([file], file.name);
    return await cliWorker.send("convertFile", await file.bytes(), file.name);
}

function convertDir(files, inputFilename) {
    console.log(7, files, inputFilename);
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
