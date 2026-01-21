const { ccclass, property } = cc._decorator;
import { UIElement } from "./UIElement";
import { setAsLastSibling } from "../../Utils/NodeUtils";
import { TypedEvent } from "../../Utils/TypedEvent";

/**
 * UIPage: container for a page composed of multiple UIElement components.
 * Drag UIElement component instances into `uiElements` in the inspector.
 */
@ccclass
export class UIPage extends cc.Component {
    //------------------------------
    //------ Properties

    // Whether the page should be hidden when enabled (inspector-visible). Default: true.
    @property({ tooltip: "If true, the page will start hidden (opacity = 0) when enabled." })
    hideByDefault = true;

    // Whether to automatically call `show()` in `onEnable()` when the page is not hidden by default.
    @property({ tooltip: "If true and hideByDefault is false, the page will call show() when enabled." })
    showAtOnEnable = false;

    //------------------------------
    //------ Events

    /** Event fired when the show animation / process starts. */
    public readonly onShowStart = new TypedEvent<UIPage>();

    /** Event fired when the show animation / process completes. */
    public readonly onShowFinish = new TypedEvent<UIPage>();

    /** Event fired when the hide animation / process starts. */
    public readonly onHideStart = new TypedEvent<UIPage>();

    /** Event fired when the hide animation / process completes. */
    public readonly onHideFinish = new TypedEvent<UIPage>();

    //------------------------------
    //------ Private Properties

    // UIElement components assigned via the Cocos Creator inspector.
    private uiElements: UIElement[] = [];

    // Cache duration values. A negative sentinel (-99) indicates the duration has
    // not been computed / cached yet; valid animation durations are expected to be >= 0.
    private cacheShowDuration: number = -99;
    private cacheHideDuration: number = -99;

    // Component used to enable/disable input blocking for this page.
    // This references the BlockInputEvents component on the `blockTouchOnPageUI` child node.
    private inputBlocker: cc.BlockInputEvents | null = null;

    //------------------------------
    //--- Lifecycle Methods
    /**
     * onLoad: ensure `uiElements` contains all `UIElement` components found
     * on this node and its children. If the inspector already provided values,
     * we keep them; otherwise we auto-populate from children for convenience.
     */
    onLoad(): void {
        // Find all UIElement components in this node's hierarchy.
        const found = this.node.getComponentsInChildren(UIElement);
        if (found && found.length > 0) {
            this.uiElements = found;
        } else {
            this.uiElements = [];
        }
        // Ensure default opacity is set explicitly if needed.
        this.node.opacity = 255;

        // Create an input-blocking node to manage interaction for this page.
        this.generateBlockTouchNode();
    }

    //------------------------------
    //------ Lifecycle Methods (continued)

    /**
     * onEnable: apply hide-by-default behavior by setting node opacity to 0 when requested.
     * Uses the cached `uiOpacity` component that is initialized in `onLoad`.
     * If the page is not hidden by default and `showAtOnEnable` is enabled, call `show()`.
     */
    onEnable(): void {
        // Apply hide-by-default using cached uiOpacity (populated in onLoad).
        if (this.hideByDefault) {
            this.node.opacity = 0;
        } else if (this.showAtOnEnable) {
            // When not hidden by default, optionally show the page immediately on enable.
            this.show();
        }
    }

    //------------------------------
    //------ Public Methods

    public show(): void {
        // Reset any pending scheduled callbacks (e.g., a pending hide opacity setter).
        this.unscheduleAllCallbacks();

        // Notify listeners that show process has started.
        this.onShowStart.invoke(this);

        // Block interaction while show animations run.
        this.setActiveInteraction(false);

        // Ensure page is visible immediately by setting node opacity to fully opaque
        // (use cached uiOpacity from onLoad; do not query/add components here).
        this.node.opacity = 255;

        // Ensure this page is rendered above sibling pages by moving it to the
        // last sibling position in the parent.
        setAsLastSibling(this.node);

        for (const element of this.uiElements) {
            element.playShowAnimation();
        }

        const showDuration = Math.max(0, this.getShowDuration());
        if (showDuration === 0) {
            // Re-enable immediately if there is no animation.
            this.setActiveInteraction(true);
            this.onShowFinish.invoke(this);
        } else {
            this.scheduleOnce(() => {
                this.setActiveInteraction(true);
                this.onShowFinish.invoke(this);
            }, showDuration);
        }
    }

