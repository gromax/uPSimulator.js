function isString(a) {
    return ((a instanceof String) || (typeof a == 'string'));
}

function decToBin(n) {
    /* renvoie le nombre en binaire, en 16 bits. */
    return decToRadix(n, 2, 16);
}

function decToHex(n) {
    return decToRadix(n, 16, 4);
}

// partie privée

const SYMBOLS = '0123456789ABCDEF';

function decToRadix(n, radix, size){
    if ((n < 0) || (n > 65535)) {
        throw Error(`[decToBin(${n})] La fonction ne permet de convertir qu'entre 0 et 65535`);
    }
    let shift = radix == 16 ? 4 : 1;
    let out = [];
    while (n > 0) {
        out.push(SYMBOLS.charAt(n % radix));
        n = n >> shift;
    }
    while (out.length < size) {
        out.push('0');
    }
    return (_.reverse(out).join(''));
}

function strToInt(str) {
    if ((str == '') || isNaN(str)) {
        return null;
    }
    let n = Number(str);
    if (!Number.isInteger(n)) {
        return null;
    }
    return n;
}

function div(a, b){
    return (a - a%b) / b;
}

function hexToValues(text){
    /* text: chaine représentant une longue séquence hexa, par blocs de 4 */
    let n = text.length;
    let values = [];
    for (let i=0; i<n; i+=4) {
        let s = text.substring(i, i+4);
        let v = Number.parseInt(`0x${s}`);
        if (!isNaN(v)) {
            values.push(v);
        }
    }
    return values;
}


function GET(param) {
    var vars = {};
    window.location.href.replace( location.hash, '' ).replace( 
        /[?&]+([^=&]+)=?([^&]*)?/gi,
        function( m, key, value ) {
            vars[key] = value !== undefined ? value : '';
        }
    );

    if ( param ) {
        return vars[param] ? vars[param] : null;	
    }
    return vars;
}

function getItem(tab, index) {
    /* renvoie l'item de rang i s'il existe sinon -1 */
    if (!tab) {
        return -1;
    }
    if ((index<0) || (index>=tab.length)) {
        return -1;
    }
    return tab[index];
}

function replaceSpace(chaine) {
    return chaine.replaceAll(' ', '\u00A0')
}

export { isString, decToBin, decToHex, strToInt, div, hexToValues, GET, decToRadix, getItem, replaceSpace };