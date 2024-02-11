/* engine.js
module: simulation du modèle de processeur
*/
import _ from 'lodash';

import { AsmWords, AsmArgs, wordToStr, isJump, jumpCond, actsOnOperand } from '../compile/asmconstantes';
import { Register } from './register';
import { Ual } from './ual';
import { Memory } from './memory';
import { Buffer } from './buffer';

const STATES = {
    READ_RI       : 0,  // transfert mot programme dans registre instruction
    DECODE_RI     : 1,  // décodage registre instruction
    HALT          : 2,  // fin du programme
    OUT_K         : 3,  // littéral vers sortie
    LOAD_K        : 4,  // littéral vers UAL
    OUT_BIG_K     : 5,  // grand littéral vers sortie
    LOAD_BIG_K    : 6,  // grand littéral vers UAL
    OUT_A         : 7,  // Mémoire vers sortie
    LOAD_A        : 8,  // mémoire vers UAL
    OUT_W         : 9,  // Envoie W vers sortie
    LOAD_W        : 10, // Envoie W vers UAL
    OUT_POP       : 11, // Contenu poppé vers la sortie
    LOAD_POP      : 12, // Contenu poppé vers UAL
    BUFF_IN       : 13, // Attente saisie
    IN_A          : 14, // Envoie IN vers mémoire
    IN_W          : 15, // Envoie IN vers W
    EXEC_UAL      : 16, // Exécute l'opération UAL
    DEC_SP        : 17, // Décrémente SP
    PUSH          : 18, // Met W sur la pile
    STR           : 19, // Stocke W dans la mémoire
    JMP           : 20, // Saut
    NOP           : 21, // Pas d'opération
    FIN_INSTR     : 22, // Fin instruction
    START         : 23, // Démarrage
    ERROR         : 24, // Erreur
}

