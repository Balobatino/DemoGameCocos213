import { TypedEvent } from "../../../Utils/TypedEvent";
const { ccclass, property } = cc._decorator;

/**
 * Inspector group for UI references used by GameLevelSelectItem.
 */
@ccclass("GameLevelSelectItemUIReference")
export class UIReference {
    @property(cc.Button)
    public selectButton: cc.Button = null;

    @property(cc.Label)
    public levelLabel: cc.Label = null;

    @property(cc.Node)
    public lockedIcon: cc.Node = null;

    @property(cc.Node)
    public backgroundLocked: cc.Node = null;

    @property(cc.Node)
    public backgroundUnlocked: cc.Node = null;
}

/**
 * GameLevelSelectItem: Represents a selectable level item.
 * Exposes `onSelected` so consumers can react when this item is chosen.
 */
@ccclass
export class LevelSelectItem extends cc.Component {
    //------------------------------
    // Exposed inspector properties

    /** Numeric index representing the level. Set in inspector or by code. */
    public levelIndex = -1;

    /**
     * Grouped UI references for this item. Assign the button, label and star nodes
     * in the inspector under this object for better organization.
     */
    @property(UIReference)
    public uiRef: UIReference = new UIReference();

    //------------------------------
    // Public events

    /** Event fired when this item is selected. Payload: levelIndex (number). */
    public readonly onSelected = new TypedEvent<number>();

    //------------------------------
    // Lifecycle

    onLoad(): void {
        this.registerButtonClick();
    }

    onDestroy(): void {
        this.unregisterButtonClick();
        // Clear any remaining listeners attached to this event.
        this.onSelected.clear();
    }

    //-----------------------------
    // Public Methods

    /**
     * Set basic info for this level item.
     * @param index - zero-based level index
     */
    public setLevelIndex(index: number): void {
        this.levelIndex = index;

        if (this.uiRef.levelLabel) {
            // Display human-friendly 1-based level number
            this.uiRef.levelLabel.string = String(index + 1);
        }
    }

    /**
     * Set or clear the locked visual state for this item.
     * When locked, the `lockedIcon` node is enabled and the `selectButton` is disabled.
     * @param isLocked - true to lock (disable interaction), false to unlock
     */
    public setActiveLock(isLocked: boolean): void {
        if (this.uiRef.lockedIcon) {
            this.uiRef.lockedIcon.active = isLocked;
        }

        if (this.uiRef.backgroundLocked) {
            this.uiRef.backgroundLocked.active = isLocked;
        }

        if (this.uiRef.backgroundUnlocked) {
            this.uiRef.backgroundUnlocked.active = !isLocked;
        }

        if (this.uiRef.levelLabel) {
            this.uiRef.levelLabel.node.active = !isLocked;
        }

        if (this.uiRef.selectButton) {
            this.uiRef.selectButton.interactable = !isLocked;
        }
    }

    //------------------------------
    // Private

    private registerButtonClick(): void {
        if (this.uiRef.selectButton) {
            this.uiRef.selectButton.node.on(cc.Node.EventType.TOUCH_END, this.handleSelectClicked, this);
            return;
        }

        // If no Button assigned, warn so caller can attach a handler another way.
        console.warn(`GameLevelSelectItem: 'uiRef.selectButton' not assigned for node '${this.node.name}'.`);
    }

    private unregisterButtonClick(): void {
        if (this.uiRef.selectButton) {
            this.uiRef.selectButton.node.off(cc.Node.EventType.TOUCH_END, this.handleSelectClicked, this);
        }
    }

    private handleSelectClicked(): void {
        // Dispatch the level index to listeners.
        this.onSelected.invoke(this.levelIndex);
    }
}
