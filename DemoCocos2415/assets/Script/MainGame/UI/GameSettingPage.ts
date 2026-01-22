import { Singleton } from "../../Standard/Singleton";
import { UIPage } from "../../Standard/UIPage/UIPage";
import { GameMainPage } from "./GameMainPage";
import { AudioManager } from "../../Standard/Audio/AudioManager"; // for reading/setting mute state
import { UserScoreLoadSave } from "../../UserScoreLoadSave/UserScoreLoadSave";
const { ccclass, property } = cc._decorator;

/**
 * GameSettingPage: Singleton that manages the settings UI page for the game.
 */
/**
 * Inspector group for Settings Page UI references.
 */
@ccclass("GameSettingPageUIReference")
export class UIReference {
    @property({ type: cc.Button })
    public policyButton: cc.Button | null = null;

    @property({ type: cc.Button })
    public closeButton: cc.Button | null = null;

    @property({ type: cc.Toggle })
    public muteBgmToggle: cc.Toggle | null = null;

    @property({ type: cc.Toggle })
    public muteSfxToggle: cc.Toggle | null = null;

    @property({ type: cc.Button })
    public cheatAll: cc.Button | null = null;

    @property({ type: cc.Button })
    public cheatZero: cc.Button | null = null;
}

/**
 * GameSettingPage: Singleton that manages the settings UI page for the game.
 */
@ccclass
export class GameSettingPage extends Singleton<GameSettingPage> {
    //------------------------------
    //---- Inspector grouped UI references
    @property({ type: UIReference })
    public uiRef: UIReference = new UIReference();

    // Event names (scoped to this class)
    private static readonly TOGGLE_EVENT: string = "toggle";

    //------------------------------
    //--- Private Properties
    // Cached UIPage component for the settings page. May be null if not found.
    private uiPage: UIPage | null = null;

    //------------------------------
    //--- Lifecycle Methods

    /**
     * Load-time initialization hook for the singleton.
     * Finds the UIPage component on this node or its children and caches it.
     * Registers button click handlers.
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
            console.error(`GameSettingPage: UIPage component not found on node "${this.node.name}" or its children.`);
        }
    }

    private registerButtonHandlers(): void {
        // Policy button (use touch end for compatibility)
        const policyBtn = this.uiRef.policyButton;
        if (policyBtn) {
            policyBtn.node.on(cc.Node.EventType.TOUCH_END, this.onPolicyButtonClicked, this);
        } else {
            console.warn("GameSettingPage: policyButton is not assigned in the inspector (uiRef.policyButton).");
        }

        // Close button (use touch end for compatibility)
        const closeBtn = this.uiRef.closeButton;
        if (closeBtn) {
            closeBtn.node.on(cc.Node.EventType.TOUCH_END, this.onCloseButtonClicked, this);
        } else {
            console.warn("GameSettingPage: closeButton is not assigned in the inspector (uiRef.closeButton).");
        }

        // Mute BGM toggle
        const muteBgm = this.uiRef.muteBgmToggle;
        if (muteBgm) {
            muteBgm.node.on(GameSettingPage.TOGGLE_EVENT, this.onMuteBgmToggled, this);
        } else {
            console.warn("GameSettingPage: muteBgmToggle is not assigned in the inspector (uiRef.muteBgmToggle).");
        }

        // Mute SFX toggle
        const muteSfx = this.uiRef.muteSfxToggle;
        if (muteSfx) {
            muteSfx.node.on(GameSettingPage.TOGGLE_EVENT, this.onMuteSfxToggled, this);
        } else {
            console.warn("GameSettingPage: muteSfxToggle is not assigned in the inspector (uiRef.muteSfxToggle).");
        }

        // Cheat All button
        const cheatAllBtn = this.uiRef.cheatAll;
        if (cheatAllBtn) {
            cheatAllBtn.node.on(cc.Node.EventType.TOUCH_END, this.onCheatAllButtonClicked, this);
        }

        // Cheat Zero button
        const cheatZeroBtn = this.uiRef.cheatZero;
        if (cheatZeroBtn) {
            cheatZeroBtn.node.on(cc.Node.EventType.TOUCH_END, this.onCheatZeroButtonClicked, this);
        }
    }

    /**
     * Handler for the Policy button click event.
     * Use sys.openURL on native/mobile (works on iOS). Fallback to window.open for web preview.
     */
    private onPolicyButtonClicked(): void {
        const policyUrl = "https://doc-hosting.flycricket.io/notes-sequence-jumper-privacy-policy/ec1c804c-36c2-46d3-a987-3e56600d5af4/privacy";
        // Attempt to open the policy URL using platform-specific APIs
        try {
            // default use cc.sys.openURL if available (Cocos 2.x)
            if (cc && cc.sys && typeof cc.sys.openURL === "function") {
                cc.sys.openURL(policyUrl);
                return;
            }
            // fallback to window.open for web
            if (typeof window !== "undefined" && typeof window.open === "function") {
                window.open(policyUrl, "_blank");
                return;
            }
            console.warn(`GameSettingPage: No available API to open URL: ${policyUrl}`);
        } catch (e) {
            console.error("GameSettingPage: Failed to open policy URL:", e);
            // best-effort fallback to window.open
            if (typeof window !== "undefined" && typeof window.open === "function") {
                window.open(policyUrl, "_blank");
            }
        }
    }

