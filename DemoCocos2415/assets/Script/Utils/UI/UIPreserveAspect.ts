const { ccclass, property, executeInEditMode } = cc._decorator;

/** Enum to specify which axis to fit the parent container on.*/
export enum FitParentOnAxis {
    Horizontal = 0,
    Vertical = 1,
}
/**Create a runtime Cocos Enum so the editor shows a dropdown. */
const FitParentOnAxisEnum = cc.Enum(FitParentOnAxis);

/**
 * Component that adjusts node scale to maintain the aspect ratio of a Sprite
 * based on its parent container content size.
 */
@ccclass
@executeInEditMode
export class UIPreserveAspect extends cc.Component {
    // #region Properties
    private sprite: cc.Sprite | null = null;
    private parentNode: cc.Node | null = null;

    /** Axis to force-fit the parent container on while preserving the other axis to maintain the image ratio. */
    @property({ type: FitParentOnAxisEnum })
    fitParentOnAxis: FitParentOnAxis = FitParentOnAxis.Horizontal;
    // #endregion Properties

    // #region Lifecycle
    onEnable() {
        this.updateAspect();
        // console.log(`UIPreserveAspect: onEnable called for node ${this.node.name}`);
    }

    onDisable() {
        // Logic for when component/node is disabled
    }
    // #endregion Lifecycle

    // #region Logic
    /**
     * Caches the required components if they haven't been cached yet.
     */
    private cacheComponent() {
        if (!this.sprite) {
            this.sprite = this.getComponent(cc.Sprite);
        }
        if (!this.parentNode) {
            this.parentNode = this.getParentNode();
        }
    }

    /**
     * Updates the node's scale to fit the sprite frame within the container
     * without distortion. This method is a short orchestrator that defers
     * work to smaller helper methods for readability and testability.
     */
    updateAspect() {
        this.cacheComponent();
        if (!this.ensureNoNullComponents()) {
            return;
        }

        // Center and size this node to match the parent
        this.centerAndMatchParent(this.parentNode!);

        // Compute scales
        const containerSize = this.parentNode!.getContentSize();

        // Read original size from SpriteFrame for Cocos Creator 2.4.15.
        // Use the engine API directly (cc.SpriteFrame) and fall back to rect if needed.
        const sf = this.sprite!.spriteFrame as cc.SpriteFrame;
        let originalSize: cc.Size = sf.getOriginalSize();
        if (!originalSize || originalSize.width <= 0 || originalSize.height <= 0) {
            // Fallback: use rect size if original size is invalid.
            const rect = sf.getRect();
            originalSize = new cc.Size(rect.width, rect.height);
        }

        const uniformScale = this.computeUniformScale(containerSize, originalSize);
        const { scaleX, scaleY } = this.computeScales(containerSize, originalSize, uniformScale);

        // Apply scale (2D)
        this.node.setScale(scaleX, scaleY);

        // log the scaling for debugging
        // console.log(`UIPreserveAspect: Set scaleX=${scaleX}, scaleY=${scaleY}. Container Size: ${containerSize.width}x${containerSize.height}, Image Size: ${originalSize.width}x${originalSize.height}`);
    }

    /**
     * Check that required components are not null, logging warnings if they are missing.
     * Returns true if all components are present, false otherwise.
     */
    private ensureNoNullComponents(): boolean {
        // Guard: sprite & spriteFrame must exist
        if (!this.sprite || !this.sprite.spriteFrame) {
            console.warn(`UIPreserveAspect, node ${this.node.name}: Sprite or SpriteFrame is missing.`);
            return false;
        }

        // Guard: the attached node must exist (it should in a component)
        if (!this.node) {
            console.warn(`UIPreserveAspect: attached node is missing.`);
            return false;
        }

        // Ensure we have the parent node (helper logs a warning when missing).
        const parentNode = this.parentNode ?? this.getParentNode();
        if (!parentNode) {
            return false;
        }

        // Cache parent node for further use
        this.parentNode = parentNode;
        return true;
    }

    /**
     * Return parent node or null (and log a warning) if missing.
     */
    private getParentNode(): cc.Node | null {
        const parent = this.node.parent;
        if (!parent) {
            console.warn(`UIPreserveAspect, node ${this.node.name}: Parent node is missing.`);
            return null;
        }
        return parent;
    }

    /**
     * Center this node and make its contentSize match the parent container.
     */
    private centerAndMatchParent(parentNode: cc.Node) {
        this.node.setPosition(0, 0, 0);
        // Set node-level anchor and content size using Node API (Cocos 2.x)
        this.node.setAnchorPoint(0.5, 0.5);
        const parentSize = parentNode.getContentSize();
        this.node.setContentSize(parentSize);
    }

    /**
     * Compute a uniform scale that fits the image entirely inside the container.
     */
    private computeUniformScale(containerSize: cc.Size, originalSize: cc.Size): number {
        const containerRatio = containerSize.width / containerSize.height;
        const imageRatio = originalSize.width / originalSize.height;

        if (imageRatio > containerRatio) {
            // Image is relatively wider than the container: fit by width
            return containerSize.width / originalSize.width;
        } else {
            // Image is relatively taller than the container: fit by height
            return containerSize.height / originalSize.height;
        }
    }

    /**
     * Compute axis-specific scales based on fit mode while preserving aspect ratio.
     */
    private computeScales(containerSize: cc.Size, originalSize: cc.Size, uniformScale: number): { scaleX: number; scaleY: number } {
        // Start with the uniform scale so the image fits the container without distortion
        let scaleX = uniformScale;
        let scaleY = uniformScale;

        switch (this.fitParentOnAxis) {
            case FitParentOnAxis.Horizontal:
                // Force width to match container width: keep scaleX = 1 (content width already equals container width),
                // compute scaleY so displayed height = containerWidth * (originalHeight/originalWidth) / containerHeight
                scaleX = 1;
                if (containerSize.height > 0 && originalSize.width > 0) {
                    scaleY = (containerSize.width * originalSize.height) / (originalSize.width * containerSize.height);
                } else {
                    scaleY = uniformScale;
                }
                break;
            case FitParentOnAxis.Vertical:
                // Force height to match container height: keep scaleY = 1 (content height already equals container height),
                // compute scaleX so displayed width = containerHeight * (originalWidth/originalHeight) / containerWidth
                scaleY = 1;
                if (containerSize.width > 0 && originalSize.height > 0) {
                    scaleX = (containerSize.height * originalSize.width) / (originalSize.height * containerSize.width);
                } else {
                    scaleX = uniformScale;
                }
                break;
            default:
                console.warn(`UIPreserveAspect, node ${this.node.name}: Unknown fitParentOnAxis value (${this.fitParentOnAxis}). Using uniform scale.`);
                break;
        }

        return { scaleX, scaleY };
    }
    // #endregion Logic
}
