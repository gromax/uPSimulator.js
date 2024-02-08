import { decToRadix } from './misc';

class VBox {
    #valuesNodes;
    #container;
    #titlebar;
    #x;
    #y;
    #mouseUpHandler;
    #mouseMoveHandler;
    #button;
    #content;

    constructor(variables, container) {
        /* variables: dictionnaire de forme {nom:{line, value}}
           container: div contenant la boîte
        */
        this.#container = container;
        this.#container.classList.add('vboxcontainer');
        this.#titlebar = document.createElement("div");
        this.#button = document.createElement("button");
        this.#button.classList.add('boxbutton');
        this.#button.innerText = "□";
        this.#titlebar.appendChild(this.#button);
        this.#titlebar.appendChild(document.createTextNode('  Variables'));
        this.#container.appendChild(this.#titlebar);
        this.#titlebar.classList.add('vboxtitle');
        this.#content = document.createElement("table");
        //this.#content.classList.add('boxcontent');
        this.#content.innerHTML = "<tr><th>nom</th><th>@</th><th>Valeur</th></tr>";
        this.#content.classList.add('vbox');
        this.#container.appendChild(this.#content);
        this.#valuesNodes = {};
        for (let name in variables){
            let adresse = variables[name].line;
            let value = variables[name].value;
            let row = document.createElement('tr');
            let cell = document.createElement('td');
            cell.appendChild(document.createTextNode(name));
            row.appendChild(cell);
            cell = document.createElement('td');
            cell.appendChild(document.createTextNode(adresse));
            row.appendChild(cell);
            cell = document.createElement('td');
            this.#valuesNodes[adresse] = cell;
            cell.appendChild(document.createTextNode(decToRadix(value,16,4)));
            row.appendChild(cell);
            this.#content.appendChild(row);
        }
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

    get variablesNodes(){
        return this.#valuesNodes;
    }
}

export { VBox };