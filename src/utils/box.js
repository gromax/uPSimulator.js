import { replaceSpace } from './misc';

class Box {
    #codeLines;
    #nodes;
    #container;
    #titlebar;
    #x;
    #y;
    #mouseUpHandler;
    #mouseMoveHandler;
    #button;
    #content;

    constructor(code, container, title) {
        this.#container = container;
        this.#container.classList.add('boxcontainer');
        this.#titlebar = document.createElement("div");
        this.#button = document.createElement("button");
        this.#button.classList.add('boxbutton');
        this.#button.innerText = "□";
        this.#titlebar.appendChild(this.#button);
        this.#titlebar.appendChild(document.createTextNode('  '+title));
        this.#container.appendChild(this.#titlebar);
        this.#titlebar.classList.add('boxtitle');
        this.#content = document.createElement("div");
        this.#content.classList.add('boxcontent');
        this.#container.appendChild(this.#content);
        this.#codeLines = code.split('\n');
        this.#nodes = [];
        for (let i=0; i<this.#codeLines.length;i++) {
            let line = replaceSpace(this.#codeLines[i]);
            let itab = line.indexOf('\t');
            if (itab>=0) {
                line = "<span class='tag'>" + line.substring(0,itab+1) + "</span>" + line.substring(itab+1);
            }
            let p = document.createElement('p');
            p.classList.add('boxitem');
            p.innerHTML = line;
            this.#content.appendChild(p);
            this.#nodes.push(p);
        }
        let that = this;
        this.#titlebar.addEventListener("mousedown", function(e) { that.mouseDown(e); });
        this.#button.addEventListener("click", function(e) { that.reduce(e); });
    }

    highlight(n){
        for (let i=0;i<this.#nodes.length;i++){
            this.#nodes[i].classList.remove('highlight');
        }
        if ((n>=0) && (n<this.#nodes.length)) {
            this.#nodes[n].classList.add('highlight');
        }
    }

    mouseDown(e){
        this.#x = e.clientX;
        this.#y = e.clientY;
        let that = this;
        this.#mouseMoveHandler = function(e) {that.mouseMove(e);};
        this.#mouseUpHandler = function(e) {that.mouseUp(e);};
        document.addEventListener("mousemove", this.#mouseMoveHandler);
        document.addEventListener("mouseup", this.#mouseUpHandler);
    }

    mouseMove(e){
        let dx = e.clientX - this.#x;
        let dy = e.clientY - this.#y;
        this.move(dx, dy);
        this.#x = e.clientX;
        this.#y = e.clientY;
    }

    mouseUp(e){
        document.removeEventListener("mouseup", this.#mouseUpHandler);
        document.removeEventListener("mousemove", this.#mouseMoveHandler);
    }

    reduce(e) {
        this.#content.classList.toggle('invisible');
    }

    move(dx, dy) {
        this.#container.style.left = (this.#container.offsetLeft  + dx) + 'px';
        this.#container.style.top = (this.#container.offsetTop + dy) + 'px';
    }

    setXY(x,y) {
        this.#container.style.left = x + 'px';
        this.#container.style.top = y + 'px';
    }
}

export { Box };