import { Singleton } from "../../Standard/Singleton";
import { UIPage } from "../../Standard/UIPage/UIPage";
import { GameModePage } from "./GameModePage/GameModePage";
import { LevelSelectPage } from "./LevelSelectPage/LevelSelectPage";
import { PlayGamePage } from "../GamePlay/PlayGamePage";

const { ccclass, property } = cc._decorator;

/**
 * Inspector group for Failed Level Page UI references.
 */
@ccclass("FailedLevelPageUIReference")
export class UIReference {
    @property({ type: cc.Button })
    public levelSelectButton: cc.Button | null = null;

    @property({ type: cc.Button })
    public gameModeSelectButton: cc.Button | null = null;

    @property({ type: cc.Button })
    public replayButton: cc.Button | null = null;
}

/**
 * FailedLevelPage: Singleton that manages the level failure UI page.
 */
@ccclass
export default class FailedLevelPage extends Singleton<FailedLevelPage> {
    //------------------------------
    //---- Inspector grouped UI references
    @property({ type: UIReference })
    public uiRef: UIReference = new UIReference();

    //------------------------------
    //--- Private Properties
    // Cached UIPage component for the failed page.
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
            console.error(`FailedLevelPage: UIPage component not found on node "${this.node.name}" or its children.`);
        }
    }

    private registerButtonHandlers(): void {
        const { levelSelectButton, gameModeSelectButton, replayButton } = this.uiRef;

        if (levelSelectButton) {
            levelSelectButton.node.on(cc.Node.EventType.TOUCH_END, this.onLevelSelectClicked, this);
        } else {
            console.warn("FailedLevelPage: levelSelectButton is not assigned.");
        }

        if (gameModeSelectButton) {
            gameModeSelectButton.node.on(cc.Node.EventType.TOUCH_END, this.onGameModeSelectClicked, this);
        } else {
            console.warn("FailedLevelPage: gameModeSelectButton is not assigned.");
        }

        if (replayButton) {
            replayButton.node.on(cc.Node.EventType.TOUCH_END, this.onReplayClicked, this);
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
     * Replays the current level by navigating back to PlayGamePage.
     */
    private onReplayClicked(): void {
        const uiPage = this.getUiPage();
        if (uiPage) {
            uiPage.hide();
        } else {
            console.warn("FailedLevelPage: UIPage component not found; cannot call hide().");
        }

        const delay = uiPage ? uiPage.getHideDuration() * 0.75 : 0;
        this.scheduleOnce(() => {
            const playGamePage = PlayGamePage.getInstance<PlayGamePage>();
            if (!playGamePage) {
                console.warn("FailedLevelPage: PlayGamePage singleton instance not found.");
                return;
            }

            const playUiPage = playGamePage.getUiPage();
            if (playUiPage) {
                playUiPage.show();
                void playGamePage.runStartGameProcess();
            } else {
                console.warn("FailedLevelPage: PlayGamePage UIPage component not found; cannot call show().");
            }
        }, delay);
    }

    /**
     * Hides the current failed page and opens a target page after a delay.
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
                console.warn("FailedLevelPage: Target singleton instance not found.");
                return;
            }

            const targetUiPage = target.getUiPage();
            if (targetUiPage) {
                targetUiPage.show();
            } else {
                console.warn("FailedLevelPage: Target UIPage component not found.");
            }
        }, delay);
    }

    //------------------------------
    //--- Cleanup

    /**
     * Clean up registered button listeners.
     */
    protected onDestroy(): void {
        const { levelSelectButton, gameModeSelectButton, replayButton } = this.uiRef;

        if (levelSelectButton) {
            levelSelectButton.node.off(cc.Node.EventType.TOUCH_END, this.onLevelSelectClicked, this);
        }

        if (gameModeSelectButton) {
            gameModeSelectButton.node.off(cc.Node.EventType.TOUCH_END, this.onGameModeSelectClicked, this);
        }

        if (replayButton) {
            replayButton.node.off(cc.Node.EventType.TOUCH_END, this.onReplayClicked, this);
        }
    }
}
