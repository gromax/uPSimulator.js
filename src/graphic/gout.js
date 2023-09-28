/* buffer out */

import { Register } from "../simulation/register";
import { Button } from "./button";
import { Led } from "./led";
import {
    DATA_BUS,
    HIGHLIGHTED_DATA_BUS,
    FONT_FAMILY,
    TITLE
} from "./styles";

class GOut {
    static WIDTH = 140;
    static HEIGHT = 180;
    static PADDING = 10;
    static FOOT = 20;
    static HEAD = 60;
    static COLOR = '#bb0';
    static STROKE = { color:'#000', width:2, linejoin: 'round' };
    static FONT = { fill:'#000', family:FONT_FAMILY, size:14 };
    static MARGIN = 5;
    static BUTTON_WIDTH=20;
    static BUTTON_HEIGHT = 20;
    static X_BUS = 75;
    #group;
    #champ;
    #textes;
    #values;
    #reg;
    #buttons;
    #buttonsText;
    #fmt;
    #ledWR;
    #arrBus;
    #bus;
    #dataPort;
    constructor(parent){
        this.#reg = new Register(0); // sert pour les conversions
        this.#group = parent.nested();
        let back = this.#group.rect(GOut.WIDTH, GOut.HEIGHT);
        back.stroke('none').fill(GOut.COLOR);

        this.#champ = this.#group.rect(GOut.WIDTH - 2*GOut.PADDING, GOut.HEIGHT - 2*GOut.PADDING - GOut.HEAD - GOut.FOOT);
        this.#champ.stroke(GOut.STROKE).fill('#fff');
        this.#champ.move(GOut.PADDING, GOut.HEAD + GOut.PADDING);

        let entete = this.#group.text('Sortie');
        entete.font(TITLE);
        entete.move(3,3);
        this.#textes = [];
        this.#values = [];
        this.#buttons = [];
        this.#buttonsText = ['b', 'h', 's', 'u'];
        for (let i=0; i<this.#buttonsText.length; i++){
            let button = new Button(this.#group, {
                width:GOut.BUTTON_WIDTH,
                height:GOut.BUTTON_HEIGHT,
                linewidth:1,
                label:this.#buttonsText[i],
                callback:(e) => {this.setFormat(this.#buttonsText[i]);}

            })
            button.move(GOut.MARGIN + i*GOut.BUTTON_WIDTH, GOut.HEAD - GOut.BUTTON_HEIGHT);
            this.#buttons.push(button);
        }

        this.#ledWR = new Led(this.#group, {anchor:'north', 'label':'WR'});
        this.#ledWR.move(20, GOut.HEIGHT);

        this.#bus = this.#group.path(`M${this.#champ.cx()} ${this.#champ.y() + this.#champ.height()} V${GOut.HEIGHT}`);
        this.#bus.fill('none').stroke(DATA_BUS);
        this.#dataPort = this.#group.rect(10, 5).cx(this.#champ.cx()).y(GOut.HEIGHT - 5);
        this.#dataPort.stroke('none').fill(DATA_BUS.color);
        this.#arrBus = this.#group.path(`M${this.#champ.cx()} ${GOut.HEIGHT - 20} l-7.5 10 15 0 Z`);
        this.#arrBus.stroke('none').fill(HIGHLIGHTED_DATA_BUS.color);
        this.#arrBus.attr('display', 'none');

        this.setFormat('h');
    }

    setFormat(fmt){
        switch(fmt) {
            case 'h': this.#fmt = 'hex'; break;
            case 'b': this.#fmt = 'bin'; break;
            case 's': this.#fmt = 'signed'; break;
            default : this.#fmt = 'unsigned'; break;
        }

        for(let i=0; i<this.#buttonsText.length; i++) {
            if (fmt == this.#buttonsText[i]){
                this.#buttons[i].setOn();
            } else {
                this.#buttons[i].setOff();
            }
        }
        for (let i=0; i<this.#textes.length; i++) {
            let v = this.#values[i];
            this.#reg.write(v);
            let text = this.#reg.read(this.#fmt);
            let t = this.#textes[i];
            t.text(text);
            t.x(GOut.WIDTH -GOut.PADDING - GOut.MARGIN - t.length());
        }
    }



    add(value) {
        for (let i=0; i<this.#textes.length; i++) {
            let t = this.#textes[i];
            t.dmove(0, -GOut.FONT.size - GOut.MARGIN);
        }
        while (this.#textes.length > 0) {
            let t = this.#textes[0];
            if (t.y() + GOut.FONT.size < this.#champ.y()) {
                this.#textes.shift();
                this.#values.shift();
            } else {
                break;
            }
        }
        this.#reg.write(value);
        this.#values.push(this.#reg.value);
        let text = this.#reg.read(this.#fmt);
        let newT = this.#group.text(text);
        this.#textes.push(newT);
        newT.font(GOut.FONT);
        newT.move(GOut.WIDTH -GOut.PADDING - GOut.MARGIN - newT.length(), this.#champ.y() + this.#champ.height() - GOut.MARGIN - GOut.FONT.size);
    }

    move(x, y) {
        this.#group.move(x, y);
        return this;
    }

    setWR(value) {
        if (value === true) {
            this.#ledWR.setOn();
            this.#arrBus.attr('display', null);
            this.#bus.stroke(HIGHLIGHTED_DATA_BUS);
            this.#dataPort.fill(HIGHLIGHTED_DATA_BUS.color);
        } else {
            this.#ledWR.setOff();
            this.#arrBus.attr('display', 'none');
            this.#bus.stroke(DATA_BUS);
            this.#dataPort.fill(DATA_BUS.color);
        }
    }

    purge() {
        this.#values = [];
        for (let i=0; i<this.#textes.length; i++) {
            this.#textes[i].remove();
        }
        this.#textes = [];
    }

    get wrAnchor() {
        let [x, y] = this.#ledWR.anchorSouth;
        return [this.#group.x() + x, this.#group.y() + y];
    }

    get anchorData() {
        return [this.#champ.cx() + this.#group.x(), this.#group.y() + GOut.HEIGHT];
    }
}

export { GOut };