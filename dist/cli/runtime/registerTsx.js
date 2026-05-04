let registered = false;
export async function registerTsx() {
    if (registered)
        return;
    try {
        const { register } = await import("tsx/esm/api");
        register();
        registered = true;
    }
    catch { }
}
//# sourceMappingURL=registerTsx.js.map