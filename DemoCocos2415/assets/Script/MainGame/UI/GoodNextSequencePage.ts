import { Singleton } from "../../Standard/Singleton";
import { UIPage } from "../../Standard/UIPage/UIPage";

const { ccclass, property } = cc._decorator;

/**
 * Inspector group for ListenAndRepeatPage UI references.
 */
@ccclass("GoodNextSequencePageUIReference")
export class UIReference {
    @property({ type: cc.Label })
    public contentText: cc.Label | null = null;
}

/**
 * GoodNextSequencePage: Singleton that manages the good next sequence UI page.
 */
@ccclass
export class GoodNextSequencePage extends Singleton<GoodNextSequencePage> {
    //------------------------------
    //---- Inspector grouped UI references
    @property({ type: UIReference })
    public uiRef: UIReference = new UIReference();

    //------------------------------
    //--- Private Properties
    // Cached UIPage component for the page. May be null if not found.
    private uiPage: UIPage | null = null;

    //------------------------------
    //--- Lifecycle Methods

    /**
     * Load-time initialization hook for the singleton.
     * Finds the UIPage component on this node or its children and caches it.
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

    /**
     * Sets the text displayed in the content label.
     * @param text The string to display.
     */
    public setContentText(text: string): void {
        if (this.uiRef.contentText) {
            this.uiRef.contentText.string = text;
        } else {
            console.warn("ListenAndRepeatPage: contentText label is not assigned.");
        }
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
            console.error(`ListenAndRepeatPage: UIPage component not found on node "${this.node.name}" or its children.`);
        }
    }

    /**
     * Registers event handlers for UI buttons.
     */
    private registerButtonHandlers(): void {
        // Add button registration logic here if needed.
    }

    //------------------------------
    //--- Cleanup

    /**
     * Clean up registered listeners.
     */
    protected onDestroy(): void {
        // Add cleanup logic here if needed.
    }
}
