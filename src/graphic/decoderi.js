/* bloc affichant le décodage instruction */

import { FONT_FAMILY } from "./styles";
import { decToRadix } from "../utils";

class DecodeRI {
    static HEIGHT = 50;
    static SIZE = 20;
    static PADDING = 10;
    static FILL_OPCODE = '#e899db';
    static FILL_ARGTYPE = '#57acde';
    static FILL_ARG = '#db911a';
    static FILL_NO = '#ccc';
    #group;
    #backOpcode;
    #backArgtype;
    #backArg;
    #binOpcode;
    #binArgtype;
    #binArg;
    #textOp;
    #textType;
    #textArg;
    constructor(parent) {
        this.#group = parent.nested();
        this.#binOpcode = this.#group.text('xxxx xx').font({ family:FONT_FAMILY, size:DecodeRI.SIZE, fill:'#555', 'font-weight':'bold' });
        this.#binArgtype = this.#group.text('xx').font({ family:FONT_FAMILY, size:DecodeRI.SIZE, fill:'#555', 'font-weight':'bold' });
        this.#binArg = this.#group.text('xxxx xxxx').font({ family:FONT_FAMILY, size:DecodeRI.SIZE, fill:'#555', 'font-weight':'bold' });
        this.#backOpcode = this.#group.rect(this.#binOpcode.length() + 2*DecodeRI.PADDING, DecodeRI.HEIGHT);
        this.#backArgtype = this.#group.rect(this.#binArgtype.length() + 2*DecodeRI.PADDING, DecodeRI.HEIGHT);
        this.#backArg = this.#group.rect(this.#binArg.length() + 2*DecodeRI.PADDING, DecodeRI.HEIGHT);
        this.#backArgtype.x(this.#backOpcode.width());
        this.#backArg.x(this.#backArgtype.x() + this.#backArgtype.width());
        this.#binOpcode.front().cx(this.#backOpcode.cx()).y(DecodeRI.PADDING);
        this.#binArgtype.front().cx(this.#backArgtype.cx()).y(DecodeRI.PADDING);
        this.#binArg.front().cx(this.#backArg.cx()).y(DecodeRI.PADDING);

        this.#textOp = this.#group.text('').font({ family:FONT_FAMILY, size:DecodeRI.SIZE, fill:'#555', 'font-weight':'bold' }).y(45).cx(this.#backOpcode.cx());
        this.#textType = this.#group.text('').font({ family:FONT_FAMILY, size:DecodeRI.SIZE, fill:'#555', 'font-weight':'bold' }).y(45).cx(this.#backArgtype.cx());
        this.#textArg = this.#group.text('').font({ family:FONT_FAMILY, size:DecodeRI.SIZE, fill:'#555', 'font-weight':'bold' }).y(45).cx(this.#backArg.cx());

        this.#backOpcode.fill(DecodeRI.FILL_NO).stroke('none');
        this.#backArgtype.fill(DecodeRI.FILL_NO).stroke('none');
        this.#backArg.fill(DecodeRI.FILL_NO).stroke('none');

        this.#group.path('M0 0 l20 -20 v10 h30 v20 h-30 v10 Z').fill('#b09310').stroke('none').x(this.#backArg.x() + this.#backArg.width()+5).cy(this.#backArg.cy());
    }

    update(decode) {
        let [word, argtype, arg] = decode.code;
        let t = decToRadix(word, 2, 6);
        this.#binOpcode.text(`${t.substring(0,4)} ${t.substring(4,6)}`).cx(this.#backOpcode.cx());
        this.#binArgtype.text(decToRadix(argtype, 2, 2)).cx(this.#backArgtype.cx());
        t = decToRadix(arg, 2, 8)
        this.#binArg.text(`${t.substring(0,4)} ${t.substring(4,8)}`).cx(this.#backArg.cx());
        if (decode.name !== null) {
            this.#backOpcode.fill(DecodeRI.FILL_OPCODE);
            this.#textOp.text(decode.name).font({fill:'#5c1250'});
            this.#binOpcode.font({fill:'#5c1250'});
        } else {
            this.#backOpcode.fill(DecodeRI.FILL_NO);
            this.#textOp.text('???').font({fill:'#555'});
            this.#binOpcode.font({fill:'#555'});
        }
        this.#textOp.cx(this.#backOpcode.cx());
        if (decode.argtype !== null) {
            this.#backArgtype.fill(DecodeRI.FILL_ARGTYPE);
            this.#textType.text(decode.argtype).font({fill:'#0a3c59'});
            this.#binArgtype.font({fill:'#0a3c59'})
        } else {
            this.#backArgtype.fill(DecodeRI.FILL_NO);
            this.#textType.text('-').font({fill:'#555'});
            this.#binArgtype.font({fill:'#555'});
        }
        this.#textType.cx(this.#backArgtype.cx());
        if (decode.arg !== null) {
            this.#backArg.fill(DecodeRI.FILL_ARG);
            this.#binArg.font({fill:'#63420b'});
            if ((decode.argtype == 'K') && (decode.arg == 255)) {
                this.#textArg.text('Litt. long').font({fill:'#63420b'});
            } else {
                this.#textArg.text(decode.arg).font({fill:'#63420b'});
            }
        } else {
            this.#backArg.fill(DecodeRI.FILL_NO);
            this.#textArg.text('-').font({fill:'#555'});
            this.#binArg.font({fill:'#555'});
        }
        this.#textArg.cx(this.#backArg.cx());
    }

    move(x, y) {
        this.#group.move(x, y);
        return this;
    }
}

export { DecodeRI };