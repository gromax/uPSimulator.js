import { FONT_FAMILY } from "./styles";

class Button {
    static OPTIONS = {
        'offcolor':{back:'#aaa', stroke:'#000'},
        'oncolor':{back:'#eee', stroke:'#000'},
        'overcolor':{back:'#fad47d', stroke:'#000'},
        'pressedcolor':{back:'#dcfc88', stroke:'#000'},
        'width':50,
        'height':20,
        'size':12,
        'linewidth':2,
        'label': '',
        'callback':null,
        'hint':''
    }
    #group;
    #oncolor;
    #offcolor;
    #pressedcolor;
    #overcolor;
    #back;
    #caption;
    #active = false;
    #over = false;
    #pressed = false;
    constructor(parent, options = {}) {
        this.#group = parent.nested();
        for (let o in options) {
            if (!(o in Button.OPTIONS)) {
                throw Error(`[Button] l'option ${o} n'est pas reconnue.`);
            }
        }
        this.#oncolor = ("oncolor" in options) ? options['oncolor'] : Button.OPTIONS['oncolor'];
        this.#offcolor = ("offcolor" in options) ? options['offcolor'] : Button.OPTIONS['offcolor'];
        this.#pressedcolor = ("pressedcolor" in options) ? options['pressedcolor'] : Button.OPTIONS['pressedcolor'];
        this.#overcolor = ("overcolor" in options) ? options['overcolor'] : Button.OPTIONS['overcolor'];
        let width = ("width" in options) ? options['width'] : Button.OPTIONS['width'];
        let height = ("height" in options) ? options['height'] : Button.OPTIONS['height'];
        let linewidth = ("linewidth" in options) ? options['linewidth'] : Button.OPTIONS['linewidth'];
        let size = ("size" in options) ? options['size'] : Button.OPTIONS['size'];
        let label = ("label" in options) ? options['label'] : Button.OPTIONS['label'];
        let callback = ("callback" in options) ? options['callback'] : Button.OPTIONS['callback'];
        let hint = ("hint" in options) ? options['hint'] : Button.OPTIONS['hint'];

        if (hint != '') {
            let hintNode = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            hintNode.textContent = hint;
            this.#group.node.appendChild(hintNode);
        }

        this.#back = this.#group.rect(width, height);
        this.#back.stroke({color:this.#offcolor.stroke, width:linewidth, linejoin: 'round'});
        this.#back.fill(this.#offcolor.back);

        if (label == '') {
            this.#caption = null;
            return;
        }
        this.#caption = this.#group.text(label);
        this.#caption.font({fill:this.#offcolor.stroke, size:size, family:FONT_FAMILY});
        this.#caption.cx(this.#back.cx()).cy(this.#back.cy());

        this.#group.attr('cursor','pointer');
        this.#group.on('mouseover', (e) => { this.#setOver(); });
        this.#group.on('mouseout', (e) => { this.#setOut(); });
        this.#group.on('mousedown', (e) => { this.#setPressed(); callback(this); });
        this.#group.on('mouseup', (e) => { this.#setUnpressed(); });
    }

    setOn() {
        this.#active = true;
        this.#updateColors();
    }

    setOff(){
        this.#active = false;
        this.#updateColors();        
    }

    #setOver(){
        this.#over = true;
        this.#updateColors();        
    }

    #setOut(){
        this.#over = false;
        this.#pressed = false;
        this.#updateColors();

    }

    #setPressed(){
        this.#pressed = true;
        this.#updateColors();
                
    }

    #setUnpressed(){
        this.#pressed = false;
        this.#updateColors();
    }

    #updateColors(){
        if (this.#pressed) {
            this.#back.fill(this.#pressedcolor.back);
            this.#back.stroke({color:this.#pressedcolor.stroke});
            this.#caption.font({fill:this.#pressedcolor.stroke});
        } else if (this.#active) {
            this.#back.fill(this.#oncolor.back);
            this.#back.stroke({color:this.#oncolor.stroke});
            this.#caption.font({fill:this.#oncolor.stroke});
        } else if (this.#over) {
            this.#back.fill(this.#overcolor.back);
            this.#back.stroke({color:this.#overcolor.stroke});
            this.#caption.font({fill:this.#overcolor.stroke});
        } else {
            this.#back.fill(this.#offcolor.back);
            this.#back.stroke({color:this.#offcolor.stroke});
            this.#caption.font({fill:this.#offcolor.stroke});
        }
    }

    move(x, y) {
        this.#group.move(x, y);
        return this;
    }

    x() {
        return this.#group.x();
    }

    right() {
        return this.#group.x() + this.#back.width();
    }
}

export { Button };