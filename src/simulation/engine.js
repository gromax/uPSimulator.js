/* engine.js
module: simulation du modèle de processeur
*/
import _ from 'lodash';

import { AsmWords, AsmArgs, wordToStr } from '../compile/asmconstantes';
import { Register } from './register';
import { Ual } from './ual';
import { Memory } from './memory';
import { Buffer } from './buffer';

const STATES = {
    READ_RI       : 0,
    DECODE_RI     : 1,
    HALT          : 2,  
    LOAD_K        : 3,
    LOAD_BIG_K    : 4,
    LOAD_A        : 5,
    LOAD_POP      : 6,
    LOAD_NO       : 7,
    BUFF_IN       : 9,
    IN_A          : 10,
    INW           : 11,
    EXEC_UAL      : 12,
    PUSH          : 13,
    STR           : 14,
    JMP           : 15,
    FIN_INSTR     : 16,
    START         : 17,
    INC_POP       : 18,
    ERROR         : 19,
}

/*
- ERROR:
    -> ERROR
- READ_RI:
    PL->@, MEM -> RI, PL++
    -> DECODE_RI
- DECODE_RI:
    -> STR : STR
    -> PUSH : PUSH
    -> HALT : HALT
    -> NOP : FIN_INSTR
    -> INP : BUFF_IN
    -> Branchement satisfait : JMP
    -> Branchement non satisfait : FIN_INSTR

    -> type K & grand K: LOAD_GK
    -> type K & !grand K: LOAD_K
    -> type A : LOAD_A ***
    -> type P || POP: INC_POP
- HALT:
    -> HALT
- LOAD_K:
    RI.LOW -> OUT (si out) | UAL (sinon)
    -> FIN_INSTR (si out) | EXEC_UAL (sinon)
- LOAD_BIG_K:
    PL->@,  PL++
    MEM-> OUT (si out)  | UAL (sinon),
    -> FIN_INSTR (si out) | EXEC_UAL (sinon)
- LOAD_A:
    RI.LOW -> @
    MEM-> OUT (si out)  | UAL (sinon),
    -> FIN_INSTR (si out) | EXEC_UAL (sinon)
- INC_POP:
    SP++
    -> LOAD_POP
- LOAD_POP:
    SP->@,
    MEM -> OUT (si out) | UAL (sinon)
    -> FIN_INSTR (si out) | EXEC_UAL (sinon)
- LOAD_NO :
    W -> OUT (si out) | UAL (sinon)
    -> FIN_INSTR (si out) | EXEC_UAL (sinon)
- BUFF_IN:
    signal buffer in
    -> INA (si type A) INW (sinon)
- IN_A:
    RI.LOW -> @
    IN -> MEM
    -> FIN_INSTR
- INW:
    IN -> UAL
    -> EXEC_UAL
- EXEC_UAL:
    com UAL pour ADD, SUB, MUL, DIV, MOD, OR, AND, XOR, CMP, INV, NEG
    ou simple transfert in_ual -> w dans tout autre cas
    -> FIN_INSTR
- PUSH:
    SP -> @
    W -> MEM
    SP--
    -> FIN_INSTR
- STR:
    RI.LOW -> @
    W -> MEM
    -> FIN_INSTR
- JMP:
    RI.LOW -> PL
    -> FIN_INSTR
- FIN_INSTR:
    signal de fin
*/

const DATA_BUS = {
    OFF: 0,
    IN: 1,
    OUT: 2,
    RI: 3,
    UAL: 4,
    MEM: 5,
    PL: 6
}


class Engine {
    static SIZE = 256;
    #memory;
    #ual;
    #pl;
    #sp;
    #state = STATES.START;
    #ri;
    #out;
    #in;
    #loadedValue = false;
    #save = [];

    constructor(data){
        this.#memory = new Memory();
        this.#ual = new Ual();
        this.#pl = new Register(0);
        this.#ri = new Register(0);
        this.#sp = new Register(255);
        this.#in = new Register(0);
        this.#out = new Buffer();

        this.#save = data;
        this.#memory.load(data);
    }

    readMemory(adresse, format = '') {
        return this.#memory.read(adresse, format);
    }

