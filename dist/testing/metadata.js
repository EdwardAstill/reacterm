export function screenHash(output) {
    let hash = 2166136261;
    for (let i = 0; i < output.length; i++) {
        hash ^= output.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return `h${(hash >>> 0).toString(16)}`;
}
export function createFrame(index, output, styledOutput, width, height) {
    return {
        index,
        output,
        styledOutput,
        screenHash: screenHash(output),
        width,
        height,
    };
}
export function collectTestMetadata(options) {
    const semanticNodes = [];
    let nextId = 0;
    for (const child of options.root.children) {
        collectNode(child, semanticNodes, () => `node-${nextId++}`);
    }
    return {
        frames: [...options.frames],
        semanticNodes,
        focusableEntries: Array.from(options.renderContext.focus.entries.values()).map(toTestFocusableEntry),
        focusedId: options.renderContext.focus.focused,
        warnings: [...options.warnings],
        errors: [...options.errors],
        screenHash: options.screenHash,
    };
}
function collectNode(node, out, nextId) {
    if (node.type === "TEXT_NODE")
        return node.text;
    const childText = node.children.map((child) => collectNode(child, out, nextId)).join("");
    const role = stringProp(node.props, "role");
    const label = stringProp(node.props, "aria-label");
    const testId = stringProp(node.props, "testId") ??
        stringProp(node.props, "data-testid") ??
        stringProp(node.props, "dataTestId");
    const focusId = stringProp(node.props, "_focusId");
    if (role !== undefined || label !== undefined || testId !== undefined || focusId !== undefined) {
        const semanticNode = {
            id: nextId(),
            type: node.type,
            text: childText,
            bounds: layoutBounds(node),
            props: copyPublicProps(node.props),
        };
        if (role !== undefined)
            semanticNode.role = role;
        if (label !== undefined)
            semanticNode.label = label;
        if (testId !== undefined)
            semanticNode.testId = testId;
        if (focusId !== undefined)
            semanticNode.focusId = focusId;
        out.push(semanticNode);
    }
    return childText;
}
function layoutBounds(node) {
    const layout = node.layoutNode.layout;
    return {
        x: layout.x,
        y: layout.y,
        width: layout.width,
        height: layout.height,
    };
}
function toTestFocusableEntry(entry) {
    const out = {
        id: entry.id,
        type: entry.type,
        bounds: { ...entry.bounds },
    };
    if (entry.disabled !== undefined)
        out.disabled = entry.disabled;
    if (entry.tabIndex !== undefined)
        out.tabIndex = entry.tabIndex;
    if (entry.groupId !== undefined)
        out.groupId = entry.groupId;
    return out;
}
function stringProp(props, key) {
    const value = props[key];
    return typeof value === "string" ? value : undefined;
}
function copyPublicProps(props) {
    const out = {};
    for (const [key, value] of Object.entries(props)) {
        if (key === "children")
            continue;
        if (typeof value === "function")
            continue;
        out[key] = value;
    }
    return out;
}
//# sourceMappingURL=metadata.js.map