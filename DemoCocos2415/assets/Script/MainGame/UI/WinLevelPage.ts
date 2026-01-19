import { Singleton } from "../../Standard/Singleton";
import { UIPage } from "../../Standard/UIPage/UIPage";
import { GameModePage } from "./GameModePage/GameModePage";
import { LevelSelectPage } from "./LevelSelectPage/LevelSelectPage";
import { PlayGamePage } from "../GamePlay/PlayGamePage";
import GameStats from "../GameStats/GameStats";

const { ccclass, property } = cc._decorator;

/**
 * Inspector group for Win Level Page UI references.
 */
@ccclass("WinLevelPageUIReference")
export class UIReference {
    @property({ type: cc.Button })
    public levelSelectButton: cc.Button | null = null;

    @property({ type: cc.Button })
    public gameModeSelectButton: cc.Button | null = null;

    @property({ type: cc.Button })
    public nextLevelButton: cc.Button | null = null;
}

/**
 * WinLevelPage: Singleton that manages the level completion UI page.
 */
@ccclass
export default class WinLevelPage extends Singleton<WinLevelPage> {
    //------------------------------
    //---- Inspector grouped UI references
    @property({ type: UIReference })
    public uiRef: UIReference = new UIReference();

    //------------------------------
    //--- Private Properties
    // Cached UIPage component for the win page.
    private uiPage: UIPage | null = null;

    //------------------------------
    //--- Lifecycle Methods

    /**
     * Load-time initialization hook for the singleton.
     * Finds the UIPage component and registers button handlers.
     */
    protected doOnLoad(): void {
        this.cacheComponents();
        this.registerButtonHandlers();
    }

    //------------------------------
    //--- Public Methods

    /**
     * Return the cached UIPage instance, or null when not available.
     */
    public getUiPage(): UIPage | null {
        return this.uiPage;
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
            console.error(`WinLevelPage: UIPage component not found on node "${this.node.name}" or its children.`);
        }
    }

    private registerButtonHandlers(): void {
        const { levelSelectButton, gameModeSelectButton, nextLevelButton } = this.uiRef;

        if (levelSelectButton) {
            levelSelectButton.node.on(cc.Node.EventType.TOUCH_END, this.onLevelSelectClicked, this);
        } else {
            console.warn("WinLevelPage: levelSelectButton is not assigned.");
        }

        if (gameModeSelectButton) {
            gameModeSelectButton.node.on(cc.Node.EventType.TOUCH_END, this.onGameModeSelectClicked, this);
        } else {
            console.warn("WinLevelPage: gameModeSelectButton is not assigned.");
        }

        if (nextLevelButton) {
            nextLevelButton.node.on(cc.Node.EventType.TOUCH_END, this.onNextLevelClicked, this);
        }
    }

    /**
     * Navigates to the Level Select page.
     */
    private onLevelSelectClicked(): void {
        this.navigateToPage(() => LevelSelectPage.getInstance<LevelSelectPage>());
    }

    /**
     * Navigates to the Game Mode selection page.
     */
    private onGameModeSelectClicked(): void {
        this.navigateToPage(() => GameModePage.getInstance<GameModePage>());
    }

    /**
     * Navigates to the next level by incrementing selection and re-entering PlayGamePage.
     */
    private onNextLevelClicked(): void {
        // Reset turn progress and increment the level index
        GameStats.stats.reset();
        GameStats.userSelect.selectLevel++;

        const uiPage = this.getUiPage();
        if (uiPage) {
            uiPage.hide();
        } else {
            console.warn("WinLevelPage: UIPage component not found; cannot call hide().");
        }

        const delay = uiPage ? uiPage.getHideDuration() * 0.75 : 0;
        this.scheduleOnce(() => {
            const playGamePage = PlayGamePage.getInstance<PlayGamePage>();
            if (!playGamePage) {
                console.warn("WinLevelPage: PlayGamePage singleton instance not found.");
                return;
            }

            const playUiPage = playGamePage.getUiPage();
            if (playUiPage) {
                playUiPage.show();
                void playGamePage.runStartGameProcess();
            } else {
                console.warn("WinLevelPage: PlayGamePage UIPage component not found; cannot call show().");
            }
        }, delay);
    }

    /**
     * Hides the current win page and opens a target page after a delay.
     * @param targetGetter - Function to retrieve the singleton instance of the target page
     */
    private navigateToPage(targetGetter: () => Singleton<any> & { getUiPage: () => UIPage | null }): void {
        const uiPage = this.getUiPage();
        if (!uiPage) return;

        uiPage.hide();

        // Delay 75% of hide duration to allow transition effects
        const delay = uiPage.getHideDuration() * 0.75;
        this.scheduleOnce(() => {
            const target = targetGetter();
            if (!target) {
                console.warn("WinLevelPage: Target singleton instance not found.");
                return;
            }

            const targetUiPage = target.getUiPage();
            if (targetUiPage) {
                targetUiPage.show();
            } else {
                console.warn("WinLevelPage: Target UIPage component not found.");
            }
        }, delay);
    }

    //------------------------------
    //--- Cleanup

    /**
     * Clean up registered button listeners.
     */
    protected onDestroy(): void {
        const { levelSelectButton, gameModeSelectButton, nextLevelButton } = this.uiRef;

        if (levelSelectButton) {
            levelSelectButton.node.off(cc.Node.EventType.TOUCH_END, this.onLevelSelectClicked, this);
        }

        if (gameModeSelectButton) {
            gameModeSelectButton.node.off(cc.Node.EventType.TOUCH_END, this.onGameModeSelectClicked, this);
        }

        if (nextLevelButton) {
            nextLevelButton.node.off(cc.Node.EventType.TOUCH_END, this.onNextLevelClicked, this);
        }
    }
}
