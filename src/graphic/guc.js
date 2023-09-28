import { SVG } from "@svgdotjs/svg.js";
import { GRegister } from "./gregister";
import { DecodeRI } from "./decoderi";
import {
    FONT_FAMILY,
    DATA_BUS,
    HIGHLIGHTED_DATA_BUS,
    ADDRESS_BUS,
    HIGHLIGHTED_ADDRESS_BUS,
    TITLE
} from "./styles";
import { Led } from "./led";

class PLBloc {
    static HEIGHT = 85;
    static WIDTH = 120;
    static FILL = '#8f8';
    #group;
    #reg;
    #ledInc;
    #ledA;
    #ledWR;
    #dbus;
    #abus;
    constructor(parent) {
        this.#group = parent.nested();
        let rectPl = this.#group.rect(PLBloc.WIDTH, PLBloc.HEIGHT);
        rectPl.fill(PLBloc.FILL).stroke('none');
        let textPl = this.#group.text('PL');
        textPl.font({ fill:'#000', family:FONT_FAMILY, size:20 });
        textPl.move(3,3);
        this.#reg = new GRegister(this.#group, true);
        this.#reg.move(PLBloc.WIDTH - 10 - this.#reg.width, 20);
        this.#ledInc = new Led(this.#group, {anchor:'north', label:'++'});
        this.#ledInc.move(20, PLBloc.HEIGHT);
        this.#ledA = new Led(this.#group, {anchor:'north', label:'→ @'});
        this.#ledA.move(60, PLBloc.HEIGHT);
        this.#ledWR = new Led(this.#group, {anchor:'north', label:'WR'});
        this.#ledWR.move(100, PLBloc.HEIGHT);

        let [x, y] = this.#reg.anchorNorth;
        this.#dbus = this.#group.path(`M${x - 10} ${y} V0`);
        this.#dbus.fill('none').stroke(DATA_BUS);

        this.#abus = this.#group.path(`M${x + 10} ${y} V0`);
        this.#abus.fill('none').stroke(ADDRESS_BUS);
    }

    move(x, y) {
        this.#group.move(x, y);
        return this;
    }

