export type RecordedEvent = { t: number; kind: "key"; key: string };

export class EventSink {
  events: RecordedEvent[] = [];
  start = Date.now();
  push(key: string) {
    this.events.push({ t: Date.now() - this.start, kind: "key", key });
  }
}
