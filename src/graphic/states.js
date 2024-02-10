import {
    FONT_FAMILY
} from "./styles";

class Axes {
    static E='E';
    static W='W';
    static N='N';
    static S='S';
}

class StateNode {
    static DIAMETER = 50;
    static BACKCOLOR = {off:'#ee0', on:'#ff0'};
    static STROKECOLOR = {off:'#000', on:'#e00'};
    static CONDCOLOR = {off:'#000', on:'#800'};
    static PATHON = {width:4, color:'#a00'};
    static PATHOFF = {width:2, color:'#000'};
    static NUMBERFONTSIZE = 16;
    static ORDERFONTSIZE = 12;

    #group;
    #circle;
    #caption;
    #orders = null;
    #outPaths;
    #condIn = null;
    constructor(parent, n, orders, condIn='') {
        this.#outPaths = {};
        this.#group = parent.nested();
        this.#circle = this.#group.circle(StateNode.DIAMETER);
        this.#circle.move(2,2);
        this.#circle.stroke({color:StateNode.STROKECOLOR.off, width:3}).fill(StateNode.BACKCOLOR.off);
        this.#caption = this.#group.text(n);
        this.#caption.font({fill:StateNode.STROKECOLOR.off, size:StateNode.NUMBERFONTSIZE, family:FONT_FAMILY});
        this.#caption.cx(this.#circle.cx()).cy(this.#circle.cy());
        this.#caption.css({"font-weight":"bold"});
        if (orders.length > 0) {
            this.#orders = this.#group.text(function(add) {
                for (let order of orders) {
                    add.tspan(order).newLine();
                }
            });
            this.#orders.font({fill:StateNode.STROKECOLOR.off, size:StateNode.ORDERFONTSIZE, family:FONT_FAMILY});
            this.#orders.cy(this.#circle.cy());
            this.#orders.x(StateNode.DIAMETER + 5 + this.#circle.x());
            if (this.#orders.y() < 0) {
                let dy = -this.#orders.y();
                this.#circle.y(this.#circle.y()+dy);
                this.#caption.y(this.#caption.y()+dy);
                this.#orders.y(0);
            }
        }
        if (condIn != '') {
            let lines = condIn.split('\n');
            this.#condIn = this.#group.text(function(add) {
                for (let line of lines) {
                    add.tspan(line).newLine();
                }
            });
            this.#condIn.font({fill:StateNode.CONDCOLOR.off, size:StateNode.ORDERFONTSIZE, family:FONT_FAMILY});
            let h = this.#condIn.node.getBBox().height;
            this.#condIn.x(this.#circle.cx() + 5).y(0);
            this.#circle.y(this.#circle.y() + h + 2);
            this.#caption.cy(this.#circle.cy());
            if (this.#orders) {
                this.#orders.cy(this.#circle.cy());
            }
        }
    }

    onCond(){
        if (this.#condIn) {
            this.#condIn.font({fill:StateNode.CONDCOLOR.on});
        }
    }

    offCond(){
        if (this.#condIn) {
            this.#condIn.font({fill:StateNode.CONDCOLOR.off});
        }
    }

    addPath(stateNumber, path) {
        this.#outPaths[stateNumber] = path;
    }

    offPaths(){
        for (let i in this.#outPaths){
            this.#outPaths[i].stroke(StateNode.PATHOFF);
        }
    }

    onPath(n){
        if (n in this.#outPaths){
            this.#outPaths[n].stroke(StateNode.PATHON).front();
        }
    }

    set_on(){
        this.#caption.font({fill:StateNode.STROKECOLOR.on});
        if (this.#orders != null) {
            this.#orders.font({fill:StateNode.STROKECOLOR.on});
        }
        this.#circle.stroke({color:StateNode.STROKECOLOR.on}).fill(StateNode.BACKCOLOR.on);
    }

    set_off(){
        this.#caption.font({fill:StateNode.STROKECOLOR.off});
        if (this.#orders != null) {
            this.#orders.font({fill:StateNode.STROKECOLOR.off});
        }
        this.#circle.stroke({color:StateNode.STROKECOLOR.off}).fill(StateNode.BACKCOLOR.off);
        this.offPaths();
    }

    move(x, y) {
        this.#group.move(x, y);
        return this;
    }

    top(y){
        if (typeof y == "undefined") {
            return this.#group.y() + this.#circle.y();
        }
        this.#group.y(y - this.#circle.y());
        return this;
    }

    bottom(y){
        if (typeof y == "undefined") {
            return this.#group.y() + this.#circle.y() + StateNode.DIAMETER;
        }
        this.#group.y(y - this.#circle.y() - StateNode.DIAMETER);
        return this;
    }

    left(x){
        if (typeof x == "undefined") {
            return this.#group.x() + this.#circle.x();
        }
        this.#group.x(x - this.#circle.x());
        return this;
    }

    right(x){
        let r = this.#orders == null? this.#circle.x() + StateNode.DIAMETER:this.#orders.x() + this.#orders.node.getBBox().width;
        if (typeof x == "undefined") {
            return this.#group.x() + r;
        }
        this.#group.x(x - r);
        return this;
    }

    xAnchor(c) {
        /* c: un point cardinal de Axes */
        switch(c) {
            case Axes.N: return this.#group.x() + this.#circle.cx();
            case Axes.S: return this.#group.x() + this.#circle.cx();
            case Axes.E: return this.#group.x() + this.#circle.x();
            default:     return this.#group.x() + this.#circle.x() + StateNode.DIAMETER;
        }
    }

    yAnchor(c) {
        /* c: un point cardinal de Axes */
        switch(c) {
            case Axes.N: return this.#group.y() + this.#circle.y();
            case Axes.S: return this.#group.y() + this.#circle.y() + StateNode.DIAMETER;
            case Axes.E: return this.#group.y() + this.#circle.cy();
            default:     return this.#group.y() + this.#circle.cy();
        }
    }


}

