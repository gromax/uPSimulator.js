/* buffer pour les sorties */

import { Register } from "./register";


class Buffer {
    #items;
    #r;
    constructor() {
        this.#items = [];
        this.#r = new Register(0);
    }

    get items() {
        return _.clone(this.#items);
    }

    push(item){
        this.#r.write(item);
        this.#items.push(this.#r.read());
    }

    purge() {
        this.#items = [];
    }

    write(item){
        this.push(item);
    }

    read(fmt='') {
        if (this.#items.length == 0) {
            return null;
        }
        this.#r.write(this.#items.shift());
        return this.#r.read(fmt);
    }

    get empty() {
        return this.#items.length == 0;
    }
}

export { Buffer };