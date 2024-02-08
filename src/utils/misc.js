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
    /* n: nombre à convertir
       radix: base, 16 ou 2
       size: nombre de symboles
       Renvoie une écriture de n dans la base voulue
    */
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



function replaceSpace(chaine) {
    return chaine.replaceAll(' ', '\u00A0')
}

export { isString, decToBin, decToHex, strToInt, div, hexToValues, GET, decToRadix, replaceSpace };