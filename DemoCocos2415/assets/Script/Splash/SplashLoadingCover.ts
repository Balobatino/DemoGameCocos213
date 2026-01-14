const { ccclass, property } = cc._decorator;
import { Singleton } from "../Standard/Singleton";

/**
 * Component that manages a full-screen splash loading cover with fade-in and fade-out animations.
 */
@ccclass
export class SplashLoadingCover extends Singleton<SplashLoadingCover> {
    //--------------------------
    //--------- Properties -----

    // Reference to the full-screen cover sprite (assign in the editor).
    @property(cc.Sprite)
    screenCover: cc.Sprite | null = null;

    // Duration (in seconds) for fade animations.
    @property(cc.Float)
    fadeAnimationDuration: number = 0.5;

    //------------------------------
    //--------- Private Members
    // Internal reference to the current active Tween so it can be stopped.
    private _activeTween: any | null = null;

    //------------------------------
    //--------- Lifecycle Methods
    protected doOnDestroy(): void {
        // Clean up any active tween on destroy.
        this.cancelFade();
    }

    protected doOnLoad(): void {
        if (!this.screenCover) return;
        // Ensure the node has an opacity property.
        this.screenCover.node.opacity = 255;
    }

    //------------------------------
    //--------- Public Methods -----

    private getNodeOpacity(): number {
        if (this.screenCover && this.screenCover.node) return this.screenCover.node.opacity;
        return 255;
    }

    private setNodeOpacity(value: number): void {
        if (this.screenCover && this.screenCover.node) {
            this.screenCover.node.opacity = value;
        }
        // Ensure the sprite node color alpha remains fully opaque so opacity controls visibility.
        if (!this.screenCover) return;
        const c = this.screenCover.node.color;
        this.screenCover.node.color = new cc.Color(c.r, c.g, c.b, 255);
    }

    /**
     * Immediately set the cover to black and fully opaque.
     */
    public coverScreen(): void {
        if (!this.screenCover) return;
        // Ensure sprite is black and node is fully opaque.
        this.screenCover.node.color = new cc.Color(0, 0, 0, 255);
        this.setNodeOpacity(255);
    }

    /**
     * Fade the cover from alpha=1 (opaque) to alpha=0 (transparent) over `fadeAnimationDuration` seconds.
     * @param onComplete Optional callback called when the fade finishes.
     */
    public runFadeOut(onComplete?: () => void): void {
        if (!this.screenCover) {
            if (onComplete) onComplete();
            return;
        }

        // Ensure sprite node is black and starts fully opaque.
        this.screenCover.node.color = new cc.Color(0, 0, 0, 255);
        this.setNodeOpacity(255);

        // Stop any active tween.
        if (this._activeTween) {
            this._activeTween.stop();
            this._activeTween = null;
        }

        // Tween the node's opacity directly.
        // console.log(`SplashLoadingCover: runFadeOut started (duration=${this.fadeAnimationDuration}s)`);
        if (!this.screenCover || !this.screenCover.node) {
            if (onComplete) onComplete();
            return;
        }
        const t = cc
            .tween(this.screenCover.node)
            .to(this.fadeAnimationDuration, { opacity: 0 })
            .call(() => {
                this._activeTween = null;
                if (onComplete) onComplete();
            });
        // Set active tween and start it.
        this._activeTween = t;
        t.start();
    }

    /**
     * Fade the cover from alpha=0 (transparent) to alpha=1 (opaque) over `fadeAnimationDuration` seconds.
     * @param onComplete Optional callback called when the fade finishes.
     */
    public runFadeIn(onComplete?: () => void): void {
        if (!this.screenCover) {
            if (onComplete) onComplete();
            return;
        }

        // Ensure sprite node starts black; keep it transparent via node opacity (not color alpha).
        // Setting color alpha to 0 would make the visual stay invisible regardless of opacity.
        this.screenCover.node.color = new cc.Color(0, 0, 0, 255);
        this.setNodeOpacity(0);

        // Stop any active tween.
        if (this._activeTween) {
            this._activeTween.stop();
            this._activeTween = null;
        }

        // Tween the node's opacity directly.
        // console.log(`SplashLoadingCover: runFadeIn started (duration=${this.fadeAnimationDuration}s)`);
        if (!this.screenCover || !this.screenCover.node) {
            if (onComplete) onComplete();
            return;
        }
        const t = cc
            .tween(this.screenCover.node)
            .to(this.fadeAnimationDuration, { opacity: 255 })
            .call(() => {
                this._activeTween = null;
                if (onComplete) onComplete();
            });

        this._activeTween = t;
        t.start();
    }

    /**
     * Cancel any in-progress fade operation.
     */
    public cancelFade(): void {
        if (this._activeTween) {
            this._activeTween.stop();
            this._activeTween = null;
        }
    }
}
