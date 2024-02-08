import { GRegister } from "./gregister";
import { Button } from "./button";
import { Led } from "./led";
import { div } from "../utils/misc";

import {
    DATA_BUS,
    HIGHLIGHTED_DATA_BUS,
    FONT_FAMILY,
    TITLE
} from "./styles";

class GMemory {
    #group;
    #scaleGroup;
    #registers;
    #page;
    #labels;
    #buttons;
    #highlighted = null;
    #pathHighlight = null;
    #rAddress;
    #yAnchorData;
    #ledRD;
    #ledWR;
    #arrRD;
    #arrWR;
    #dataPort;
    #mode = 'off';
    static SIZE = 256;
    static PSIZE = 32;
    static REG_IN_ROW = 4;
    static LINES = 8;
    static HMARGIN = 5;
    static VMARGIN = 15;
    static LMARGIN = 70;
    static HEAD = 50;
    static XBUS = 30;
    static HEIGHT = 450;
    static FILL = '#afa';
    static SCALE = 1;
    constructor(parent){
        this.#group = parent.nested();
        this.#scaleGroup = this.#group.group();
        this.#registers = [];
        this.#labels = [];
        let w = GRegister.BIG_WIDTH + GMemory.HMARGIN;
        let h = GRegister.HEIGHT + GMemory.VMARGIN;
        this.#scaleGroup.attr('transform', `scale(${GMemory.SCALE})`);

        let cadre = this.#scaleGroup.rect(GMemory.LMARGIN + GMemory.REG_IN_ROW*w, GMemory.HEIGHT);
        cadre.fill(GMemory.FILL).stroke('none');

        let text = this.#scaleGroup.text('Mémoire');
        text.font(TITLE);
        text.move(3,3);

        for (let i=0; i<GMemory.SIZE; i++) {
            let col = i % GMemory.REG_IN_ROW;
            let x = GMemory.LMARGIN + col*w;
            let lig = div(i, GMemory.REG_IN_ROW) % (GMemory.PSIZE/GMemory.REG_IN_ROW);
            let y = lig*h + GMemory.HEAD;
            let reg = (new GRegister(this.#scaleGroup)).move(x, y);
            this.#registers.push(reg);
        }
        for (let i=0; i<GMemory.PSIZE; i++){
            let [xr, yr] = this.#registers[i].anchorSouth;
            let col = i % GMemory.REG_IN_ROW;
            let line = (i-col)/GMemory.REG_IN_ROW;
            let xLeft = col == 0 ? GMemory.XBUS : xr - w;
            let p = this.#scaleGroup.path(`M${xr} ${yr} l 0 ${GMemory.VMARGIN/2} H ${xLeft}`);
            p.stroke(DATA_BUS).fill('none');
            
            if ((line > 0) && (line < GMemory.LINES-1)) {
                let c = this.#scaleGroup.circle(2*DATA_BUS.width);
                c.cx(xLeft).cy(yr + GMemory.VMARGIN/2).fill(DATA_BUS.color).stroke('none');
            }
            if (col != 0) {
                continue;
            }
            let label = this.#scaleGroup.text('');
            label.font({ fill:'#000', family:FONT_FAMILY, PSIZE:14 });
            label.y(yr - GRegister.HEIGHT/2 + 7);
            this.#labels.push(label);
        }

        
        this.#yAnchorData = this.#registers[(GMemory.LINES-2)*GMemory.REG_IN_ROW].anchorSouth[1] + GMemory.VMARGIN/2;
        this.#dataPort = this.#scaleGroup.rect(5,10).x(0).cy(this.#yAnchorData).fill(DATA_BUS.color).stroke('none');

        let vp = this.#scaleGroup.path(`M${GMemory.XBUS+10} ${this.#registers[0].bottom + GMemory.VMARGIN/2} h-10 v${(GMemory.PSIZE/GMemory.REG_IN_ROW - 1)*h} h10`);
        vp.stroke(DATA_BUS).fill('none');
        this.#scaleGroup.path(`M0 ${this.#yAnchorData} h${GMemory.XBUS}`).stroke(DATA_BUS).fill('none');

        this.#buttons = [];
        let gButtons = this.#scaleGroup.nested();
        for (let i=0; i<GMemory.SIZE/GMemory.PSIZE; i++){
            let col = i%4;
            let lig = div(i, 4);
            let button = new Button(gButtons, {
                width:50,
                height:20,
                size:12,
                label:`${i*GMemory.PSIZE} - ${(i+1)*GMemory.PSIZE-1}`,
                hint:`Afficher les adresses ${i*GMemory.PSIZE} à ${(i+1)*GMemory.PSIZE-1}`,
                callback: (e) => {this.#setPage(i);}
            });
            button.move(col*51, lig*21+3)
            this.#buttons.push(button);
        }
        gButtons.x(180);

        this.#rAddress = (new GRegister(this.#scaleGroup, true)).move(200, GMemory.HEIGHT - GRegister.HEIGHT);
        let addressText = this.#scaleGroup.text('@');
        addressText.font({ fill:'#000', family:FONT_FAMILY, PSIZE:20 });
        addressText.move(200 - addressText.length() - 5, GMemory.HEIGHT - GRegister.HEIGHT/2 - 10 );
      
        this.#ledRD = new Led(this.#scaleGroup, {anchor:'north', label:'RD', 'hint':"Mémoire -> BUS DATA"});
        this.#ledRD.move(330, GMemory.HEIGHT);
        this.#ledWR = new Led(this.#scaleGroup, {anchor:'north', label:'WR', 'hint':"BUS DATA -> Mémoire"});
        this.#ledWR.move(360, GMemory.HEIGHT);
        this.#arrRD = this.#scaleGroup.path(`M15 ${this.#yAnchorData} l10 -7.5 0 15 Z`).stroke('none').fill(HIGHLIGHTED_DATA_BUS.color);
        this.#arrWR = this.#scaleGroup.path(`M30 ${this.#yAnchorData} l-10 -7.5 0 15 Z`).stroke('none').fill(HIGHLIGHTED_DATA_BUS.color);
        this.#setPage(0);
        this.setMode('off');

    }

    load(values) {
        for (let i=0; i<Math.min(values.length, GMemory.SIZE); i++) {
            this.#registers[i].setValue(values[i]);
        }
        
        for (let i=values.length; i<GMemory.SIZE; i++) {
            this.#registers[i].setValue(0);
        }
    }

    setMode(mode) {
        this.#mode = mode;
        let n = this.#rAddress.value;
        let page = div(n, GMemory.PSIZE);
        switch(mode) {
            case 'read':
                this.#ledRD.setOn();
                this.#ledWR.setOff();
                this.#highlight(n);
                this.#setPage(page);
                break;
            case 'write':
                this.#ledRD.setOff();
                this.#ledWR.setOn();
                this.#highlight(n);
                this.#setPage(page);
                break;
            default:
                this.#ledRD.setOff();
                this.#ledWR.setOff();
                this.#highlight(false);
        }
    }

    setRD(value) {
        if (value === true) {
            this.setMode('read');
        } else {
            this.setMode('off');
        }
    }

    setWR(value) {
        if (value === true) {
            this.setMode('write');
        } else {
            this.setMode('off');
        }
    }

    #updateHighlightedBus(){
        if ((this.#mode == 'off') || (this.#highlighted === null) || (this.#page != div(this.#highlighted, GMemory.PSIZE))) {
            this.#arrRD.attr('display', 'none');
            this.#arrWR.attr('display', 'none');
            this.#dataPort.fill(DATA_BUS.color);
            if (this.#pathHighlight !== null) {
                this.#pathHighlight.attr('display', 'none');
            }
        } else if (this.#mode == 'read') {
            this.#arrRD.attr('display', null);
            this.#arrWR.attr('display', 'none');
            this.#dataPort.fill(HIGHLIGHTED_DATA_BUS.color);
            if (this.#pathHighlight !== null) {
                this.#pathHighlight.attr('display', null);
            }
        } else if (this.#mode == 'write') {
            this.#arrRD.attr('display', 'none');
            this.#arrWR.attr('display', null);
            this.#dataPort.fill(HIGHLIGHTED_DATA_BUS.color);
            if (this.#pathHighlight !== null) {
                this.#pathHighlight.attr('display', null);
            }
        }
    }

    #setPage(n) {
        this.#page = n % (GMemory.SIZE/GMemory.PSIZE);
        let offset = this.#page * GMemory.PSIZE;
        for (let i=0; i<GMemory.PSIZE/GMemory.REG_IN_ROW; i++){
            let label = this.#labels[i];
            label.text(`${offset+i*GMemory.REG_IN_ROW}`);
            label.x(this.#registers[offset + i*GMemory.REG_IN_ROW].left - label.length() - 2);
        }
        for (let i=0; i<GMemory.SIZE; i++){
            if (div(i, GMemory.PSIZE) == this.#page){
                this.#registers[i].show();
            } else {
                this.#registers[i].hide();
            }
        }
        for (let i=0; i<GMemory.SIZE/GMemory.PSIZE; i++){
            this.#buttons[i].setOff();
        }
        this.#buttons[this.#page].setOn();
        this.#updateHighlightedBus();
    }

    #highlight(n) {
        if (this.#highlighted !== null){
            this.#registers[this.#highlighted].highlight(false);
        }
        if (this.#pathHighlight !== null){
            this.#pathHighlight.remove();
            this.#pathHighlight = null;
        }
        if (n === false) {
            n = null;
        }
        this.#highlighted = n;
        if (n !== null) {
            let reg = this.#registers[n];
            reg.highlight(true);
            let [x, y] = reg.anchorSouth;
            this.#pathHighlight = this.#scaleGroup.path(`M${x} ${y} v${GMemory.VMARGIN/2} H${GMemory.XBUS} V${this.#yAnchorData} H0`);
            this.#pathHighlight.stroke(HIGHLIGHTED_DATA_BUS).fill('none');
        }
        this.#updateHighlightedBus();
    }

    setAddress(a) {
        this.#rAddress.setValue(a);
    }

    activateAddress(value) {
        this.#rAddress.activate(value);
    }

    move(x, y) {
        this.#group.move(x, y);
        return this;
    }

    get anchorData() {
        return [this.#group.x(), this.#yAnchorData*GMemory.SCALE + this.#group.y()];
    }

    get anchorAddress() {
        let [x, y] = this.#rAddress.anchorSouth;
        return [x*GMemory.SCALE + this.#group.x(), y*GMemory.SCALE + this.#group.y()];
    }

    get rdAnchor() {
        let [x, y] = this.#ledRD.anchorSouth;
        return [
            x + this.#group.x(),
            y + this.#group.y()
        ];
    }

    get wrAnchor() {
        let [x, y] = this.#ledWR.anchorSouth;
        return [
            x + this.#group.x(),
            y + this.#group.y()
        ];
    }

    write(address, value) {
        this.#registers[address].setValue(value);
    }

    read(address, fmt) {
        return this.#registers[address].read(fmt);
    }

    link(nodes) {
        /* nodes: dictionnaire de forme {adresse:node}
           relie les gregister concernés pour qu'ils mettent à jour le node à chaque changement */
        for (let adresse in nodes) {
            this.#registers[adresse].link(nodes[adresse])
        }
    }

}

export { GMemory }