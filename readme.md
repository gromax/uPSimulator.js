# uP.js

## Mise en route

* Commande pour mettre les dépendance npm : `npm install`
* Commande pour compiler le tout : `npm run build`

## Qu'est-ce ?

Il s'agit d'un simulateur de microprocesseur à visée pédagogique, pour apprendre le fonctionnement des processeur et de l'**assembleur**.

### Le pseudocode

On écrit un langage en pseudocode avec une syntaxe à la Python, en particulier le système d'indentation.

On a le droit à **if**, **else**, **elif** et **while**. On calcule en nombres entiers et on a le droit aux expressions booléennes comme en Python.

### La compilation et le langage machine

La page *index.js* prévoit la transformation du pseudocode en un assembleur customisé qui sera détaillé plus loin. On peut ensuite transformé l'assembleur en un binaire adapté. Enfin, le binaire peut-être chargé dans le simulateur pour exécution.

## L'architecture du processeur

Le processeur utilisé est inventé pour les besoins de la simulation. Il reste assez simple pour permettre de comprendre des mécanismes de fonctionnement des processeurs mais ne rentre pas trop dans les détails.

Le processeur dispose d'une mémoire de 256 mots de 16 bits. Une adresse mémoire se limite donc à 8 bits.

L'UAL peut effectuer addition, multiplication, division entière, modulo, soustraction, OR, AND... L'UAL n'a qu'un registre de travail W. Tout calcul implique ce registre de travail. Par exemple, si on écrit `ADD #2` cela signifie que l'on ajoute 2 au contenu du registre W. Enfin, l'UAL dispose deux booléens Z et P indiquant si le résultat est Zéro et/ou Positif.

Le processeur dispose d'un bloc INPUT permettant une intéraction facile avec l'utilisateur, ainsi qu'un bloc de sortie pour affichage des résultats.

Pour les opérations complexes, une pile (*stack*) est maintenue grâce à un  registre STACK.

## Le langage assembleur

### Table des commandes

Dans le tableau ci-dessous, on indique la liste de toutes les commandes disponibles, avec leurs opcodes.

Les commandes peuvent accepter différents types d'arguments. Par exemple, la commande ADD additionne au registre de travail W une certaine quantité, selon le type d'argument :
  * si pas d'argument, ajoute W à W
  * si type K (littéral) ajoute un littéral à W
  * si type @, ajoute à W le contenu stocker à l'adresse en argument
  * si POP, on ajoute à W le contenu ôté de la pile,
  * par contre ADD n'est pas un saut.

|Commande|opcode|No Arg ?|K Arg ?|@ Arg ?|Pop Arg ?|Jump ?|
|--------|------|--------|-------|-------|---------|------|
|ADD|32| Oui | Oui | Oui | Oui | Non|
|SUB | 33 | Oui | Oui | Oui | Oui | Non|
|MUL ou MULT | 34 | Oui | Oui | Oui | Oui | Non|
|DIV | 35 | Oui | Oui | Oui | Oui | Non|
|MOD | 36 | Oui | Oui | Oui | Oui | Non|
|OR | 37 | Oui | Oui | Oui | Oui | Non|
|AND | 38 | Oui | Oui | Oui | Oui | Non|
|XOR | 39 | Oui | Oui | Oui | Oui | Non|
|CMP | 40 | Oui | Oui | Oui | Oui | Non|
|MOVE ou MOV | 41 | Oui | Oui | Oui | Oui | Non|
|INV | 42 | Oui | Oui | Oui | Oui | Non|
|NEG | 43 | Oui | Oui | Oui | Oui | Non|
|OUT | 44 | Oui | Oui | Oui | Oui | Non|
|INP | 45 | Oui | Non | Oui | Non | Non|
|STR | 46 | Non | Non | Oui | Non | Non|
|POP | 47 | Oui | Non | Non | Non | Non|
|PUSH | 48 | Oui | Non | Non | Non | Non|
|GOTO ou B ou JMP | 16 | Non | Non | Oui | Non | Oui|
|BEQ | 17 | Non | Non | Oui | Non | Oui|
|BNE | 18 | Non | Non | Oui | Non | Oui|
|BGT | 19 | Non | Non | Oui | Non | Oui|
|BGE | 20 | Non | Non | Oui | Non | Oui|
|BLT | 21 | Non | Non | Oui | Non | Oui|
|BLE | 22 | Non | Non | Oui | Non | Oui|
|HALT | 0 | Oui | Non | Non | Non | Non|
|NOP | 1 | Oui | Non | Non | Non | Non|

### Assembleur

```assembly
    INP @x
    MOV #2
    STR @d
b   MOV @x
    MOD @d
    CMP #0
BGE fin
    MOV @d
    ADD #1
    STR @d
    JMP b
fin OUT @d
```

