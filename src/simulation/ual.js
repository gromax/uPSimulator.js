/* gestion de l'ual */

import { Register } from './register.js'
import { AsmWords, wordToStr } from '../compile/asmconstantes.js'

class Ual {
    #w;
    #in;
    #command;
    #result;

    constructor(){
        this.command = null;
        this.#w = new Register(0);
        this.#in = new Register(0);
        this.#result = new Register(0);
    }

    setCommand (com) {
        this.#command = com;
    }

    write(value){
        this.#in.write(value);
    }

    get Z(){
        return this.#result.isNul();
    }

    get P(){
        return this.#result.isPos();
    }

    read(fmt='') {
        return this.#w.read(fmt);
    }

    hex() {
        return this.#w.hex();
    }

    bin() {
        return this.#w.bin();
    }

    signed() {
        return this.#w.signed();
    }

    reset() {
        this.#w.write(0);
        this.#in.write(0);
    }

    #calcResult() {
        switch(this.#command) {
            case AsmWords.ADD.code:
                return this.#w.read() + this.#in.read();
            case AsmWords.SUB.code:
                return this.#w.read() - this.#in.read();
            case AsmWords.MUL.code:
                return this.#w.signed() * this.#in.signed();
            case AsmWords.DIV.code:
                let a = this.#w.signed();
                let b = this.#in.signed();
                if (b == 0){
                    return 0;
                }
                return (a - a%b) / b;
            case AsmWords.MOD.code:
                if (this.#in.signed() == 0) {
                    return this.#w.signed();
                }
                return this.#w.signed() % this.#in.signed();
            case AsmWords.OR.code:
                return this.#w.read() | this.#in.read();
            case AsmWords.AND.code:
                return this.#w.read() & this.#in.read();
            case AsmWords.XOR.code:
                return this.#w.read() ^ this.#in.read();
            case AsmWords.CMP.code:
                return this.#w.read() - this.#in.read();
            case AsmWords.MOV.code:
                return this.#in.read();
            case AsmWords.INV.code:
                return ~this.#in.read();
            case AsmWords.NEG.code:
                return -this.#in.read();
            default:
                // MOV par défaut
                return this.#in.read();
        }
    }

    exec() {
        this.#result.write(this.#calcResult());
        if (this.#command != AsmWords.CMP.code) {
            this.#w.write(this.#result.read());
        }
    }

    descrition() {
        switch(this.#command) {
            case AsmWords.ADD.code:
                return `Addition : W(0x${this.#w.hex()}) + 0x${this.#in.hex()} -> W.`;
            case AsmWords.SUB.code:
                return `Soustraction : W(${this.#w.signed()}) - ${this.#in.signed()} -> W.`;
            case AsmWords.MUL.code:
                return `Multiplication signée : W(${this.#w.signed()}) x ${this.#in.signed()} -> W.`;
            case AsmWords.DIV.code:
                let a = this.#w.signed();
                let b = this.#in.signed();
                return `Division entière signée : W(${this.#w.signed()}) // ${this.#in.signed()} -> W.`;
            case AsmWords.MOD.code:
                return `Modulo signé : W(${this.#w.signed()}) % ${this.#in.signed()} -> W.`;
            case AsmWords.OR.code:
                return `OR bitwise : W(0x${this.#w.hex()}) or 0x${this.#in.hex()} -> W.`;
            case AsmWords.AND.code:
                return `AND bitwise : W(0x${this.#w.hex()}) and 0x${this.#in.hex()} -> W.`;
            case AsmWords.XOR.code:
                return `XOR bitwise : W(0x${this.#w.hex()}) xor 0x${this.#in.hex()} -> W.`;
            case AsmWords.CMP.code:
                return `Comparaison : W(${this.#w.signed()}) - ${this.#in.signed()}.\nW n'est pas modifié.`;
            case AsmWords.MOV.code:
                return `MOVE : 0x${this.#in.hex()} -> W.`;
            case AsmWords.INV.code:
                return `NOT bitwise : ~0x${this.#in.hex()} -> W.`;
            case AsmWords.NEG.code:
                return `Opposé : -(${this.#in.signed()}) -> W.`;
            default:
                return `MOVE (${wordToStr(this.#command)}) : 0x${this.#in.hex()} -> W.`;
        }

    }
}

export { Ual };