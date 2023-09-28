const NodeType = {
    AFFECTATION : 1,
    JMP         : 2,
    DUMMY       : 0,
    LAST        : 3
}

const OpType = {
    ARITHMETIC  : 1,
    LOGIC       : 2,
    COMPARAISON : 3,
    COMMAND     : 4,
    OTHER       : 0
}



export { NodeType, OpType };