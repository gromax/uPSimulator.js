import _ from 'lodash';

import { GUal } from './gual';
import { GMemory } from './gmemory';
import { GUc } from './guc';
import { GOut } from './gout';
import { GInput } from './ginput';
import { Button } from './button';
import {
    ADDRESS_BUS,
    DATA_BUS,
    HIGHLIGHTED_ADDRESS_BUS,
    ON_COLOR,
    OFF_COLOR,
    HIGHLIGHTED_DATA_BUS,
    FONT_FAMILY
} from './styles';

const PATHS = {
    'ri,ual': 'M510 500 v-35 H420 V357.5 H250',
    'input,ual': 'M290 180 V357.5 H250',
    'output,ual': 'M420 180 V357.5 H250',
    'memory,ual': 'M250 357.5 H500',
    'input,memory': 'M290 180 V357.5 H500',
    'memory,output': 'M420 180 V357.5 H500',
    'memory,ri': 'M510 500 v-35 H420 V357.5 H500',
    'output,ri': 'M510 500 v-35 H420 V180',
    'pl,ri': 'M510 500 v-35 H660 V500'
}


class GProc {
    static WIRE_STROKE = { color:OFF_COLOR, width:2, linecap: 'butt', linejoin:'round' };
    #group;
    #ual;
    #memory;
    #uc;
    #out;
    #input;
    #addressRI;
    #addressPL;
    #addressSP;
    #arrAddress;

    #comUalWire;
    #rdUalWire;
    #wrUalWire;
    #zUalWire;
    #pUalWire;

    #rdInputWire;
    #wrOutputWire;
    
    #rdMemWire;
    #wrMemWire;

    #highlightedData = null;

    #rdDataOn = 'off';
    #wrDataOn = 'off';

    constructor(parent, callbacks = {}) {
        this.#group = parent.nested();

        // DATA BUS
        this.#group.path('M250 357.5 H500').fill('none').stroke(DATA_BUS); // UAL -> Mem
        this.#group.path('M290 180 V 357.5').fill('none').stroke(DATA_BUS); // IN
        this.#group.circle(2*DATA_BUS.width).stroke('none').fill(DATA_BUS.color).cx(290).cy(357.5);
        this.#group.path('M420 180 V 357.5').fill('none').stroke(DATA_BUS); // OUT
        this.#group.circle(2*DATA_BUS.width).stroke('none').fill(DATA_BUS.color).cx(420).cy(357.5);
        this.#group.path('M510 500 v-35 H420 V357.5').fill('none').stroke(DATA_BUS); // RI
        this.#group.path('M640 500 v-35 H490').fill('none').stroke(DATA_BUS); // PL
        this.#group.circle(2*DATA_BUS.width).stroke('none').fill(DATA_BUS.color).cx(510).cy(465);

        // ADDRESS BUS
        this.#group.circle(2*ADDRESS_BUS.width).stroke('none').fill(ADDRESS_BUS.color).cx(660).cy(485);
        this.#group.circle(2*ADDRESS_BUS.width).stroke('none').fill(ADDRESS_BUS.color).cx(730).cy(485);
        let g = this.#group.group();
        this.#addressRI = g.path('M530 500 v-15 H730 V450').fill('none').stroke(ADDRESS_BUS); // RI
        this.#addressPL = g.path('M660 500 v-15 H730 V450').fill('none').stroke(ADDRESS_BUS); // PL
        this.#addressSP = g.path('M770 500 v-15 H730 V450').fill('none').stroke(ADDRESS_BUS); // SP
        this.#arrAddress = this.#group.path('M730 460 l-7.5 10 15 0 Z').fill(HIGHLIGHTED_ADDRESS_BUS.color).stroke('none');
        this.#arrAddress.hide();
        
        // COMMANDS WIRES
        this.#comUalWire = this.#group.path('M25 430 V510').fill('none').stroke(GProc.WIRE_STROKE);
        this.#rdUalWire = this.#group.path('M100 430 V510').fill('none').stroke(GProc.WIRE_STROKE);
        this.#wrUalWire = this.#group.path('M130 430 V510').fill('none').stroke(GProc.WIRE_STROKE);
        this.#zUalWire = this.#group.path('M55 420 V510').fill('none').stroke(GProc.WIRE_STROKE);
        this.#pUalWire = this.#group.path('M70 420 V510').fill('none').stroke(GProc.WIRE_STROKE);
        this.#rdMemWire = this.#group.path('M830 450 V510').fill('none').stroke(GProc.WIRE_STROKE);
        this.#wrMemWire = this.#group.path('M860 450 V510').fill('none').stroke(GProc.WIRE_STROKE);
        this.#rdInputWire = this.#group.path('M325 180 V510').fill('none').stroke(GProc.WIRE_STROKE);
        this.#wrOutputWire = this.#group.path('M370 180 V510').fill('none').stroke(GProc.WIRE_STROKE);

        // éléments
        this.#ual = (new GUal(this.#group)).move(0, 207.5);
        this.#memory = (new GMemory(this.#group)).move(500, 0);
        this.#uc = (new GUc(this.#group)).move(0, 500);
        this.#out = (new GOut(this.#group)).move(350, 0);
        this.#input = (new GInput(this.#group)).move(100, 110);

        // embellissement
        this.#group.text('Bus Data 16 bits').font({ family:FONT_FAMILY, fill:DATA_BUS.color, size:12, 'font-style':'italic' }).move(422, 467);
        this.#group.text('Bus @ 8 bits').font({ family:FONT_FAMILY, fill:ADDRESS_BUS.color, size:12, 'font-style':'italic' }).move(737, 467);

        // boutons
        let buttons = [];
        for (let key in callbacks) {
            let c = callbacks[key][0];
            let h = callbacks[key][1];
            let button = new Button(this.#group, { width:50, height:30, label:key, callback:c, hint:h });
            let x = (buttons.length == 0) ? 400 : buttons[buttons.length-1].right();
            buttons.push(button);
            button.move(x, 600);
        }
    }



    #setMemMode(value){
        switch(value) {
            case 'read':
                this.#rdMemWire.stroke({color:ON_COLOR});
                this.#wrMemWire.stroke({color:OFF_COLOR});
                break;
            case 'write':
                this.#wrMemWire.stroke({color:ON_COLOR});
                this.#rdMemWire.stroke({color:OFF_COLOR});
                break;
            default:
                this.#rdMemWire.stroke({color:OFF_COLOR});
                this.#wrMemWire.stroke({color:OFF_COLOR});
        }
        this.#memory.setMode(value);
    }

