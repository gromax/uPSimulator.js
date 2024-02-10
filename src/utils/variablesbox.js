import { decToRadix } from './misc';
import { Box } from './box';

class VBox extends Box {
    #valuesNodes;

    constructor(variables) {
        /* variables: dictionnaire de forme {nom:{line, value}}
           container: div contenant la boîte
        */
        let length = Object.keys(variables).length;
        super('Variables', "table", length == 0);
        this.#valuesNodes = {};
        if (length == 0) {
            return;
        }
        {
            let row = document.createElement('tr');
            row.innerHTML = "<th>nom</th><th>@</th><th>Valeur</th>";
            this.append(row);
        }
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
            this.append(row);
        }
    }

    get variablesNodes(){
        return this.#valuesNodes;
    }
}

export { VBox };