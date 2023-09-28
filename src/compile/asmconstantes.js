const AsmArgs = { // types d'argument
    NO: 0,
    K : 1,
    A : 2,
    P : 3,
    D : 4
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

export { AsmArgs, AsmWords, wordToStr };