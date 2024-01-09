import _ from 'lodash';
import { AsmArgs, AsmWords } from './asmconstantes';
import { decToBin, decToHex } from '../utils';


class AsmLine {
    static REGEX = /^(@?[_A-Za-z]+[_A-Za-z0-9]*\s)?\s*([A-Za-z]+)\s*(\s@?#?[_A-Za-z0-9]+)?$/;

    #arg = null;
    #word;
    #lab = "";
    #argtype;
    #size = 1;
    #line;
    constructor(line) {
        /* reçoit une ligne et en analyse le contenu */
        this.#line = line;
        if (! AsmLine.REGEX.test(line)) {
            throw Error(`[${line}] : erreur, vérifiez.`);
        }
        let groups = line.match(AsmLine.REGEX);

        // gestion du cas ex: MUL POP qui comprend MUL comme un label
        let g1 = (groups[1] || '').trim();
        let g2 = groups[2];
        let g3 = (groups[3] || '').trim();
        if ((g1.toUpperCase() in AsmWords) && (g3 =="")) {
            g3 = g2;
            g2 = g1.toUpperCase();
            g1 = "";
        } else {
            g2 = g2.toUpperCase()
        }

        this.#lab = g1;
        if (this.#lab.charAt(0) == '@'){
            this.#lab = this.#lab.substring(1);
        }
        if (this.#lab.toLocaleUpperCase() in AsmWords) {
            throw Error(`[${line}] : l'étiquette [${this.#lab}] ne doit pas être une des commandes assembleur.`);
        }
        this.#word = g2;
        if (!(this.#word in AsmWords)) {
            throw Error(`[${line}] : la commande [${this.#word}] est inconnue.`);
        }

        if (AsmWords[this.#word].code == AsmWords.DAT.code) {
            // cas d'une ligne DAT
            if (this.#lab == ''){
                throw Error(`[${line}] : une ligne [${this.#word}] doit avoir une étiquette.`);
            }
            let arg = (groups[3] || '0').trim();
            if (! /\-?[0-9]+/.test(arg)) {
                throw Error(`[${line}] : [${this.#word}] doit avoir un entier comme argument ou rien..`);
            }
            this.#arg = Number(arg);
            if ((this.#arg < -32768) || (this.#arg > 65535)) {
                throw Error(`[${line}] : le contenu d'un mot 16 bits est compris entre -32768 et 32767 dans le cas signé et entre 0 et 65535 dans le cas non signé.`);
            }
            this.#argtype = AsmArgs.D;
            return;
        }

        let arg = g3;
        if (arg == '') {
            this.#argtype = AsmArgs.NO;
            if (!AsmWords[this.#word].NO) {
                throw Error(`[${line}] : la commande [${this.#word}] attend un argument.`);
            }
        } else if (/^\#\-?[0-9]+$/.test(arg)) {
            this.#argtype = AsmArgs.K;
            if (!AsmWords[this.#word].K) {
                throw Error(`[${line}] : la commande [${this.#word}] ne peut recevoir un littéral.`);
            }
            this.#arg = Number(arg.substring(1));
            if ((this.#arg < -32768) || (this.#arg > 65535)) {
                throw Error(`[${line}] : en 16 bits, le littéral est compris entre -32768 et 32767, entre 0 et 65535 pour un littéral non signé.`);
            }
            if ((this.#arg >= 255) || (this.#arg < 0)) {
                this.#size = 2;
            }
        } else if (arg == 'POP') {
            this.#argtype = AsmArgs.P;
            if (!AsmWords[this.#word].P) {
                throw Error(`[${line}] : la commande [${this.#word}] ne peut recevoir l'argument POP.`);
            }
        } else if (/^@?([0-9]+|[_A-Za-z]+[_A-Za-z0-9]*)$/.test(arg)) {
            this.#argtype = AsmArgs.A;
            if (!AsmWords[this.#word].A) {
                throw Error(`[${line}] : la commande [${this.#word}] ne peut recevoir une adresse en argument.`);
            }
            if (arg.charAt(0) == '@'){
                arg = arg.substring(1);
            }
            if (!isNaN(groups[3])) {
                this.#arg = Number(arg);
                if ((this.#arg < 0) || (this.#arg > 255)) {
                    throw Error(`[${line}] : l'adresse ${this.#arg} peut prendre les valeurs de 0 à 255 inclus.`);
                }
            } else {
                this.#arg = arg;
            }
        } else {
            throw Error(`[${line}] : erreur, vérifiez.`);
        }
    }

    #opcode(){
        if (this.#argtype == AsmArgs.D) {
            throw Error(`[${this.toString()}] : une ligne DAT n'a pas d'opcode.`);
        }
        return AsmWords[this.#word].code*4 + this.#argtype;
    }

    toString() {
        if (AsmWords[this.#word].J) {
            return `${this.#lab}\t${this.#word} ${this.#arg}`;
        }
        if (this.#argtype == AsmArgs.K) {
            return `${this.#lab}\t${this.#word} #${this.#arg}`;
        }
        if (this.#argtype == AsmArgs.A) {
            return `${this.#lab}\t${this.#word} @${this.#arg}`;
        }
        if (this.#argtype == AsmArgs.P) {
            return `${this.#lab}\t${this.#word} POP`;
        }
        return `${this.#lab}\t${this.#word}`;
    }

    get lab() {
        return this.#lab;
    }

    get size() {
        return this.#size;
    }

    get variable() {
        if ((this.#argtype == AsmArgs.A) && _.isString(this.#arg)) {
            return this.#arg;
        }
        return null;
    }

    get jump() {
        if (AsmWords[this.#word].J && _.isString(this.#arg)) {
            return this.#arg;
        }
        return null;
    }

    get word(){
        return this.#word;
    }

    get isdat(){
        return this.#argtype == AsmArgs.D;
    }

    setLab(newlab) {
        if (this.#lab != '') {
            if (newlab == '') {
                throw Error(`[${this.toString()}] interdiction d'effacer le label.`);
            } else {
                throw Error(`[${this.toString()}] interdiction de modifier le label [${newlab}].`);
            }
        }
        this.#lab = newlab;
    }

    to_number(labels) {
        if (this.#argtype == AsmArgs.D) {
            return this.#arg>=0 ? this.#arg : 65536 - this.#arg;
        }
        if (this.#argtype == AsmArgs.K) {
            if (this.#arg < 0) {
                let a = 65536 + this.#arg;
                return [(this.#opcode() << 8) + 255, a];
            } else if (this.#arg >= 255) {
                return [(this.#opcode() << 8) + 255, this.#arg];
            } else {
                return (this.#opcode() << 8) + this.#arg;
            }
        }
        if (this.#argtype == AsmArgs.A) {
            let a = this.#arg;
            if (_.isString(this.#arg)) {
                // adresse qui devrait être dans la liste des variables
                if (!(this.#arg in labels)){
                    throw Error(`[${this.toString()}] pointe vers ${this.#arg} qui n'est pas défini.`);
                }
                a = labels[this.#arg].number;
            }
            return (this.#opcode() << 8) + a;
        }
        return this.#opcode() << 8;
    }
}

class AsmLines {
    #lines;
    #size;
    #labels;
    #binary;
    constructor(program) {
        this.#lines = [];
        let plines = program.split('\n');
        let currentlab = '';
        for (let i=0; i<plines.length; i++) {
            let p = AsmLines.parseLine(plines[i]);
            if (p === null) {
                continue;
            }
            if (p instanceof String) {
                if (currentlab != '') {
                    throw Error(`${p} - ${currentlab} : labels consécutifs.`);
                }
                currentlab = p;
                continue;
            }
            if (currentlab != ''){
                p.setLab(currentlab);
                currentlab = '';
            }
            this.#lines.push(p);
        }
        if (currentlab != '') {
            throw Error(`[${currentlab}] : le programme se termine par un label sans instructions.`);
        }

        this.#labels = {};
        let c = 0;
        for (let i=0; i<this.#lines.length; i++) {
            let line = this.#lines[i];
            let lab = line.lab;
            if (lab == '') {
                c = c + line.size;
                continue;
            }
            if (lab in this.#labels) {
                throw Error(`[${lab}] : le label est défini plusieurs fois.`);
            }
            this.#labels[lab] = { number:c, asm:line, isdat:line.isdat };
            c = c + line.size;
        }
        this.#size = c;

        // vérif que toutes les cibles de saut existent
        for (let i=0; i<this.#lines.length; i++) {
            let line = this.#lines[i];
            let j = line.jump;
            if (j === null) {
                continue;
            }
            if (!(j in this.#labels)) {
                throw Error(`[${line.toString()}] l'étiquette de saut n'est pas définie.`);
            }
            if (this.#labels[j].isdat) {
                throw Error(`[${line.toString()}] l'étiquette de saut correspond à une ligne DATA.`);
            }
        }

        /// dernier passage pour les variables
        for (let i=0; i<this.#lines.length; i++) {
            let line = this.#lines[i];
            let v = line.variable;
            if (v === null) {
                continue;
            }
            if (!(v in this.#labels)) {
                let nline = new AsmLine(`${v}\tDAT`);
                this.#lines.push(nline);
                this.#labels[v] = { number:this.#size, asm:nline, isdat:true};
                this.#size++;
            }
        }
        let labels = this.#labels;
        this.#binary = _.flatten(_.map(this.#lines, function(item){return item.to_number(labels)}));
    }

    static parseLine(line) {
        line = line.trim();
        if (line == '') {
            return null;
        }
        if (/^@?[_A-Za-z][_A-Za-z0-9]*$/.test(line) && !(line.toUpperCase() in AsmWords)) {
            // simple label à reporter sur la ligne suivante
            return line;
        }
        return new AsmLine(line);
    }

    get binary() {
        return _.map(this.#binary, decToBin);
    }

    get hex() {
        return _.map(this.#binary, decToHex);
    }

    get program() {
        return _.clone(this.#binary);
    }
}


export { AsmLine, AsmLines };