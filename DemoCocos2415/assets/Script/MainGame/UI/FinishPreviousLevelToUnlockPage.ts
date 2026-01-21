import { Singleton } from "../../Standard/Singleton";
import { UIPage } from "../../Standard/UIPage/UIPage";

const { ccclass, property } = cc._decorator;

/**
 * Inspector group for FinishPreviousLevelToUnlockPage UI references.
 */
@ccclass("FinishPreviousLevelToUnlockPageUIReference")
export class UIReference {
    @property({ type: cc.Button })
    public okayButton: cc.Button | null = null;
}

/**
 * FinishPreviousLevelToUnlockPage: Singleton that manages the page shown when a user tries to access a locked level.
 */
@ccclass
export default class FinishPreviousLevelToUnlockPage extends Singleton<FinishPreviousLevelToUnlockPage> {
    //------------------------------
    //---- Inspector grouped UI references
    @property({ type: UIReference })
    public uiRef: UIReference = new UIReference();

    //------------------------------
    //--- Private Properties
    // Cached UIPage component for the page.
    private uiPage: UIPage | null = null;

    //------------------------------
    //--- Lifecycle Methods

    /**
     * Load-time initialization hook for the singleton.
     * Finds the UIPage component and registers button handlers.
     */
    protected doOnLoad(): void {
        this.cacheComponents();
        this.registerButtonHandlers();
    }

    //------------------------------
    //--- Public Methods

    /**
     * Return the cached UIPage instance, or null when not available.
     */
    public getUiPage(): UIPage | null {
        return this.uiPage;
    }

    //------------------------------
    //--- Private

    /**
     * Searches for and caches the UIPage component.
     */
    private cacheComponents(): void {
        // Try to get UIPage on this node first, then search children.
        const onNode = this.node.getComponent(UIPage);
        if (onNode) {
            this.uiPage = onNode;
            return;
        }

        const inChildren = this.node.getComponentsInChildren(UIPage);
        this.uiPage = inChildren && inChildren.length > 0 ? inChildren[0] : null;

        if (!this.uiPage) {
            console.error(`FinishPreviousLevelToUnlockPage: UIPage component not found on node "${this.node.name}" or its children.`);
        }
    }

    /**
     * Registers event handlers for UI buttons.
     */
    private registerButtonHandlers(): void {
        if (this.uiRef.okayButton) {
            this.uiRef.okayButton.node.on("click", this.onOkayButtonClicked, this);
        }
    }

    /**
     * Handler for the okay button.
     * Hides the page and moves it to the background (sibling index 0) after hide duration.
     */
    private onOkayButtonClicked(): void {
        if (!this.uiPage) return;

        // Start the hide animation/process.
        this.uiPage.hide();

        const hideDuration = this.uiPage.getHideDuration();

        // Use a sequence of actions (delay -> move to back) to ensure
        // the page doesn't block other elements after it disappears.
        // Why: hide() only sets opacity to 0, it doesn't disable the node or its blockers.
        this.node.runAction(
            cc.sequence(
                cc.delayTime(hideDuration),
                cc.callFunc(() => {
                    this.node.setSiblingIndex(0);
                }),
            ),
        );
    }

    //------------------------------
    //--- Cleanup

    /**
     * Clean up registered listeners.
     */
    protected onDestroy(): void {
        if (this.uiRef.okayButton) {
            this.uiRef.okayButton.node.off("click", this.onOkayButtonClicked, this);
        }
        // Always call super to handle static instance cleanup in Singleton.
        super.onDestroy();
    }
}
