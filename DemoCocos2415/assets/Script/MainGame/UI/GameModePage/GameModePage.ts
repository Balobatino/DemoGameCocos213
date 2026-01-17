import { Singleton } from "../../../Standard/Singleton";
import { UIPage } from "../../../Standard/UIPage/UIPage";
import { GameMainPage } from "../GameMainPage";

const { ccclass, property } = cc._decorator;

/**
 * Inspector group for Game Mode Page UI references.
 */
@ccclass("GameModePageUIReference")
export class UIReference {
    @property({ type: cc.Button })
    public backButton: cc.Button | null = null;

    @property({ type: cc.Button })
    public easyModeButton: cc.Button | null = null;

    @property({ type: cc.Button })
    public mediumModeButton: cc.Button | null = null;

    @property({ type: cc.Button })
    public hardModeButton: cc.Button | null = null;
}

/**
 * GameModePage: Singleton that manages the game mode selection UI page.
 */
@ccclass
export class GameModePage extends Singleton<GameModePage> {
    //------------------------------
    //---- Inspector grouped UI references
    @property({ type: UIReference })
    public uiRef: UIReference = new UIReference();

    //------------------------------
    //--- Private Properties
    // Cached UIPage component for the mode selection page.
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
            console.error(`GameModePage: UIPage component not found on node "${this.node.name}" or its children.`);
        }
    }

    private registerButtonHandlers(): void {
        // Back button
        const backBtn = this.uiRef.backButton;
        if (backBtn) {
            backBtn.node.on(cc.Node.EventType.TOUCH_END, this.onBackButtonClicked, this);
        } else {
            console.warn("GameModePage: backButton is not assigned in the inspector.");
        }

        // Mode buttons
        const easyBtn = this.uiRef.easyModeButton;
        if (easyBtn) {
            easyBtn.node.on(cc.Node.EventType.TOUCH_END, this.onEasyModeClicked, this);
        }

        const mediumBtn = this.uiRef.mediumModeButton;
        if (mediumBtn) {
            mediumBtn.node.on(cc.Node.EventType.TOUCH_END, this.onMediumModeClicked, this);
        }

        const hardBtn = this.uiRef.hardModeButton;
        if (hardBtn) {
            hardBtn.node.on(cc.Node.EventType.TOUCH_END, this.onHardModeClicked, this);
        }
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
    }

    private onMediumModeClicked(): void {
        console.log("GameModePage: Medium Mode selected");
    }

    private onHardModeClicked(): void {
        console.log("GameModePage: Hard Mode selected");
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

        const easyBtn = this.uiRef.easyModeButton;
        if (easyBtn) {
            easyBtn.node.off(cc.Node.EventType.TOUCH_END, this.onEasyModeClicked, this);
        }

        const mediumBtn = this.uiRef.mediumModeButton;
        if (mediumBtn) {
            mediumBtn.node.off(cc.Node.EventType.TOUCH_END, this.onMediumModeClicked, this);
        }

        const hardBtn = this.uiRef.hardModeButton;
        if (hardBtn) {
            hardBtn.node.off(cc.Node.EventType.TOUCH_END, this.onHardModeClicked, this);
        }
    }
}