    public hide(): void {
        // Reset any pending scheduled callbacks (e.g., a pending hide opacity setter).
        this.unscheduleAllCallbacks();

        // Notify listeners that hide process has started.
        this.onHideStart.invoke(this);

        // Disable interactions immediately while hiding.
        this.setActiveInteraction(false);

        // Ensure page is visible during hide animation by setting node opacity to fully opaque
        // (use cached uiOpacity from onLoad; do not query/add components here).
        this.node.opacity = 255;

        // Keep the same stacking behavior on hide to ensure animations are
        // visible if other UI overlaps during the hide animation.
        setAsLastSibling(this.node);

        for (const element of this.uiElements) {
            element.playHideAnimation();
        }

        // After all hide animations complete, set the page opacity to 0 so the page is fully hidden.
        const hideDuration = Math.max(0, this.getHideDuration());
        if (hideDuration === 0) {
            this.node.opacity = 0;
            this.onHideFinish.invoke(this);
        } else {
            this.scheduleOnce(() => {
                this.node.opacity = 0;
                this.onHideFinish.invoke(this);
            }, hideDuration);
        }
    }

    public getShowDuration(): number {
        if (this.cacheShowDuration >= 0) return this.cacheShowDuration;
        let max = 0;
        for (const element of this.uiElements) {
            const d = element.getShowDuration();
            if (d > max) max = d;
        }
        this.cacheShowDuration = max;
        return max;
    }

    public getHideDuration(): number {
        if (this.cacheHideDuration >= 0) return this.cacheHideDuration;
        let max = 0;
        for (const element of this.uiElements) {
            const d = element.getHideDuration();
            if (d > max) max = d;
        }
        this.cacheHideDuration = max;
        return max;
    }

    //------------------------------
    // Input blocking
    /**
     * generateBlockTouchNode: add a BlockInputEvents to the current node (to prevent
     * touches from falling through to behind this page) and create a child node
     * named `blockTouchOnPageUI` with a `Widget` that covers the page and a
     * `BlockInputEvents` component whose reference is cached in `inputBlocker`.
     */
    private generateBlockTouchNode(): void {
        // Add BlockInputEvents to this node so touches don't go to UI behind this page.
        if (!this.node.getComponent(cc.BlockInputEvents)) {
            this.node.addComponent(cc.BlockInputEvents);
        }

        // Create input-blocking child node
        const blockerNode = new cc.Node("blockTouchOnPageUI");
        const widget = blockerNode.addComponent(cc.Widget);
        // Align to all edges so blocker covers the full page area.
        widget.isAlignLeft = widget.isAlignRight = widget.isAlignTop = widget.isAlignBottom = true;
        widget.left = widget.right = widget.top = widget.bottom = 0;

        // Add BlockInputEvents to the blocker node and cache reference.
        const blocker = blockerNode.addComponent(cc.BlockInputEvents);
        blockerNode.setParent(this.node);
        // Ensure blocker sits above other children so it intercepts events.
        setAsLastSibling(blockerNode);

        // save reference to the blocker component
        this.inputBlocker = blocker;
        this.setActiveInteraction(false);
    }

    /**
     * Enable or disable interactions for this page. This toggles the cached
     * `BlockInputEvents` component on the `blockTouchOnPageUI` child node.
     * @param active - true to enable interactions (component disabled), false to block (component enabled)
     */
    public setActiveInteraction(active: boolean): void {
        if (!this.inputBlocker) return;
        // When the inputBlocker component is enabled it swallows input; invert
        // the meaning to provide intuitive method semantics: active=true => interactions allowed.
        this.inputBlocker.enabled = !active;
    }
}
