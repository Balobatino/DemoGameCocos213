const { ccclass, property } = cc._decorator;
import { AudioManager } from "./AudioManager";

/**
 * Audio player used by AudioManager pool.
 */
export enum AudioType {
    None = 0,
    BGM = 1,
    SFX = 2,
}

@ccclass
export class AudioPlayer extends cc.Component {
    //------------------------------
    //--- Public Properties

    @property({ type: cc.AudioSource })
    public audioSource: cc.AudioSource | null = null;

    // Tracks whether this player is currently playing BGM or SFX
    public audioType: AudioType = AudioType.None;

    //------------------------------
    //--- Public Methods

    /** Play a one-shot SFX and return to the manager when finished. */
    public playOnShot(clip: cc.AudioClip | null): void {
        if (!clip) return;

        const src = this.ensureSource();
        this.audioType = AudioType.SFX;

        const manager = AudioManager.getInstance<AudioManager>();
        src.clip = clip;
        src.loop = false;
        src.volume = manager ? manager.getVolumeSFX() : 1;
        src.play();

        // schedule a return to the pool when playback finishes. add small buffer to ensure complete.
        // Cocos 2.x: use `duration` property instead of `getDuration()`.
        const duration = clip.duration || 0;
        this.scheduleOnce(() => {
            const manager = AudioManager.getInstance<AudioManager>();
            if (manager) manager.returnToIdlePlayers(this);
        }, duration + 0.05);
    }

    /** Play a looped BGM. Does NOT auto-return; caller must stop/replace. */
    public playBgm(clip: cc.AudioClip | null): void {
        if (!clip) return;

        const src = this.ensureSource();
        this.audioType = AudioType.BGM;

        const mgr = AudioManager.getInstance<AudioManager>();
        src.clip = clip;
        src.loop = true;
        src.volume = mgr ? mgr.getVolumeBGM() : 1;
        src.play();
    }

    /** Stop playback and return to the pool. */
    public stop(): void {
        if (this.audioSource) this.audioSource.stop();
        const manager = AudioManager.getInstance<AudioManager>();
        if (manager) manager.returnToIdlePlayers(this);
    }

    //------------------------------
    //--- Private Methods

    private ensureSource(): cc.AudioSource {
        if (!this.audioSource) {
            const src = this.getComponent(cc.AudioSource) || this.node.addComponent(cc.AudioSource);
            this.audioSource = src;
        }
        return this.audioSource!;
    }
}
