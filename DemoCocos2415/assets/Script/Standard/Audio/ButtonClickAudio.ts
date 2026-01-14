const { ccclass, property } = cc._decorator;
import { AudioManager } from "./AudioManager";

@ccclass
export class ButtonClickAudio extends cc.Component {
    //------------------------------
    //--- Inspector Properties

    @property({ type: cc.AudioClip })
    public clickClip: cc.AudioClip | null = null;

    //------------------------------
    //--- Private Properties
    private button: cc.Button | null = null;

    //------------------------------
    //--- Lifecycle Methods

    protected onLoad(): void {
        const btn = this.getComponent(cc.Button);
        if (!btn) return;
        this.button = btn;
        // Cocos 2.x: Buttons trigger touch end on the node
        btn.node.on(cc.Node.EventType.TOUCH_END, this.onButtonClick, this);
    }

    protected onDestroy(): void {
        if (this.button) {
            // Match the event used in onLoad
            this.button.node.off(cc.Node.EventType.TOUCH_END, this.onButtonClick, this);
        }
    }

    //------------------------------
    //--- Private Methods
    private onButtonClick(): void {
        if (!this.clickClip) return;
        const manager = AudioManager.getInstance<AudioManager>();
        if (!manager) return;
        manager.playOnShot(this.clickClip);
    }
}
