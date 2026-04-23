export function matchKeySpec(event, spec) {
    if (event.key !== spec.key)
        return false;
    if ((spec.ctrl ?? false) !== event.ctrl)
        return false;
    if ((spec.shift ?? false) !== event.shift)
        return false;
    if ((spec.meta ?? false) !== event.meta)
        return false;
    return true;
}
//# sourceMappingURL=key-utils.js.map