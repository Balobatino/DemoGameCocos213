import { InstrumentType } from "../../Data/InstrumentAudioStorage";
const { ccclass, property } = cc._decorator;

@ccclass("InstrumentButtonUIReference")
export class InstrumentButtonUIReference {
    @property(cc.Button)
    public button: cc.Button = null;
}

/**
 * InstrumentButton: attach to Instrument item on scene at mainGame, work with PlayGamePage
 * handle interaction and events.
 */

@ccclass
export default class InstrumentButton extends cc.Component {
    @property({ type: InstrumentButtonUIReference })
    public uiReference: InstrumentButtonUIReference = new InstrumentButtonUIReference();

    @property({ type: InstrumentType })
    public instrumentType: InstrumentType = InstrumentType.Piano;

    @property(cc.Integer)
    public indexInGroup: number = -1;
}
