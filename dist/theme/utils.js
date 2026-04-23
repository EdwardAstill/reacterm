export function isPlainObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function deepMerge(base, overrides) {
    const result = { ...base };
    const over = overrides;
    for (const key of Object.keys(over)) {
        // Prototype pollution protection
        if (key === "__proto__" || key === "constructor" || key === "prototype")
            continue;
        const baseVal = result[key];
        const overVal = over[key];
        if (isPlainObject(baseVal) && isPlainObject(overVal)) {
            result[key] = deepMerge(baseVal, overVal);
        }
        else {
            result[key] = overVal;
        }
    }
    return result;
}
//# sourceMappingURL=utils.js.map