import { GRegister } from "./gregister";
import { Led } from "./led";
import {
    DATA_BUS,
    HIGHLIGHTED_DATA_BUS,
    FONT_FAMILY,
    TITLE,
    ON_COLOR,
    OFF_COLOR
} from "./styles";

class GUal {
    #group;
    #in;
    #w;
    #ledZ;
    #ledP;
    #comText;
    #backCom;

    #pathInOn;
    #pathWOn;
    #ledZWire;
    #ledPWire;

    #ledRD;
    #ledWR;

    static FILL = '#f00';
    static WIDTH = 250;
    static HEIGHT = 220;
    static BACK = '#faa';
    static BUSFILL = '#a16b1b';
    static STROKE = { color: '#000', width: 4, linecap: 'round', linejoin: 'round' };
    static REGMARGIN = 10;
    static COM_WIDTH = 40;
    static X_COM = 5;

    static YBUS = 150;
    static BUS_MARGIN = 7.5;


    constructor(parent) {
        let h = GRegister.HEIGHT;
        let w = GRegister.BIG_WIDTH;
        let hUal = w + 20; // hauteur de la forme en V
        this.#group = parent.nested();
        this.#group.rect(GUal.WIDTH, GUal.HEIGHT).fill(GUal.BACK).stroke('none'); // fond

        this.#in = (new GRegister(this.#group)).move(30 + 20 + w, 5);
        let topUal = this.#in.bottom + GUal.REGMARGIN;
        let bottomUal = topUal + hUal;
        this.#w = (new GRegister(this.#group)).move(30 + w/2 + 10, bottomUal + GUal.REGMARGIN);
        
        let busW = this.#group.rect(10, GUal.REGMARGIN).move(30+w+10-5, bottomUal);
        busW.fill(GUal.BUSFILL);

        let busIn = this.#group.rect(10, GUal.REGMARGIN).move(30 + w + 20 + w/2 - 5, this.#in.bottom);
        busIn.fill(GUal.BUSFILL);

        let retourW = this.#group.path(`M${this.#w.left} ${this.#w.top + h/2 - 5} H15 V15 H${30+w/2-5} V${topUal} h10 V5 H5 V${this.#w.top + h/2 + 5} H${this.#w.left} Z`);
        retourW.fill(GUal.BUSFILL);
        let fleche = this.#group.path(`M10 ${h + GUal.REGMARGIN + w/2+10 -20} l10 40 -20 0 Z`);
        fleche.fill(GUal.BUSFILL);

        let path = this.#group.path(`M30 ${this.#in.bottom+GUal.REGMARGIN} l ${w} 0 10 20 10 -20 ${w} 0 ${-w/2-10} ${w+20} ${-w} 0 Z`);
        path.fill(GUal.FILL);
        path.stroke(GUal.STROKE);
        let text = this.#group.text('UAL');
        text.font(TITLE);
        text.cx(30 + w + 10).cy(h + 10 + w/2 + 10);

        this.#ledZ = new Led(this.#group, {anchor:'east', label:'Z', 'hint':"Résultat précédent est = 0"});
        let deltaY = 50; 
        this.#ledZ.move(30 + deltaY/2, topUal + deltaY);
        let [xZ, yZ] = this.#ledZ.anchorSouth;
        this.#ledZWire = this.#group.path(`M${xZ} ${yZ} V${GUal.HEIGHT}`).fill('none').stroke({width:2, linecap: 'butt'});
        this.setZ(false);

        this.#ledP = new Led(this.#group, {anchor:'east', label:'P', 'hint':"Résultat précédent est >= 0"});
        deltaY = 80; 
        this.#ledP.move(30 + deltaY/2, topUal + deltaY);
        let [xP, yP] = this.#ledP.anchorSouth;
        this.#ledPWire = this.#group.path(`M${xP} ${yP} V${GUal.HEIGHT}`).fill('none').stroke({width:2, linecap: 'butt'});
        this.setP(false);

        this.#backCom = this.#group.rect(GUal.COM_WIDTH,20);
        let hintNode = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        hintNode.textContent = "Opératon à exécuter";
        this.#backCom.node.appendChild(hintNode);
        this.#backCom.x(GUal.X_COM).cy(GUal.HEIGHT);
        this.#backCom.fill('#fff').stroke({ color: '#000', width: 2, linecap: 'round', linejoin: 'round' });
        this.#comText = this.#group.text('');
        this.#comText.font({fill:'#000', family:FONT_FAMILY, size:16});
        this.setCommand('-');

        let [xInBus, yInBus] = this.#in.anchorEast;
        let [xW, yW] = this.#w.anchorEast;
        this.#group.path(`M${xInBus} ${yInBus} H${GUal.WIDTH - GUal.BUS_MARGIN} V${yW} H${xW}`).fill('none').stroke(DATA_BUS);
        this.#group.rect(2*GUal.BUS_MARGIN, 2*GUal.BUS_MARGIN).cx(GUal.WIDTH - GUal.BUS_MARGIN).cy(GUal.YBUS).stroke('none').fill(DATA_BUS.color);

        this.#pathInOn = this.#group.nested();
        this.#pathInOn.path(`M${xInBus} ${yInBus} H${GUal.WIDTH - GUal.BUS_MARGIN} V${GUal.YBUS}`).fill('none').stroke(HIGHLIGHTED_DATA_BUS);
        this.#pathInOn.rect(2*GUal.BUS_MARGIN, 2*GUal.BUS_MARGIN).cx(GUal.WIDTH - GUal.BUS_MARGIN).cy(GUal.YBUS).stroke('none').fill(HIGHLIGHTED_DATA_BUS.color);
        this.#pathInOn.path(`M${GUal.WIDTH - GUal.BUS_MARGIN} ${GUal.YBUS - 50} l7.5 10 -15 0 Z`).stroke('none').fill(HIGHLIGHTED_DATA_BUS.color);
        this.#pathInOn.attr('display', 'none');

        this.#pathWOn = this.#group.nested();
        this.#pathWOn.path(`M${xW} ${yW} H${GUal.WIDTH - GUal.BUS_MARGIN} V${GUal.YBUS}`).fill('none').stroke(HIGHLIGHTED_DATA_BUS);
        this.#pathWOn.rect(2*GUal.BUS_MARGIN, 2*GUal.BUS_MARGIN).cx(GUal.WIDTH - GUal.BUS_MARGIN).cy(GUal.YBUS).stroke('none').fill(HIGHLIGHTED_DATA_BUS.color);
        this.#pathWOn.path(`M${xW + 30} ${yW} l-10 -7.5 0 15 Z`).stroke('none').fill(HIGHLIGHTED_DATA_BUS.color);
        this.#pathWOn.attr('display', 'none');

        this.#ledRD = new Led(this.#group, {anchor:'north', label:'RD', 'hint':"W -> DATA BUS"});
        this.#ledRD.move(100, GUal.HEIGHT);
        this.#ledWR = new Led(this.#group, {anchor:'north', label:'WR', 'hint':"DATA BUS -> Argument de droite"});
        this.#ledWR.move(130, GUal.HEIGHT);
    }