class Machine {
    static STROKE = {color:'#000', width:'1'};
    static VMARGIN = 30;
    #states;
    #group;
    #source = -1;
    #cible = -1;
    constructor(parent) {
        this.#group = parent.group();
        this.#states = [];
        this.#states.push(new StateNode(this.#group, 0,  ["PL → @", "RD MEM", "WR RI", "PL++"] , ""                            )); // READ_RI
        this.#states.push(new StateNode(this.#group, 1,  []                                    , ""                            )); // DECODE_RI
        this.#states.push(new StateNode(this.#group, 2,  []                                    , "HALT"                        )); // HALT
        this.#states.push(new StateNode(this.#group, 3,  ["RD RI.low", "WR OUT"]               , "OUT &\nlittéral"             )); // OUT_K
        this.#states.push(new StateNode(this.#group, 4,  ["RD RI.low", "WR UAL"]               , "ual com &\nlittéral"         )); // LOAD_K
        this.#states.push(new StateNode(this.#group, 5,  ["PL → @", "RD MEM", "WR OUT", "PL++"], "OUT &\ngrand littéral"       )); // OUT_BIG_K
        this.#states.push(new StateNode(this.#group, 6,  ["PL → @", "RD MEM", "WR UAL", "PL++"], "ual com &\ngrand littéral"   )); // LOAD_BIG_K
        this.#states.push(new StateNode(this.#group, 7,  ["RI.low → @", "RD MEM", "WR OUT"]    , "OUT &\n@ arg"                )); // OUT_A
        this.#states.push(new StateNode(this.#group, 8,  ["RI.low → @", "RD MEM", "WR OUT"]    , "ual com &\n@a arg"           )); // LOAD_A
        this.#states.push(new StateNode(this.#group, 9,  ["RD UAL", "WR OUT"]                  , "OUT &\n no arg"              )); // OUT_W
        this.#states.push(new StateNode(this.#group, 10, ["RD UAL", "WR UAL"]                  , "ual com &\n no arg"          )); // LOAD_W
        this.#states.push(new StateNode(this.#group, 11, ["SP → @", "RD MEM", "WR OUT", "SP++"], "OUT &\np arg"                )); // OUT_POP
        this.#states.push(new StateNode(this.#group, 12, ["SP → @", "RD MEM", "WR UAL", "SP++"], "POP ou\nual com &\np arg"    )); // LOAD_POP
        this.#states.push(new StateNode(this.#group, 13, []                                    , "INP"                         )); // BUFF_IN
        this.#states.push(new StateNode(this.#group, 14, ["RD IN", "RI.low → @", "WR MEM"]     , "@ arg"                       )); // IN_A
        this.#states.push(new StateNode(this.#group, 15, ["RD IN", "WR UAL"]                   , "no arg"                      )); // IN_W
        this.#states.push(new StateNode(this.#group, 16, ["UAL:selon opcode"]                  , ""                            )); // EXEC_UAL
        this.#states.push(new StateNode(this.#group, 17, ["SP--"]                              , "PUSH"                        )); // DEC_SP
        this.#states.push(new StateNode(this.#group, 18, ["RD UAL", "SP → @", "WR MEM" ]       , ""                            )); // PUSH
        this.#states.push(new StateNode(this.#group, 19, ["RD UAL", "RI.low → @", "WR MEM"]    , "STR"                         )); // STR
        this.#states.push(new StateNode(this.#group, 20, ["RD RI.low", "WR PL"]                , "JMP &\ncondition\nsatisfaite")); // JMP
        this.#states.push(new StateNode(this.#group, 21, ["RD RI.low", "WR PL"]                , "NOP"                         )); // NOP
        this.#states.push(new StateNode(this.#group, 22, []                                    , ""                            )); // FIN_INSTR
        this.#states[0].move(100,21);
        this.#states[1].left(this.#states[0].left()).top(this.#states[0].bottom() + Machine.VMARGIN);
        this.#states[2].right(this.#states[1].left() -20).top(this.#states[1].bottom() + 2*Machine.VMARGIN);

        // Les LOAD
        this.#states[4].left(this.#states[1].left()+30).top(this.#states[1].bottom() + 3*Machine.VMARGIN);
        this.#states[6].left(this.#states[4].right() + 20).top(this.#states[4].top());
        this.#states[8].left(this.#states[6].right() + 20).top(this.#states[4].top());
        this.#states[10].left(this.#states[8].right() + 20).top(this.#states[4].top());
        this.#states[12].left(this.#states[10].right() + 20).top(this.#states[4].top());

        // BUFF
        this.#states[13].left(this.#states[12].right() + 20).top(this.#states[1].bottom() + Machine.VMARGIN);
        this.#states[15].left(this.#states[13].left()).top(this.#states[13].bottom() + 2*Machine.VMARGIN);
        this.#states[14].left(this.#states[15].right() + 20).top(this.#states[15].top());

        // UAL
        this.#states[16].left(this.#states[15].left()).top(this.#states[15].bottom() + Machine.VMARGIN);

        // OUT
        this.#states[3].left(this.#states[1].left()+30).top(this.#states[16].bottom());
        this.#states[5].left(this.#states[3].right() + 20).top(this.#states[3].top());
        this.#states[7].left(this.#states[5].right() + 20).top(this.#states[3].top());
        this.#states[9].left(this.#states[7].right() + 20).top(this.#states[3].top());
        this.#states[11].left(this.#states[9].right() + 20).top(this.#states[3].top());
        
        // Autres
        this.#states[17].left(this.#states[1].left()).top(this.#states[3].bottom() + 3*Machine.VMARGIN);
        this.#states[19].left(this.#states[17].right() + 20).top(this.#states[17].top());
        this.#states[21].left(this.#states[19].right() + 20).top(this.#states[17].top());
        this.#states[20].left(this.#states[21].right() + 20).top(this.#states[17].top());
        this.#states[18].left(this.#states[17].left()).top(this.#states[17].bottom() + Machine.VMARGIN);

        // Fin
        this.#states[22].left(this.#states[14].left()).top(this.#states[18].bottom() + Machine.VMARGIN);

        // paths
        let nodes = [4, 6, 8, 10, 12, 13];
        for (let i=0; i<nodes.length;i++) {
            let d = this.#states[nodes[i]];
            let s = this.#states[1];
            let p = this.#group.path(`M${s.xAnchor(Axes.S)} ${s.yAnchor(Axes.S)} v10 H${d.xAnchor(Axes.N)} V${d.yAnchor(Axes.N)}`).fill('none').stroke(Machine.STROKE);
            s.addPath(nodes[i], p);
        }
        nodes = [4, 6, 8, 10, 12, 15]
        for (let i=0; i<nodes.length;i++) {
            let d = this.#states[16];
            let s = this.#states[nodes[i]];
            let p = this.#group.path(`M${s.xAnchor(Axes.S)} ${s.yAnchor(Axes.S)} V${d.yAnchor(Axes.N)-10} H${d.xAnchor(Axes.N)} V${d.yAnchor(Axes.N)}`).fill('none').stroke(Machine.STROKE);
            s.addPath(16, p);
        }
        nodes = [3, 5, 7, 9, 11];
        for (let i=0; i<nodes.length;i++) {
            let d = this.#states[nodes[i]];
            let s = this.#states[1];
            let p = this.#group.path(`M${s.xAnchor(Axes.S)} ${s.yAnchor(Axes.S)} V${d.yAnchor(Axes.N)-40} H${d.xAnchor(Axes.N)} V${d.yAnchor(Axes.N)}`).fill('none').stroke(Machine.STROKE);
            s.addPath(nodes[i], p);
        }
        nodes = [17, 19, 21, 20];
        for (let i=0; i<nodes.length;i++) {
            let d = this.#states[nodes[i]];
            let s = this.#states[1];
            let p = this.#group.path(`M${s.xAnchor(Axes.S)} ${s.yAnchor(Axes.S)} V${d.yAnchor(Axes.N)-30} H${d.xAnchor(Axes.N)} V${d.yAnchor(Axes.N)}`).fill('none').stroke(Machine.STROKE);
            s.addPath(nodes[i], p);
        }

        nodes = [15, 14];
        for (let i=0; i<nodes.length;i++) {
            let d = this.#states[nodes[i]];
            let s = this.#states[13];
            let p = this.#group.path(`M${s.xAnchor(Axes.S)} ${s.yAnchor(Axes.S)} V${s.yAnchor(Axes.S)+15} H${d.xAnchor(Axes.N)} V${d.yAnchor(Axes.N)}`).fill('none').stroke(Machine.STROKE);
            s.addPath(nodes[i], p);
        }

        nodes = [18, 19, 21, 20, 3, 5, 7, 9, 11, 16, 14];
        for (let i=0; i<nodes.length;i++) {
            let d = this.#states[22];
            let s = this.#states[nodes[i]];
            let p = this.#group.path(`M${s.xAnchor(Axes.S)} ${s.yAnchor(Axes.S)} v25 H${d.xAnchor(Axes.N)} V${d.yAnchor(Axes.N)}`).fill('none').stroke(Machine.STROKE);
            s.addPath(22, p);
        }
        {
            let d = this.#states[18];
            let s = this.#states[17];
            let p = this.#group.path(`M${s.xAnchor(Axes.S)} ${s.yAnchor(Axes.S)} H${d.xAnchor(Axes.N)} V${d.yAnchor(Axes.N)}`).fill('none').stroke(Machine.STROKE);
            s.addPath(18, p);
        }
        {
            let d = this.#states[1];
            let s = this.#states[0];
            let p = this.#group.path(`M${s.xAnchor(Axes.S)} ${s.yAnchor(Axes.S)} H${d.xAnchor(Axes.N)} V${d.yAnchor(Axes.N)}`).fill('none').stroke(Machine.STROKE);
            s.addPath(1, p);
        }
        {
            let d = this.#states[0];
            let s = this.#states[22];
            let p = this.#group.path(`M${s.xAnchor(Axes.S)} ${s.yAnchor(Axes.S)} v20 H10 V${d.yAnchor(Axes.N) - 20} H${d.xAnchor(Axes.N)} V${d.yAnchor(Axes.N)}`).fill('none').stroke(Machine.STROKE);
            s.addPath(0, p);
        }
        {
            let d = this.#states[2];
            let s = this.#states[1];
            let p = this.#group.path(`M${s.xAnchor(Axes.S)} ${s.yAnchor(Axes.S)} v10 H${d.xAnchor(Axes.N)} V${d.yAnchor(Axes.N)}`).fill('none').stroke(Machine.STROKE);
            s.addPath(2, p);
        }
        {
            let d = this.#states[2];
            let s = this.#states[2];
            let p = this.#group.path(`M${s.xAnchor(Axes.S)+3} ${s.yAnchor(Axes.S)} v20 H${d.xAnchor(Axes.S)-3} V${d.yAnchor(Axes.S)}`).fill('none').stroke(Machine.STROKE);
            s.addPath(2, p);
        }
    }

    scale(s){
        this.#group.transform({origin: 'top left', scale:s});
        return this;
    }

    select(source, cible) {
        if (this.#source >= 0) {
            this.#states[this.#source].set_off();
        }
        if (this.#cible >= 0) {
            this.#states[this.#cible].offCond();
        }
        this.#source = source;
        this.#cible = cible;
        if (source >= 0) {
            this.#states[source].set_on()
            this.#states[source].onPath(cible);
        }
        if (cible >=0) {
            this.#states[cible].onCond();
        }
    }
}


export { Machine };

