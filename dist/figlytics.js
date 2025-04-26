"use strict";
/// <reference types="@figma/plugin-typings" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Figlytics = void 0;
class Figlytics {
    constructor(figmaInstance, config) {
        this.figmaPluginMetaData = {
            pluginId: undefined,
            documentName: undefined,
            pageName: undefined,
            editorType: undefined,
            paymentsStatusType: undefined,
            currentPageElementCount: undefined,
            currentPageCurrentlySelectedElementCount: undefined,
        };
        this.customerId = "";
        this.sessionId = "";
        this.sessionStarted = "";
        //
        this.eventQueue = [];
        this.eventQueueInterval = null;
        this.eventQueueIntervalTime = 10000;
        this.figma = figmaInstance;
        this.config = config;
        this.initialize(config);
    }
    saveUserId() {
        return __awaiter(this, void 0, void 0, function* () {
            // Generate a UUID if it doesn't exist
            this.customerId = yield this.figma.clientStorage.getAsync("figlytics-customerid");
            if (!this.customerId) {
                this.customerId = Math.random().toString(36).substring(2, 15);
                //Save to local storage
                yield this.figma.clientStorage.setAsync("figlytics-customerid", this.customerId);
            }
        });
    }
    initialize(config) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get document and page information
            this.figmaPluginMetaData = {
                pluginId: this.figma.pluginId,
                documentName: this.figma.currentPage.parent
                    ? this.figma.currentPage.parent.name
                    : "Not found",
                pageName: this.figma.currentPage.name || "Not found",
                editorType: this.figma.editorType,
                paymentsStatusType: this.figma.payments
                    ? this.figma.payments.status.type
                    : "Not enabled",
                currentPageElementCount: this.figma.currentPage.children.length,
                currentPageCurrentlySelectedElementCount: this.figma.currentPage.selection.length,
            };
            if (config.customerId) {
                this.customerId = config.customerId;
                yield this.figma.clientStorage.setAsync("figlytics-customerid", this.customerId);
            }
            else {
                yield this.saveUserId();
            }
            this.sessionStarted = new Date().toISOString();
            this.sessionId = Math.random().toString(36).substring(2, 15);
            this.figma.on("close", () => {
                this.onEvent("plugin_closed", {
                    customerId: this.customerId,
                    sessionId: this.sessionId,
                    sessionStarted: this.sessionStarted,
                    sessionEnded: new Date().toISOString(),
                    eventCreated: new Date().toISOString(),
                    figmaPluginMetaData: this.figmaPluginMetaData,
                });
            });
            this.figma.on("run", () => {
                this.onEvent("plugin_started", {
                    customerId: this.customerId,
                    sessionId: this.sessionId,
                    sessionStarted: this.sessionStarted,
                    eventCreated: new Date().toISOString(),
                    figmaPluginMetaData: this.figmaPluginMetaData,
                });
            });
            try {
                if (window) {
                    window.onerror = (message, source, lineno, colno, error) => {
                        this.onEvent("error_occurred", {
                            message,
                            source,
                            lineno,
                            colno,
                            error,
                        });
                    };
                    window.addEventListener("error", (event) => {
                        this.onEvent("error_occurred", {
                            message: event.message,
                            lineno: event.lineno,
                            colno: event.colno,
                            error: event.error,
                        });
                    });
                }
            }
            catch (error) {
                console.error("Error adding event listeners:", error);
            }
            //Callback
            if (config && config.onInitialize) {
                config.onInitialize();
            }
        });
    }
    onEvent(eventName, eventData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config.isDebug) {
                console.log("onEvent", {
                    customerId: this.customerId,
                    eventName: eventName,
                    eventData: eventData,
                    sessionId: this.sessionId,
                    sessionStarted: this.sessionStarted,
                    eventCreated: new Date().toISOString(),
                    figmaPluginMetaData: this.figmaPluginMetaData,
                });
            }
            //Send to figlytics
            this.eventQueue.push({
                eventName: eventName,
                eventData: eventData,
                customerId: this.customerId,
                sessionId: this.sessionId,
                sessionStarted: this.sessionStarted,
                eventCreated: new Date().toISOString(),
                figmaPluginMetaData: this.figmaPluginMetaData,
            });
            //Send if there is 10 events
            if (this.eventQueue.length === 10) {
                this.sendEventQueue();
            }
            else if (eventName == "error_occurred" ||
                eventName === "plugin_closed" ||
                eventName === "plugin_started") {
                this.sendEventQueue();
            }
            else {
                this.startEventQueue();
            }
        });
    }
    setCustomerId(customerId) {
        this.customerId = customerId;
    }
    startEventQueue() {
        if (this.eventQueueInterval) {
            clearInterval(this.eventQueueInterval);
        }
        this.eventQueueInterval = setInterval(this.sendEventQueue.bind(this), this.eventQueueIntervalTime);
    }
    sendEventQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.eventQueue && this.eventQueue.length > 0) {
                if (this.eventQueueInterval) {
                    clearInterval(this.eventQueueInterval);
                }
                try {
                    console.log("Sending event queue", this.eventQueue);
                    const URL = "https://figlytics.com/api/";
                    yield fetch(URL + "events", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-Project-Public-Key": this.config.projectPublicKey || "",
                            "X-Customer-Id": this.customerId || "",
                        },
                        body: JSON.stringify({ data: this.eventQueue }),
                    });
                }
                catch (error) {
                    console.error("Error sending event queue", error);
                }
                this.eventQueue = [];
            }
        });
    }
}
exports.Figlytics = Figlytics;
