type Ev = { t: number; kind: "key"; key: string };
type Step = { kind: "press"; keys: string[] } | { kind: "type"; text: string };
const TEXT_KEY = /^.$/u;

export function coalesceKeystrokes(events: Ev[], windowMs: number): Step[] {
  const out: Step[] = [];
  let buf = "";
  let lastT = -Infinity;
  const flush = () => {
    if (buf) {
      out.push({ kind: "type", text: buf });
      buf = "";
    }
  };
  for (const e of events) {
    if (TEXT_KEY.test(e.key) && e.t - lastT <= windowMs) buf += e.key;
    else if (TEXT_KEY.test(e.key)) {
      flush();
      buf = e.key;
    } else {
      flush();
      out.push({ kind: "press", keys: [e.key] });
    }
    lastT = e.t;
  }
  flush();
  return out;
}
