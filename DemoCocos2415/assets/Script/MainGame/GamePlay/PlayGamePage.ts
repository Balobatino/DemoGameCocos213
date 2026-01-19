import InstrumentAudioStorage from "../../Data/InstrumentAudioStorage";
import LevelDataStorage, { LevelData } from "../../Data/LevelDataStorage";
import { Singleton } from "../../Standard/Singleton";
import { EasingType, EasingMap } from "../../Standard/UIPage/ElementAnimation/AnimationMapCache";
import { UIPage } from "../../Standard/UIPage/UIPage";
import { LevelSelectPage } from "../UI/LevelSelectPage/LevelSelectPage";
import GameStats from "../GameStats/GameStats";
import { CollectionUtils } from "../../Utils/CollectionUtils";
import InstrumentButton from "./InstrumentButton";

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

    @property(cc.Float)
    public flickDuration: number = 0.2;

    @property({ type: cc.Enum(EasingType) })
    public flickEasing: EasingType = EasingType.BackOut;
}

export class LevelSequenceData {
    public sequenceLength: number = 0;
    public nodeInterval: number = 0;
    public notesSequences: number[] = [];
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

    private currentLevelData: LevelData | null = null;
    private levelSequenceData: LevelSequenceData = new LevelSequenceData();

    // List of active instrument buttons in the current game session.
    private instrumentButtons: InstrumentButton[] = [];

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

        // scale down and destroy instruments
        void this.scaleDownInstrumentAndDestroy();

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

    /**
     * Initializes the game session: configures levels, spawns instruments, and plays entry animations.
     */
    public async runStartGameProcess(): Promise<void> {
        // Wait for page show animation to complete
        if (this.uiPage) {
            await this.sleep(this.uiPage.getShowDuration() * 1000);
        }

        // Disable back button while setting up the level
        if (this.uiRef.backButton) {
            this.uiRef.backButton.interactable = false;
        }

        // Retrieve level configuration based on current difficulty mode.
        const mode = GameStats.userSelect.difficultMode;
        if (!this.levelStorage) {
            console.error("PlayGamePage: LevelDataStorage is not available; cannot configure level.");
            return;
        }

        const levelData = this.levelStorage.getLevelConfigForDifficultMode(mode);
        if (!levelData) {
            console.error(`PlayGamePage: No level data found for difficulty mode ${mode}.`);
            return;
        }
        this.currentLevelData = levelData;

        // Clear any existing instruments from previous rounds
        this.clearInstruments();

        // Determine which instruments to spawn
        const pickedPrefabs = CollectionUtils.randomPickFromList(this.data.instrumentPrefabs, levelData.numberOfInstruments);
        // log number of instruments picked
        // console.log(`PlayGamePage: picked ${pickedPrefabs.length} instrument prefabs for difficulty ${mode}, expected ${levelData.numberOfInstruments}.`);

        for (let n = 0; n < pickedPrefabs.length; n++) {
            const prefab = pickedPrefabs[n];
            const insNode = cc.instantiate(prefab);

            // Parent to the root layout container
            if (this.uiRef.rootInstrument) {
                insNode.parent = this.uiRef.rootInstrument.node;
            } else {
                console.error("PlayGamePage: rootInstrument layout is not assigned in the inspector.");
            }

            const insBtn = insNode.getComponent(InstrumentButton);
            if (insBtn) {
                // Initialize instrument state and cache
                insBtn.indexInGroup = n;
                this.instrumentButtons.push(insBtn);

                // Register button interaction touch event
                if (insBtn.uiReference.button) {
                    insBtn.uiReference.button.node.on(cc.Node.EventType.TOUCH_END, () => this.onInstrument(n), this);
                } else {
                    console.warn(`PlayGamePage: InstrumentButton at index ${n} is missing its Button component in uiReference.`);
                }
            } else {
                console.error(`PlayGamePage: InstrumentButton component not found on instantiated prefab at index ${n}.`);
            }

            // Immediately set to scale 0 to hide it before the animation pass
            insNode.setScale(0, 0, 1);
        }

        // config size and force a layout update so positions are finalized before animating
        const layout = this.uiRef.rootInstrument;
        if (layout) {
            const totalWidth = pickedPrefabs.length * this.data.instrumentDisplayWidth;
            layout.node.width = totalWidth;
            layout.updateLayout();
        }

        // Retrieve easing once to avoid map lookup in the loop
        const easing = EasingMap.get(this.insAnimConfig.showEasing);
        // Animate the appearance of all instruments
        for (const insBtn of this.instrumentButtons) {
            if (!insBtn.node) continue;
            // Stop any conflicting tweens and enforce the starting scale inside the tween
            cc.Tween.stopAllByTarget(insBtn.node);
            cc.tween(insBtn.node).set({ scaleX: 0, scaleY: 0, scaleZ: 1 }).to(this.insAnimConfig.showDuration, { scaleX: 1, scaleY: 1, scaleZ: 1 }, { easing }).start();
        }

        // Wait for all instruments to finish scaling in
        await this.sleep(this.insAnimConfig.showDuration * 1000);

        // Re-enable layout so it can handle any future structural changes
        if (layout) {
            layout.enabled = true;
        }

        // before enable backButton
        // calculate the levelSequenceData, using the cache currentLevelData
        this.calculateLevelSequenceForCurrentLevel();

        // Preparation complete, re-enable back navigation
        if (this.uiRef.backButton) {
            this.uiRef.backButton.interactable = true;
        }
    }

