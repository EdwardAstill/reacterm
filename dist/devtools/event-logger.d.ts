/**
 * Event logger — ring buffer of recent input events for DevTools inspection.
 *
 * Tracks keyboard, mouse, paste, and resize events with timestamps.
 * Maintains a fixed-size buffer (default 20) of the most recent events,
 * newest first.
 */
export interface LoggedEvent {
    type: "key" | "mouse" | "paste" | "resize";
    detail: string;
    timestamp: number;
}
/**
 * Creates an event logger with a fixed-capacity ring buffer.
 *
 * @param maxEvents - Maximum number of events to retain (default: 20).
 */
export declare function createEventLogger(maxEvents?: number): {
    log: (event: LoggedEvent) => void;
    getEvents: () => readonly LoggedEvent[];
    clear: () => void;
};
//# sourceMappingURL=event-logger.d.ts.map