    get anchorData() {
        let [x, y] = this.#reg.anchorNorth;
        return [x - 10 + this.#group.x(), this.#group.y()];
    }

    get anchorAddress() {
        let [x, y] = this.#reg.anchorNorth;
        return [x + 10 + this.#group.x(), this.#group.y()];
    }

    setInc(value){
        if (value === true) {
            this.#ledInc.setOn();
        } else {
            this.#ledInc.setOff();
        }
    }

    setA(value){
        if (value === true) {
            this.#ledWR.setOff();
            this.#ledA.setOn();
            this.#dbus.stroke(DATA_BUS);
            this.#abus.stroke(HIGHLIGHTED_ADDRESS_BUS);
        } else {
            this.#ledA.setOff();
            this.#abus.stroke(ADDRESS_BUS);
        }
    }

    setWR(value){
        if (value === true) {
            this.#ledWR.setOn();
            this.#ledA.setOff();
            this.#dbus.stroke(HIGHLIGHTED_DATA_BUS);
            this.#abus.stroke(ADDRESS_BUS);
        } else {
            this.#ledWR.setOff();
            this.#dbus.stroke(DATA_BUS);
        }
    }

    read(fmt) {
        return this.#reg.read(fmt);
    }

    setValue(value) {
        this.#reg.setValue(value);
    }

    inc() {
        this.#reg.inc();
    }


}

class SPBloc {
    static HEIGHT = 85;
    static WIDTH = 120;
    static FILL = '#aaf';
    #group;
    #reg;
    #ledInc;
    #ledDec;
    #ledA;
    #abus;
    constructor(parent) {
        this.#group = parent.nested();
        let rectPl = this.#group.rect(SPBloc.WIDTH, SPBloc.HEIGHT);
        rectPl.fill(SPBloc.FILL).stroke('none');
        let textPl = this.#group.text('SP');
        textPl.font({ fill:'#000', family:FONT_FAMILY, size:20 });
        textPl.move(3,3);
        this.#reg = new GRegister(this.#group, true);
        this.#reg.move(SPBloc.WIDTH - 10 - this.#reg.width, 20);
        this.#ledInc = new Led(this.#group, {anchor:'north', label:'++'});
        this.#ledInc.move(20, SPBloc.HEIGHT);
        this.#ledDec = new Led(this.#group, {anchor:'north', label:'--'});
        this.#ledDec.move(60, SPBloc.HEIGHT);
        this.#ledA = new Led(this.#group, {anchor:'north', label:'→ @'});
        this.#ledA.move(100, SPBloc.HEIGHT);

        let [x, y] = this.#reg.anchorNorth;
        this.#abus = this.#group.path(`M${x} ${y} V0`);
        this.#abus.fill('none').stroke(ADDRESS_BUS);
    }

    move(x, y) {
        this.#group.move(x, y);
        return this;
    }

    get anchorAddress() {
        let [x, y] = this.#reg.anchorNorth;
        return [x + this.#group.x(), this.#group.y()];
    }

    setInc(value){
        if (value === true) {
            this.#ledInc.setOn();
        } else {
            this.#ledInc.setOff();
        }
    }

    inc() {
        this.#reg.inc();
    }

    dec() {
        this.#reg.dec();
    }

    setDec(value){
        if (value === true) {
            this.#ledDec.setOn();
        } else {
            this.#ledDec.setOff();
        }
    }

    setA(value){
        if (value === true) {
            this.#ledA.setOn();
            this.#abus.stroke(HIGHLIGHTED_ADDRESS_BUS);
        } else {
            this.#ledA.setOff();
            this.#abus.stroke(ADDRESS_BUS);
        }
    }

    read(fmt) {
        return this.#reg.read(fmt);
    }

    setValue(value) {
        this.#reg.setValue(value);
    }


}

class RIBloc {
    static HEIGHT = 85;
    static WIDTH = 180;
    static FILL = '#f48';
    #group;
    #reg;
    #ledRDLow;
    #ledWR;
    #ledALow;
    #abus;
    #dbus;
    constructor(parent) {
        this.#group = parent.nested();
        let rectPl = this.#group.rect(RIBloc.WIDTH, RIBloc.HEIGHT);
        rectPl.fill(RIBloc.FILL).stroke('none');
        let textPl = this.#group.text('RI');
        textPl.font({ fill:'#000', family:FONT_FAMILY, size:20 });
        textPl.move(3,3);
        this.#reg = new GRegister(this.#group);
        this.#reg.move(RIBloc.WIDTH - 10 - this.#reg.width, 20);
        this.#ledWR = new Led(this.#group, {anchor:'north', label:'WR'});
        this.#ledWR.move(20, RIBloc.HEIGHT);
        this.#ledRDLow = new Led(this.#group, {anchor:'north', label:'RD Low'});
        this.#ledRDLow.move(70, RIBloc.HEIGHT);
        this.#ledALow = new Led(this.#group, {anchor:'north', label:'Low → @'});
        this.#ledALow.move(140, RIBloc.HEIGHT);

        let [x, y] = this.#reg.anchorNorth;
        this.#abus = this.#group.path(`M${x+10} ${y} V0`);
        this.#abus.fill('none').stroke(ADDRESS_BUS);

        this.#dbus = this.#group.path(`M${x-10} ${y} V0`);
        this.#dbus.fill('none').stroke(DATA_BUS);
    }

    move(x, y) {
        this.#group.move(x, y);
        return this;
    }

    get anchorData() {
        let [x, y] = this.#reg.anchorNorth;
        return [x - 10 + this.#group.x(), this.#group.y()];
    }

    get anchorAddress() {
        let [x, y] = this.#reg.anchorNorth;
        return [x + 10 + this.#group.x(), this.#group.y()];
    }

    setWR(value){
        if (value === true) {
            this.#ledWR.setOn();
            this.#ledALow.setOff();
            this.#ledRDLow.setOff();
            this.#dbus.stroke(HIGHLIGHTED_DATA_BUS);
            this.#abus.stroke(ADDRESS_BUS);
        } else {
            this.#ledWR.setOff();
            this.#dbus.stroke(DATA_BUS);
        }
    }

    setRD(value){
        if (value === true) {
            this.#ledWR.setOff();
            this.#ledALow.setOff();
            this.#ledRDLow.setOn();
            this.#dbus.stroke(HIGHLIGHTED_DATA_BUS);
            this.#abus.stroke(ADDRESS_BUS);
        } else {
            this.#ledRDLow.setOff();
            this.#dbus.stroke(DATA_BUS);
        }
    }

    setA(value){
        if (value === true) {
            this.#ledWR.setOff();
            this.#ledALow.setOn();
            this.#ledRDLow.setOff();
            this.#dbus.stroke(DATA_BUS);
            this.#abus.stroke(HIGHLIGHTED_ADDRESS_BUS);
        } else {
            this.#ledALow.setOff();
            this.#abus.stroke(ADDRESS_BUS);
        }
    }

    read(fmt) {
        return this.#reg.read(fmt);
    }

    setValue(value) {
        this.#reg.setValue(value);
    }

}


class GUc {
    static WIDTH = 910;
    static HEIGHT = 135;
    static FILL = '#aaa';
    static BLOC_HEIGHT = 85;
    #group;
    #ri;
    #pl;
    #sp;
    #messageArea;
    #decode;

    constructor(parent) {
        this.#group = parent.nested();
        this.#group.rect(GUc.WIDTH, GUc.HEIGHT).fill(GUc.FILL).stroke('none');
        let title = this.#group.text('UC');
        title.font(TITLE);
        title.move(3,3);
        this.#pl = (new PLBloc(this.#group)).move(570,0);
        this.#sp = (new SPBloc(this.#group)).move(570 + PLBloc.WIDTH,0);
        this.#ri = (new RIBloc(this.#group)).move(390);

        let foreignObject = this.#group.foreignObject(350, 70);
        foreignObject.add(SVG(`<div xmlns="http://www.w3.org/1999/xhtml"><textarea readonly id='ucMessage' class='ucMessage'></div>`));
        foreignObject.move(60, 65);
        this.#messageArea = document.getElementById('ucMessage');
        this.#messageArea.spellcheck = false;

        this.#decode = new DecodeRI(this.#group);
        this.#decode.move(100, 10);
    }

    move(x, y) {
        this.#group.move(x, y);
        return this;
    }

    showMessage(message) {
        this.#messageArea.value = message;
    }

    get anchorRIData() {
        let [x, y] = this.#ri.anchorData;
        return [x + this.#group.x(), y + this.#group.y()];
    }

    get anchorPLData() {
        let [x, y] = this.#pl.anchorData;
        return [x + this.#group.x(), y + this.#group.y()];
    }

    get ri() {
        return this.#ri;
    }

    get sp() {
        return this.#sp;
    }

    get pl() {
        return this.#pl;
    }

    get decode() {
        return this.#decode;
    }


}

export { GUc };