const { ccclass, property } = cc._decorator;

@ccclass("InstrumentButtonUIReference")
export class InstrumentButtonUIReference {
    @property(cc.Button)
    public button: cc.Button = null;
}

/**
 * InstrumentButton: Component managing a button for selecting an instrument.
 */

@ccclass
export default class InstrumentButton extends cc.Component {
    @property({ type: InstrumentButtonUIReference })
    public uiReference: InstrumentButtonUIReference = new InstrumentButtonUIReference();
}
