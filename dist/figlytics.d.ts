export interface FiglyticsConfig {
    onInitialize?: () => void;
    projectPublicKey?: string;
    isDebug?: boolean;
    customerId?: string;
}
export declare class Figlytics {
    private figma;
    private figmaPluginMetaData;
    private config;
    private customerId;
    private sessionId;
    private sessionStarted;
    private eventQueue;
    private eventQueueInterval;
    private eventQueueIntervalTime;
    constructor(figmaInstance: typeof figma, config: FiglyticsConfig);
    private saveUserId;
    private initialize;
    onEvent(eventName: "error_occurred" | "api_call" | "ui_interaction" | "plugin_closed" | "plugin_started" | "payment_completed" | "payment_initialized" | "payment_failed" | "feature_used" | string, eventData: any): Promise<void>;
    setCustomerId(customerId: string): void;
    private startEventQueue;
    private sendEventQueue;
}