    setUalCom(name) {
        if ((name === false) || (name === null) || (name == 'off')) {
            this.#ual.setCommand('off');
            this.#comUalWire.stroke({ color:OFF_COLOR });
        } else {
            this.#ual.setCommand(name);
            this.#comUalWire.stroke({ color:ON_COLOR });
        }
    }

    setAddressBus(port) {
        this.#uc.ri.setA(false);
        this.#uc.pl.setA(false);
        this.#uc.sp.setA(false);
        switch(port) {
            case 'ri':
                this.#addressRI.stroke(HIGHLIGHTED_ADDRESS_BUS);
                this.#addressRI.front();
                this.#addressPL.stroke(ADDRESS_BUS);
                this.#addressSP.stroke(ADDRESS_BUS);
                this.#uc.ri.setA(true);
                this.#memory.setAddress(this.#uc.ri.read('low'));
                this.#memory.activateAddress(true);
                this.#arrAddress.show();
                break;
            case 'pl':
                this.#addressRI.stroke(ADDRESS_BUS);
                this.#addressPL.stroke(HIGHLIGHTED_ADDRESS_BUS);
                this.#addressPL.front();
                this.#addressSP.stroke(ADDRESS_BUS);
                this.#uc.pl.setA(true);
                this.#memory.setAddress(this.#uc.pl.read('low'));
                this.#memory.activateAddress(true);
                this.#arrAddress.show();
                break;
            case 'sp':
                this.#addressRI.stroke(ADDRESS_BUS);
                this.#addressPL.stroke(ADDRESS_BUS);
                this.#addressSP.stroke(HIGHLIGHTED_ADDRESS_BUS);
                this.#uc.sp.setA(true);
                this.#addressSP.front();
                this.#memory.setAddress(this.#uc.sp.read('low'));
                this.#memory.activateAddress(true);
                break;
            default:
                this.#addressRI.stroke(ADDRESS_BUS);
                this.#addressPL.stroke(ADDRESS_BUS);
                this.#addressSP.stroke(ADDRESS_BUS);
                this.#memory.activateAddress(false);
                this.#arrAddress.hide();
        }
    }

