/* module de gestion de la mémoire */

import { Register } from './register';

class Memory {
    static SIZE = 256;
    #data;
    constructor(){
        this.#data = [];
        for(let i=0; i<Memory.SIZE; i++){
            this.#data.push(new Register(0));
        }
    }

    #getRegister(adresse){
        if (adresse === null) {
            throw Error(`[Memory] l'adresse est vide.`);
        }
        if ((adresse < 0) || (adresse >= Memory.SIZE)){
            throw Error(`[Memory] l'adresse ${adresse} n'est pas valide.`);
        }
        return this.#data[adresse];
    }

    read(adresse, format = '') {
        let reg = this.#getRegister(adresse);
        switch(format){
            case "hex": return reg.hex();
            case "bin": return reg.bin();
            case "signed": return reg.signed();
            default: return reg.read();
        }
    }

    write(adresse, value) {
        let reg = this.#getRegister(adresse);
        reg.write(value);
    }

    load(data) {
        if (data.length > Memory.SIZE) {
            throw Error(`[Engine.load] vous chargez ${data.length} mots de données. La mémoire du processeur n'en a que ${Memory.SIZE}.`);
        }
        for (let i=0; i<data.length; i++) {
            this.#data[i].write(data[i]);
        }
        for (let i=data.length; i<Memory.SIZE; i++) {
            this.#data[i].write(0);
        }
    }
}

export { Memory };