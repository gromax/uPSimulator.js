/* parse d'une expression logique, arithmétique */

import { BinaryOperatorToken, UnaryOperatorToken, ParenthesisToken, VariableToken, NumberToken } from './tokens';

class ExpressionParser {
    static #test_brackets(expression) {
        let n = 0
        for (let i = 0; i < expression.length; i++) {
            let c = expression.charAt(i);
            if (c == '(') {
                n += 1;
            } else if (c == ')') {
                n -= 1;
            }
            if (n < 0) {
                return false;
            }
        }
        return (n == 0);
    }

    static #is_legal(precedent, suivant) {
        if (precedent === null) {
            if (suivant === null) {
                return true;
            } else if (suivant instanceof BinaryOperatorToken) {
                return false;
            } else if (suivant instanceof UnaryOperatorToken) {
                return true;
            } else if (suivant.isValue()){
                return true;
            } else if (suivant instanceof ParenthesisToken) {
                return suivant.opening;
            }
        } else if (precedent.isOperator()) {
            if (suivant === null) {
                return false;
            } else if (suivant instanceof BinaryOperatorToken) {
                return false;
            } else if (suivant instanceof UnaryOperatorToken) {
                return true;
            } else if (suivant.isValue()) {
                return true;
            } else if (suivant instanceof ParenthesisToken) {
                return suivant.opening;
            }
        } else if (precedent.isValue()) {
            if (suivant === null) {
                return true;
            } else if (suivant instanceof BinaryOperatorToken) {
                return true;
            } else if (suivant instanceof UnaryOperatorToken) {
                return false;
            } else if (suivant.isValue()) {
                return false;
            } else if (suivant instanceof ParenthesisToken) {
                return !suivant.opening;
            } else {
                return false;
            }
        } else if (precedent instanceof ParenthesisToken) {
            if (suivant === null) {
                return !precedent.opening;
            } else if (suivant instanceof BinaryOperatorToken) {
                return !precedent.opening;
            } else if (suivant instanceof UnaryOperatorToken) {
                return precedent.opening;
            } else if (suivant.isValue()) {
                return precedent.opening;
            } else if (suivant instanceof ParenthesisToken) {
                // seul )( est illégal
                return precedent.opening || !suivant.opening;
            }
        }
        return false;
    }

    static rpn(tokens) {
        /* Construit l'expression dans une notation polonaise inversée
        tokens: liste brute des tokens
        return: liste des tokens en notation représentant l'expression
                en notation polonaise inversée
        */
        let stack = [];
        let operators = [];
        for (let i = 0; i < tokens.length; i++) {
            let token = tokens[i];
            if (token.isValue()) {
                stack.push(token);
                continue;
            }
            if ((token instanceof ParenthesisToken) && !token.opening) {
                let opening_found = false;
                while ((operators.length > 0) && !opening_found) {
                    let unstacked = operators.pop();
                    if (unstacked instanceof ParenthesisToken) {
                        // forcément une parenthèse ouvrante
                        opening_found = true;
                    } else {
                        stack.push(unstacked);
                    }
                }
                continue;
            }
            if (token instanceof ParenthesisToken) {
                // donc une parenthèse ouvrante
                operators.push(token);
                continue;
            }
            if (token.isOperator()) {
                // on dépile la pile d'attente si elle contient
                // des opérateurs de priorité plus haute
                while (
                    (operators.length > 0)
                    && operators[operators.length-1].isOperator()
                    && operators[operators.length-1].priority >= token.priority
                ){
                    stack.push(operators.pop());
                }
                operators.push(token);
            }
        }
        // arrivé à la fin des tokens, on vide la pile d'attente
        while (operators.length > 0) {
            let token = operators.pop();
            if (token.isOperator()) {
                stack.push(token);
            }
        }
        return stack;
    }

    static tree(rpn) {
        /*Construit l'arbre représentant l'expression
        rpn: liste des tokens dans la version polonaise inversée
        return: noeud racine de l'arbre représentant l'expression.
        */
        let operands = [];
        let names = [];
        for (let i = 0; i < rpn.length; i++) {
            let token = rpn[i];
            if (token instanceof VariableToken) {
                let n = token.name;
                if (!names.includes(n)) {
                    names.push(n);
                }
                operands.push(token);
            } else if (token instanceof NumberToken) {
                operands.push(token);
            } else if (token instanceof UnaryOperatorToken) {
                if (operands.length == 0) {
                    throw Error(
                        `Par assez d'opérande pour ${token.symbol}.`
                    );
                }
                let operand = operands.pop();
                operands.push(token.setChild(operand));
            } else if (token instanceof BinaryOperatorToken) {
                if (operands.length <=1) {
                    throw Error(
                        `Par assez d'opérande pour ${token.symbol}.`
                    );
                }
                let operand2 = operands.pop();
                let operand1 = operands.pop();
                operands.push(token.setChilds(operand1, operand2));
            }
        }
        // à la fin, normalement, il n'y a qu'une opérande
        if (operands.length != 1) {
            throw Error(
                `Trop d'opérandes dans l'expression.`
            );
        }
        return operands.pop();
    }

    static legals(tokens) {
        /* Teste si la liste de tokens un enchaînement de paire autorisées
        tokens: liste brute des tokens
        return: Vrai si l'enchaînement de token est autorisé
        */
        if (tokens.length == 0) {
            return true;
        }
        // Le premier Token est il valable en tant que premier token ?
        if (!ExpressionParser.#is_legal(null, tokens[0])) {
            return false;
        }
        for (let i = 0; i < tokens.length-1; i++) {
            if (!ExpressionParser.#is_legal(tokens[i], tokens[i+1])) {
                return false;
            }
        }
        // Le dernier Token est il valable en tant que dernier token ?
        if (!ExpressionParser.#is_legal(tokens[tokens.length-1], null)) {
            return false;
        }
        return true;
    }

    static is_variable_name(expression) {
        /* Teste si une expression est un nom de variable possible.
        Exclut les mots-clefs du langage
        expression: expression à tester
        return: vrai si le nom est valable
        */
        return VariableToken.test(expression);
    }

    static is_expression(expression) {
        /* Teste si une chaîne est une expression possible.
        expression: expression à tester
        return: vrai si l'expression est valable
        */
        let regex = new RegExp("^(\\s*("+[
            BinaryOperatorToken.regex,
            UnaryOperatorToken.regex,
            ParenthesisToken.regex,
            VariableToken.regex,
            NumberToken.regex
        ].join('|') +"))+\\s*$", "gi");
        return regex.test(expression);
    }

    static tokenize(expression) {
        /* Transforme une expression en une liste de tokens
        représentant chacun un item de l'expression.
        expression: expression à tester
        return: La liste des tokens tels que donnés dans l'expression
        note: Les symboles + et - sont ambigus car ils peuvent être compris comme des
              symboles unaires ou binaires.
              On réalise un traitement pour lever l'ambiguité.
              Deux // successifs sont compris comme une division de toute façon entière
        */
        let regex = new RegExp([
            BinaryOperatorToken.regex,
            UnaryOperatorToken.regex,
            ParenthesisToken.regex,
            VariableToken.regex,
            NumberToken.regex
        ].join('|'), "gi");
        let matchs = expression.match(regex);
        if (matchs === null) {
            return [];
        }
        let tokens = [];
        for (let i=0; i<matchs.length; i++){
            let item = matchs[i];
            if (BinaryOperatorToken.test(item)) {
                let token = new BinaryOperatorToken(item);
                tokens.push(token);
            } else if (UnaryOperatorToken.test(item)) {
                let token = new UnaryOperatorToken(item);
                tokens.push(token);
            } else if (ParenthesisToken.test(item)) {
                let token = new ParenthesisToken(item);
                tokens.push(token);
            } else if (VariableToken.test(item)) {
                let token = new VariableToken(item);
                tokens.push(token);
            } else if (NumberToken.test(item)) {
                let token = new NumberToken(item);
                tokens.push(token);
            } else {
                throw Error(`Match ${item} ne correspond à aucun token.`);
            }
        }
        ExpressionParser.#consolid_add_sub(tokens);
        let tokens_correct_div = ExpressionParser.#consolid_div(tokens);
        return tokens_correct_div;
    }

    static #consolid_div(tokens) {
        /* Cherche une succession de deux /
           Dans ce cas les remplace par // dans une nouvelle liste
           renvoie la nouvelle liste de tokens
        */
        let i = 0;
        let new_tokens = [];
        let last_is_div = false;
        for (let i=0; i<tokens.length; i++){
            if (tokens[i].symbol != '/')  {
                last_is_div = false;
                new_tokens.push(tokens[i]);
                continue;
            }
            if (last_is_div) {
                new_tokens[new_tokens.length - 1] = new BinaryOperatorToken("//");
                last_is_div = false;
                continue;
            }
            last_is_div = true;
            new_tokens.push(tokens[i]);
        }
        return new_tokens;
    }

    static #consolid_add_sub(tokens) {
        /* Cherche les + et les - pour lever l'ambiguité sur leur arité :
        un - ou un + peut être unaire ou binaire.

        - À la détection, tous les - et + sont compris comme binaires par défaut,
        - Un + compris comme unaire peut être supprimé,
        - Un - compris comme unaire doit recevoir un token unaire en remplacement
          de son token binaire

        Dans ces l'opérateur est modifié :
        - le token suit '('
        - le token est en début d'expression
        - le token suit un opérateur

        tokens: liste brute des tokens représentant l'expression
        */
        let i = 0;
        while (i < tokens.length) {
            let token = tokens[i]
            let prec = (i <= 0)? null : tokens[i-1];
            if ((token instanceof BinaryOperatorToken)
                && ((token.symbol == '+') || (token.symbol == '-'))
                && !ExpressionParser.#is_legal(prec, token)) {
                // Ce + ou - doit être rectifié car il ne devrait pas se trouver
                // à la suite de ce qui précède
                if (token.symbol == '+') {
                    // Dans le cas d'un +, il suffit de le supprimer
                    delete tokens[i];
                } else {
                    // l'opérateur est - et c'est un cas d'opération unaire
                    // on l'interprète comme neg
                    tokens[i] = new UnaryOperatorToken('neg');
                }
            } else {
                i++;
            }
        }
    }

    static build(expression) {
        /* À partir d'une expression sous forme d'une chaîne de texte,
        produit l'arbre représentant cette expression et
        retourne la racine de cet arbre.

        expression: expression à analyser
        return: racine de l'arbre
        raises: ExpressionError si l'expression ne match pas l'expression régulière
                ou si les parenthèses ne sont pas convenablement équilibrées,
                ou si l'expression contient un enchaînement non valable, comme +).
        */
        let expr = expression.trim();
        if (!ExpressionParser.is_expression(expr)) {
            throw Error(
                `${expression} : Expression incorrecte.`
            );
        }
        if (!ExpressionParser.#test_brackets(expr)) {
            throw Error(
                `${expression} : Les parenthèses ne sont pas équilibrées.`
            );
        }

        let tokens = ExpressionParser.tokenize(expr);
        if (!ExpressionParser.legals(tokens)) {
            throw Error(
                `${expression} : Erreur. Vérifiez.`
            );
        }
        let rpn = ExpressionParser.rpn(tokens);
        let root = ExpressionParser.tree(rpn);
        
        if (root === null) {
            throw Error(
                `${expression} : Erreur. Vérifiez.`
            );
        }
        return root;
    }
}

export { ExpressionParser };