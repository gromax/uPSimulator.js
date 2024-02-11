const AsmArgs = { // types d'argument
    NO: 0,        // Pas d'argument ou W
    K : 1,        // Littéral
    A : 2,        // Adresse
    P : 3,        // Pile
    D : 4         // Data
}

const AsmWords = { // opcode sur 6 bits
    ADD   : { code:32, NO:true, K:true,  A:true,  P:true , J:false },
    SUB   : { code:33, NO:true, K:true,  A:true,  P:true , J:false },
    MUL   : { code:34, NO:true, K:true,  A:true,  P:true , J:false },
    MULT  : { code:34, NO:true, K:true,  A:true,  P:true , J:false },
    DIV   : { code:35, NO:true, K:true,  A:true,  P:true , J:false },
    MOD   : { code:36, NO:true, K:true,  A:true,  P:true , J:false },
    OR    : { code:37, NO:true, K:true,  A:true,  P:true , J:false },
    AND   : { code:38, NO:true, K:true,  A:true,  P:true , J:false },
    XOR   : { code:39, NO:true, K:true,  A:true,  P:true , J:false },
    CMP   : { code:40, NO:true, K:true,  A:true,  P:true , J:false },
    MOVE  : { code:41, NO:true, K:true,  A:true,  P:true , J:false },
    MOV   : { code:41, NO:true, K:true,  A:true,  P:true , J:false },
    INV   : { code:42, NO:true,  K:true,  A:true,  P:true , J:false },
    NEG   : { code:43, NO:true,  K:true,  A:true,  P:true , J:false },
    OUT   : { code:44, NO:true,  K:true,  A:true,  P:true , J:false },
    INP   : { code:45, NO:true,  K:false, A:true,  P:false, J:false },
    STR   : { code:46, NO:false, K:false, A:true,  P:false, J:false },
    POP   : { code:47, NO:true,  K:false, A:false, P:false, J:false },
    PUSH  : { code:48, NO:true,  K:false, A:false, P:false, J:false }, 
    GOTO  : { code:16, NO:false, K:false, A:true,  P:false, J:true  },
    B     : { code:16, NO:false, K:false, A:true,  P:false, J:true  },
    JMP   : { code:16, NO:false, K:false, A:true,  P:false, J:true  },
    BEQ   : { code:17, NO:false, K:false, A:true,  P:false, J:true  },
    BNE   : { code:18, NO:false, K:false, A:true,  P:false, J:true  },
    BGT   : { code:19, NO:false, K:false, A:true,  P:false, J:true  },
    BGE   : { code:20, NO:false, K:false, A:true,  P:false, J:true  },
    BLT   : { code:21, NO:false, K:false, A:true,  P:false, J:true  },
    BLE   : { code:22, NO:false, K:false, A:true,  P:false, J:true  },
    HALT  : { code:0,  NO:true , K:false, A:false, P:false, J:false },
    NOP   : { code:1,  NO:true , K:false, A:false, P:false, J:false },
    DAT   : { code:-1, NO:false, K:false, A:false, P:false, J:false },
    DATA  : { code:-1, NO:false, K:false, A:false, P:false, J:false }
}

function wordToStr(word) {
    for (let key in AsmWords) {
        if (AsmWords[key].code == word) {
            return key;
        }
    }
    return 'INCONNU';
}

function argtypeToStr(code){
    switch(code) {
        case AsmArgs.A: return '@';
        case AsmArgs.K: return 'K';
        case AsmArgs.P: return 'P';
        case AsmArgs.NO: return 'N';
        default: return '';
    }
}

function isJump(code){
    return ((code == AsmWords.JMP.code) ||
            (code == AsmWords.BLE.code) ||
            (code == AsmWords.BLT.code) ||
            (code == AsmWords.BGE.code) ||
            (code == AsmWords.BGT.code) ||
            (code == AsmWords.BEQ.code) ||
            (code == AsmWords.BNE.code));
}

function jumpCond(code){
    switch(code) {
        case AsmWords.BLE.code: return 'Z ou non P';
        case AsmWords.BLT.code: return 'non P' ;
        case AsmWords.BGE.code: return 'P' ;
        case AsmWords.BGT.code: return 'P et non Z';
        case AsmWords.BEQ.code: return 'Z';
        case AsmWords.BNE.code: return 'non Z';
        default: return null;
    }
}

function actsOnOperand(code){
    return ((code == AsmWords.OUT.code) ||
            (code == AsmWords.ADD.code) ||
            (code == AsmWords.SUB.code) ||
            (code == AsmWords.MUL.code) ||
            (code == AsmWords.DIV.code) ||
            (code == AsmWords.MOD.code) ||
            (code == AsmWords.OR.code) ||
            (code == AsmWords.AND.code) ||
            (code == AsmWords.XOR.code) ||
            (code == AsmWords.CMP.code) ||
            (code == AsmWords.MOV.code) ||
            (code == AsmWords.INV.code) ||
            (code == AsmWords.NEG.code) ||
            (code == AsmWords.STR.code));
}


export { AsmArgs, AsmWords, wordToStr, argtypeToStr, isJump, jumpCond, actsOnOperand};