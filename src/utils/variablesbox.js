import { decToRadix } from './misc';
import { Box } from './box';

class VBox extends Box {
    #valuesNodes;
    #stackRow = null;
    #onlyStack;

    constructor(variables) {
        /* variables: dictionnaire de forme {nom:{line, value}}
           container: div contenant la boîte
        */
        let length = Object.keys(variables).length;
        let onlyStack = (length == 0);
        let title = onlyStack ? 'Pile':'Variables';
        super(title, "table");
        this.#onlyStack = onlyStack;
        this.#valuesNodes = {};
        {
            let row = document.createElement('tr');
            if (this.#onlyStack) {
                row.innerHTML = "<th>@</th><th>Valeur</th>";
            } else {
                row.innerHTML = "<th>nom</th><th>@</th><th>Valeur</th>";
            }
            this.append(row);
        }
        for (let name in variables){
            let row = this.#makeRow(name, variables[name].line, variables[name].value)
            this.append(row);
        }
    }

    get variablesNodes(){
        return this.#valuesNodes;
    }

    #makeRow(name, adresse, value) {
        let row = document.createElement('tr');
        let cell = document.createElement('td');
        if (!this.#onlyStack) {
            cell.appendChild(document.createTextNode(name));
            row.appendChild(cell);
            cell = document.createElement('td');
        }
        cell.appendChild(document.createTextNode(adresse));
        row.appendChild(cell);
        cell = document.createElement('td');
        this.#valuesNodes[adresse] = cell;
        cell.appendChild(document.createTextNode(decToRadix(value,16,4)));
        row.appendChild(cell);
        row.adresse = adresse;
        return row;
    }

    push(adresse, value) {
        let row = this.#makeRow('pile', adresse, value);
        if (this.#stackRow === null) {
            this.append(row);
        } else {
            if (!this.#onlyStack) { this.#stackRow.firstChild.innerHTML = ''; }
            this.#stackRow.before(row);
        }
        this.#stackRow = row;
        return row.lastChild;
    }

    pop() {
        if (this.#stackRow === null) {
            return -1;
        }
        let adresse = this.#stackRow.adresse;
        let next = this.#stackRow.nextElementSibling;
        this.#stackRow.remove();
        if (next) {
            if (!this.#onlyStack) { next.firstChild.innerHTML = 'pile'; }
            this.#stackRow = next;
        } else {
            this.#stackRow = null;
        }
        return adresse;
    }

}

export { VBox };