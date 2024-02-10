import { replaceSpace } from './misc';

import { Box } from './box';

class TextBox extends Box {
    #codeLines;
    #nodes;

    constructor(code, title) {
        super(title, "div", code == '');
        this.#nodes = [];
        if (code == '') {
            return;
        }
        this.#codeLines = code.split('\n');
        for (let i=0; i<this.#codeLines.length;i++) {
            let line = replaceSpace(this.#codeLines[i]);
            let itab = line.indexOf('\t');
            if (itab>=0) {
                line = "<span class='tag'>" + line.substring(0,itab+1) + "</span>" + line.substring(itab+1);
            }
            let p = document.createElement('p');
            p.classList.add('boxitem');
            p.innerHTML = line;
            this.append(p);
            this.#nodes.push(p);
        }
    }

    highlight(n){
        for (let i=0;i<this.#nodes.length;i++){
            this.#nodes[i].classList.remove('highlight');
        }
        if ((n>=0) && (n<this.#nodes.length)) {
            this.#nodes[n].classList.add('highlight');
        }
    }
}

export { TextBox };