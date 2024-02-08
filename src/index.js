import _ from 'lodash';


import { Parser } from './compile/parser';
import { AsmLines } from './compile/parseasm';



function submitPython(){
   /* prend le contenu de la boîte Python,
       compile et produit l'asm dans la boîte Asm
       renvoie un message journal
    */
    let source = pythonSource.value;
    addMessage("Compilation &rarr; ASM...", false, 'Python');
    try {
        let result = new Parser(source);
        asm.value = result.asm;
        addMessage("Succès !", 'validline', 'Python');
        return result;
    } catch({type, message}) {
        addMessage(message, 'errorline', 'Python');
        return null;
    }
}

function runPython(){
    /* prend le contenu de la boîte python
       tente la compilation asm,
       puis la traduction en binaire
       et envoie l'exécution
       les logs sont envoyés dans la même boîte
       en cas de succès, envoie la fenêtre de simulation avec la clé contenant le source
    */
    let p = submitPython();
    if (p==null) {
        return null;
    }
    let a = submitAsm('Python');
    if (a==null) {
        return null;
    }
    // succès, le python peut être envoyé
    let source = encodeURIComponent(pythonSource.value);
    //let asmCode = encodeURIComponent(asm.value);
    //let hex = binary.hex;
    //let pNumbers = encodeURIComponent(p.linesNumbers.join('_'));
    //let aNumbers = encodeURIComponent(a.linesNumbers.join('_'));
    window.open(`./up.html?python=${source}`, '_blank').focus();
}

function submitAsm(cibleLog = 'Asm'){
    /* cibleLog: boîte d'erreur dans laquelle on écrit 'Asm' ou 'Python'
       prend le contenu de la boite asm, traduit en binaire
       change le contenu de la boîte binaire
       ajoute un message journal dans la cible
    */
    if (cibleLog != 'Python') {
        cibleLog = 'Asm';
    }
    let source = asm.value;
    addMessage("Codage ASM &rarr; Binaire...", false, cibleLog);
    try {
        let asm = new AsmLines(source);
        let b = asm.binary;
        binary.value = b.join('\n');
        binary.hex = asm.hex.join('');
        addMessage("Succès !", 'validline', cibleLog);
        return asm;
    } catch({type, message}) {
        addMessage(message, 'errorline', cibleLog);
        return null;
    }
}

function getLogBox(name) {
    let box = document.getElementById('error'+name);
    if (!box) {
        let container = document.getElementById('divLog'+name);
        let textarea = document.createElement('div');
        textarea.id = 'error'+name;
        textarea.classList.add("error");
        container.appendChild(textarea);
        box = textarea;
    }
    return box;
}

function addMessage(message, c, cible) {
    let p = document.createElement('p');
    p.innerHTML = message;
    if (c) {
        p.classList.add(c);
    }
    p.classList.add('message');
    let cibleLog = getLogBox(cible);
    cibleLog.appendChild(p);
}

function run(){
    if (binary.hex == '') {
        addMessage("Aucun code à exécuter.", 'errorline', 'Binary');
    } else {
        window.open(`./up.html?hex=${binary.hex}`, '_blank').focus();
        //document.location.href=`./up.html?hex=${binary.hex}`; 
    }
}

let pythonButton = document.getElementById('validpython');
let runPythonButton = document.getElementById('runpython');
let asmButton = document.getElementById('validasm');
let runButton = document.getElementById('runButton');
let pythonSource = document.getElementById('python');
let asm = document.getElementById('asm');
let binary = document.getElementById('binary');
let erreurPython = document.getElementById('errorPython');
let erreurAsm = document.getElementById('errorAsm');
let erreurBinary = document.getElementById('errorBinary');
binary.hex = "";

/*let engine = new Engine();*/

pythonButton.addEventListener('click', submitPython);
runPythonButton.addEventListener('click', runPython);
asmButton.addEventListener('click', submitAsm);
runButton.addEventListener('click', run);