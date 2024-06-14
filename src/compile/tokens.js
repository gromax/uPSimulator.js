/* tokens pour le parse d'expressions logique ou arithmétiques */

import { OpType } from "../constantes";
import _ from 'lodash';

class Token {
    static test(expression, regex) {
        /* Chaque type de noeud est associé à une expression régulière
        expression (str): expression à tester
        regex: expression régulière
        return (bool): vrai si l'expression valide l'expression régulière
        */
        if (expression.trim().match(regex)) {
            return true;
        } else {
            return false;
        }
    }

    isOperator() {
        /* Le token est-il un opérateur ? */
        return false;
    }

    isValue() {
        /* le token est-il une variable ou un littéral ? */
        return false;
    }

    toString() {
        return "<Token>";
    }

    inverse(root){
        /* root: noeud racine de l'arbre
        prérequis: root est logique ou Arithmétique
        */
        throw Error(`${root.toString()} ne peut être inversé.`);
    }

}

class UnaryOperatorToken extends Token {
    static regex = "not|\\~";
    #child = null;
    #symbol = '';
    #priority = 0;
    #type;
    #asmcode = '';
    constructor(expression) {
        super();
        this.#symbol = expression.trim();
        if (this.#symbol == 'neg') {
            this.#priority = 6;
            this.#type = OpType.ARITHMETIC;
            this.#asmcode = 'NEG';
        } else if (this.#symbol == '\~') {
            this.#priority = 6;
            this.#type = OpType.ARITHMETIC;
            this.#asmcode = 'INV';
        } else if (this.#symbol == 'not') {
            this.#priority = 2;
            this.#type = OpType.LOGIC;
        } else {
            throw new Error('Symbole unaire non reconnu : '+this.#symbol);
        }
    }

    toString(){
        if (this.#child.isValue()) {
            return `${this.#symbol} ${this.#child.toString()}`;
        } else {
            return `${this.#symbol} (${this.#child.toString()})`;
        }
    }

    isOperator() {
        return true;
    }

    setChild(child) {
        /* renvoie une version du nœud avec l'enfant */
        if ((this.#type == OpType.ARITHMETIC) && (child.type != OpType.ARITHMETIC)) {
            throw Error(`[${this.#symbol}] L'enfant [${child.toString()}] doit être arithmétique.`);
        }
        if ((this.#type == OpType.LOGIC) && (child.type != OpType.LOGIC) && (child.type != OpType.COMPARAISON)) {
            throw Error(`[${this.#symbol}] L'enfant [${child.toString()}] doit être logique ou comparaison.`);
        }
        if ((this.#type == OpType.COMPARAISON) && (child.type != OpType.ARITHMETIC)) {
            throw Error(`[${this.#symbol}] L'enfant [${child.toString()}] doit être arithmétique.`);
        }
        if ((this.#symbol == 'neg') && (child instanceof NumberToken)) {
            return new NumberToken(-child.value);
        }

        this.#child = child;
        return this;
    }

    get symbol() {
        return this.#symbol;
    }

    get priority() {
        return this.#priority;
    }

    get type() {
        return this.#type;
    }

    get child() {
        return this.#child;
    }

    static test(expression) {
        let expr = expression.trim();
        let regex = new RegExp(UnaryOperatorToken.regex,'i');
        return regex.test(expr);
    }

    inverse(root){
        /* root: noeud racine de l'arbre
        prérequis: root est logique ou Arithmétique
        */
        if (this.#symbol == 'not') {
            return root.child;
        }
        throw Error(`${root.toString()} ne peut être inversé.`);
    }

    asm() {
        if (this.#type == OpType.LOGIC) {
            throw Error(`${this.toString()} est de type logique, n'a donc pas de version asm.`);
        }
        if (this.#child.isValue()) {
            return [`\t${this.#asmcode} ${this.#child.toString()}`];
        }
        let c = this.#child.asm();
        c.push(`\t${this.#asmcode}`);
        return c;
    }
}

class BinaryOperatorToken extends Token {
    static regex = "\\+|\\-|\\*|\\/|%|\\||&|\\^|>(?!=)|>=|<(?!=)|<=|==|!=|or|and";
    #left = null;
    #right = null;
    #symbol = '';
    #priority = 0;
    #type;
    #commutatif;
    #asmcode = "";
    #asmCondJump = "";
    constructor(expression) {
        super();
        this.#symbol = expression.trim();
        if (this.#symbol == '+') {
            this.#type = OpType.ARITHMETIC;
            this.#priority = 5;
            this.#commutatif = true;
            this.#asmcode = "ADD";
        } else if (this.#symbol == '-') {
            this.#type = OpType.ARITHMETIC;
            this.#priority = 5;
            this.#commutatif = false;
            this.#asmcode = "SUB";
        } else if (this.#symbol == '*') {
            this.#type = OpType.ARITHMETIC;
            this.#priority = 7;
            this.#commutatif = true;
            this.#asmcode = "MUL";
        } else if (this.#symbol == '//') {
            this.#symbol = '//';
            this.#type = OpType.ARITHMETIC;
            this.#priority = 7;
            this.#commutatif = false;
            this.#asmcode = "DIV";
        } else if (this.#symbol == '/') {
            this.#symbol = '/';
            this.#type = OpType.ARITHMETIC;
            this.#priority = 7;
            this.#commutatif = false;
            this.#asmcode = "DIV";
        } else if (this.#symbol == '%') {
            this.#type = OpType.ARITHMETIC;
            this.#priority = 8;
            this.#commutatif = false;
            this.#asmcode = "MOD";
        } else if (this.#symbol == '|') {
            this.#type = OpType.ARITHMETIC;
            this.#priority = 6;
            this.#commutatif = true;
            this.#asmcode = "OR";
        } else if (this.#symbol == '&') {
            this.#type = OpType.ARITHMETIC;
            this.#priority = 7;
            this.#commutatif = true;
            this.#asmcode = "AND";
        } else if (this.#symbol == '^') {
            this.#type = OpType.ARITHMETIC;
            this.#priority = 7;
            this.#commutatif = true;
            this.#asmcode = "XOR";
        } else if ((this.#symbol == '==') || (this.#symbol == '!=')){
            this.#type = OpType.COMPARAISON;
            this.#priority = 4;
            this.#commutatif = true;
            this.#asmcode = "CMP";
            let d = {"==":"BEQ", "!=":"BNE"};
            this.#asmCondJump = d[this.#symbol];
        } else if (
            (this.#symbol == '>') || (this.#symbol == '>=') ||
            (this.#symbol == '<') || (this.#symbol == '<=')){
            this.#type = OpType.COMPARAISON;
            this.#priority = 4;
            this.#commutatif = false;
            this.#asmcode = "CMP";
            let d = {">":"BGT", "<":"BLT", ">=":"BGE", "<=":"BLE"};
            this.#asmCondJump = d[this.#symbol];
        } else if (this.#symbol == 'or') {
            this.#type = OpType.LOGIC;
            this.#priority = 1;
            this.commutatif = true;
        } else if (this.#symbol == 'and') {
            this.#type = OpType.LOGIC;
            this.#priority = 3;
            this.commutatif = true;
            this.commutatif = true;
        } else {
            throw new Error(`Symbole binaire non reconnu : ${this.#symbol}`);
        }
    }

    toString() {
        let str1 = this.#left.isValue()? this.#left.toString() : `(${this.#left.toString()})`;
        let str2 = this.#right.isValue()? this.#right.toString() : `(${this.#right.toString()})`;
        return `${str1} ${this.#symbol} ${str2}`;
    }

    isOperator() {
        return true;
    }

    setChilds(left, right) {
        /* renvoie une version du nœud avec l'enfant */
        if ((this.#type == OpType.ARITHMETIC) && (left.type != OpType.ARITHMETIC)) {
            throw Error(`[${this.#symbol}] L'enfant gauche [${left.toString()}] doit être arithmétique.`);
        }
        if ((this.#type == OpType.ARITHMETIC) && (right.type != OpType.ARITHMETIC)) {
            throw Error(`[${this.#symbol}] L'enfant droit [${left.toString()}] doit être arithmétique.`);
        }
        if ((this.#type == OpType.LOGIC) && (left.type != OpType.LOGIC) && (left.type != OpType.COMPARAISON)) {
            throw Error(`[${this.#symbol}] L'enfant gauche [${left.toString()}] doit être logique ou comparaison.`);
        }
        if ((this.#type == OpType.LOGIC) && (left.type != OpType.LOGIC) && (left.type != OpType.COMPARAISON)) {
            throw Error(`[${this.#symbol}] L'enfant droit [${left.toString()}] doit être logique ou comparaison.`);
        }
        if ((this.#type == OpType.COMPARAISON) && (left.type != OpType.ARITHMETIC)) {
            throw Error(`[${this.#symbol}] L'enfant gauche [${left.toString()}] doit être arithmétique.`);
        }
        if ((this.#type == OpType.COMPARAISON) && (right.type != OpType.ARITHMETIC)) {
            throw Error(`[${this.#symbol}] L'enfant droit [${left.toString()}] doit être arithmétique.`);
        }
        if (((this.#type == OpType.ARITHMETIC) && (this.#commutatif) || (this.#type == OpType.COMPARAISON)) &&
            (left.isValue() && !right.isValue() || (left instanceof NumberToken) && (left.value == 0) )) {
            this.#right = left;
            this.#left = right;
            if (this.#type == OpType.COMPARAISON) {
                let mirror = {"<":">", "<=":">=", "==":"==", "!=":"!=", ">=":"<=", ">":"<"};
                this.#symbol = mirror[this.$symbol];
            }
        } else {
            this.#left = left;
            this.#right = right;
        }
        return this;
    }

    get symbol() {
        return this.#symbol;
    }

    get priority() {
        return this.#priority;
    }

    get type() {
        return this.#type;
    }

    get left() {
        return this.#left;
    }

    get right() {
        return this.#right;
    }

    static test(expression) {
        let expr = expression.trim();
        let regex = new RegExp(BinaryOperatorToken.regex,'i');
        return regex.test(expr);
    }

    inverse(){
        /* token est logique ou Arithmétique
        */
        if (this.#symbol == 'and') {
            let token = new BinaryOperatorToken("or");
            token.setChilds(
                this.#left.inverse(),
                this.#right.inverse());
            return token;
        }
        if (this.#symbol == 'or') {
            let token = new BinaryOperatorToken("and");
            token.setChilds(
                this.#left.inverse(),
                this.#right.inverse());
            return token;
        }
        let neg = {"<":">=", "<=":">", "==":"!=", "!=":"==", ">=":"<", ">":"<="};
        if (_.includes(neg, this.#symbol))  {
            let token = new BinaryOperatorToken(neg[this.#symbol]);
            token.setChilds(this.left, this.right);
            return token;
        }
        throw Error(`${root.toString()} ne peut être inversé.`);
    }

    asm(cible = null) {
        if (this.#type == OpType.LOGIC) {
            throw Error(`${this.toString()} est de type logique, n'a donc pas de version asm.`);
        }
        let left = this.#left.asm();
        if (!this.#right.isValue()){
            let right = this.#right.asm();
            right.push("\tPUSH");
            left = _.concat(right, left);
            left.push(`\t${this.#asmcode} POP`);
        } else if((this.#type == OpType.COMPARAISON) && (this.#right instanceof NumberToken) && (this.#right.value == 0)) {
            // aucun calcul à faire, c'est une comparaison avec 0
        } else {
            left.push(`\t${this.#asmcode} ${this.#right.toString()}`)
        }
        if (this.#type == OpType.COMPARAISON) {
            if (cible === null) {
                throw Error(`[asm] ${this.toString()} nécessite que l'on précise une cible de saut.`);
            }
            left.push(`\t${this.#asmCondJump} ${cible}`);
        }
        return left;
    }
}

class VariableToken extends Token {
    static RESERVED_NAMES = ["while", "if", "else", "elif", "or", "not", "and", "input", "print"];
    static regex = "[a-zA-Z][a-zA-Z_0-9]*";

    #name;

    constructor(expression) {
        super();
        this.#name = expression.trim();
    }

    get name() {
        return this.#name;
    }

    get type() {
        return OpType.ARITHMETIC;
    }

    isValue() {
        /* le token est-il une variable ou un littéral ? */
        return true;
    }

    static test(expression) {
        let expr = expression.trim();
        if (VariableToken.RESERVED_NAMES.includes(expr)) {
            return false;
        }
        let regex = new RegExp(VariableToken.regex,'i');
        return regex.test(expr);
    }

    toString() {
        return `@${this.#name}`;
    }

    asm() {
        return [`\tMOV @${this.#name}`];
    }
}

class NumberToken extends Token {
    static regex = "[0-9]+";

    #value;
    
    constructor(expression) {
        super();
        if (expression instanceof Number){
            this.#value = expression.trim();
        } else {
            this.#value = Number(expression.trim());
        }
    }

    isValue() {
        /* le token est-il une variable ou un littéral ? */
        return true;
    }

    get value() {
        return this.#value;
    }

    get type() {
        return OpType.ARITHMETIC;
    }

    static test(expression) {
        let expr = expression.trim();
        let regex = new RegExp(NumberToken.regex,'i');
        return regex.test(expr);
    }

    toString() {
        return `#${this.#value}`;
    }

    asm() {
        if ((this.#value < 0) && (this.#value > -255)){
            return [`\tNEG #${-this.#value}`];
        } 
        return [`\tMOV #${this.#value}`];
    }
}

class ParenthesisToken extends Token {
    static regex = "\\(|\\)";

    #type;
    #opening;

    constructor(expression) {
        super();
        this.#opening = (expression.trim() == '(');
        this.#type = OpType.OTHER;
    }

    get opening() {
        return this.#opening;
    }

    get type() {
        return this.#type;
    }

    static test(expression) {
        let expr = expression.trim();
        let regex = new RegExp(ParenthesisToken.regex,'i');
        return regex.test(expr);
    }

    toString() {
        if (this.#opening) {
            return "(";
        } else {
            return ")";
        }
    }
}

export { UnaryOperatorToken, BinaryOperatorToken, VariableToken, NumberToken, ParenthesisToken };