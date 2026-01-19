const { ccclass, property } = cc._decorator;
import { BaseUIElementAnimation } from "../BaseUIElementAnimation";
import { EasingType, EasingMap } from "./AnimationMapCache";

/**
 * UIElementFadeAnimation
 *
 * Exposes show/hide animation parameters (duration, easing, from/to alpha)
 * and provides public `show()` / `hide()` methods which use the project's
 * centralized `EasingMap` and Cocos' `tween` system.
 */
@ccclass
export class UIElementFadeAnimation extends BaseUIElementAnimation {
    // Show animation configuration
    @property
    public showDuration: number = 0.2;

    // Delay before the show animation starts (seconds).
    @property
    public showDelay: number = 0;

    @property({ type: cc.Enum(EasingType) })
    public showEasing: EasingType = EasingType.Linear;

    @property
    public showFromAlpha: number = 0;

    @property
    public showToAlpha: number = 1;

    // Hide animation configuration
    @property
    public hideDuration: number = 0.15;

    // Delay before the hide animation starts (seconds).
    @property
    public hideDelay: number = 0;

    @property({ type: cc.Enum(EasingType) })
    public hideEasing: EasingType = EasingType.Linear;

    @property
    public hideFromAlpha: number = 1;

    @property
    public hideToAlpha: number = 0;

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

        const from = this.showFromAlpha * 255;
        const to = this.showToAlpha * 255;

        // Immediately set to the "from" opacity so the animation starts from there.
        this.node.opacity = from;

        const t = cc
            .tween(this.node)
            .delay(this.showDelay)
            .to(this.showDuration, { opacity: to }, { easing: EasingMap.get(this.showEasing) })
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

        const from = this.hideFromAlpha * 255;
        const to = this.hideToAlpha * 255;

        // Immediately set to the "from" opacity so the animation starts from there.
        this.node.opacity = from;

        const t = cc
            .tween(this.node)
            .delay(this.hideDelay)
            .to(this.hideDuration, { opacity: to }, { easing: EasingMap.get(this.hideEasing) })
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
