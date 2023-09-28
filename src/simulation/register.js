/* classe de simulation d'un registre */

class Register {
    #value;
    constructor(value) {
        this.write(value);
    }

    hex() {
        let a = this.#value.toString(16);
        return '0'.repeat(4 - a.length) + a;
    }

    lowhex() {
        let a = this.low().toString(16);
        return '0'.repeat(2 - a.length) + a;
    }

    lowbin() {
        let a = this.#value.toString(2);
        return '0'.repeat(8 - a.length) + a;
    }

    bin() {
        let a = this.#value.toString(2);
        return '0'.repeat(16 - a.length) + a;
    }

    isPos() {
        return (this.#value >> 15) == 0;
    }

    isNul() {
        return this.#value == 0;
    }

    inc() {
        this.#value = (this.#value + 1) % 65536;
    }

    dec() {
        if (this.#value == 0) {
            this.#value = 65536 - 1;
        } else {
            this.#value--;
        }
    }

    reset() {
        this.#value = 0;
    }

    write(value) {
        if (isNaN(value)) {
            throw Error('[Register.write] NaN value.');
        }
        this.#value = value % 65536;
        if (this.#value < 0) {
            this.#value += 65536;
        }
    }

    read(fmt='') {
        switch (fmt) {
            case 'hex': return this.hex();
            case 'bin': return this.bin();
            case 'signed': return this.signed();
            case 'lowhex': return this.lowhex();
            case 'lowbin': return this.lowbin();
            case 'low': return this.low();
            default: return this.#value;
        }
    }

    get value(){
        return this.#value;
    }

    signed() {
        if (this.isPos()){
            return this.#value;
        }
        return this.#value - 65536;
    }

    low() {
        return this.#value % 256;
    }
}

export {Register};