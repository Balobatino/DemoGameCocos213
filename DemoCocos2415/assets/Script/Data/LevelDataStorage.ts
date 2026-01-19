import { DifficultMode } from "../MainGame/GameStats/GameStats";

const { ccclass, property } = cc._decorator;

/**
 * Serializable data object representing configuration for a specific difficulty level.
 */
@ccclass("LevelData")
export class LevelData {
    /**
     * The difficulty mode this data applies to.
     */
    @property({ type: cc.Enum(DifficultMode) })
    public difficultMode: DifficultMode = DifficultMode.Easy;

    /**
     * Number of instruments to use in this difficulty.
     */
    @property(cc.Integer)
    public numberOfInstruments: number = 1;

    /**
     * Minimum length of the note sequence.
     */
    @property(cc.Integer)
    public minSequenceLength: number = 1;

    /**
     * Maximum length of the note sequence.
     */
    @property(cc.Integer)
    public maxSequenceLength: number = 5;

    /**
     * Minimum interval between notes (in seconds).
     */
    @property(cc.Float)
    public minNoteInterval: number = 0.5;

    /**
     * Maximum interval between notes (in seconds).
     */
    @property(cc.Float)
    public maxNoteInterval: number = 1.0;

    /**
     * Number of turns per level for this difficulty.
     */
    @property(cc.Integer)
    public turnPerLevel: number = 10;
}

/**
 * Editor-friendly container for level settings.
 * Attach this component to a Node and configure `levels` in the inspector.
 */
@ccclass
export default class LevelDataStorage extends cc.Component {
    /**
     * Configured list of level settings (editable in the inspector).
     */
    @property([LevelData])
    public levels: LevelData[] = [];

    /**
     * Internal map for fast lookups by difficulty.
     */
    private _levelMap: Map<DifficultMode, LevelData> = null;

    /**
     * Retrieves the LevelData for a given difficulty mode.
     * Uses a map for faster subsequent lookups.
     * @param mode - The requested difficulty mode
     * @returns The associated LevelData or null if not found
     */
    public getLevelConfigForDifficultMode(mode: DifficultMode): LevelData | null {
        // Initialize map on first access
        if (!this._levelMap) {
            this.initializeLevelMap();
        }
        const config = this._levelMap.get(mode);

        // Guard: return null if difficulty is not configured
        if (!config) {
            console.warn(`LevelDataStorage: No LevelData found for difficulty: ${DifficultMode[mode]}`);
            return null;
        }

        return config;
    }

    /**
     * Populates the lookup map from the serialized list.
     */
    private initializeLevelMap(): void {
        this._levelMap = new Map<DifficultMode, LevelData>();
        if (!this.levels) return;

        for (const data of this.levels) {
            // Guard: check for duplicate configuration for the same difficulty.
            if (this._levelMap.has(data.difficultMode)) {
                console.warn(`LevelDataStorage: Duplicate configuration found for difficulty: ${DifficultMode[data.difficultMode]}. Keeping the first entry.`);
                continue;
            }
            this._levelMap.set(data.difficultMode, data);
        }
    }
}