    setWR(value){
        if (value === true){
            this.#pathInOn.attr('display', null);
            this.#in.highlight(true);
            this.#ledWR.setOn();
        } else {
            this.#pathInOn.attr('display', 'none');
            this.#in.highlight(false);
            this.#ledWR.setOff();
        }
    }

    setRD(value){
        if (value === true){
            this.#pathWOn.attr('display', null);
            this.#w.highlight(true);
            this.#ledRD.setOn();
        } else {
            this.#pathWOn.attr('display', 'none');
            this.#w.highlight(false);
            this.#ledRD.setOff();
        }
    }


    /**
     * @param {str} value
     */
    setIn(value) {
        this.#in.setValue(value);
    }

    /**
     * @param {str} value
     */
    setW(value) {
        this.#w.setValue(value);
    }

    get anchorBus() {
        return [GUal.WIDTH + this.#group.x(), GUal.YBUS + this.#group.y()];
    }

    get ledZAnchor() {
        return [this.#ledZ.anchorSouth[0] + this.#group.x(), GUal.HEIGHT + this.#group.y()];
    }

    get ledPAnchor() {
        return [this.#ledP.anchorSouth[0] + this.#group.x(), GUal.HEIGHT + this.#group.y()];
    }

    get comAnchor() {
        return [this.#backCom.cx() + this.#group.x(), this.#backCom.y() + this.#backCom.height() + this.#group.y()];
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

    setZ(value){
        if (value == true){
            this.#ledZ.setOn();
            this.#ledZWire.stroke({color:ON_COLOR});
        } else {
            this.#ledZ.setOff();
            this.#ledZWire.stroke({color:OFF_COLOR});
        }
    }

    setP(value){
        if (value == true){
            this.#ledP.setOn();
            this.#ledPWire.stroke({color:ON_COLOR});
        } else {
            this.#ledP.setOff();
            this.#ledPWire.stroke({color:OFF_COLOR});
        }
    }

    setCommand(name){
        if (name == 'off') {
            this.#comText.text('-');
            this.#comText.font({ fill:'#888' });
        } else {
            this.#comText.text(name);
            this.#comText.font({ fill:'#000' });
        }
        this.#comText.cx(this.#backCom.cx()).cy(this.#backCom.cy());
    }

    move(x, y) {
        this.#group.move(x, y);
        return this;
    }
}

export { GUal };