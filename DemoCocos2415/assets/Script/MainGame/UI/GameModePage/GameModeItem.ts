import { TypedEvent } from "../../../Utils/TypedEvent";
const { ccclass, property } = cc._decorator;

/**
 * Inspector group for UI references used by GameModeItem.
 */
@ccclass("GameModeItemUIReference")
export class UIReference {
    @property(cc.Button)
    public mainButton: cc.Button = null;

    @property(cc.Node)
    public iconNormal: cc.Node = null;

    @property(cc.Node)
    public iconLocked: cc.Node = null;

    @property(cc.Node)
    public rootProgress: cc.Node = null;

    @property(cc.Sprite)
    public fillSprite: cc.Sprite = null;
}

/**
 * GameModeItem: Represents a selectable game mode item.
 */
@ccclass
export default class GameModeItem extends cc.Component {
    //------------------------------
    // Exposed inspector properties

    /**
     * Grouped UI references for this item. Assign the button and nodes
     * in the inspector under this object for better organization.
     */
    @property(UIReference)
    public uiRef: UIReference = new UIReference();

    //------------------------------
    // Public events

    /** Event fired when this item is selected. Payload: the item itself. */
    public readonly onSelected = new TypedEvent<GameModeItem>();

    //------------------------------
    // Private variables

    private _isLocked: boolean = false;

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
     * Set the locked status and update the visual state.
     * @param isLocked - true to lock, false to unlock
     */
    public setLockStatus(isLocked: boolean): void {
        this._isLocked = isLocked;

        if (this.uiRef.iconNormal) {
            this.uiRef.iconNormal.active = !isLocked;
        }

        if (this.uiRef.iconLocked) {
            this.uiRef.iconLocked.active = isLocked;
        }

        if (this.uiRef.rootProgress) {
            this.uiRef.rootProgress.active = !isLocked;
        }

        // NOTES : Disable button interaction right when we call page show/hide will disable the button animation
        // that run by UIElements (so far it seem call button.interactable will adjust the size, layout ... or something)
        // lead to animation component will calculate wrong size and make animation broken.
        // try someway, and finally call enable is work well.
        // if (this.uiRef.mainButton) {
        //     this.uiRef.mainButton.enabled = !isLocked;
        // }
    }

    /**
     * Returns the current locked status of the item.
     * @returns boolean - true if locked, false otherwise
     */
    public getLockedStatus(): boolean {
        return this._isLocked;
    }

    /**
     * Set the progress bar value.
     * @param progress - value from 0 to 1
     */
    public setProgress(progress: number): void {
        if (this.uiRef.fillSprite) {
            this.uiRef.fillSprite.fillRange = progress;
        }
    }

    //------------------------------
    // Private

    private registerButtonClick(): void {
        if (this.uiRef.mainButton) {
            this.uiRef.mainButton.node.on(cc.Node.EventType.TOUCH_END, this.handleSelectClicked, this);
            return;
        }

        console.warn(`GameModeItem: 'uiRef.mainButton' not assigned for node '${this.node.name}'.`);
    }

    private unregisterButtonClick(): void {
        if (this.uiRef.mainButton) {
            this.uiRef.mainButton.node.off(cc.Node.EventType.TOUCH_END, this.handleSelectClicked, this);
        }
    }

    private handleSelectClicked(): void {
        // // Only trigger if not locked (safety check, though button interactable also handles this)
        // if (this._isLocked) return;

        // Dispatch this item to listeners (even if locked, so handlers can show "locked" feedback).
        this.onSelected.invoke(this);
    }
}
