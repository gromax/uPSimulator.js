/* module chargé du parse du programme d'origine */

import { LineAffectation, LinePrint, LineTest, LinesBloc } from './line';
import { NodeType, OpType } from '../constantes';


class Parser {
    static parse(text) {
        /* Produit le parse du programme contenu dans text
        */
        let lines = text.split('\n');
        let parsed_lines = []
        for(let i=0; i<lines.length; i++) {
            let line = lines[i];
            if (line.trim() == "") {
                continue;
            }
            let obj = Parser.#parse_line(line, i+1);
            parsed_lines.push(obj);
        }
        let error_line = Parser.#verify_indents(parsed_lines);
        if (error_line > 0) {
            throw Error(`[${error_line}] Erreur d'indentation.`);
        }
        let blocs = Parser.#blocs(parsed_lines);

        error_line = Parser.#verify_else(blocs);
        if (error_line > 0) {
            throw Error(`[${error_line}] elif ou else n'est pas correctement lié à un if.`);
        }

        let nodes = Parser.#rec_convert_to_nodes(blocs);
        nodes[0].type = NodeType.LAST;
        Parser.#clear_useless(nodes);
        Parser.#decompose_jump(nodes);
        return Parser.#asm(_.reverse(nodes));
    }

    static #verify_indents(lines) {
        /* vérifie le bon enchaînement des indentations
        lines: liste des lignes parsées
        return: numéro de ligne d'une éventuelle erreur, -1 si pas d'erreur
        */
        if (lines.length == 0) {
            return -1;
        }
        let first = lines[0];
        let indents = [first.indent];
        for (let i=1; i<lines.length; i++) {
            let current  = lines[i];
            let previous = lines[i-1];
            if (previous instanceof LineTest) {
                // augmentation de l'indentation requise
                if (current.indent > previous.indent) {
                    indents.push(current.indent);
                    continue;
                }
                return current.number;
            }
            if (current.indent > previous.indent) {
                // augmentation imprévue de l'indentation
                return current.number;
            }
            if (current.indent < previous.indent) {
                // diminution de l'indentation
                // doit revenir à un niveau antérieur
                while ((indents.length > 0) && (indents[indents.length-1] > current.indent)) {
                    // dépile un niveau d'indentation
                    indents.pop();
                }
                if ((indents.length == 0) || (indents[indents.length-1] < current.indent)) {
                    return current.number;
                }
            }
        }
        // ne doit pas terminé par un item nécessitant indentation
        let last = lines[lines.length-1]
        if (last instanceof LineTest) {
            return last.number;
        }
        return -1;
    }

    static #blocs(lines) {
        /* regroupe les blocs en arborescence suivant l'indentation
        lines: liste des lignes parsées
        return: liste avec les blocs regroupés
        */
        if (lines.length == 0){
            return [];
        }
        let base_indent = lines[0].indent;
        let out = []; // pile des groupés
        for (let i=0; i<lines.length; i++) {
            let line = lines[i];
            if (line instanceof LineTest) {
                line = new LinesBloc(line);
            }
            if (out.length == 0) {
                out.push(line);
                continue;
            }
            if (line.indent < base_indent) {
                throw Error(`Erreur d'indentation en ligne ${line.number}.`);
            }
            while (out[out.length-1].indent > line.indent) {
                let b = out.pop();
                let bp = out[out.length-1];
                if (!(bp instanceof LinesBloc)) {
                    throw Error(`La ligne ${b.number} n'a pas de bloc où s'insérer.`);
                }
                bp.add_child(b);
            }
            if ((line.indent > base_indent) && (out[out.length-1].indent == line.indent)) {
                let b = out.pop();
                let bp = out[out.length-1];
                if (!(bp instanceof LinesBloc)) {
                    throw Error(`La ligne ${b.number} n'a pas de bloc où s'insérer.`);
                }
                bp.add_child(b);
            }
            if ((line instanceof LinesBloc) || (line.indent == base_indent)) {
                out.push(line);
                continue;
            }
            if (!(out[out.length-1] instanceof LinesBloc)) {
                throw Error(`La ligne ${line.number} n'a pas de bloc où s'insérer.`);
            }
            out[out.length-1].add_child(line);
        }
        return out;
    }

    static #verify_else(lines) {
        /* vérifie si un else ou elif donné correspond bien à un if
        lines: liste des lignes groupées en blocs
        return: numéro de ligne d'une éventuelle erreur, -1 si pas d'erreur
        */
        if (lines.length == 0) {
            return -1;
        }
        for (let i=0; i<lines.length; i++) {
            let current = lines[i];
            if (! current instanceof LinesBloc) {
                continue;
            }
            if (! ["elif", "else"].includes(current.type)) {
                continue;
            }
            if (i == 0) {
                return current.number;
            }
            let prec = lines[i-1];
            if (!(prec instanceof LinesBloc)) {
                return current.number;
            }
            if (prec.indent != current.indent){
                return current.number;
            }
            if (! ["if", "elif"].includes(prec.type)) {
                return current.number;
            }
        }
        return -1;
    }

    static #rec_convert_to_nodes(lines) {
        /* Convertit une liste de lignes en noeuds
           Ces noeuds sont des dictionnaires contenant l'info utile
           de 4 types : affectation, jmp, dummy
        lines: liste des objets à convertir
        return: liste sous forme de noeuds, en ordre inverse
        */
        let nodes = [{type:NodeType.DUMMY, number:-1}];
        let else_end_jump = null;
        
        for (let i=lines.length-1; i>=0; i--) {
            let line = lines[i];
            if ((line instanceof LinePrint) || (line instanceof LineAffectation)) {
                if (else_end_jump !== null){
                    throw Error(`Instruction avant un else [ligne ${line.number}]`);
                }
                let node = {
                    type:NodeType.AFFECTATION,
                    number:line.number,
                    expression:line.expression,
                    variable:line.variable
                }
                nodes.push(node);
                continue;
            }
            
            if (!(line instanceof LinesBloc)) {
                throw Error(`Ligne de type inconnu [ligne ${line.number}]`);
            }


            let children = Parser.#rec_convert_to_nodes(line.children);
            if (line.type == "else") {
                if (else_end_jump === null){
                    else_end_jump = nodes.length - 1;
                } else {
                    throw Error(`else suivi d'un else [ligne ${line.number}]`);
                }
                nodes = _.concat(nodes, children);
                continue;
            }
            if ((line.type == "elif") || (line.type == "if")) {
                let jmp_else = {
                    type:NodeType.JMP,
                    number:line.number,
                    condition:line.condition.inverse(),
                    cible:nodes.length - 1
                };
                if (else_end_jump === null){
                    else_end_jump = nodes.length - 1;
                }
                let jmp_end = {
                    type:NodeType.JMP,
                    number:line.number,
                    condition:null,
                    cible:else_end_jump
                };
                nodes = _.concat(nodes, jmp_end, children, jmp_else);
                if (line.type =="if") {
                    else_end_jump = null;
                }
                continue;
            }
            if (line.type == "while") {
                if (else_end_jump !== null){
                    throw Error(`while avant un else [ligne ${line.number}]`);
                }
                let jmp_while = {
                    type:NodeType.JMP,
                    number:line.number,
                    condition:line.condition.inverse(),
                    cible:nodes.length - 1
                };
                let jmp_loop = {
                    type:NodeType.JMP,
                    number:line.number,
                    condition:null,
                    cible: -1
                };
                nodes = _.concat(nodes, jmp_loop, children, jmp_while);
                jmp_loop.cible = nodes.length - 1;
                continue;
            }
            throw Error(`Bloc inconnu [ligne ${line.number}]`);
        }
        return nodes;
    }

    static #parse_line(original_line, line_number) {
        /*parse d'une ligne

        original_line: ligne d'origine
        line_number: numéro de la ligne d'origine
        return: noeud de type Line
        Lève une erreur si ligne pas reconnue
        */
        let clean_line = Parser.#del_comments(original_line);
        if (LineAffectation.test(clean_line)) {
            return new LineAffectation(clean_line, line_number);
        }
        if (LinePrint.test(clean_line)) {
            return new LinePrint(clean_line, line_number);
        }
        if (LineTest.test(clean_line)) {
            return new LineTest(clean_line, line_number);
        }
        throw Error(`[parse:${line_number}] Erreur de syntaxe.`);
    }

    static #del_comments(line) {
        /*
        line: ligne d'origine
        return: ligne sans les éventuels commentaires
        */
        let i = line.indexOf('#');
        if (i<0) {
            return line;
        }
        return line.substr(0,i);
    }

    static #clear_useless(nodes){
        for (let i=0; i<nodes.length; i++) {
            let node = nodes[i];
            node.tag = i;
        }
        let tag_next = 0;
        for (let i=0; i<nodes.length; i++){
            let node = nodes[i];
            if (node.type != NodeType.DUMMY){
                tag_next = node.tag;
                continue;
            }
            let tag = node.tag;
            _.map(nodes, function(n){if (n.cible == tag) {n.cible = tag_next;}});
            _.remove(nodes, function(n){return (n.type == NodeType.DUMMY)});
        }
        // suppression des goto next
        let i = 1;
        while (i < nodes.length) {
            if (nodes[i].cible != nodes[i-1].tag) {
                i++;
                continue;
            }
            _.map(nodes, function(n){if (n.cible == nodes[i].tag) {n.cible = nodes[i-1].tag;}});
            nodes.splice(i,1);
        }
    }

    static #decompose_jump(nodes){
        let finder = function(n){
            return ((n.type == NodeType.JMP)&&(n.condition!==null)&&(n.condition.type == OpType.LOGIC));
        };
        let i = _.findIndex(nodes, finder);
        while (i > 0){
            let node = nodes[i];
            if (node.condition.symbol == 'not') {
                node.condition = node.condition.child.inverse();
            } else if (node.condition.symbol == 'or') {
                let newnode = {
                    type:NodeType.JMP,
                    number:node.number,
                    condition:node.condition.right,
                    cible:node.cible,
                    tag:_.maxBy(nodes, 'tag').tag+1
                };
                nodes.splice(i, 0, newnode);
                node.condition = node.condition.left;
            } else if (node.condition.symbol == 'and'){
                let tag_next = nodes[i-1].tag;
                let newnode = {
                    type:NodeType.JMP,
                    number:node.number,
                    condition:node.condition.right,
                    cible:node.cible,
                    tag:_.maxBy(nodes, 'tag').tag+1
                }
                nodes.splice(i, 0, newnode);
                node.condition = node.condition.left.inverse();
                node.cible = tag_next;
            } else {
                throw Error(`${node.condition.symbol} pas un opérateur logique reconnu.`);
            }
            i = _.findIndex(nodes, finder);
        }
    }

    static #asm(nodes) {
        /* transforme la suite de noeuds en asm */
        // récupérer la liste de labels utiles
        let labels = {};
        let c = 0;
        for(let i=0; i<nodes.length; i++) {
            if (('cible' in nodes[i]) && !(nodes[i].cible in labels)) {
                labels[nodes[i].cible] = `L${c}`;
                c++;
            }
        }
        let asm = [];
        for (let i=0; i<nodes.length; i++) {
            let node = nodes[i];
            let asm_node = null;            
            if (node.type == NodeType.LAST) {
                asm_node = ["\tHALT"];
            } else if ((node.type == NodeType.JMP) && (node.condition === null)) {
                asm_node = [`\tJMP ${labels[node.cible]}`];
            } else if (node.type == NodeType.JMP) {
                asm_node = node.condition.asm(labels[node.cible]);
            } else if ((node.type == NodeType.AFFECTATION) && (node.variable === null) && (node.expression.isValue())) {
                asm_node = [`\tOUT ${node.expression.toString()}`];
            } else if ((node.type == NodeType.AFFECTATION) && (node.variable === null)) {
                asm_node = node.expression.asm();
                asm_node.push("\tOUT");
            } else if ((node.type == NodeType.AFFECTATION) && (node.expression === null)) {
                asm_node = [`\tINP ${node.variable.toString()}`];
            } else if (node.type == NodeType.AFFECTATION) {
                asm_node = node.expression.asm();
                asm_node.push(`\tSTR ${node.variable.toString()}`);
            }
            if (node.tag in labels) {
                asm_node[0] = labels[node.tag] + asm_node[0];
            }
            asm.push(asm_node);
        }
        return _.flatten(asm).join('\n');
    }
}

export { Parser };