let registered = false;

export async function registerTsx(): Promise<void> {
  if (registered) return;
  try {
    const { register } = await import("tsx/esm/api");
    register();
    registered = true;
  } catch {}
}
