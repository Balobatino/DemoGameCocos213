import { Singleton } from "../../../Standard/Singleton";
import { UIPage } from "../../../Standard/UIPage/UIPage";
import { GameMainPage } from "../GameMainPage";
import { GameModePage } from "../GameModePage/GameModePage";
import { LevelSelectItem } from "./LevelSelectItem";
import GameStats from "../../GameStats/GameStats";
import { UserScoreLoadSave } from "../../../UserScoreLoadSave/UserScoreLoadSave";
import { PlayGamePage } from "../../GamePlay/PlayGamePage";
const { ccclass, property } = cc._decorator;

/**
 * Grouped data for GameLevelSelectPage similar to LevelGridController:
 * - Data stores the LevelDataStorage prefab reference (set via inspector)
 * - UIReference holds UI refs (kept minimal for now)
 */
@ccclass("GameLevelSelectPageData")
export class Data {}

@ccclass("GameLevelSelectPageUIReference")
export class UIReference {
    @property(cc.Button)
    public closeButton: cc.Button | null = null;
}

/**
 * GameLevelSelectPage: Singleton that manages the level selection UI page.
 */
@ccclass
export class LevelSelectPage extends Singleton<LevelSelectPage> {
    //------------------------------
    //---- expose properties
    @property(Data)
    public data: Data = new Data();

    @property(UIReference)
    public uiRef: UIReference = new UIReference();

    //------------------------------
    //--- Private Properties
    // Cached UIPage component for the level-select page. May be null if not found.
    private uiPage: UIPage | null = null;

    // Map storing unsubscribe functions for item event subscriptions.
    private itemUnsubscribes = new Map<LevelSelectItem, () => void>();

    // Cached list of LevelSelectItem components for quick lookup.
    private gameLevelSelectItems: LevelSelectItem[] = [];

    // Current progress (last unlocked level index) for the selected difficulty mode.
    private currentProgress = 0;

    //------------------------------
    //--- Lifecycle Methods
    protected doOnLoad(): void {
        this.cacheComponents();
        this.registerButtonHandlers();
        this.loadAndRegisterItemListeners();
        this.registerUiPageEvents();
    }

    //------------------------------
    //--- Public Methods
    /**
     **
     * Handler for when the difficulty mode changes. Updates the level locked status.
     */
    public onDifficultModeChanged(): void {
        const mode = GameStats.userSelect.difficultMode;
        this.currentProgress = UserScoreLoadSave.getScore(mode);
        this.refreshLevelItemLockedStatus();
    }

    /**
     * Iterates through all level items and updates their locked/unlocked visual state
     * based on the player's saved progress for the current difficulty mode.
     */
    public refreshLevelItemLockedStatus(): void {
        // update the progress according to current difficult mode
        const mode = GameStats.userSelect.difficultMode;
        this.currentProgress = UserScoreLoadSave.getScore(mode);
        // log the current progress
        console.log(`LevelSelectPage: Current progress for mode "${mode}" is level index ${this.currentProgress}.`);
        // update each item's lock status
        for (const item of this.gameLevelSelectItems) {
            item.setActiveLock(item.levelIndex > this.currentProgress);
        }
    }

    /* Return the cached UIPage instance, or null when not available.
     */
    public getUiPage(): UIPage | null {
        return this.uiPage;
    }

    //------------------------------
    //--- Private

    private cacheComponents(): void {
        this.cacheUIPage();
    }

    private cacheUIPage(): void {
        const onNode = this.node.getComponent(UIPage);
        if (onNode) {
            this.uiPage = onNode;
            return;
        }

        const inChildren = this.node.getComponentsInChildren(UIPage);
        this.uiPage = inChildren && inChildren.length > 0 ? inChildren[0] : null;

        if (!this.uiPage) {
            console.error(`GameLevelSelectPage: UIPage component not found on node "${this.node.name}" or its children.`);
        }
    }

