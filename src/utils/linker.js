/* module servant à récupérer les clés GET de la simulation
   permet de produire les différentes formes du code et de faire le lien entre elles
*/

import { Parser } from '../compile/parser';
import { AsmLines } from '../compile/parseasm';

class Linker {
    #python = '';
    #hex = '';
    #asm = '';
    #asmToPython = null;
    #binaryToAsm = null;
    #line = -1;
    #asmLine = -1;
    #pythonLine = -1;

    constructor(option) {
        let python = option.python || '';
        let hex = option.hex || '';
        let asm = option.asm || '';
        if (python != '') {
            this.#python = python;
            try {
                let result = new Parser(python);
                asm = result.asm;
                this.#asmToPython = result.linesNumbers;
            } catch({type, message}) {
                console.log(message);
                alert("Le code python est invalide  !");
                return;
            }
        }

        if (asm != '') {
            this.#asm = asm;
            try {
                let asmParsed = new AsmLines(asm);
                hex = asmParsed.hex.join('');
                this.#binaryToAsm = asmParsed.linesNumbers;
            } catch({type, message}) {
                console.log(message);
                alert("Le code assembleur est invalide  !");
                return;
            }
        }
        this.#hex = hex;

    }

    get asm() {
        return this.#asm;
    }

    get python() {
        return this.#python;
    }

    get hex() {
        return this.#hex;
    }

    setLine(n) {
        this.#line = n;
        if ((this.#line<0) || (this.#binaryToAsm == null) || (this.#line>=this.#binaryToAsm.length)) {
            this.#asmLine = -1;
        } else {
            this.#asmLine = this.#binaryToAsm[this.#line];
        }
        if ((this.#asmLine<0) ||  (this.#asmToPython == null) || (this.#asmLine>=this.#asmToPython.length)) {
            this.#pythonLine = -1;
        } else {
            this.#pythonLine = this.#asmToPython[this.#asmLine];
        }
    }

    get asmLine(){
        return this.#asmLine;
    }

    get pythonLine(){
        return this.#pythonLine;
    }

}

export { Linker };