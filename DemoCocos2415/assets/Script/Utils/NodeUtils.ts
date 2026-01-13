/**
 * setAsLastSibling
 *
 * Move the node to be the last child of its parent so it renders above siblings.
 * Safe no-op if node or parent is missing.
 */
export function setAsLastSibling(node: cc.Node | null | undefined): void {
    if (!node || !node.parent) return;

    const parent = node.parent;
    const lastIndex = parent.children.length - 1;
    if (lastIndex < 0) return;

    // If already last, nothing to do.
    if (node.getSiblingIndex() === lastIndex) return;

    // Use the engine-provided API to set sibling index.
    node.setSiblingIndex(lastIndex);
}
