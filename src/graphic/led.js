import { FONT_FAMILY, ON_COLOR, OFF_COLOR } from "./styles";

class Led {
    static STROKE = { color: '#000', width: 2 };
    static OPTIONS = {
        'radius':5,
        'color':'#000',
        'fontsize':16,
        'linewidth':2,
        'label':'',
        'anchor':'east',
        'hint':'',
        'margin':5,
        'oncolor':ON_COLOR,
        'offcolor':OFF_COLOR
    };
    #group;
    #circle;
    #oncolor;
    #offcolor;



    constructor(parent, options = {}) {
        this.#group = parent.nested();
        for (let o in options) {
            if (!(o in Led.OPTIONS)) {
                throw Error(`[Led] l'option ${o} n'est pas reconnue.`);
            }
        }
        let radius = ("radius" in options) ? options['radius'] : Led.OPTIONS['radius'];
        let color = ("color" in options) ? options['color'] : Led.OPTIONS['color'];
        let fontSize = ("fontsize" in options) ? options['fontsize'] : Led.OPTIONS['fontsize'];
        let lineWidth = ("linewidth" in options) ? options['linewidth'] : Led.OPTIONS['linewidth'];
        let label = ("label" in options) ? options['label'] : Led.OPTIONS['label'];
        let anchor = ("anchor" in options) ? options['anchor'] : Led.OPTIONS['anchor'];
        let margin = ("margin" in options) ? options['margin'] : Led.OPTIONS['margin'];
        let hint = ("hint" in options) ? options['hint'] : Led.OPTIONS['hint'];
        this.#oncolor = ("oncolor" in options) ? options['oncolor'] : Led.OPTIONS['oncolor'];
        this.#offcolor = ("offcolor" in options) ? options['offcolor'] : Led.OPTIONS['offcolor'];

        this.#circle = this.#group.circle(2*radius);
        this.#circle.stroke({'color':color, 'width':lineWidth});
        this.#circle.fill(this.#offcolor);
        this.#circle.move(lineWidth, lineWidth);

        if (hint !=''){
            let hintNode = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            hintNode.textContent = hint;
            this.#group.node.appendChild(hintNode);
        }
        
        if (label == '') {
            return;
        }
        
        let caption = this.#group.text(label);
        caption.font({fill:color, family:FONT_FAMILY, size:fontSize});
        switch(anchor) {
            case 'north': caption.cx(radius).y(this.#circle.y() - margin - fontSize); break;
            case 'south': caption.cx(radius).y(this.#circle.y() + 2*radius + margin); break;
            case 'west' : caption.cy(radius).x(this.#circle.x() - caption.length() - margin); break;
            default     : caption.cy(radius).x(this.#circle.x() + 2*radius + margin);
        }
        let dx = caption.x() < 0 ? -caption.x() : 0;
        let dy = caption.y() < 0 ? -caption.y() : 0;
        this.#circle.dmove(dx, dy);
        caption.dmove(dx, dy);
    }

    setOn() {
        this.#circle.fill(this.#oncolor);
    }

    setOff() {
        this.#circle.fill(this.#offcolor);
    }

    move(x, y) {
        /* l'ancre est le centre de la diode */
        this.#group.move(x - this.#circle.cx(), y - this.#circle.cy());
    }

    get anchorSouth() {
        let x = this.#circle.cx() + this.#group.x(); 
        let y = this.#circle.y() + this.#circle.height() + this.#group.y(); 
        return [x, y];
    }

}

export { Led };