    private registerButtonHandlers(): void {
        // Close button (in UI reference)
        const closeBtn = this.uiRef && this.uiRef.closeButton;
        if (closeBtn) {
            closeBtn.node.on(cc.Node.EventType.TOUCH_END, this.onCloseButtonClicked, this);
        } else {
            console.warn("GameLevelSelectPage: uiRef.closeButton is not assigned in the inspector.");
        }
    }

    /**
     * Handler for the Close button click event.
     * Hides this page and re-opens the level select page.
     */
    private onCloseButtonClicked(): void {
        const uiPage = this.getUiPage();
        if (!uiPage) {
            console.warn("GameLevelSelectPage: UIPage component not found; cannot call hide().");
            return;
        }

        uiPage.hide();

        // Delay 75% of hide duration before reopening the LevelSelectPage
        const delay = uiPage.getHideDuration() * 0.75;
        this.scheduleOnce(() => {
            const gameModePage = GameModePage.getInstance<GameModePage>();
            if (!gameModePage) {
                console.warn("LevelSelectPage: GameModePage singleton instance not found.");
                return;
            }

            const levelUiPage = gameModePage.getUiPage();
            if (levelUiPage) {
                levelUiPage.show();
            } else {
                console.warn("GameModePage: UIPage component not found; cannot call show().");
            }
        }, delay);
    }

    /**
     * Find LevelSelectItem components in children and subscribe to their onSelected events.
     * Keeps unsubscribe functions so we can cleanly remove listeners on destroy.
     */
    private loadAndRegisterItemListeners(): void {
        const items = this.node.getComponentsInChildren(LevelSelectItem);
        if (!items || items.length === 0) {
            this.gameLevelSelectItems = [];
            return;
        }

        // Cache items for fast lookups later.
        this.gameLevelSelectItems = items;

        // Use an indexed loop so we can assign levelIndex based on list order (0-based).
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item) continue;

            // Avoid double-subscribe by checking map
            if (this.itemUnsubscribes.has(item)) continue;

            // Set level index according to the order in the list
            item.setLevelIndex(i);

            const unsubscribe = item.onSelected.add((levelIndex: number) => {
                this.onItemSelected(levelIndex, item);
            });

            this.itemUnsubscribes.set(item, unsubscribe);
        }
    }

    private registerUiPageEvents(): void {
        const uiPage = this.getUiPage();
        if (!uiPage) return;

        uiPage.onShowStart.add(() => {
            this.refreshLevelItemLockedStatus();
        });
    }

    private onItemSelected(levelIndex: number, item: LevelSelectItem): void {
        // Hide this page if available.
        const uiPage = this.getUiPage();
        if (uiPage) {
            uiPage.hide();
        } else {
            console.warn("GameLevelSelectPage: UIPage component not found; cannot call hide().");
        }

        // open the PlayGamePage after a delay
        const delay = uiPage ? uiPage.getHideDuration() * 0.75 : 0;
        this.scheduleOnce(() => {
            const playGamePage = PlayGamePage.getInstance<PlayGamePage>();
            if (!playGamePage) {
                console.warn("LevelSelectPage: PlayGamePage singleton instance not found.");
                return;
            }

            const playUiPage = playGamePage.getUiPage();
            if (playUiPage) {
                playUiPage.show();
                void playGamePage.runStartGameProcess();
            } else {
                console.warn("PlayGamePage: UIPage component not found; cannot call show().");
            }
        }, delay);

        // Save select level index to GameStats and reset stats for new game
        GameStats.userSelect.selectLevel = levelIndex;
    }

    //------------------------------
    //--- Cleanup
    protected onDestroy(): void {
        if (this.uiRef && this.uiRef.closeButton) {
            this.uiRef.closeButton.node.off(cc.Node.EventType.TOUCH_END, this.onCloseButtonClicked, this);
        }

        // Unsubscribe all item listeners
        this.itemUnsubscribes.forEach((unsubscribe) => {
            unsubscribe();
        });
        this.itemUnsubscribes.clear();
        // Clear cached items list
        this.gameLevelSelectItems = [];
    }
}
