export const MAX_TREE_DEPTH = 100;
export function flattenVisible(rows, depth = 0, parentIsLast = []) {
    if (depth >= MAX_TREE_DEPTH)
        return [];
    const out = [];
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const isLast = i === rows.length - 1;
        const hasChildren = row.children !== undefined && row.children.length > 0;
        out.push({ row, depth, isLast, parentIsLast: [...parentIsLast], hasChildren });
        if (hasChildren && row.expanded) {
            out.push(...flattenVisible(row.children, depth + 1, [...parentIsLast, isLast]));
        }
    }
    return out;
}
//# sourceMappingURL=TreeTable.flatten.js.map