class Box {
    #container = null;
    #titlebar;
    #x;
    #y;
    #mouseUpHandler;
    #mouseMoveHandler;
    #button;
    #content = null;

    constructor(title, contentTag, zombie = false) {
        if (zombie) {
            this.#y = 0;
            return;
        }
        this.#container = document.createElement("div");
        document.body.appendChild(this.#container);
        this.#container.classList.add('boxcontainer');
        this.#titlebar = document.createElement("div");
        this.#button = document.createElement("button");
        this.#button.classList.add('boxbutton');
        this.#button.innerText = "□";
        this.#titlebar.appendChild(this.#button);
        this.#titlebar.appendChild(document.createTextNode('  '+title));
        this.#container.appendChild(this.#titlebar);
        this.#titlebar.classList.add('boxtitle');
        this.#content = document.createElement(contentTag);
        this.#content.classList.add('box');
        this.#container.appendChild(this.#content);

        let that = this;
        this.#titlebar.addEventListener("mousedown", function(e) { that.mouseDown(e); });
        this.#button.addEventListener("click", function(e) { that.reduce(e); });
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
        if (this.#content == null) {
            return;
        }
        this.#content.classList.toggle('invisible');
    }

    move(dx, dy) {
        if (this.#container == null) {
            return;
        }
        this.#container.style.left = (this.#container.offsetLeft  + dx) + 'px';
        this.#container.style.top = (this.#container.offsetTop + dy) + 'px';
    }

    setXY(x,y) {
        if (this.#container == null) {
            this.#y = y;
            return;
        }
        this.#container.style.left = x + 'px';
        this.#container.style.top = y + 'px';
    }

    append(node){
        if (this.#content == null) {
            return;
        }
        this.#content.appendChild(node);
    }

    get content() {
        return this.#content;
    }

    get bottom() {
        if (this.#container == null) {
            return this.#y;
        }
        return this.#container.offsetTop + this.#container.offsetHeight;
    }
}






export { Box };