    get memory() {
        return this.#memory;
    }

    get input() {
        return this.#input;
    }

    get out() {
        return this.#out;
    }

    get ual() {
        return this.#ual;
    }

    get uc() {
        return this.#uc;
    }

    setUalZ(value) {
        this.#ual.setZ(value);
        let color = value ? ON_COLOR:OFF_COLOR;
        this.#zUalWire.stroke({color:color});
    }

    setUalP(value) {
        this.#ual.setP(value);
        let color = value ? ON_COLOR:OFF_COLOR;
        this.#pUalWire.stroke({color:color});
    }

    #offRd(name) {
        switch(name){
            case 'memory': this.#setMemMode('off'); break;
            case 'input': this.#input.setRD(false); this.#rdInputWire.stroke({color:OFF_COLOR}); break;
            case 'ual': this.#ual.setRD(false); this.#rdUalWire.stroke({color:OFF_COLOR}); break;
            case 'ri':this.#uc.ri.setRD(false); break;
            case 'off': break;
            default:
                throw Error(`[GProc.#offRd] ${name} n'a pas de commande RD.`);
        }
    }

    #offWr(name) {
        switch(name){
            case 'memory': this.#setMemMode('off'); break;
            case 'output': this.#out.setWR(false); this.#wrOutputWire.stroke({color:OFF_COLOR}); break;
            case 'ual': this.#ual.setWR(false); this.#wrUalWire.stroke({color:OFF_COLOR}); break;
            case 'ri':this.#uc.ri.setWR(false); break;
            case 'pl':this.#uc.pl.setWR(false); break;
            case 'off': break;
            default:
                throw Error(`[GProc.#offWr] ${name} n'a pas de commande WR.`);
        }
    }

    #onRd(name) {
        this.#offRd(this.#rdDataOn);
        this.#rdDataOn = name;
        switch(name){
            case 'memory': this.#setMemMode('read'); break;
            case 'input': this.#input.setRD(true); this.#rdInputWire.stroke({color:ON_COLOR}); break;
            case 'ual': this.#ual.setRD(true); this.#rdUalWire.stroke({color:ON_COLOR}); break;
            case 'ri':this.#uc.ri.setRD(true); break;
            case 'off': break;
            default:
                throw Error(`[GProc.#onRd] ${name} n'a pas de commande RD.`);
        }
    }

    #onWr(name) {
        this.#offWr(this.#wrDataOn);
        this.#wrDataOn = name;
        switch(name){
            case 'memory': this.#setMemMode('write'); break;
            case 'output': this.#out.setWR(true); this.#wrOutputWire.stroke({color:ON_COLOR}); break;
            case 'ual': this.#ual.setWR(true); this.#wrUalWire.stroke({color:ON_COLOR}); break;
            case 'ri':this.#uc.ri.setWR(true); break;
            case 'pl':this.#uc.pl.setWR(true); break;
            case 'off': break;
            default:
                throw Error(`[GProc.#onWr] ${name} n'a pas de commande WR.`);
        }
    }


    setDataIO(input, output) {
        this.#onRd(input);
        this.#onWr(output);
        if (this.#highlightedData !== null) {
            this.#highlightedData.remove();
            this.#highlightedData = null;
        }
        if ((input == 'off') || (output == 'off')) {
            return;
        }
        let label = [input, output].sort().join(',');
        if (!(label in PATHS)) {
            throw Error(`[GProc.setDataIO] La connexion ${input} -> ${output} n'est pas prévue.`);
        }
        let p = PATHS[label];
        this.#highlightedData = this.#group.path(p).fill('none').stroke(HIGHLIGHTED_DATA_BUS);
    }

    offAll() {
        this.#uc.pl.setInc(false);
        this.#uc.sp.setInc(false);
        this.#uc.sp.setDec(false);
        this.setDataIO('off', 'off');
        this.setAddressBus('off');
        this.ual.setRD(false);
        this.ual.setWR(false);
        this.ual.setCommand('off');
        this.#input.warning('off');
    }


}

export { GProc };