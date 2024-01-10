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

## Langage et processeur

Le langage assembleur et le modèle de processeur sont détaillés dans ce [document](https://wiki.goupill.fr/lib/exe/fetch.php?media=nsi:premiere:architecture:langage_asm.fiche.pdf).

## Démonstration

L'ensemble est utilisable à cette [adresse](htts://goupill.fr/up/index.html).