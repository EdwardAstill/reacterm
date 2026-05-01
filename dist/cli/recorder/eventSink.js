export class EventSink {
    events = [];
    start = Date.now();
    push(key) {
        this.events.push({ t: Date.now() - this.start, kind: "key", key });
    }
}
//# sourceMappingURL=eventSink.js.map