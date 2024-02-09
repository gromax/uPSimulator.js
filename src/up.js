import { SVG } from '@svgdotjs/svg.js';
import { GProc } from './graphic/gproc';

import { GET, hexToValues } from './utils/misc';
import { Engine, STATES, DATA_BUS } from './simulation/engine';
import { Box } from './utils/box';
import { VBox } from './utils/variablesbox';
import { Linker } from './utils/linker';

let link = new Linker({
    hex:GET('hex'),
    python:decodeURIComponent(GET('python') || ''),
    asm:decodeURIComponent(GET('asm') || '')
 });

let values = hexToValues(link.hex);

/* en l'absence de code python, pythonbox est une coquille vide */
let pythonbox = new Box(link.python, 'Pseudo Python');
pythonbox.setXY(10,10);
pythonbox.reduce();

/* en l'absence de code asm, asmbox est une coquille vide */
let asmbox = new Box(link.asm, 'Assembleur');
asmbox.setXY(200,10);
asmbox.reduce();

let vbox = null;
{
    let variables = link.variables;
    if (Object.keys(variables).length > 0) {
        let node = document.createElement("div");
        document.body.appendChild(node);
        vbox = new VBox(variables, node);
        vbox.setXY(10,50);
        vbox.reduce();
    }
}



/**
 * @param {GProc} gp
 * @param {Engine} eng
 */
function execCurrent(gp, eng) {
    /* gp: processeur graphique
       eng: moteur de processeur
    */
        let state = engine.state;
        switch(state) {
            case STATES.READ_RI:
                gp.uc.ri.setValue(eng.onBus());
                gp.uc.pl.inc();
                break;
            case STATES.DECODE_RI:
                break;
            case STATES.HALT:
                break;
            case STATES.LOAD_K:
                if (eng.outDataBus() == DATA_BUS.OUT) {
                    gp.out.add(eng.onBus());
                } else {
                    gp.ual.setIn(eng.onBus());
                }
                break;
            case STATES.LOAD_BIG_K:
                if (eng.outDataBus() == DATA_BUS.OUT) {
                    gp.out.add(eng.onBus());
                } else {
                    gp.ual.setIn(eng.onBus());
                }
                gp.uc.pl.inc();
                break;
            case STATES.LOAD_A:
                if (eng.outDataBus() == DATA_BUS.OUT) {
                    gp.out.add(eng.onBus());
                } else {
                    gp.ual.setIn(eng.onBus());
                }
                break;
            case STATES.INC_POP:
                gp.uc.sp.inc();
                break;
            case STATES.LOAD_POP:
                if (eng.outDataBus() == DATA_BUS.OUT) {
                    gp.out.add(eng.onBus());
                } else {
                    gp.ual.setIn(eng.onBus());
                }
                break;
            case STATES.LOAD_NO: 
                if (eng.outDataBus() == DATA_BUS.OUT) {
                    gp.out.add(eng.onBus());
                } else {
                    gp.ual.setIn(eng.onBus());
                }
                break;
            case STATES.BUFF_IN:
                break;
            case STATES.IN_A:
                gp.input.purge();
                gp.memory.write(eng.memAdresse(), eng.onBus());
                break;
            case STATES.INW:
                gp.input.purge();
                gp.ual.writeIn(eng.onBus());
                break;
            case STATES.PUSH:
                gp.memory.write(eng.memAdresse(), eng.onBus());
                gp.uc.sp.dec();
                break;
            case STATES.STR:
                gp.memory.write(eng.memAdresse(), eng.onBus());
                break;
            case STATES.JMP:
                gp.uc.pl.setValue(eng.onBus());
                break;
            case STATES.EXEC_UAL:
                break;
            case STATES.FIN_INSTR:
                break;
            case STATES.START:
                break;
       }
   
}

/**
 * @param {GProc} gp
 * @param {Engine} eng
 */
