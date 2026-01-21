import { Singleton } from "../../../Standard/Singleton";
import { UIPage } from "../../../Standard/UIPage/UIPage";
import { GameMainPage } from "../GameMainPage";
import { LevelSelectPage } from "../LevelSelectPage/LevelSelectPage";
import FinishPreviousLevelToUnlockPage from "../FinishPreviousLevelToUnlockPage";
import GameStats, { DifficultMode } from "../../GameStats/GameStats";
import GameModeItem from "./GameModeItem";
import { UserScoreLoadSave } from "../../../UserScoreLoadSave/UserScoreLoadSave";

const { ccclass, property } = cc._decorator;

/**
 * Inspector group for Game Mode Page UI references.
 */
@ccclass("GameModePageUIReference")
export class UIReference {
    @property({ type: cc.Button })
    public backButton: cc.Button | null = null;

    @property({ type: GameModeItem })
    public easyModeItem: GameModeItem | null = null;

    @property({ type: GameModeItem })
    public mediumModeItem: GameModeItem | null = null;

    @property({ type: GameModeItem })
    public hardModeItem: GameModeItem | null = null;
}

/**
 * GameModePage: Singleton that manages the game mode selection UI page.
 */
@ccclass
export class GameModePage extends Singleton<GameModePage> {
    //------------------------------
    //---- Constants
    public static readonly levelPerDifficult = 10;
    public static readonly minLevelToUnlockNextMode = 3;

    //------------------------------
    //---- Inspector grouped UI references
    @property({ type: UIReference })
    public uiRef: UIReference = new UIReference();

    //------------------------------
    //--- Private Properties
    // Cached UIPage component for the mode selection page.
    private uiPage: UIPage | null = null;

    private itemUnsubscribes: Map<GameModeItem, () => void> = new Map();

    //------------------------------
    //--- Lifecycle Methods

    /**
     * Load-time initialization hook for the singleton.
     * Finds the UIPage component and registers button handlers.
     */
    protected doOnLoad(): void {
        this.cacheComponents();
        this.registerButtonHandlers();
        this.registerUiPageEvents();
    }

    //------------------------------
    //--- Public Methods
    /**
     * Return the cached UIPage instance, or null when not available.
     */
    public getUiPage(): UIPage | null {
        return this.uiPage;
    }

    /**
     * Configure mode items based on saved progress and difficulty rules.
     */
    public configContentForDifficultMode(): void {
        // Easy Mode: Always unlocked.
        const easyScore = UserScoreLoadSave.getScore(DifficultMode.Easy);
        if (this.uiRef.easyModeItem) {
            this.uiRef.easyModeItem.setLockStatus(false);
            this.uiRef.easyModeItem.setProgress(easyScore / GameModePage.levelPerDifficult);
        }

        // Medium (Normal) Mode: Unlocked if easyScore reaches required minimum.
        const mediumScore = UserScoreLoadSave.getScore(DifficultMode.Normal);
        if (this.uiRef.mediumModeItem) {
            const isLocked = easyScore < GameModePage.minLevelToUnlockNextMode;
            this.uiRef.mediumModeItem.setLockStatus(isLocked);
            this.uiRef.mediumModeItem.setProgress(mediumScore / GameModePage.levelPerDifficult);
        }

        // Hard Mode: Unlocked if mediumScore reaches required minimum.
        const hardScore = UserScoreLoadSave.getScore(DifficultMode.Hard);
        if (this.uiRef.hardModeItem) {
            const isLocked = mediumScore < GameModePage.minLevelToUnlockNextMode;
            this.uiRef.hardModeItem.setLockStatus(isLocked);
            this.uiRef.hardModeItem.setProgress(hardScore / GameModePage.levelPerDifficult);
        }
    }

    //------------------------------
    //--- Private

    private cacheComponents(): void {
        // Try to get UIPage on this node first, then search children.
        const onNode = this.node.getComponent(UIPage);
        if (onNode) {
            this.uiPage = onNode;
            return;
        }

        const inChildren = this.node.getComponentsInChildren(UIPage);
        this.uiPage = inChildren && inChildren.length > 0 ? inChildren[0] : null;

        if (!this.uiPage) {
            console.error(`GameModePage: UIPage component not found on node "${this.node.name}" or its children.`);
        }
    }

    private registerUiPageEvents(): void {
        const uiPage = this.getUiPage();
        if (!uiPage) return;

        uiPage.onShowStart.add(() => {
            this.configContentForDifficultMode();
        });
    }