    /**
     * Calculates the level sequence data based on current level configuration and progress.
     */
    private calculateLevelSequenceForCurrentLevel(): void {
        if (!this.currentLevelData) {
            console.error("PlayGamePage: currentLevelData is not set; cannot calculate level sequence.");
            return;
        }

        const ratio = GameStats.userSelect.selectLevel / 10;
        // Calculate sequence length using linear interpolation
        this.levelSequenceData.sequenceLength = Math.round(cc.misc.lerp(this.currentLevelData.minSequenceLength, this.currentLevelData.maxSequenceLength, ratio));
        // Calculate node interval using linear interpolation
        this.levelSequenceData.nodeInterval = cc.misc.lerp(this.currentLevelData.maxNoteInterval, this.currentLevelData.minNoteInterval, ratio);
        // Generate random note sequences for the level
        this.levelSequenceData.notesSequences = CollectionUtils.generateRandomIntArray(this.levelSequenceData.sequenceLength, this.currentLevelData.numberOfInstruments - 1);
    }

    /**
     * Handler for instrument button clicks.
     * @param index - The index of the instrument in the active list.
     */
    private onInstrument(index: number): void {
        // Implementation for note checking/playing logic goes here.
        const insBtn = this.instrumentButtons[index];
        // if (insBtn && insBtn.node) {
        //     this.playFlickAnimationOnInstrumentNode(insBtn.node);
        // }
        // console.log(`Instrument index ${index} clicked.`);
    }

    /**
     * Animates all active instruments scaling down to zero and then destroys them.
     */
    private async scaleDownInstrumentAndDestroy(): Promise<void> {
        if (this.instrumentButtons.length === 0) return;

        // Use UIPage's hide duration if available, else fallback to show duration.
        const duration = this.uiPage ? this.uiPage.getHideDuration() : this.insAnimConfig.showDuration;
        const easing = EasingMap.get(this.insAnimConfig.showEasing);

        for (const btn of this.instrumentButtons) {
            if (!btn.node) continue;
            cc.tween(btn.node).to(duration, { scaleX: 0, scaleY: 0, scaleZ: 1 }, { easing }).start();
        }

        // Wait for animations to complete before node destruction.
        await this.sleep(duration * 1000);
        this.clearInstruments();
    }

    /**
     * Destroys existing instrument nodes and clears the internal tracking array.
     */
    private clearInstruments(): void {
        for (const btn of this.instrumentButtons) {
            if (btn.node) btn.node.destroy();
        }
        this.instrumentButtons = [];
    }

    // Small helper to await a number of milliseconds.
    private sleep(milliseconds: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    }

    //------------------------------
    //--- Instrument Animations

    /**
     * Performs a scale ping-pong "flick" animation on the target node.
     * Scales from current scale to 1.1 and back to 1.0.
     * @param target - The CCNode to animate.
     */
    private playFlickAnimationOnInstrumentNode(target: cc.Node): void {
        // Guard: invalid target
        if (!target) return;

        // Split total duration into two halves for the ping-pong effect
        const halfDuration = this.insAnimConfig.flickDuration / 2;
        const easing = EasingMap.get(this.insAnimConfig.flickEasing);

        cc.tween(target).to(halfDuration, { scaleX: 1.1, scaleY: 1.1 }, { easing }).to(halfDuration, { scaleX: 1.0, scaleY: 1.0 }, { easing }).start();
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
