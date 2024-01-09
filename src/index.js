import _ from 'lodash';


import { Parser } from './compile/parser';
import { AsmLines } from './compile/parseasm';



function submitPython(){
    let source = pythonSource.value;
    addMessage("Compilation &rarr; ASM...", false, 'Python');
    try {
        let result = Parser.parse(source);
        asm.value = result;
        addMessage("Succès !", 'validline', 'Python');
    } catch({type, message}) {
        addMessage(message, 'errorline', 'Python');
    }
}

function submitAsm(){
    let source = asm.value;
    addMessage("Codage ASM &rarr; Binaire...", false, 'Asm');
    try {
        let asm = new AsmLines(source);
        let b = asm.binary;
        binary.value = b.join('\n');
        binary.hex = asm.hex.join('');
        addMessage("Succès !", 'validline', 'Asm');
        //engine.load(asm.program);
    } catch({type, message}) {
        addMessage(message, 'errorline', 'Asm');
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
        document.location.href=`./up.html?hex=${binary.hex}`; 
    }
}

let pythonButton = document.getElementById('validpython');
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
asmButton.addEventListener('click', submitAsm);
runButton.addEventListener('click', run);