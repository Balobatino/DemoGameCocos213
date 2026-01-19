import InstrumentAudioStorage from "../../Data/InstrumentAudioStorage";
import LevelDataStorage from "../../Data/LevelDataStorage";
import { Singleton } from "../../Standard/Singleton";
import { EasingType } from "../../Standard/UIPage/ElementAnimation/AnimationMapCache";
import { UIPage } from "../../Standard/UIPage/UIPage";
import { LevelSelectPage } from "../UI/LevelSelectPage/LevelSelectPage";

const { ccclass, property } = cc._decorator;

/**
 * Inspector group for Play Game Page UI references.
 */
@ccclass("PlayGamePageUIReference")
export class UIReference {
    @property({ type: cc.Button })
    public backButton: cc.Button | null = null;

    @property({ type: cc.Layout })
    public rootInstrument: cc.Layout | null = null;
}

/**
 * Inspector group for Play Game Page data configuration.
 */
@ccclass("PlayGamePageData")
export class Data {
    @property({ type: [cc.Prefab] })
    public instrumentPrefabs: cc.Prefab[] = [];

    @property({ type: cc.Float })
    public instrumentDisplayWidth: number = 0;

    @property({ type: cc.Prefab })
    public InstrumentAudioStoragePrefab: cc.Prefab = null;

    @property({ type: cc.Prefab })
    public levelStorage: cc.Prefab = null;
}

// class InstrumentAnimationConfig
@ccclass("InstrumentAnimationConfig")
export class InstrumentAnimationConfig {
    @property(cc.Float)
    public showDuration: number = 0.3;

    @property({ type: cc.Enum(EasingType) })
    public showEasing: EasingType = EasingType.BackOut;
}

/**
 * PlayGamePage: Singleton that manages the gameplay UI and state.
 */
@ccclass
export class PlayGamePage extends Singleton<PlayGamePage> {
    //------------------------------
    //---- Inspector grouped UI references
    @property({ type: UIReference })
    public uiRef: UIReference = new UIReference();

    //------------------------------
    //---- Inspector grouped Page Data
    @property({ type: Data })
    public data: Data = new Data();

    @property({ type: InstrumentAnimationConfig })
    public insAnimConfig: InstrumentAnimationConfig = new InstrumentAnimationConfig();

    //------------------------------
    //--- Private Properties
    // Cached UIPage component for the play game page.
    private uiPage: UIPage | null = null;

    private levelStorage: LevelDataStorage | null = null;
    private insAudioStorage: InstrumentAudioStorage | null = null;

    //------------------------------
    //--- Lifecycle Methods

    /**
     * Load-time initialization hook for the singleton.
     * Finds the UIPage component and registers button handlers.
     */
    protected doOnLoad(): void {
        this.cacheComponents();
        this.retrieveDataComponent();
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
            console.error(`PlayGamePage: UIPage component not found on node "${this.node.name}" or its children.`);
        }
    }

    /**
     * Retrieves data components from the assigned prefabs in the inspector.
     */
    private retrieveDataComponent(): void {
        // Retrieve LevelDataStorage from prefab
        if (this.data.levelStorage) {
            this.levelStorage = this.data.levelStorage.data.getComponent(LevelDataStorage);
        } else {
            console.error("PlayGamePage: levelStorage prefab is not assigned in the inspector.");
        }
        if (!this.levelStorage) {
            console.error("PlayGamePage: LevelDataStorage component not found on the assigned levelStorage prefab.");
        }

        // Retrieve InstrumentAudioStorage from prefab
        if (this.data.InstrumentAudioStoragePrefab) {
            this.insAudioStorage = this.data.InstrumentAudioStoragePrefab.data.getComponent(InstrumentAudioStorage);
        } else {
            console.error("PlayGamePage: InstrumentAudioStoragePrefab is not assigned in the inspector.");
        }
        if (!this.insAudioStorage) {
            console.error("PlayGamePage: InstrumentAudioStorage component not found on the assigned InstrumentAudioStoragePrefab.");
        }
    }

    //-------------------------------
    //--- Button Handlers

    private registerButtonHandlers(): void {
        // Back button
        const backBtn = this.uiRef.backButton;
        if (backBtn) {
            backBtn.node.on(cc.Node.EventType.TOUCH_END, this.onBackButtonClicked, this);
        } else {
            console.warn("PlayGamePage: backButton is not assigned in the inspector.");
        }
    }

    /**
     * Handler for the Back button click event.
     * Hides this page and returns to the level select page.
     */
    private onBackButtonClicked(): void {
        const uiPage = this.getUiPage();

        // Guard: missing UIPage
        if (!uiPage) {
            console.warn("PlayGamePage: UIPage component not found; cannot call hide().");
            return;
        }

        // hide the play game page
        uiPage.hide();

        // Delay 75% of hide duration before reopening the level select page
        const delay = uiPage.getHideDuration() * 0.75;
        this.scheduleOnce(() => {
            // reopen the level select page
            const levelSelectPage = LevelSelectPage.getInstance<LevelSelectPage>();
            if (!levelSelectPage) {
                console.warn("LevelSelectPage singleton instance not found.");
                return;
            }

            const levelUiPage = levelSelectPage.getUiPage();
            if (levelUiPage) {
                levelUiPage.show();
            } else {
                console.warn("LevelSelectPage: UIPage component not found; cannot call show().");
            }
        }, delay);
    }

    //------------------------------
    //--- Start game sequence

    public async runStartGameProcess(): Promise<void> {
        //
    }

    // Small helper to await a number of milliseconds.
    private sleep(milliseconds: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
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
    }
}
