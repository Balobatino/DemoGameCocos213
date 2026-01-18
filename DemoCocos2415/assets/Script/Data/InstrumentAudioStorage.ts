const { ccclass, property } = cc._decorator;

/**
 * Supported instrument types.
 */
export enum InstrumentType {
    None = 0,
    Xylophone,
    Drum,
    Flute,
    Piano,
    Trumpet,
    Violin,
}

// Register enum for Cocos Creator inspector
cc.Enum(InstrumentType);

/**
 * Serializable data object associating an instrument with its audio clip.
 */
@ccclass("AudioData")
export class AudioData {
    /**
     * The type of instrument.
     */
    @property({ type: cc.Enum(InstrumentType) })
    public instrument: InstrumentType = InstrumentType.None;

    /**
     * The audio clip for this instrument.
     */
    @property(cc.AudioClip)
    public audioData: cc.AudioClip = null;
}

/**
 * Editor-friendly container for instrument audio clips.
 * Attach this component to a Node, configure `audioDataList` in the inspector
 * and save the Node as a prefab to persist configuration.
 */
@ccclass
export default class InstrumentAudioStorage extends cc.Component {
    /**
     * Configured list of audio data (editable in the inspector).
     */
    @property([AudioData])
    public audioDataList: AudioData[] = [];

    /**
     * Internal map for fast lookups.
     */
    private _audioMap: Map<InstrumentType, cc.AudioClip> = null;

    /**
     * Retrieves the AudioClip for a given instrument type.
     * Uses a map for faster subsequent lookups.
     * @param instrument - The requested instrument type
     * @returns The associated AudioClip or null if not found
     */
    public getClipForInstrument(instrument: InstrumentType): cc.AudioClip | null {
        // Initialize map on first access
        if (!this._audioMap) {
            this.initializeAudioMap();
        }

        const clip = this._audioMap.get(instrument);
        if (!clip) {
            console.warn(`InstrumentAudioStorage: No AudioClip found for instrument: ${InstrumentType[instrument]}`);
            return null;
        }

        return clip;
    }

    /**
     * Populates the lookup map from the serialized list.
     */
    private initializeAudioMap(): void {
        this._audioMap = new Map<InstrumentType, cc.AudioClip>();
        if (!this.audioDataList) return;

        for (const data of this.audioDataList) {
            // Guard: skip empty entries or invalid instruments.
            if (data.instrument === InstrumentType.None || !data.audioData) {
                console.warn(`InstrumentAudioStorage: Skipping invalid entry with instrument: ${InstrumentType[data.instrument]}`);
                continue;
            }

            // Guard: check for duplicate instrument keys in the configuration.
            if (this._audioMap.has(data.instrument)) {
                console.warn(`InstrumentAudioStorage: Duplicate configuration found for instrument: ${InstrumentType[data.instrument]}. Keeping the first entry.`);
                continue;
            }

            this._audioMap.set(data.instrument, data.audioData);
        }
    }
}