    get needInput() {
        return ((this.#state == STATES.BUFF_IN) && (this.#loadedValue == false));
    }

    writeIn(value) {
        this.#in.write(value);
        this.#loadedValue = true;
    }

    get bufferEmpty() {
        return this.#out.empty;
    }

    #getRegByName(name){
        switch(name) {
            case 'ri': return this.#ri;
            case 'ual': return this.#ual;
            case 'in': return this.#in;
            case 'sp': return this.#sp;
            case 'pl': return this.#pl;
            default:
                throw Error(`[Engine] le registre ${name} est inconnu.`);
        }
    }

    readOutBuffer(fmt = ''){
        return this.#out.read(fmt);
    }

    readRegister(name, format) {
        return this.#getRegByName(name).read(format);
    }

    reset() {
        this.#state = STATES.START;
        this.#pl.reset();
        this.#ual.reset();
        this.#in.reset();
        this.#out.purge();
        this.#sp.write(255);
        this.#ri.reset(0);
        this.#loadedValue = false;
        this.#memory.load(this.#save);
    }

    get isHalted() {
        return (this.#state == STATES.HALT);
    }

    get word() {
        let ri = this.#ri.read();
        return ri >> 10;
    }

    get wordName() {
        return wordToStr(this.word);
    }

    get argType() {
        let ri = this.#ri.read();
        return (ri >> 8) % 4;
    }

    get state() {
        return this.#state;
    }

    decodeRI() {
        let word = this.word;
        let argType = this.argType;
        let arg = this.#ri.low();
        let code = [word, argType, arg];
        let wordName = wordToStr(word);
        if (_.includes([AsmWords.STR.code, AsmWords.PUSH.code,
                AsmWords.HALT.code, AsmWords.NOP.code, AsmWords.POP.code
        ], word)) {
            return { name:wordName, argtype:null, arg:null, code:code , jump:false, cond:null };
        }
        switch (word) {
            case AsmWords.JMP.code: return { name:wordName, argtype:null, arg:this.#ri.low(), code:code , jump:true, cond:null };
            case AsmWords.BLE.code: return { name:wordName, argtype:null, arg:this.#ri.low(), code:code , jump:true, cond:'Z ou non P' };
            case AsmWords.BLT.code: return { name:wordName, argtype:null, arg:this.#ri.low(), code:code , jump:true, cond:'non P' };
            case AsmWords.BGE.code: return { name:wordName, argtype:null, arg:this.#ri.low(), code:code , jump:true, cond:'P' };
            case AsmWords.BGT.code: return { name:wordName, argtype:null, arg:this.#ri.low(), code:code , jump:true, cond:'P et non Z' };
            case AsmWords.BEQ.code: return { name:wordName, argtype:null, arg:this.#ri.low(), code:code , jump:true, cond:'Z' };
            case AsmWords.BNE.code: return { name:wordName, argtype:null, arg:this.#ri.low(), code:code , jump:true, cond:'non Z' };
        }
        switch (argType) {
            case AsmArgs.A: return { name:wordName, argtype:'@', arg:this.#ri.low(), code:code , jump:false, cond:null };
            case AsmArgs.K: return { name:wordName, argtype:'K', arg:this.#ri.low(), code:code , jump:false, cond:null };
            case AsmArgs.P: return { name:wordName, argtype:'P', arg:null, code:code , jump:false, cond:null };
            case AsmArgs.NO: return { name:wordName, argtype:'N', arg:null, code:code , jump:false, cond:null };
        }
        return { name:null, argtype:null, arg:null, code:code, jump:false, cond:null };
    }

    stateDescription() {
        let word = this.word;
        let a, cible;
        switch(this.#state) {
            case STATES.READ_RI:
                a = this.#pl.read();
                let mem = this.#memory.read(a, 'hex');
                return `Lecture Mémoire en PL = ${a}.\n0x${mem} sera écrit dans RI.\nPL sera incrémenté.`;
            case STATES.DECODE_RI:
                let decode = this.decodeRI();
                if (decode.name === null) {
                    return 'Erreur.';
                }
                if (decode.jump && (decode.cond === null)) {
                    return `Un saut ${decode.name} vers ${decode.arg} est décodé.`;
                }
                if (decode.jump) {
                    return `Un saut conditionnel ${decode.name} vers ${decode.arg} est décodé.\nLe saut sera effectué si ${decode.cond}.`;
                }
                if (decode.argtype === null) {
                    return `Une instruction ${decode.name} est décodée.`;
                }
                if (word == AsmWords.INP.code) {
                    if (decode.argtype == '@') {
                        `Une instruction INP vers l'adresse @${decode.arg} a été décodée.`
                    } else {
                        `Une instruction INP vers W a été décodée.`
                    }
                }
                switch (decode.argtype) {
                    case '@': return `Une instruction ${decode.name} opérant sur l'adresse @${decode.arg} est décodée.`;
                    case 'K':
                        if (decode.arg == 255) {
                            return `Une instruction ${decode.name} opérant sur un littéral long est décodée.\nLe littéral se trouve à l'adresse mémoire @${this.#pl.low()}.`;
                        } else {
                            return `Une instruction ${decode.name} opérant sur le littéral court ${decode.arg} est décodée.`;
                        }
                    case AsmArgs.P: return `Une instruction ${decode.name} opérant en dépilant est décodée.`;
                    case AsmArgs.NO: return `Une instruction ${decode.name} opérant sur W argument décodée.`;
                }
                return "Erreur";
            case STATES.HALT: return "Processeur à l'arrêt (HALT)";
            case STATES.LOAD_K:
                if (word == AsmWords.OUT.code) {
                    return `Chargement du littéral ${this.#ri.low()} vers OUT.`;
                } else {
                    return `Chargement du littéral ${this.#ri.low()} vers UAL.`;
                }
            case STATES.LOAD_BIG_K:
                cible = (word == AsmWords.OUT.code)? 'OUT' : 'UAL';
                a = this.#pl.read();
                let k = this.#memory.read(a, 'hex');
                return `Chargement littéral long :\nLecture Mémoire en PL = ${a}.\n0x${k} sera écrit dans ${cible}.\nPL sera incrémenté.`;
            case STATES.LOAD_A:
                cible = (word == AsmWords.OUT.code)? 'OUT' : 'UAL';
                a = this.#ri.low();
                let v = this.#memory.read(a, 'hex');
                return `Chargement selon adresse :\nLecture Mémoire en @ = ${a}.\n0x${v} sera écrit dans ${cible}.`;
            case STATES.INC_POP:
                return "En préparation du dépilement, le contenu de SP est incrémenté.";
            case STATES.LOAD_POP:
                cible = (word == AsmWords.OUT.code)? 'OUT' : 'UAL';
                a = this.#sp.read();
                let p = this.#memory.read(a, 'hex');
                return `Chargement de valeur popée de la pile :\nLecture Mémoire en SP = ${a}.\n0x${p} sera écrit dans ${cible}.`;
            case STATES.LOAD_NO: 
                cible = (word == AsmWords.OUT.code)? 'OUT' : 'UAL';
                let w = this.#ual.hex();
                return `Chargement de valeur depuis le registre de travail W = 0x${w} vers ${cible}.`;
            case STATES.BUFF_IN:
                if (!this.#loadedValue) {
                    return "Attente du chargement d'une valeur en entrée.";
                }
                return `Donnée 0x${this.#in.hex()} chargée en entrée, prête à être transférée.`;
            case STATES.IN_A:
                a = this.#ri.low();
                return `Donnée 0x${this.#in.hex()} transférée de l'entré à la mémoire à l'adresse @ = ${a}.`;
            case STATES.INW:
                return `Donnée 0x${this.#in.hex()} transférée de l'entré à l'UAL.`;
            case STATES.PUSH:
                return `PUSH : Registre de travail W = 0x${this.#ual.hex()} va être transféré sur la pile, à l'adresse SP = ${this.#sp.read()}.\nSP sera décrémenté.`;
            case STATES.STR:
                return `STORE : Registre de travail W = 0x${this.#ual.hex()} va être transféré dans la mémoire à l'adresse @ = ${this.#ri.low()}.`;
            case STATES.JMP:
                return `SAUT : ${this.#ri.low()} va être transféré dans le pointeur de ligne PL.`;
            case STATES.EXEC_UAL:
                return `Exécution UAL :\n${this.#ual.descrition()}`;
            case STATES.FIN_INSTR: return "Fin instruction";
            case STATES.START: return "Démarrage.";
            default: return "Erreur.";
        }
    }

    memAdresse() {
        if ((this.#state == STATES.READ_RI) || (this.#state == STATES.LOAD_BIG_K)) {
            return this.#pl.read();
        }
        if ((this.#state == STATES.LOAD_A) || (this.#state == STATES.IN_A) || (this.#state = STATES.STR)) {
            return this.#ri.low();
        }
        if ((this.#state == STATES.LOAD_POP) || (this.#state = STATES.PUSH)) {
            return this.#sp.read();
        }
        return null;
    }

    inDataBus() {
        if ((this.#state == STATES.READ_RI) ||
            (this.#state == STATES.LOAD_BIG_K) ||
            (this.#state == STATES.LOAD_A) ||
            (this.#state == STATES.LOAD_POP)) {
            return DATA_BUS.MEM;
        }
        if ((this.#state == STATES.LOAD_K) ||
            (this.#state == STATES.JMP)) {
            return DATA_BUS.RI;
        }
        if ((this.#state == STATES.LOAD_NO) ||
            (this.#state == STATES.STR) ||
            (this.#state == STATES.PUSH)) {
            return DATA_BUS.UAL;
        }
        if ((this.#state == STATES.IN_A) ||
        (this.#state == STATES.INW)) {
            return DATA_BUS.IN;
        }
        return DATA_BUS.OFF;
    }

    outDataBus() {
        if (this.#state == STATES.READ_RI) {
            return DATA_BUS.RI;
        }
        if (this.#state == STATES.JMP) {
            return DATA_BUS.PL;
        }
        let s = ((this.#state == STATES.LOAD_K) || (this.#state == STATES.LOAD_BIG_K) ||
                 (this.#state == STATES.LOAD_A) || (this.#state == STATES.LOAD_POP) ||
                 (this.#state == STATES.LOAD_NO));
        if (s && (this.word == AsmWords.OUT.code)) {
            return DATA_BUS.OUT;
        }
        if (s || (this.#state == STATES.INW)) {
            return DATA_BUS.UAL;
        }
        if ((this.#state == STATES.IN_A) || (this.#state == STATES.STR) || (this.#state == STATES.PUSH)) {
            return DATA_BUS.MEM;
        }
        return DATA_BUS.OFF;
    }

    onBus() {
        let inB = this.inDataBus();
        switch (inB) {
            case DATA_BUS.OFF: return null;
            case DATA_BUS.IN : return this.#in.read();
            case DATA_BUS.MEM: return this.#memory.read(this.memAdresse());
            case DATA_BUS.UAL: return this.#ual.read();
            case DATA_BUS.PL: return this.#pl.read();
            case DATA_BUS.OUT:
                throw Error("OUT ne peut être lu !");
            case DATA_BUS.RI: return this.#ri.low();
            default: return null;
        }
    }

    #execBus(){
        let v = this.onBus();
        if (v === null) {
            return;
        }
        let outB = this.outDataBus();
        switch (outB) {
            case DATA_BUS.IN :
                throw Error("IN ne peut être écrit !");
            case DATA_BUS.MEM:
                this.#memory.write(this.memAdresse(), v);
                break;
            case DATA_BUS.UAL:
                this.#ual.write(v);
                break;
            case DATA_BUS.PL:
                this.#pl.write(v);
                break;
            case DATA_BUS.OUT:
                this.#out.write(v);
                break;
            case DATA_BUS.RI:
                this.#ri.write(v);
                break;
        }
    }

    tick() {
        this.#execBus();
        if (this.#state == STATES.EXEC_UAL){
            this.#ual.exec();
        }
        if ((this.#state == STATES.READ_RI) || (this.#state == STATES.LOAD_BIG_K)){
            this.#pl.inc();
        }
        if (this.#state == STATES.INC_POP){
            this.#sp.inc();
        }
        if (this.#state == STATES.PUSH){
            this.#sp.dec();
        }
        if ((this.#state == STATES.INW) || (this.#state == STATES.IN_A)){
            this.#loadedValue = false;
        }
        this.#state = this.nextState();
        if (this.#state == STATES.EXEC_UAL) {
            this.#ual.setCommand(this.word);
        }
        
    }

    nextState() {
        // changements d'états
        let word = this.word;
        let argType = this.argType;
        switch(this.#state) {
            case STATES.START: return STATES.READ_RI;
            case STATES.READ_RI: return STATES.DECODE_RI;
            case STATES.DECODE_RI:
                switch(word) {
                    case AsmWords.STR.code: return STATES.STR;
                    case AsmWords.PUSH.code: return STATES.PUSH;
                    case AsmWords.HALT.code: return STATES.HALT;
                    case AsmWords.INP.code: return STATES.BUFF_IN;
                    case AsmWords.JMP.code: return STATES.JMP;
                    case AsmWords.BEQ.code: return this.#ual.Z ? STATES.JMP : STATES.FIN_INSTR;
                    case AsmWords.BNE.code: return !this.#ual.Z ? STATES.JMP : STATES.FIN_INSTR;
                    case AsmWords.BGE.code: return this.#ual.P ? STATES.JMP : STATES.FIN_INSTR;
                    case AsmWords.BLT.code: return !this.#ual.P ? STATES.JMP : STATES.FIN_INSTR;
                    case AsmWords.BGT.code: return this.#ual.P && !this.#ual.Z ? STATES.JMP : STATES.FIN_INSTR;
                    case AsmWords.BLE.code: return !this.#ual.P || this.#ual.Z ? STATES.JMP : STATES.FIN_INSTR;
                    case AsmWords.NOP.code: return STATES.FIN_INSTR;
                    case AsmWords.POP.code: return STATES.INC_POP;
                }
                switch(argType) {
                    case AsmArgs.K: return (this.#ri.low() == 255) ? STATES.LOAD_BIG_K : STATES.LOAD_K;
                    case AsmArgs.A: return STATES.LOAD_A;
                    case AsmArgs.P: return STATES.INC_POP;
                    case AsmArgs.NO: return STATES.LOAD_NO;
                }
                return STATES.ERROR;
            case STATES.HALT: return STATES.HALT;
            case STATES.ERROR: return STATES.ERROR;
            case STATES.LOAD_K: return (word == AsmWords.OUT.code) ? STATES.FIN_INSTR : STATES.EXEC_UAL;
            case STATES.LOAD_BIG_K: return (word == AsmWords.OUT.code) ? STATES.FIN_INSTR : STATES.EXEC_UAL;
            case STATES.LOAD_A: return (word == AsmWords.OUT.code) ? STATES.FIN_INSTR : STATES.EXEC_UAL;
            case STATES.INC_POP: return STATES.LOAD_POP;
            case STATES.LOAD_POP: return (word == AsmWords.OUT.code) ? STATES.FIN_INSTR : STATES.EXEC_UAL;
            case STATES.LOAD_NO: return (word == AsmWords.OUT.code) ? STATES.FIN_INSTR : STATES.EXEC_UAL;
            case STATES.BUFF_IN:
                if (!this.#loadedValue) {
                    return STATES.BUFF_IN;
                }
                return (argType == AsmArgs.A) ? STATES.IN_A : STATES.INW;
            case STATES.IN_A: return STATES.FIN_INSTR;
            case STATES.INW: return STATES.EXEC_UAL;
            case STATES.EXEC_UAL: return STATES.FIN_INSTR;
            case STATES.PUSH: return STATES.FIN_INSTR;
            case STATES.STR: return STATES.FIN_INSTR;
            case STATES.JMP: return STATES.FIN_INSTR;
            case STATES.FIN_INSTR: return STATES.READ_RI;
            default: return STATES.ERROR;
        }
    }

    get ual() {
        return this.#ual;
    }

    get ri() {
        return this.#ri.read();
    }


}

export { Engine, STATES, DATA_BUS };