function updateSignaux(gp, eng){
    /* gp: processeur graphique
       eng: moteur de processeur
    */
    let state = eng.state;
    let wr;
    gp.offAll();
    switch(state) {
        case STATES.READ_RI:
            link.setLine(eng.lineNumber);
            pythonbox.highlight(link.pythonLine);
            asmbox.highlight(link.asmLine);
            gp.setAddressBus('pl');
            gp.setDataIO('memory', 'ri');
            gp.uc.pl.setInc(true);
            break;
        case STATES.DECODE_RI:
            gp.uc.decode.update(eng.decodeRI());
            break;
        case STATES.HALT:
            break;
        case STATES.LOAD_K:
            wr = (eng.outDataBus() == DATA_BUS.OUT) ? 'output' : 'ual';
            gp.setDataIO('ri', wr);
            break;
        case STATES.LOAD_BIG_K:
            wr = (eng.outDataBus() == DATA_BUS.OUT) ? 'output' : 'ual';
            gp.setAddressBus('pl');
            gp.uc.pl.setInc(true);
            gp.setDataIO('memory', wr);
            break;
        case STATES.LOAD_A:
            wr = (eng.outDataBus() == DATA_BUS.OUT) ? 'output' : 'ual';
            gp.setAddressBus('ri');
            gp.setDataIO('memory', wr);
            break;
        case STATES.INC_POP:
            gp.uc.sp.setInc(true);
            break;
        case STATES.LOAD_POP:
            wr = (eng.outDataBus() == DATA_BUS.OUT) ? 'output' : 'ual';
            gp.setAddressBus('sp');
            gp.setDataIO('memory', wr);
            break;
        case STATES.LOAD_NO: 
            wr = (eng.outDataBus() == DATA_BUS.OUT) ? 'output' : 'ual';
            gp.setDataIO('ual', wr);
            break;
        case STATES.BUFF_IN:
            if (eng.needInput) {
                gp.input.warning(true);
            }
            break;
        case STATES.IN_A:
            gp.setAddressBus('ri');
            gp.setDataIO('input', 'memory');
            break;
        case STATES.INW:
            gp.setDataIO('input', 'ual');
            break;
        case STATES.PUSH:
            gp.setAddressBus('sp');
            gp.uc.sp.setDec(true);
            gp.setDataIO('ual', 'memory');
            break;
        case STATES.STR:
            gp.setAddressBus('ri');
            gp.setDataIO('ual', 'memory');
            break;
        case STATES.JMP:
            gp.setDataIO('ri', 'pl');
            break;
        case STATES.EXEC_UAL:
            gp.setUalCom(eng.wordName);
            break;
        case STATES.FIN_INSTR:
            break;
        case STATES.START:
            break;
    }
}

function step() {
    execCurrent(proc, engine);
    let lastState = engine.state;
    engine.tick();
    if (lastState == STATES.EXEC_UAL) {
        proc.setUalZ(engine.ual.Z);
        proc.setUalP(engine.ual.P);
        proc.ual.setW(engine.ual.read());
    }
    proc.uc.showMessage(engine.stateDescription());
    updateSignaux(proc, engine);
}

function reset(){
    runActif = false;
    engine.reset();
    proc.memory.load(values);
    proc.input.purge();
    proc.out.purge();
    proc.ual.setIn(0);
    proc.ual.setW(0);
    proc.uc.ri.setValue(0);
    proc.uc.sp.setValue(255);
    proc.uc.pl.setValue(0);

    proc.setUalP(true);
    proc.setUalZ(true);
    proc.uc.showMessage(engine.stateDescription());
    updateSignaux(proc, engine);

    pythonbox.highlight(-1);
    asmbox.highlight(-1);
}



let runActif = false;
let tempo = 500;
function runStep() {
    if (!runActif){
        return;
    }
    step();
    if (engine.isHalted) {
        runActif = false;
    } else {
        setTimeout(runStep, tempo);
    }
}

function pressStep(){
    if (runActif) {
        runActif = false;
    } else {
        step();
    }
}


function pressRun(tmp){
    tempo = tmp;
    if (runActif) {
        return;
    }
    runActif = true;
    setTimeout(runStep, tempo);
}

function pressStop() {
    runActif = false;
}

var draw = SVG().addTo('#svg').size(910, 650);

let engine = new Engine(values);
var proc = new GProc(draw, {
    step:[pressStep, "Avancer d'un pas"],
    reset:[reset, "Réinitialiser"],
    run:[function(){ pressRun(1000); }, "Exécuter"],
    vite:[function(){ pressRun(500); }, "Exécuter vite"],
    "très vite":[function(){ pressRun(50); }, "Exécuter très vite"],
    stop:[pressStop,"Arrêter"]});

if (vbox){
    proc.memory.link(vbox.variablesNodes);
}
proc.memory.load(values);


proc.input.setCallback(function(v) { engine.writeIn(v); });




proc.uc.showMessage(engine.stateDescription());
reset()
updateSignaux(proc, engine);


