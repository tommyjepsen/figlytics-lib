/// <reference types="@figma/plugin-typings" />

export interface FiglyticsConfig {
  onInitialize?: () => void;
  projectPublicKey?: string;
  isDebug?: boolean;
  customerId?: string;
}

type PluginMetaData = {
  pluginId: string | undefined;
  documentName: string | undefined;
  pageName: string | undefined;
  editorType: string | undefined;
  paymentsStatusType: string | undefined;
  currentPageElementCount: number | undefined;
  currentPageCurrentlySelectedElementCount: number | undefined;
};

export class Figlytics {
  private figma: typeof figma;
  private figmaPluginMetaData: PluginMetaData = {
    pluginId: undefined,
    documentName: undefined,
    pageName: undefined,
    editorType: undefined,
    paymentsStatusType: undefined,
    currentPageElementCount: undefined,
    currentPageCurrentlySelectedElementCount: undefined,
  };
  private config: FiglyticsConfig;
  private customerId: string = "";
  private sessionId: string = "";
  private sessionStarted: string = "";

  //
  private eventQueue: any[] = [];
  private eventQueueInterval: any | null = null;
  private eventQueueIntervalTime: number = 10000;

  constructor(figmaInstance: typeof figma, config: FiglyticsConfig) {
    this.figma = figmaInstance;
    this.config = config;
    this.initialize(config);
  }

  private async saveUserId() {
    // Generate a UUID if it doesn't exist
    this.customerId = await this.figma.clientStorage.getAsync(
      "figlytics-customerid"
    );
    if (!this.customerId) {
      this.customerId = Math.random().toString(36).substring(2, 15);
      //Save to local storage
      await this.figma.clientStorage.setAsync(
        "figlytics-customerid",
        this.customerId
      );
    }
  }

  private async initialize(config: FiglyticsConfig) {
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
      currentPageCurrentlySelectedElementCount:
        this.figma.currentPage.selection.length,
    };

    if (config.customerId) {
      this.customerId = config.customerId;
      await this.figma.clientStorage.setAsync(
        "figlytics-customerid",
        this.customerId
      );
    } else {
      await this.saveUserId();
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
    } catch (error) {
      console.error("Error adding event listeners:", error);
    }

    //Callback
    if (config && config.onInitialize) {
      config.onInitialize();
    }
  }

  public async onEvent(
    eventName:
      | "error_occurred"
      | "api_call"
      | "ui_interaction"
      | "plugin_closed"
      | "plugin_started"
      | "payment_completed"
      | "payment_initialized"
      | "payment_failed"
      | "feature_used"
      | string,
    eventData: any
  ) {
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
    } else if (
      eventName == "error_occurred" ||
      eventName === "plugin_closed" ||
      eventName === "plugin_started"
    ) {
      this.sendEventQueue();
    } else {
      this.startEventQueue();
    }
  }

  public setCustomerId(customerId: string) {
    this.customerId = customerId;
  }

  private startEventQueue() {
    if (this.eventQueueInterval) {
      clearInterval(this.eventQueueInterval);
    }
    this.eventQueueInterval = setInterval(
      this.sendEventQueue.bind(this),
      this.eventQueueIntervalTime
    );
  }

  private async sendEventQueue() {
    if (this.eventQueue && this.eventQueue.length > 0) {
      if (this.eventQueueInterval) {
        clearInterval(this.eventQueueInterval);
      }

      try {
        if (this.config.isDebug) {
          console.log("Sending event queue", this.eventQueue);
        }
        const URL = "https://figlytics.com/api/";
        await fetch(URL + "events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Project-Public-Key": this.config.projectPublicKey || "",
            "X-Customer-Id": this.customerId || "",
          },
          body: JSON.stringify({ data: this.eventQueue }),
        });
      } catch (error) {
        console.error("Error sending event queue", error);
      }

      this.eventQueue = [];
    }
  }
}
