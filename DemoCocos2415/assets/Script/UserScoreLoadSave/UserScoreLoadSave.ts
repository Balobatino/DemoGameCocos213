// const { ccclass } = cc._decorator;

/**
 * Simple utility to save and load per-mode user scores.
 * Uses `cc.sys.localStorage` so it works across web and native targets.
 */
export class UserScoreLoadSave {
    // ----------------------------------------
    // ------- Constants
    // These remain at class scope because they are shared between save and load methods.

    private static readonly DIFFICULT_PREFIXES = ["Easy", "Normal", "Hard"];
    private static readonly STORAGE_KEY_PREFIX = "UserScore_";

    // ----------------------------------------
    // ------- Public static

    /**
     * Save player's progress for a specific difficulty mode.
     * @param difficultMode - 0: Easy, 1: Normal, 2: Hard
     * @param progress - progress to save
     */
    public static saveScore(difficultMode: number, progress: number): void {
        const modeName = this.getModeName(difficultMode);
        const key = this.getStorageKey(modeName);
        const scoreData = `${modeName}_${progress}`;

        cc.sys.localStorage.setItem(key, scoreData);
    }

    /**
     * Get saved progress for a specific difficulty mode.
     * @param difficultMode - 0: Easy, 1: Normal, 2: Hard
     * @returns the progress value as an integer
     */
    public static getScore(difficultMode: number): number {
        const modeName = this.getModeName(difficultMode);
        const key = this.getStorageKey(modeName);
        const data = cc.sys.localStorage.getItem(key);

        if (!data) {
            return 0;
        }

        // data format: <modeName>_<progress>
        const parts = data.split("_");
        if (parts.length < 2) {
            return 0;
        }

        const progress = parseInt(parts[1], 10);
        return isNaN(progress) ? 0 : progress;
    }

    // ----------------------------------------
    // ------- Private static

    /**
     * Get the string prefix for a difficulty mode index.
     * @param difficultMode - index of the mode
     */
    private static getModeName(difficultMode: number): string {
        if (difficultMode >= 0 && difficultMode < this.DIFFICULT_PREFIXES.length) {
            return this.DIFFICULT_PREFIXES[difficultMode];
        }
        // warning
        console.warn(`UserScoreLoadSave: Unknown difficulty mode index ${difficultMode}`);
        return "Unknown";
    }

    /**
     * Get the storage key for a mode name.
     * @param modeName - name of the mode
     */
    private static getStorageKey(modeName: string): string {
        return this.STORAGE_KEY_PREFIX + modeName;
    }

    //----------------------------------------
    //------- Cheat Methods

    /**
     * Cheat: Unlock/finish all difficulty modes by setting progress to 10.
     */
    public static cheatFinishAllMode(): void {
        for (let i = 0; i < this.DIFFICULT_PREFIXES.length; i++) {
            this.saveScore(i, 10);
        }
    }

    /**
     * Cheat: Reset all difficulty modes by setting progress to 0.
     */
    public static cheatResetAllMode(): void {
        for (let i = 0; i < this.DIFFICULT_PREFIXES.length; i++) {
            this.saveScore(i, 0);
        }
    }
}