Cet exemple de programme demande une valeur en entrée qui sera stockée dans la mémoire `x`. On va chercher un diviseur à partir de 2 et on affichera le diviseur trouvé.

Ce programme occupera les cellules 0 à 11 de la mémoire. Le compilateur placera donc `x` dans la cellule d'adresse 12 et `d` dans la cellule d'adresse 13.

L'étiquette `fin` correspond à la ligne 11, donc `fin` sera remplacé par 11. De même, l'étiquette `b` sera remplacée par 3.

`MOV #2` signifie que l'on charge le littéral 2 dans le registre de travail W. `#` indique un argument de type K, littéral.

`STR @d` stocke W dans la cellule mémoire `d`. `@` signal un argument de type adresse. Ici l'adresse n'est pas explicite, c'est un étiquette qui sera remplacée par 13 à la compilation.

`BGE fin` est un saut conditionnel. `fin` est donc reconnue comme une étiquette désignant une ligne de programme, donc une adresse mémoire.

### Format binaire des commandes

 * Les commandes sont en général sur un mot de 16 bits (un mot en mémoire) mais peuvent exceptionnellement prendre 2 mots de 16 bits.
 * Une commande commence par l'**opcode** sur 6 bits suivi de 2 bits pour le type d'argument :
   * 00 pour pas d'argument,
   * 01 pour un argument de type K, c'est à dire un **littéral**,
   * 10 pour pas d'argument de type A, c'est à dire une adresse — cela vaut pour un saut,
   * 11 pour POP.


> Exemple : ADD #45
>
> ADD : 32 soit 100000 en binaire
>
> l'argument est de type littéral : 01
>
> Il reste 8 bits pour coder 45 : 0010 1101
>
> La commande est donc codée : 100000 01 00101101

### Cas particulier d'une instruction codée sur 2 mots de 16 bits

Autre exemple :  ADD #4000

Cette commande semble légitime puisque les mots mémoires sont de 16 bits et en 16 bits on peut coder 4000.

ADD : 32 soit 100000

type K : 01

4000 s'écrit 1111 1010 0000 en binaire. Il faut 12 bits pour l'écrire. Mais le début de l'instruction (ADD et type K) occupent déjà 8 bits. Il n'y a plus assez de place sur un seul mot. Dans ce genre de cas, exceptionnellement, l'instruction sera codée sur 2 mots de 16 bits.

ADD # : 100000 01 est placé sur le premier mot et on complète avec des 1

4000 est écrit en binaire sur le 2e mot. On aura donc ici :

1000 0001 1111 1111   (représentation de ADD # complétée avec des 1)

0000 1111 1010 0000   (binaire pour 4000)

Le compilateur tient compte de tels instructions pour calculer les adresses correspondant aux étiquettes de saut ou de variables.

### Commandes de type Pop
Une opération complexe comme `(x + 2) * (y + 7)` nécessite des calculs intermédiaires. L'utisation d'une pile simplifie grandement les choses. Dans ce cas on pourra faire :

```assembly
MOV @y
ADD #7
PUSH
MOV @x
ADD #2
MUL POP 
```

* `MOV @y ; ADD #7` réalise le calcul `y + 7`,
* `PUSH` met le résultat de côté, sur la pile,
* `MOV @x ; ADD #2` réalise le calcul `x + 2` (stocké dans W),
* `MUL POP` multiplie le résultats précédent à la dernière valeur mise sur la pile.

Pour ce qui est du codage binaire : `MUL` a l'opcode 34, donc 100010 en binaire ; l'argument est POP donc on poursuit par 11. Il n'y a rien d'autre à préciser. On peut compléter le mot de 16 bits avec ce que l'on veut, par exemple des 0 :

100010 11 00000000

### Signification des commandes

* ADD :  additionne l'argument à W
* SUB : soustrait l'argument à W
* MUL ou MULT: multiplie l'argument à W
* DIV : division entière W / argument dans W
* MOD : modulo  W % arg dans W
* OR : OU bitwise
* AND : AND bitwise
* XOR : OU exclusif bitwise
* CMP : comparaison. Correspond à une soustraction qui ne modifie pas W mais seulement les registres Z et P
* MOVE ou MOV : copie l'argument dans W
* INV : inversion binaire bitwise
* NEG : multiplie par -1
* OUT : envoie vers l'affichage
* INP : lit en entrée
* STR : écrit W dans une cellule mémoire
* POP : extrait le dessus de la pile et le place dans W
* PUSH : place W sur le dessus de la pile
* GOTO ou B ou JMP : saute à l'adresse en argument
* BEQ : saute à l'adresse si **Z**
* BNE : saute à l'adresse si **non Z**
* BGT : saute à l'adresse si **non Z et P**
* BGE : saute à l'adresse si **P**
* BLT : saute à l'adresse si **non P**
* BLE : saute à l'adresse si **Z ou non P**
* HALT : arrête le programme
* NOP : ne fait rien