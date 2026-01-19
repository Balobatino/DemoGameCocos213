const { ccclass, property } = cc._decorator;

/**
 * Difficulty modes for the game.
 */
export enum DifficultMode {
    Easy = 0,
    Normal,
    Hard,
}

/**
 * Class representing user selection criteria.
 * Similar to LevelSelectPage data classes.
 */
@ccclass("UserSelection")
export class UserSelection {
    @property({ type: cc.Enum(DifficultMode) })
    public difficultMode: DifficultMode = DifficultMode.Easy;

    @property(cc.Integer)
    public selectLevel: number = 0;

    public reset(): void {
        this.difficultMode = DifficultMode.Easy;
        this.selectLevel = 0;
    }
}

/**
 * Class representing game-specific statistics.
 */
@ccclass("Stats")
export class Stats {
    /**
     * The index of the current note being processed/played.
     */
    public currentNoteIndex: number = 0;

    public reset(): void {
        this.currentNoteIndex = 0;
    }
}

/**
 * Global class for managing game statistics and user selection.
 * This is a normal class (non-Component).
 */
export default class GameStats {
    public static userSelect: UserSelection = new UserSelection();
    public static stats: Stats = new Stats();

    /**
     * Resets statistics for a new game session.
     */
    public static resetStatsForNewGame(): void {
        this.stats.reset();
        this.userSelect.reset();
    }
}
