const { ccclass, property } = cc._decorator;

/**
 * EasingType
 *
 * Enum of available easing choices. Use this in components to expose an editor
 * dropdown and to look up the corresponding easing function.
 */
export enum EasingType {
    Linear = 0,
    QuadIn = 1,
    QuadOut = 2,
    QuadInOut = 3,
    CubicIn = 4,
    CubicOut = 5,
    CubicInOut = 6,
    QuartIn = 7,
    QuartOut = 8,
    QuartInOut = 9,
    QuintIn = 10,
    QuintOut = 11,
    QuintInOut = 12,
    SineIn = 13,
    SineOut = 14,
    SineInOut = 15,
    ExpoIn = 16,
    ExpoOut = 17,
    ExpoInOut = 18,
    CircIn = 19,
    CircOut = 20,
    CircInOut = 21,
    BackIn = 22,
    BackOut = 23,
    BackInOut = 24,
    ElasticIn = 25,
    ElasticOut = 26,
    ElasticInOut = 27,
    BounceIn = 28,
    BounceOut = 29,
    BounceInOut = 30,
}

/**
 * EasingMap
 *
 * Centralized, cached mapping between `EasingType` and the actual Cocos easing
 * functions. The map is built lazily on first request and can be initialized
 * eagerly via `initialize()` to warm the cache early (e.g. on first scene load).
 */
export class EasingMap {
    private static map: Map<EasingType, (t: number) => number> | null = null;

    /**
     * Identity easing used as the project's linear fallback (safe for Cocos 2.x).
     * @param t - normalized time in [0,1]
     * @returns same t (linear)
     */
    private static readonly linearFallback: (t: number) => number = (t: number) => t;

    /**
     * Initialize (build) the easing map if not already built.
     * Safe to call multiple times.
     */
    public static initialize() {
        if (!this.map) this.buildMap();
    }

    /**
     * Get the easing function for the given EasingType.
     * Falls back to a simple identity (linear) function and logs a warning if the value is not mapped.
     */
    public static get(e: EasingType): (t: number) => number {
        if (!this.map) this.buildMap();

        const fn = this.map!.get(e);
        if (!fn) {
            console.warn(`EasingMap: Unhandled easing value: ${e} - falling back to linear.`);
            return this.linearFallback;
        }
        return fn;
    }

    /**
     * Private builder for the map. Keeps all mapping in one place.
     */
    private static buildMap() {
        const m = new Map<EasingType, (t: number) => number>();

        // Use the internal identity fallback for the Linear easing so this works on Cocos 2.x.
        m.set(EasingType.Linear, this.linearFallback);

        m.set(EasingType.QuadIn, cc.easing.quadIn);
        m.set(EasingType.QuadOut, cc.easing.quadOut);
        m.set(EasingType.QuadInOut, cc.easing.quadInOut);

        m.set(EasingType.CubicIn, cc.easing.cubicIn);
        m.set(EasingType.CubicOut, cc.easing.cubicOut);
        m.set(EasingType.CubicInOut, cc.easing.cubicInOut);

        m.set(EasingType.QuartIn, cc.easing.quartIn);
        m.set(EasingType.QuartOut, cc.easing.quartOut);
        m.set(EasingType.QuartInOut, cc.easing.quartInOut);

        m.set(EasingType.QuintIn, cc.easing.quintIn);
        m.set(EasingType.QuintOut, cc.easing.quintOut);
        m.set(EasingType.QuintInOut, cc.easing.quintInOut);

        m.set(EasingType.SineIn, cc.easing.sineIn);
        m.set(EasingType.SineOut, cc.easing.sineOut);
        m.set(EasingType.SineInOut, cc.easing.sineInOut);

        m.set(EasingType.ExpoIn, cc.easing.expoIn);
        m.set(EasingType.ExpoOut, cc.easing.expoOut);
        m.set(EasingType.ExpoInOut, cc.easing.expoInOut);

        m.set(EasingType.CircIn, cc.easing.circIn);
        m.set(EasingType.CircOut, cc.easing.circOut);
        m.set(EasingType.CircInOut, cc.easing.circInOut);

        m.set(EasingType.BackIn, cc.easing.backIn);
        m.set(EasingType.BackOut, cc.easing.backOut);
        m.set(EasingType.BackInOut, cc.easing.backInOut);

        m.set(EasingType.ElasticIn, cc.easing.elasticIn);
        m.set(EasingType.ElasticOut, cc.easing.elasticOut);
        m.set(EasingType.ElasticInOut, cc.easing.elasticInOut);

        m.set(EasingType.BounceIn, cc.easing.bounceIn);
        m.set(EasingType.BounceOut, cc.easing.bounceOut);
        m.set(EasingType.BounceInOut, cc.easing.bounceInOut);

        this.map = m;
    }
}
