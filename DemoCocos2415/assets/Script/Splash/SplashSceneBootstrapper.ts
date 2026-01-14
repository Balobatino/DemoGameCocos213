const { ccclass, property } = cc._decorator;
import { Singleton } from "../Standard/Singleton";
import { SplashLoadingCover } from "./SplashLoadingCover";
import { SplashLoadingBar } from "./SplashLoadingBar";

/**
 * Bootstraps the splash scene sequence.
 *
 * Sequence (per design):
 *  - Immediately set a black full-screen cover.
 *  - Wait 0.5s, then fade out the cover.
 *  - Wait for fade-out to complete and for `splashDuration`.
 *  - Fade the cover back in, then load the "Main" scene.
 */
@ccclass
export class SplashSceneBootstrapper extends Singleton<SplashSceneBootstrapper> {
    // Duration of the splash hold (in seconds).
    @property(cc.Float)
    splashDuration: number = 2.0;

    protected doOnStart(): void {
        // Start the full async splash flow without blocking the engine.
        // console.log('SplashSceneBootstrapper: doOnStart called.');
        void this.runProcess();
    }

    // Small helper to await a number of milliseconds.
    private sleep(milliseconds: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    }

    // The async splash flow described above.
    private async runProcess(): Promise<void> {
        const now = () => Date.now() / 1000;
        const loadingCover = SplashLoadingCover.getInstance<SplashLoadingCover>();
        // warn if no loading cover is present.
        if (!loadingCover) {
            console.warn("SplashLoadingCover singleton instance not found in Splash scene.");
        }

        // Ensure the cover is immediately black and opaque at scene open.
        if (loadingCover) {
            loadingCover.coverScreen();
            // console.log(`SplashLoadingCover: coverScreen called. time ${now()}`);
        }

        // Initial short delay so the opaque cover is visible briefly.
        await this.sleep(500);

        // Fade out to reveal the splash content.
        if (loadingCover) {
            // console.log(`SplashLoadingCover: runFadeOut called. time ${now()}`);
            loadingCover.runFadeOut();
            // Wait for the fade out animation to finish.
            await this.sleep(loadingCover.fadeAnimationDuration * 1000);
        }

        // After fade-out, run the loading bar fake progress if present.
        const loadingBar = SplashLoadingBar.getInstance<SplashLoadingBar>();
        if (loadingBar) {
            console.log(`SplashLoadingBar: fakeLoadingProgress starting. time ${now()}`);
            await loadingBar.fakeLoadingProgress();
        } else {
            console.warn("SplashLoadingBar singleton instance not found in Splash scene.");
        }

        // Keep the splash visible for the configured duration.
        // console.log(`SplashSceneBootstrapper: waiting splash duration ${this.splashDuration}s.`);
        await this.sleep(this.splashDuration * 300);

        // Fade back to opaque before switching scenes.
        if (loadingCover) {
            // console.log(`SplashLoadingCover: runFadeIn called. time ${now()}`);
            loadingCover.runFadeIn();
            await this.sleep(loadingCover.fadeAnimationDuration * 1000);
        }

        // Finally load the main scene.
        // console.log('SplashSceneBootstrapper: loading Main scene.');
        cc.director.loadScene("Main");
    }
}
