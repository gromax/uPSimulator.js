import _ from 'lodash';


import {Parser} from './compile/parser';
import { AsmLines } from './compile/parseasm';



function submitPython(){
    let source = pythonSource.value;
    addMessage("Compilation -> ASM...");
    try {
        let result = Parser.parse(source);
        asm.value = result;
        addMessage("Succès !", 'validline');
    } catch({type, message}) {
        addMessage(message, 'errorline');
    }
}

function submitAsm(){
    let source = asm.value;
    addMessage("Codage ASM -> Binaire...");
    try {
        let asm = new AsmLines(source);
        let b = asm.binary;
        binary.value = b.join('\n');
        binary.hex = asm.hex.join('');
        addMessage("Succès !", 'validline');
        //engine.load(asm.program);
    } catch({type, message}) {
        addMessage(message, 'errorline');
    }
}

function addMessage(message, c) {
    let p = document.createElement('p');
    p.innerHTML = message;
    if (c) {
        p.classList.add(c);
    }
    p.classList.add('message');
    erreur.appendChild(p);
}

function run(){

    if (binary.hex == '') {
        addMessage("Aucun code à exécuter.", 'errorline');
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
let erreur = document.getElementById('error');
binary.hex = "";

/*let engine = new Engine();*/

pythonButton.addEventListener('click', submitPython);
asmButton.addEventListener('click', submitAsm);
runButton.addEventListener('click', run);