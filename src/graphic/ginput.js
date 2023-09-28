import { SVG } from '@svgdotjs/svg.js';
import { GRegister } from './gregister';
import { Button } from './button';
import { Led } from './led';
import {
    DATA_BUS,
    HIGHLIGHTED_DATA_BUS,
    FONT_FAMILY,
    TITLE
} from './styles';

class GInput {
    static WIDTH = 240;
    static HEIGHT = 70;
    static PADDING = 10;
    static FIELD_HEIGHT = 25;
    static FILL ='#bcb';


    #group;
    #back;
    #value;
    #bus;
    #dataPort;
    #arrBus;
    #ledRD;
    #warningText;
    #callback = null;
    constructor(parent) {
        this.#group = parent.nested();
        this.#back = this.#group.rect(GInput.WIDTH, GInput.HEIGHT);
        this.#back.fill(GInput.FILL).stroke('none');
        let titre = this.#group.text('Entrée');
        titre.font(TITLE);
        titre.move(3, 3);

        let button = new Button(this.#group, {
            width:30,
            height:21,
            label:'Ok',
            callback: (e) => {
                let val = document.getElementById('inputWidget').value;
                this.#addInput(val.trim());
            }

        });
        button.move(80,45);

        let foreignObject = this.#group.foreignObject(80, 22);
        foreignObject.add(SVG(`<div xmlns="http://www.w3.org/1999/xhtml"><input type='text' id='inputWidget' value='' placeholder='???' class='inputWidget'></div>`));
        foreignObject.move(3, 45);

        let node = document.getElementById("inputWidget");
        node.addEventListener("keyup", (e) => {
            if (e.key == 'Enter') {
                let val = document.getElementById('inputWidget').value;
                this.#addInput(val.trim());
            }
        });

        this.#warningText = this.#group.text('Entrée attendue');
        this.#warningText.font({fill:'#d00', family:FONT_FAMILY, size:12});
        this.#warningText.move(3, 30);
        this.#warningText.hide();

        this.#value = new GRegister(this.#group);
        this.#value.move(150, 10);
        this.#value.activate(false);

        this.#ledRD = new Led(this.#group, {anchor:'north', 'label':'RD'});
        this.#ledRD.move(225, GInput.HEIGHT);

        let [x, y] = this.#value.anchorSouth;
        this.#bus = this.#group.path(`M${x} ${y} V${GInput.HEIGHT}`);
        this.#bus.fill('none').stroke(DATA_BUS);
        this.#dataPort = this.#group.rect(10, 5).cx(x).y(GInput.HEIGHT - 5);
        this.#dataPort.stroke('none').fill(DATA_BUS.color);
        this.#arrBus = this.#group.path(`M${x} ${GInput.HEIGHT - 10} l-7.5 -10 15 0 Z`);
        this.#arrBus.stroke('none').fill(HIGHLIGHTED_DATA_BUS.color);
        this.#arrBus.hide();
    }

    /**
     * @param {(arg0: (v: CallableFunction) => void) => void} callback
     */
    setCallback(callback) {
        this.#callback = callback;
    }

    setRD(value) {
        if (value === true) {
            this.#ledRD.setOn();
            this.#arrBus.show();
            this.#bus.stroke(HIGHLIGHTED_DATA_BUS);
            this.#dataPort.fill(HIGHLIGHTED_DATA_BUS.color);
            this.warning(!this.#value.active);
        } else {
            this.#ledRD.setOff();
            this.#arrBus.hide();
            this.#bus.stroke(DATA_BUS);
            this.#dataPort.fill(DATA_BUS.color);
            this.warning(false);
        }
    }

    warning(value) {
        if (value === true) {
            this.#back.stroke({color:'#d00', width:'4', linejoin: 'round' });
            this.#warningText.show();
        } else {
            this.#back.stroke('none');
            this.#warningText.hide();
        }
    }

    #addInput(text){
        if ((text == '') || isNaN(text)) {
            return;
        }
        let v = Math.trunc(Number(text));
        this.#value.activate(true);
        this.#value.setValue(v);
        this.warning(false);
        if (this.#callback !== null) {
            this.#callback(v);
        }
    }

    read() {
        if (this.#value.active) {
            let v = this.#value.value;
            this.#value.activate(false);
            return v;
        } else {
            this.warning(true);
            return null;
        }
    }

    purge() {
        this.#value.activate(false);
    }

    move(x, y) {
        this.#group.move(x, y);
        return this;
    }

    get rdAnchor() {
        let [x, y] = this.#ledRD.anchorSouth;
        return [this.#group.x() + x, this.#group.y() + y];
    }

    get anchorData() {
        return [this.#dataPort.cx() + this.#group.x(), this.#group.y() + GInput.HEIGHT];
    }

    get value() {
        if (this.#value.active) {
            return this.#value.value;
        } else {
            return null;
        }
    }


}

export { GInput };