    private registerButtonHandlers(): void {
        // Back button
        const backBtn = this.uiRef.backButton;
        if (backBtn) {
            backBtn.node.on(cc.Node.EventType.TOUCH_END, this.onBackButtonClicked, this);
        } else {
            console.warn("GameModePage: backButton is not assigned in the inspector.");
        }

        // Mode items
        const itemConfigs = [
            { item: this.uiRef.easyModeItem, handler: () => this.onEasyModeClicked() },
            { item: this.uiRef.mediumModeItem, handler: () => this.onMediumModeClicked() },
            { item: this.uiRef.hardModeItem, handler: () => this.onHardModeClicked() },
        ];

        itemConfigs.forEach((config) => {
            if (config.item) {
                const unsub = config.item.onSelected.add(config.handler);
                this.itemUnsubscribes.set(config.item, unsub);
            }
        });
    }

    /**
     * Handler for the Back button click event.
     * Hides this page and returns to the main page.
     */
    private onBackButtonClicked(): void {
        const uiPage = this.getUiPage();

        // Guard: missing UIPage
        if (!uiPage) {
            console.warn("GameModePage: UIPage component not found; cannot call hide().");
            return;
        }

        // hide the mode selection page
        uiPage.hide();

        // Delay 75% of hide duration before reopening the main page
        const delay = uiPage.getHideDuration() * 0.75;
        this.scheduleOnce(() => {
            // reopen the main page
            const gameMainPage = GameMainPage.getInstance<GameMainPage>();
            if (!gameMainPage) {
                console.warn("GameMainPage singleton instance not found in Main scene.");
                return;
            }

            const mainUiPage = gameMainPage.getUiPage();
            if (mainUiPage) {
                mainUiPage.show();
            } else {
                console.warn("GameMainPage: UIPage component not found; cannot call show().");
            }
        }, delay);
    }

    private onEasyModeClicked(): void {
        console.log("GameModePage: Easy Mode selected");
        this.navigateToLevelSelect(DifficultMode.Easy);
    }

    private onMediumModeClicked(): void {
        console.log("GameModePage: Medium Mode selected");
        if (this.uiRef.mediumModeItem && this.uiRef.mediumModeItem.getLockedStatus()) {
            this.showUnlockWarningPage();
            return;
        }
        this.navigateToLevelSelect(DifficultMode.Normal);
    }

    private onHardModeClicked(): void {
        console.log("GameModePage: Hard Mode selected");
        if (this.uiRef.hardModeItem && this.uiRef.hardModeItem.getLockedStatus()) {
            this.showUnlockWarningPage();
            return;
        }
        this.navigateToLevelSelect(DifficultMode.Hard);
    }

    /**
     * Helper to show the unlock warning page for locked difficulty modes.
     */
    private showUnlockWarningPage(): void {
        const unlockPage = FinishPreviousLevelToUnlockPage.getInstance<FinishPreviousLevelToUnlockPage>();
        if (!unlockPage) {
            console.warn("GameModePage: FinishPreviousLevelToUnlockPage singleton instance not found.");
            return;
        }

        const uiPage = unlockPage.getUiPage();
        if (uiPage) {
            uiPage.show();
        } else {
            console.warn("GameModePage: FinishPreviousLevelToUnlockPage found but has no UIPage component.");
        }
    }

    /**
     * Hides this page and opens the Level Select page after a 75% hide duration delay.
     * @param mode - selected difficulty mode
     */
    private navigateToLevelSelect(mode: DifficultMode): void {
        const uiPage = this.getUiPage();
        if (!uiPage) {
            console.warn("GameModePage: UIPage component not found; cannot call hide().");
            return;
        }

        // update global selection state
        GameStats.userSelect.difficultMode = mode;

        uiPage.hide();

        const delay = uiPage.getHideDuration() * 0.75;
        this.scheduleOnce(() => {
            const levelSelectPage = LevelSelectPage.getInstance<LevelSelectPage>();
            if (!levelSelectPage) {
                console.warn("LevelSelectPage singleton instance not found.");
                return;
            }

            // Notify LevelSelectPage that the difficulty mode has changed
            levelSelectPage.onDifficultModeChanged();

            const levelUiPage = levelSelectPage.getUiPage();
            if (levelUiPage) {
                levelUiPage.show();
            } else {
                console.warn("LevelSelectPage: UIPage component not found; cannot call show().");
            }
        }, delay);
    }

    //------------------------------
    //--- Cleanup

    /**
     * Clean up registered button listeners to avoid duplicate handlers on reload.
     */
    protected onDestroy(): void {
        const backBtn = this.uiRef.backButton;
        if (backBtn) {
            backBtn.node.off(cc.Node.EventType.TOUCH_END, this.onBackButtonClicked, this);
        }

        // Unsubscribe all item listeners
        this.itemUnsubscribes.forEach((unsubscribe) => {
            unsubscribe();
        });
        this.itemUnsubscribes.clear();
    }
}
