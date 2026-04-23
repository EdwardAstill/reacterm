/**
 * Event logger — ring buffer of recent input events for DevTools inspection.
 *
 * Tracks keyboard, mouse, paste, and resize events with timestamps.
 * Maintains a fixed-size buffer (default 20) of the most recent events,
 * newest first.
 */
/**
 * Creates an event logger with a fixed-capacity ring buffer.
 *
 * @param maxEvents - Maximum number of events to retain (default: 20).
 */
export function createEventLogger(maxEvents) {
    const capacity = maxEvents ?? 20;
    const buffer = [];
    return {
        log(event) {
            buffer.unshift(event);
            if (buffer.length > capacity) {
                buffer.length = capacity;
            }
        },
        getEvents() {
            return buffer;
        },
        clear() {
            buffer.length = 0;
        },
    };
}
//# sourceMappingURL=event-logger.js.map