    // Initialize toggle states from AudioManager once the node is enabled and start runs
    protected start(): void {
        const audioMgr = AudioManager.getInstance<AudioManager>();
        if (!audioMgr) return;

        const muteBgm = this.uiRef.muteBgmToggle;
        if (muteBgm) {
            // Initialize checked state directly (Cocos 2.x Toggle uses `isChecked`).
            muteBgm.isChecked = audioMgr.isBgmMuted();
        }

        const muteSfx = this.uiRef.muteSfxToggle;
        if (muteSfx) {
            muteSfx.isChecked = audioMgr.isSfxMuted();
        }
    }

    // Handler for BGM mute toggle changed
    private onMuteBgmToggled(toggle: cc.Toggle): void {
        const audioMgr = AudioManager.getInstance<AudioManager>();
        if (!audioMgr) {
            console.warn("GameSettingPage: AudioManager singleton instance not found; cannot set BGM mute.");
            return;
        }
        audioMgr.setMuteBGM(toggle.isChecked);
    }

    // Handler for SFX mute toggle changed
    private onMuteSfxToggled(toggle: cc.Toggle): void {
        const audioMgr = AudioManager.getInstance<AudioManager>();
        if (!audioMgr) {
            console.warn("GameSettingPage: AudioManager singleton instance not found; cannot set SFX mute.");
            return;
        }
        audioMgr.setMuteSFX(toggle.isChecked);
    }

    /**
     * Handler for the Cheat All button click event.
     * Unlocks all levels by setting progress to max.
     */
    private onCheatAllButtonClicked(): void {
        console.log("GameSettingPage: Cheat All clicked.");
        UserScoreLoadSave.cheatFinishAllMode();
    }

    /**
     * Handler for the Cheat Zero button click event.
     * Resets all levels progress to zero.
     */
    private onCheatZeroButtonClicked(): void {
        console.log("GameSettingPage: Cheat Zero clicked.");
        UserScoreLoadSave.cheatResetAllMode();
    }

    /**
     * Handler for the Close button click event.
     * Currently logs a message; actual close/hide logic to be implemented.
     */
    private onCloseButtonClicked(): void {
        const uiPage = this.getUiPage();

        // Guard: missing UIPage
        if (!uiPage) {
            console.warn("GameSettingPage: UIPage component not found; cannot call hide().");
            return;
        }

        // hide the settings page
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

    //------------------------------
    //--- Cleanup

    /**
     * Clean up registered button listeners to avoid duplicate handlers on reload.
     */
    protected onDestroy(): void {
        const policyBtn = this.uiRef.policyButton;
        if (policyBtn) {
            policyBtn.node.off(cc.Node.EventType.TOUCH_END, this.onPolicyButtonClicked, this);
        }
        const closeBtn = this.uiRef.closeButton;
        if (closeBtn) {
            closeBtn.node.off(cc.Node.EventType.TOUCH_END, this.onCloseButtonClicked, this);
        }

        const muteBgm = this.uiRef.muteBgmToggle;
        if (muteBgm) {
            muteBgm.node.off(GameSettingPage.TOGGLE_EVENT, this.onMuteBgmToggled, this);
        }
        const muteSfx = this.uiRef.muteSfxToggle;
        if (muteSfx) {
            muteSfx.node.off(GameSettingPage.TOGGLE_EVENT, this.onMuteSfxToggled, this);
        }

        const cheatAllBtn = this.uiRef.cheatAll;
        if (cheatAllBtn) {
            cheatAllBtn.node.off(cc.Node.EventType.TOUCH_END, this.onCheatAllButtonClicked, this);
        }

        const cheatZeroBtn = this.uiRef.cheatZero;
        if (cheatZeroBtn) {
            cheatZeroBtn.node.off(cc.Node.EventType.TOUCH_END, this.onCheatZeroButtonClicked, this);
        }
    }
}
