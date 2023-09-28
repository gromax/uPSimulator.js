import { Register } from "../simulation/register";
import { FONT_FAMILY } from "./styles";

class GRegister {
    static BIG_WIDTH = 80;
    static SMALL_WIDTH = 60;
    static HEIGHT = 30;
    static B_WIDTH = 15;
    static FILLCOLOR = "#fff";
    static RPADDING = 5;
    static BPADDING = 5;
    static BIGFONT = { fill:'#000', family:FONT_FAMILY, size:20 };
    static OFF_FONT = { fill:'#888', family:FONT_FAMILY, size:20 };
    static SMALLFONT = { fill:'#000', family:FONT_FAMILY, size:10 };
    static H_STROKE = { color: '#f00', width: 2, linecap: 'round', linejoin: 'round' };
    static STROKE = { color: '#000', width: 2, linecap: 'round', linejoin: 'round' };
    #back;
    #group;
    #text;
    #text2 = null;
    #register;
    #fmt;
    #baseRect;
    #baseText;
    #fmtList;
    #small;
    #width;
    #activated = true;
    constructor(parent, small = false) {
        this.#small = (small == true);
        this.#register = new Register(0);
        this.#group = parent.nested();
        this.#width = this.#small ? GRegister.SMALL_WIDTH : GRegister.BIG_WIDTH;
        this.#back = this.#group.rect(this.#width, GRegister.HEIGHT);
        this.#back.fill(GRegister.FILLCOLOR);
        this.#back.stroke(GRegister.STROKE);
        this.#text = this.#group.text('');
        
        let baseGroup = this.#group.group();
        this.#baseRect = baseGroup.rect(GRegister.B_WIDTH, GRegister.HEIGHT);
        this.#baseRect.stroke(GRegister.STROKE);
        this.#baseRect.fill('#222');
        this.#baseText = baseGroup.text('');
        this.#baseText.font({fill:'#fff', family:FONT_FAMILY, size:12 });
        this.#baseText.cx(GRegister.B_WIDTH/2).cy(GRegister.HEIGHT/2);
        if (this.#small) {
            this.#fmtList = ['lowhex', 'lowbin', 'low'];
        } else {
            this.#fmtList = ['hex', 'bin', 'unsigned', 'signed'];
        }
        this.setFormat(this.#fmtList[0]);
        this.setValue(0);
        baseGroup.click((e) => {this.upFormat();});
        baseGroup.on('mouseover', (e) => { this.#baseRect.fill('#444'); });
        baseGroup.on('mouseout', (e) => { this.#baseRect.fill('#222'); });
        baseGroup.attr('cursor','pointer');
    }

    move(x,y) {
        this.#group.move(x,y);
        return this;
    }

    /**
     * @param {Number} v
     */
    setValue(v) {
        this.#register.write(v);
        if (this.#group.visible()) {
            this.#updateValueDisplay();
        }
    }

    #clearText2() {
        if (this.#text2 !== null){
            this.#text2.remove();
            this.#text2 = null;
        }
    }

    #updateValueDisplay() {
        if (!this.#activated) {
            this.#clearText2();
            this.#text.font(GRegister.OFF_FONT);
            this.#text.text('??');
            return;
        }
        if (this.#fmt == 'lowbin') {
            this.#updateValueDisplayBinSmall();
            return;
        }
        if (this.#fmt == 'bin') {
            this.#updateValueDisplayBin();
            return;
        }
        this.#clearText2();
        this.#text.font(GRegister.BIGFONT);
        this.#text.text(`${this.#register.read(this.#fmt)}`);
        let width = this.#text.length();
        this.#text.move(this.width - GRegister.RPADDING - width, GRegister.HEIGHT - GRegister.BPADDING - 20);
    }

    #updateValueDisplayBinSmall(){
        let text = this.#register.read('lowbin');
        if (this.#text2 === null){
            console.log('oh');
            this.#text2 = this.#group.text(text.substring(0,4));
            this.#text2.font(GRegister.SMALLFONT);
        } else {
            this.#text2.text(text.substring(0,4));
        }
        this.#text.font(GRegister.SMALLFONT);
        this.#text.text(text.substring(4,8));
        this.#text.move(this.width - GRegister.RPADDING - this.#text.length(), GRegister.HEIGHT - GRegister.BPADDING - 10);
        this.#text2.move(this.width - GRegister.RPADDING - this.#text2.length(), GRegister.HEIGHT - GRegister.BPADDING - 2*10 - 2);
    }

    #updateValueDisplayBin(){
        let text = this.#register.read('bin');
        if (this.#text2 === null){
            this.#text2 = this.#group.text(`${text.substring(0,4)} ${text.substring(4,8)}`);
            this.#text2.font(GRegister.SMALLFONT);
        } else {
            this.#text2.text(`${text.substring(0,4)} ${text.substring(4,8)}`);
        }
        this.#text.font(GRegister.SMALLFONT);
        this.#text.text(`${text.substring(8,12)} ${text.substring(12,16)}`);
        this.#text.move(this.width - GRegister.RPADDING - this.#text.length(), GRegister.HEIGHT - GRegister.BPADDING - 10);
        this.#text2.move(this.width - GRegister.RPADDING - this.#text2.length(), GRegister.HEIGHT - GRegister.BPADDING - 2*10 - 2);
    }

    highlight(value){
        if (value == true){
            this.#back.stroke(GRegister.H_STROKE);
        } else {
            this.#back.stroke(GRegister.STROKE);
        }
    }

    upFormat(){
        let i = this.#fmtList.indexOf(this.#fmt);
        let j = (i + 1) % this.#fmtList.length;
        this.setFormat(this.#fmtList[j]);
    }

    setFormat(fmt){
        this.#fmt = fmt;
        switch(fmt){
            case 'bin': this.#baseText.text('b'); break;
            case 'lowbin': this.#baseText.text('b'); break;
            case 'signed':  this.#baseText.text('s'); break;
            case 'hex':  this.#baseText.text('h'); break;
            case 'lowhex': this.#baseText.text('h'); break;
            default:  this.#baseText.text('u');
        }
        this.#baseText.cx(GRegister.B_WIDTH/2).cy(GRegister.HEIGHT/2);
        this.#updateValueDisplay();
    }

    /**
     * @param {Number} y
     */
    set bottom(y) {
        this.#group.y(y - this.height);
    }

    get bottom() {
        return this.#group.y() + this.height;
    }

    /**
     * @param {Number} y
     */
    set top(y) {
        this.#group.y(y);
    }
    
    get top() {
        return this.#group.y();
    }

    /**
     * @param {Number} x
     */
    set right(x) {
        let width = this.#group.width();
        this.#group.x(x - width);
    }

    get right() {
        return this.#group.x() + this.width;
    }

    /**
     * @param {Number} x
     */
    set left(x) {
        this.#group.x(x);
    }
    
    get left() {
        return this.#group.x();
    }

    get width() {
        if (this.#small) {
            return GRegister.SMALL_WIDTH;
        } else {
            return GRegister.BIG_WIDTH;
        }
    }

    get height() {
        return GRegister.HEIGHT;
    }

    get anchorNorth() {
        return [this.left + this.width/2, this.top];
    }

    get anchorSouth() {
        return [this.left + this.width/2, this.bottom];
    }

    get anchorEast() {
        return [this.right, this.top + this.height/2];
    }

    hide() {
        this.#group.hide();
    }

    inc() {
        this.#register.inc();
        this.#updateValueDisplay();
    }

    dec() {
        this.#register.dec();
        this.#updateValueDisplay();
    }

    show() {
        this.#group.show();
        this.#updateValueDisplay();
    }

    activate(value){
        this.#activated = (value === true);
        this.#updateValueDisplay();
    }

    get value() {
        return this.#register.value;
    }

    read(fmt) {
        return this.#register.read(fmt);
    }

    get active() {
        return this.#activated;
    }

}

export { GRegister };