/*
- ERROR:
    -> ERROR
- READ_RI:
    PL->@, MEM -> RI, PL++
    -> DECODE_RI
- DECODE_RI:
    -> STR : STR
    -> PUSH : DEC_SP
    -> HALT : HALT
    -> NOP : NOP
    -> INP : BUFF_IN
    -> POP : LOAD_POP
    -> Branchement satisfait : JMP
    -> Branchement non satisfait : NOP
    -> OUT & type K & grand K: OUT_BIG_K
    -> OUT & type K: OUT_K
    -> OUT & type A: OUT_A
    -> OUT & type N: OUT W
    -> OUT & type P: OUT_POP

    -> type K & grand K: LOAD_GK
    -> type K & !grand K: LOAD_K
    -> type A : LOAD_A
    -> type P : LOAD_POP
    -> type N: LOAD_W
- HALT:
    -> HALT
- OUT_K:
    RI.LOW -> OUT
    -> FIN_INSTR
- LOAD_K:
    RI.LOW -> UAL
    -> EXEC_UAL
- OUT_BIG_K:
    PL->@,  PL++
    MEM-> OUT,
    -> FIN_INSTR
- LOAD_BIG_K:
    PL->@,  PL++
    MEM-> UAL,
    -> EXEC_UAL
- OUT_A:
    RI.LOW -> @
    MEM-> OUT,
    -> FIN_INSTR
- LOAD_A:
    RI.LOW -> @
    MEM-> UAL,
    -> EXEC_UAL
- OUT_POP:
    SP++,
    SP->@,
    MEM -> OUT
    -> FIN_INSTR
- LOAD_POP:
    SP++,
    SP->@,
    MEM -> UAL
    -> EXEC_UAL
- OUT_W :
    W -> OUT
    -> FIN_INSTR
- LOAD_W :
    W -> UAL
    -> EXEC_UAL
- BUFF_IN:
    signal buffer in
    -> INA (si type A) IN_W (sinon)
- IN_A:
    RI.LOW -> @
    IN -> MEM
    -> FIN_INSTR
- IN_W:
    IN -> UAL
    -> EXEC_UAL
- EXEC_UAL:
    com UAL pour ADD, SUB, MUL, DIV, MOD, OR, AND, XOR, CMP, INV, NEG
    ou simple transfert in_ual -> w dans tout autre cas
    -> FIN_INSTR
- DEC_SP:
    SP--
    -> PUSH
- PUSH:
    SP -> @
    W -> MEM
    -> FIN_INSTR
- STR:
    RI.LOW -> @
    W -> MEM
    -> FIN_INSTR
- JMP:
    RI.LOW -> PL
    -> FIN_INSTR
- NOP:
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
        this.#sp = new Register(0);
        this.#in = new Register(0);
        this.#out = new Buffer();

        this.#save = data;
        this.#memory.load(data);
    }

    get lineNumber(){
        return this.#pl.value;
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
        this.#sp.write(0);
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

    get arg() {
        return this.#ri.low();
    }

    get state() {
        return this.#state;
    }

    stateDescription() {
        switch(this.#state) {
            case STATES.READ_RI: {
                let a = this.#pl.low();
                let mem = this.#memory.read(a, 'hex');
                return `Lecture Mémoire en PL = ${a}.\n0x${mem} sera écrit dans RI.\nPL sera incrémenté.`;
            }
            case STATES.DECODE_RI:
                if (this.wordName == 'INCONNU') {
                    return 'Erreur.';
                }
                let cond = jumpCond(this.word);
                if (isJump(this.word) && (cond === null)) {
                    return `Un saut ${this.wordName} vers ${this.arg} est décodé.`;
                }
                if (isJump(this.word)) {
                    return `Un saut conditionnel ${this.wordName} vers ${this.arg} est décodé.\nLe saut sera effectué si ${cond}.`;
                }

                if (!actsOnOperand(this.word)) {
                    return `Une instruction ${this.wordName} est décodée.`;
                }
                if (this.word == AsmWords.INP.code) {
                    if (this.argType == AsmArgs.A) {
                        `Une instruction INP vers l'adresse @${this.arg} a été décodée.`
                    } else {
                        `Une instruction INP vers W a été décodée.`
                    }
                }
                
                switch (this.argType) {
                    case AsmArgs.A: return `Une instruction ${this.wordName} opérant sur l'adresse @${this.arg} est décodée.`;
                    case AsmArgs.K:
                        if (this.arg == 255) {
                            return `Une instruction ${this.wordName} opérant sur un littéral long est décodée.\nLe littéral se trouve à l'adresse mémoire @${this.#pl.low()}.`;
                        } else {
                            return `Une instruction ${this.wordName} opérant sur le littéral court ${this.arg} est décodée.`;
                        }
                    case AsmArgs.P: return `Une instruction ${this.wordName} opérant en dépilant est décodée.`;
                    case AsmArgs.NO: return `Une instruction ${this.wordName} opérant sur W argument décodée.`;
                }
                return "Erreur";
            case STATES.HALT: return "Processeur à l'arrêt (HALT)";
            case STATES.OUT_K:
                return `Chargement du littéral ${this.#ri.low()} vers OUT.`;
            case STATES.LOAD_K:
                return `Chargement du littéral ${this.#ri.low()} vers UAL.`;
            case STATES.OUT_BIG_K: {
                let a = this.#pl.low();
                let k = this.#memory.read(a, 'hex');
                return `Chargement littéral long :\nLecture Mémoire en PL = ${a}.\n0x${k} sera écrit dans OUT.\nPL sera incrémenté.`;
            }
            case STATES.LOAD_BIG_K: {
                let a = this.#pl.low();
                let k = this.#memory.read(a, 'hex');
                return `Chargement littéral long :\nLecture Mémoire en PL = ${a}.\n0x${k} sera écrit dans UAL.\nPL sera incrémenté.`;
            }
            case STATES.OUT_A: {
                let a = this.#ri.low();
                let v = this.#memory.read(a, 'hex');
                return `Chargement selon adresse :\nLecture Mémoire en @ = ${a}.\n0x${v} sera écrit dans OUT.`;
            }
            case STATES.LOAD_A: {
                let a = this.#ri.low();
                let v = this.#memory.read(a, 'hex');
                return `Chargement selon adresse :\nLecture Mémoire en @ = ${a}.\n0x${v} sera écrit dans UAL.`;
            }
            case STATES.OUT_POP: {
                let a = this.#sp.low();
                let p = this.#memory.read(a, 'hex');
                return `Chargement de valeur popée de la pile :\nLecture Mémoire en SP = ${a}.\n0x${p} sera écrit dans OUT.\nSP sera incrémenté.`;
            }
            case STATES.LOAD_POP: {
                let a = this.#sp.low();
                let p = this.#memory.read(a, 'hex');
                return `Chargement de valeur popée de la pile :\nLecture Mémoire en SP = ${a}.\n0x${p} sera écrit dans UAL.\nSP sera incrémenté.`;
            }
            case STATES.OUT_W: {
                let w = this.#ual.hex();
                return `Chargement de valeur depuis le registre de travail W = 0x${w} vers OUT.`;
            }
            case STATES.LOAD_W: {
                let w = this.#ual.hex();
                return `Chargement de valeur depuis le registre de travail W = 0x${w} vers UAL.`;
            }
            case STATES.BUFF_IN:
                if (!this.#loadedValue) {
                    return "Attente du chargement d'une valeur en entrée.";
                }
                return `Donnée 0x${this.#in.hex()} chargée en entrée, prête à être transférée.`;
            case STATES.IN_A: {
                let a = this.#ri.low();
                return `Donnée 0x${this.#in.hex()} transférée de l'entré à la mémoire à l'adresse @ = ${a}.`;
            }
            case STATES.IN_W:
                return `Donnée 0x${this.#in.hex()} transférée de l'entré à l'UAL.`;
            case STATES.DEC_SP:
                return `Pour préparer PUSH, SP va être décrémenté.`;
            case STATES.PUSH:
                return `PUSH : Registre de travail W = 0x${this.#ual.hex()} va être transféré sur la pile, à l'adresse SP = ${this.#sp.low()}.`;
            case STATES.STR:
                return `STORE : Registre de travail W = 0x${this.#ual.hex()} va être transféré dans la mémoire à l'adresse @ = ${this.#ri.low()}.`;
            case STATES.JMP:
                return `SAUT : ${this.#ri.low()} va être transféré dans le pointeur de ligne PL.`;
            case STATES.EXEC_UAL:
                return `Exécution UAL :\n${this.#ual.descrition()}`;
            case STATES.NOP: return "NOP : Pas d'opération";
            case STATES.FIN_INSTR: return "Fin instruction";
            case STATES.START: return "Démarrage.";
            default: return "Erreur.";
        }
    }

    memAdresse() {
        if ((this.#state == STATES.READ_RI) ||
            (this.#state == STATES.LOAD_BIG_K) ||
            (this.#state == STATES.OUT_BIG_K)
            ) {
            return this.#pl.low();
        }
        if ((this.#state == STATES.LOAD_A) ||
            (this.#state == STATES.OUT_A)  ||
            (this.#state == STATES.IN_A)   ||
            (this.#state == STATES.STR)
        ) {
            return this.#ri.low();
        }
        if ((this.#state == STATES.OUT_POP)  ||
            (this.#state == STATES.LOAD_POP) ||
            (this.#state = STATES.PUSH)
        ) {
            return this.#sp.low();
        }
        return null;
    }

    inDataBus() {
        if ((this.#state == STATES.READ_RI)    ||
            (this.#state == STATES.OUT_BIG_K)  ||
            (this.#state == STATES.LOAD_BIG_K) ||
            (this.#state == STATES.OUT_A)      ||
            (this.#state == STATES.LOAD_A)     ||
            (this.#state == STATES.OUT_POP)    ||
            (this.#state == STATES.LOAD_POP)
        ) {
            return DATA_BUS.MEM;
        }
        if ((this.#state == STATES.LOAD_K) ||
            (this.#state == STATES.OUT_K)  ||
            (this.#state == STATES.JMP)
        ) {
            return DATA_BUS.RI;
        }
        if ((this.#state == STATES.LOAD_W) ||
            (this.#state == STATES.OUT_W)  ||
            (this.#state == STATES.STR)    ||
            (this.#state == STATES.PUSH)
        ) {
            return DATA_BUS.UAL;
        }
        if ((this.#state == STATES.IN_A) ||
            (this.#state == STATES.IN_W)
        ) {
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
        if ((this.#state == STATES.OUT_K)     ||
            (this.#state == STATES.OUT_BIG_K) ||
            (this.#state == STATES.OUT_A)     ||
            (this.#state == STATES.OUT_W)     ||
            (this.#state == STATES.OUT_POP)
        ) {
            return DATA_BUS.OUT;
        }
        if ((this.#state == STATES.IN_W)        ||
            (this.#state == STATES.LOAD_K)     ||
            (this.#state == STATES.LOAD_BIG_K) ||
            (this.#state == STATES.LOAD_A)     ||
            (this.#state == STATES.LOAD_W)     ||
            (this.#state == STATES.LOAD_POP)
        ) {
            return DATA_BUS.UAL;
        }
        if ((this.#state == STATES.IN_A) ||
            (this.#state == STATES.STR)  ||
            (this.#state == STATES.PUSH)
        ) {
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
            case DATA_BUS.PL: return this.#pl.low();
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
        if ((this.#state == STATES.READ_RI)   ||
            (this.#state == STATES.OUT_BIG_K) ||        
            (this.#state == STATES.LOAD_BIG_K)
        ){
            this.#pl.inc();
        }
        if ((this.#state == STATES.OUT_POP) ||
            (this.#state == STATES.LOAD_POP)
        ){
            this.#sp.inc();
        }
        if (this.#state == STATES.DEC_SP){
            this.#sp.dec();
        }
        if ((this.#state == STATES.IN_W) || (this.#state == STATES.IN_A)){
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
                    case AsmWords.PUSH.code: return STATES.DEC_SP;
                    case AsmWords.HALT.code: return STATES.HALT;
                    case AsmWords.INP.code: return STATES.BUFF_IN;
                    case AsmWords.JMP.code: return STATES.JMP;
                    case AsmWords.BEQ.code: return this.#ual.Z ? STATES.JMP : STATES.NOP;
                    case AsmWords.BNE.code: return !this.#ual.Z ? STATES.JMP : STATES.NOP;
                    case AsmWords.BGE.code: return this.#ual.P ? STATES.JMP : STATES.NOP;
                    case AsmWords.BLT.code: return !this.#ual.P ? STATES.JMP : STATES.NOP;
                    case AsmWords.BGT.code: return this.#ual.P && !this.#ual.Z ? STATES.JMP : STATES.NOP;
                    case AsmWords.BLE.code: return !this.#ual.P || this.#ual.Z ? STATES.JMP : STATES.NOP;
                    case AsmWords.NOP.code: return STATES.NOP;
                    case AsmWords.POP.code: return STATES.LOAD_POP;
                }
                if (word == AsmWords.OUT.code) {
                    switch(argType) {
                        case AsmArgs.K: return (this.#ri.low() == 255) ? STATES.OUT_BIG_K : STATES.OUT_K;
                        case AsmArgs.A: return STATES.OUT_A;
                        case AsmArgs.P: return STATES.OUT_POP;
                        case AsmArgs.NO: return STATES.OUT_W;
                    }    
                }
                switch(argType) {
                    case AsmArgs.K: return (this.#ri.low() == 255) ? STATES.LOAD_BIG_K : STATES.LOAD_K;
                    case AsmArgs.A: return STATES.LOAD_A;
                    case AsmArgs.P: return STATES.LOAD_POP;
                    case AsmArgs.NO: return STATES.LOAD_W;
                }
                return STATES.ERROR;
            case STATES.HALT: return STATES.HALT;
            case STATES.ERROR: return STATES.ERROR;
            case STATES.OUT_K: return STATES.FIN_INSTR;
            case STATES.LOAD_K: return STATES.EXEC_UAL;
            case STATES.OUT_BIG_K: return STATES.FIN_INSTR;
            case STATES.LOAD_BIG_K: return STATES.EXEC_UAL;
            case STATES.OUT_A: return STATES.FIN_INSTR;
            case STATES.LOAD_A: return STATES.EXEC_UAL;
            case STATES.OUT_POP: return STATES.FIN_INSTR;
            case STATES.LOAD_POP: return STATES.EXEC_UAL;
            case STATES.OUT_W: return STATES.FIN_INSTR;
            case STATES.LOAD_W: return STATES.EXEC_UAL;
            case STATES.BUFF_IN:
                if (!this.#loadedValue) {
                    return STATES.BUFF_IN;
                }
                return (argType == AsmArgs.A) ? STATES.IN_A : STATES.IN_W;
            case STATES.IN_A: return STATES.FIN_INSTR;
            case STATES.IN_W: return STATES.EXEC_UAL;
            case STATES.EXEC_UAL: return STATES.FIN_INSTR;
            case STATES.DEC_SP: return STATES.PUSH;
            case STATES.PUSH: return STATES.FIN_INSTR;
            case STATES.STR: return STATES.FIN_INSTR;
            case STATES.JMP: return STATES.FIN_INSTR;
            case STATES.NOP: return STATES.FIN_INSTR;
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