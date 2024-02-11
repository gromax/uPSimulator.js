import { SVG } from '@svgdotjs/svg.js';
import { GProc } from './graphic/gproc';
import { Machine } from './graphic/states';

import { GET, hexToValues } from './utils/misc';
import { Engine, STATES, DATA_BUS } from './simulation/engine';
import { TextBox } from './utils/textbox';
import { VBox } from './utils/variablesbox';
import { Box } from './utils/box'
import { Linker } from './utils/linker';

let link = new Linker({
    hex:GET('hex'),
    python:decodeURIComponent(GET('python') || ''),
    asm:decodeURIComponent(GET('asm') || '')
 });

let values = hexToValues(link.hex);

/* en l'absence de code python, pythonbox est une coquille vide */
let pythonbox = new TextBox(link.python, 'Pseudo Python');
pythonbox.setXY(10,10);
pythonbox.reduce();

/* en l'absence de code asm, asmbox est une coquille vide */
let asmbox = new TextBox(link.asm, 'Assembleur');
asmbox.setXY(10, pythonbox.bottom + 5);
asmbox.reduce();

let vbox = new VBox(link.variables);
vbox.setXY(10, asmbox.bottom + 5);
vbox.reduce();

let statebox = new Box("États", "div");
let states_svg = SVG().addTo(statebox.content).size(510, 410);
let gStates = new Machine(states_svg);
gStates.scale(.5);
statebox.reduce();
statebox.setXY(10, vbox.bottom + 5);


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
            case STATES.OUT_K:
                gp.out.add(eng.onBus());
                break;
            case STATES.LOAD_K:
                gp.ual.setIn(eng.onBus());
                break;
            case STATES.OUT_BIG_K:
                gp.out.add(eng.onBus());
                gp.uc.pl.inc();
                break;
            case STATES.LOAD_BIG_K:
                gp.ual.setIn(eng.onBus());
                gp.uc.pl.inc();
                break;
            case STATES.OUT_A:
                gp.out.add(eng.onBus());
                break;
            case STATES.LOAD_A:
                gp.ual.setIn(eng.onBus());
                break;
            case STATES.OUT_POP:
                {
                    let adresse = vbox.pop();
                    gp.memory.unlink(adresse);
                }
                gp.uc.sp.inc();
                gp.out.add(eng.onBus());
                break;
            case STATES.LOAD_POP:
                {
                    let adresse = vbox.pop();
                    gp.memory.unlink(adresse);
                }
                gp.uc.sp.inc();
                gp.ual.setIn(eng.onBus());
                break;
            case STATES.OUT_W: 
                gp.out.add(eng.onBus());
                break;
            case STATES.LOAD_W: 
                gp.ual.setIn(eng.onBus());
                break;
            case STATES.BUFF_IN:
                break;
            case STATES.IN_A:
                gp.input.purge();
                gp.memory.write(eng.memAdresse(), eng.onBus());
                break;
            case STATES.IN_W:
                gp.input.purge();
                gp.ual.writeIn(eng.onBus());
                break;
            case STATES.DEC_SP:
                gp.uc.sp.dec();
                break;
            case STATES.PUSH:
                gp.memory.write(eng.memAdresse(), eng.onBus());
                let node = vbox.push(eng.memAdresse(), eng.onBus());
                gp.memory.link(eng.memAdresse(), node);
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
            gp.uc.decode.update(eng.word, eng.argType, eng.arg);
            break;
        case STATES.HALT:
            break;
        case STATES.OUT_K:
            gp.setDataIO('ri', 'output');
            break;
        case STATES.LOAD_K:
            gp.setDataIO('ri', 'ual');
            break;
        case STATES.OUT_BIG_K:
            gp.setAddressBus('pl');
            gp.uc.pl.setInc(true);
            gp.setDataIO('memory', 'output');
            break;
        case STATES.LOAD_BIG_K:
            gp.setAddressBus('pl');
            gp.uc.pl.setInc(true);
            gp.setDataIO('memory', 'ual');
            break;
        case STATES.OUT_A:
            gp.setAddressBus('ri');
            gp.setDataIO('memory', 'output');
            break;
        case STATES.LOAD_A:
            gp.setAddressBus('ri');
            gp.setDataIO('memory', 'ual');
            break;
        case STATES.OUT_POP:
            gp.uc.sp.setInc(true);
            gp.setAddressBus('sp');
            gp.setDataIO('memory', 'output');
            break;
        case STATES.LOAD_POP:
            gp.uc.sp.setInc(true);
            gp.setAddressBus('sp');
            gp.setDataIO('memory', 'ual');
            break;
        case STATES.OUT_W: 
            gp.setDataIO('ual', 'output');
            break;
        case STATES.LOAD_W: 
            gp.setDataIO('ual', 'ual');
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
        case STATES.DEC_SP:
            gp.uc.sp.setDec(true);
            break;
        case STATES.PUSH:
            gp.setAddressBus('sp');
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
    gStates.select(engine.state, engine.nextState());
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
    proc.uc.sp.setValue(0);
    proc.uc.pl.setValue(0);

    proc.setUalP(true);
    proc.setUalZ(true);
    proc.uc.showMessage(engine.stateDescription());
    updateSignaux(proc, engine);

    pythonbox.highlight(-1);
    asmbox.highlight(-1);

    gStates.select(-1,-1);
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


{
    let nodes = vbox.variablesNodes;    
    for (let adresse in nodes) {
        proc.memory.link(adresse, nodes[adresse]);
    }
}
proc.memory.load(values);


proc.input.setCallback(function(v) { engine.writeIn(v); gStates.select(engine.state, engine.nextState()); });




proc.uc.showMessage(engine.stateDescription());
reset()
updateSignaux(proc, engine);


