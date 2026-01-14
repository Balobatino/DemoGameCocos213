const { ccclass, property } = cc._decorator;
import { BaseUIElementAnimation } from "../BaseUIElementAnimation";
import { EasingType, EasingMap } from "./AnimationMapCache";

/**
 * UIElementScaleAnimation
 *
 * Exposes show/hide animation parameters (duration, easing, from/to scale)
 * and provides public `show()` / `hide()` methods which use the project's
 * centralized `EasingMap` and Cocos' `tween` system.
 */
@ccclass
export class UIElementScaleAnimation extends BaseUIElementAnimation {
    // Show animation configuration
    @property
    public showDuration: number = 0.2;

    // Delay before the show animation starts (seconds).
    @property
    public showDelay: number = 0;

    @property({ type: cc.Enum(EasingType) })
    public showEasing: EasingType = EasingType.Linear;

    @property
    public showFromScale: cc.Vec2 = new cc.Vec2(0, 0);

    @property
    public showToScale: cc.Vec2 = new cc.Vec2(1, 1);

    // Hide animation configuration
    @property
    public hideDuration: number = 0.15;

    // Delay before the hide animation starts (seconds).
    @property
    public hideDelay: number = 0;

    @property({ type: cc.Enum(EasingType) })
    public hideEasing: EasingType = EasingType.Linear;

    @property
    public hideFromScale: cc.Vec2 = new cc.Vec2(1, 1);

    @property
    public hideToScale: cc.Vec2 = new cc.Vec2(0, 0);

    // Track active tween so we can cancel/replace it when necessary.
    private _activeTween: any = null;

    /**
     * Play the show animation on this node.
     * Optionally provide `onComplete` to be called when animation finishes.
     */
    public show(onComplete?: () => void): void {
        if (!this.node) return;

        // Cancel any in-progress tween
        if (this._activeTween) {
            this._activeTween.stop();
            this._activeTween = null;
        }

        const from = this.showFromScale;
        const to = this.showToScale;
        // Cocos 2.x uses a uniform numeric scale on nodes; preserve x/y and use z=1 for 3D calls.
        const z = 1;

        // Immediately set to the "from" scale so the animation starts from there.
        this.node.setScale(from.x, from.y, z);

        const t = cc
            .tween(this.node)
            .delay(this.showDelay)
            .to(this.showDuration, { scale: new cc.Vec3(to.x, to.y, z) }, { easing: EasingMap.get(this.showEasing) })
            .call(() => {
                this._activeTween = null;
                if (onComplete) onComplete();
            });

        this._activeTween = t;
        t.start();
    }

    /**
     * Play the hide animation on this node.
     * Optionally provide `onComplete` to be called when animation finishes.
     */
    public hide(onComplete?: () => void): void {
        if (!this.node) return;

        // Cancel any in-progress tween
        if (this._activeTween) {
            this._activeTween.stop();
            this._activeTween = null;
        }

        const from = this.hideFromScale;
        const to = this.hideToScale;
        // Cocos 2.x uses a uniform numeric scale on nodes; preserve x/y and use z=1 for 3D calls.
        const z = 1;

        // Immediately set to the "from" scale so the animation starts from there.
        this.node.setScale(from.x, from.y, z);

        const t = cc
            .tween(this.node)
            .delay(this.hideDelay)
            .to(this.hideDuration, { scale: new cc.Vec3(to.x, to.y, z) }, { easing: EasingMap.get(this.hideEasing) })
            .call(() => {
                this._activeTween = null;
                if (onComplete) onComplete();
            });
        this._activeTween = t;
        t.start();
    }

    // Ensure compatibility with BaseUIElementAnimation hooks
    public playShowAnimation(): void {
        this.show();
    }

    public playHideAnimation(): void {
        this.hide();
    }

    // Report total durations (including delays)
    public getShowDuration(): number {
        return this.showDelay + this.showDuration;
    }

    public getHideDuration(): number {
        return this.hideDelay + this.hideDuration;
    }
}
