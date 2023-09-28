/* module: reconaissance des différents types de lignes d'instructions */

import { OpType } from '../constantes';
import { ExpressionParser } from './expressionparser'
import _ from 'lodash';

class Line {
    #indent;
    #number;
    constructor(indent, number) {
        /*
        indent:indentation
        number:numéro de ligne dans le programme d'origine
        */
        this.#indent = indent;
        this.#number = number;
    }

    static indentation(expression) {
        /* renvoie le nombre d'espaces en début de lignes */
        for (let i=0; i<expression.length; i++){
            if (expression.charAt(i) != " ") {
                return i;
            }
        }
        return 0;
    }

    get number(){
        return this.#number;
    }

    get indent(){
        return this.#indent;
    }

    toString() {
        return "<Line>";
    }

    str_indent(){
        return " ".repeat(this.#indent);
    }
}

class LineAffectation extends Line {
    #expression;
    #variable;
    static test(expression){
        /* teste si l'expression est possiblement de type affectation */
        let membres = expression.split("=");
        if (membres.length != 2) {
            return false;
        }
        if (!ExpressionParser.is_variable_name(membres[0])) {
            return false;
        }
        if (/^\s*input\s*\(\)\s*$/.test(membres[1])) {
            return true;
        }
        return ExpressionParser.is_expression(membres[1]);
    }

    constructor(expression, number) {
        /* produit une ligne de type input
        expression: contenu de la ligne
        number: numéro de ligne
        */
        let indent = Line.indentation(expression);
        super(indent, number);
        let membres = expression.split("=");
        if (membres.length != 2) {
            throw Error(`[affectation:${number}] : ${expression} n'a pas le format.`);
        }
        this.#variable = ExpressionParser.build(membres[0]);
        if (this.#variable.constructor.name != 'VariableToken') {
            throw Error(`[affectation:${number}] : le membre de gauche de ${expression} devrait être un nom de variable.`);
        }
        if (/^\s*input\s*\(\)\s*$/.test(membres[1])) {
            this.#expression = null;
            return;
        }
        this.#expression = ExpressionParser.build(membres[1]);
        if (this.#expression.type != OpType.ARITHMETIC) {
            throw Error(`[affectation:${number}] : le membre de droite de ${expression} devrait être de type arithmétique.`);
        }
    }

    toString() {
        if (this.#expression === nul) {
            return `${this.str_indent()}${this.#variable.toString()} = input()`;
        } else {
            return `${this.str_indent()}${this.#variable.toString()} = ${this.#expression.toString()}`;
        }
    }

    get expression() {
        return this.#expression;
    }

    get variable() {
        return this.#variable;
    }
}

class LinePrint extends Line {
    #expression;
    static test(expression){
        /* teste si l'expression est possiblement de type print */
        if (! /^\s*print\s*\(.*\)\s*$/.test(expression)) {
            return false;
        }
        let deb = expression.indexOf('(');
        return ExpressionParser.is_expression(expression.substr(deb));
    }

    constructor(expression, number) {
        /* produit une ligne de type input
        expression: contenu de la ligne
        number: numéro de ligne
        */
        let indent = Line.indentation(expression);
        super(indent, number);

        if (! /^\s*print\s*\(.*\)\s*$/.test(expression)) {
            throw Error(`[print:${number}] : ${expression} n'a pas le bon format.`);
        }
        let deb = expression.indexOf('(');
        expression = expression.substr(deb).trim();
        this.#expression = ExpressionParser.build(expression);
        if (this.#expression.type != OpType.ARITHMETIC) {
            throw Error(`[print:${number}] : ${expression} devrait afficher un contenu arithmétique.`);
        }
    }

    toString() {
        return `${this.str_indent()}print(${this.#expression.toString()})`;
    }

    get expression() {
        return this.#expression;
    }

    get variable() {
        return null;
    }
}

class LineTest extends Line {
    #type;
    #condition;
    static test(expression){
        /* teste si l'expression est possiblement de type if, elif, while */
        return /^\s*(if|elif|else|while)(?!\w).*:\s*/.test(expression);
    }

    get type() {
        return this.#type;
    }

    constructor(expression, number) {
        /* produit une ligne de type if / elif / while
        expression: contenu de la ligne
        number: numéro de ligne
        */
        let indent = Line.indentation(expression);
        super(indent, number);

        let groupes = expression.match(/^\s*(if|elif|else|while)(?!\w)(.*):\s*$/);
        if (groupes === null) {
            throw Error(`[test:${number}] ${expression} n'a pas le format attendu.`);
        }

        this.#type = groupes[1].trim();
        let condition = groupes[2].trim();
        if (this.#type == "else") {
            if (condition != "") {
                throw Error(`[${this.#type}:${number}] : ne devrait pas avoir de condition.`);    
            }
            this.#condition = null;
            return;
        }
        this.#condition = ExpressionParser.build(condition);
        if ((this.#condition.type != OpType.COMPARAISON) && (this.#condition.type != OpType.LOGIC)) {
            throw Error(`[${this.#type}:${number}] : ${condition} n'a pas le bon format de condition.`);
        }
    }

    toString() {
        if (this.#type == "else") {
            return `${this.str_indent()}else:`;
        }
        return `${this.str_indent()}${this.#type} ${this.#condition}:`;
    }

    get condition() {
        return this.#condition;
    }
}

class LinesBloc {
    #head;
    #children;
    constructor(head) {
        /* bloc de code initié par un else, if, elif, while */
        if (!(head instanceof LineTest)) {
            throw Error("Un LinesBloc doit être initialisé avec un objet if/elif/else/while.");
        }
        this.#head = head
        this.#children = []
    }

    get head() {
        return this.#head;
    }

    get type() {
        return this.#head.type;
    }

    get condition(){
        return this.#head.condition;
    }

    get indent() {
        return this.#head.indent;
    }

    get number() {
        return this.#head.number;
    }

    add_child(child) {
        if (this.#head.indent >= child.indent) {
            throw Error("L'enfant doit avoir une indentation supérieure au parent.");
        }
        if ((this.#children.length > 0) && (this.#children[0].indent != child.indent)) {
            throw Error("Tous les enfants doivent avoir la même indentation.");
        }
        this.#children.push(child);
    }
    
    toString() {
        let outstr = [this.#head.toString()];
        for (let i=0; i<this.#children.length; i++) {
            outstr.push(this.#children[i].toString());
        }
        return outstr.join('\n');
    }

    get children() {
        return _.clone(this.#children);
    }
}

export { LineAffectation, LinePrint, LineTest, LinesBloc };