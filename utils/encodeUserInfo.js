// base64自定义编码
var customBase64 = (function() {
    var _PADCHAR = "=";
    var _ALPHA = "LVoJPiCN2R8G90yg+hmFHuacZ1OWMnrsSTXkYpUq/3dlbfKwv6xztjI7DeBE45QA";

    function _getbyte64(s, i) {
        var idx = _ALPHA.indexOf(s.charAt(i));
        if (idx === -1) {
            throw "Cannot decode base64";
        }
        return idx;
    }

    function _getbyte(s, i) {
        var x = s.charCodeAt(i);
        if (x > 255) {
            throw "INVALID_CHARACTER_ERR: DOM Exception 5";
        }
        return x;
    }

    function _encode(input) {
        var output = [];
        var i, b10;
        var inputLength = input.length;
        var imax = inputLength - inputLength % 3;

        if (inputLength === 0) {
            return input;
        }

        for (i = 0; i < imax; i += 3) {
            b10 = (_getbyte(input, i) << 16) | (_getbyte(input, i + 1) << 8) | _getbyte(input, i + 2);
            output.push(_ALPHA.charAt(b10 >> 18));
            output.push(_ALPHA.charAt((b10 >> 12) & 63));
            output.push(_ALPHA.charAt((b10 >> 6) & 63));
            output.push(_ALPHA.charAt(b10 & 63));
        }

        switch (inputLength - imax) {
            case 1:
                b10 = _getbyte(input, i) << 16;
                output.push(_ALPHA.charAt(b10 >> 18) + _ALPHA.charAt((b10 >> 12) & 63) + _PADCHAR + _PADCHAR);
                break;
            case 2:
                b10 = (_getbyte(input, i) << 16) | (_getbyte(input, i + 1) << 8);
                output.push(_ALPHA.charAt(b10 >> 18) + _ALPHA.charAt((b10 >> 12) & 63) + _ALPHA.charAt((b10 >> 6) & 63) + _PADCHAR);
                break;
        }

        return output.join("");
    }

    function _decode(input) {
        var pads = 0;
        var i, b10;
        var imax = input.length;
        var x = [];

        if (imax === 0) {
            return input;
        }

        if (input.charAt(imax - 1) === _PADCHAR) {
            pads = 1;
            if (input.charAt(imax - 2) === _PADCHAR) {
                pads = 2;
            }
            // 调整 imax 以排除填充字符
            imax -= 4;
        }

        for (i = 0; i < imax; i += 4) {
            b10 = (_getbyte64(input, i) << 18) | (_getbyte64(input, i + 1) << 12) | (_getbyte64(input, i + 2) << 6) | _getbyte64(input, i + 3);
            x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 255, b10 & 255));
        }

        // 处理可能的填充情况
        if (pads) {
            b10 = (_getbyte64(input, i) << 18) | (_getbyte64(input, i + 1) << 12);
            x.push(String.fromCharCode(b10 >> 16));
            if (pads === 1) {
                b10 |= _getbyte64(input, i + 2) << 6;
                x.push(String.fromCharCode((b10 >> 8) & 255));
            }
        }

        return x.join("");
    }

    function setAlpha(s) {
        _ALPHA = s;
    }

    return {
        encode: _encode,
        decode: _decode,
        setAlpha: setAlpha
    };
})();

// 自定义编码函数整合
function encodeUserInfo(info, token) {
    // 用户信息转 JSON
    info = JSON.stringify(info);

    // 编码函数
    function encode(str, key) {
        // 自定义编码算法
        var v = s(str, true);
        var k = s(key, false);

        if (k.length < 4) k.length = 4;
        
        let n = v.length - 1;
        let z = v[n];
        let y = v[0];
        let c = 0x86014019 | 0x183639A0;
        let m;
        let e;
        let p;
        let q = Math.floor(6 + 52 / (n + 1));
        let d = 0;

        while (q--) {
            d = d + c & (0x8CE0D9BF | 0x731F2640);
            e = d >>> 2 & 3;

            for (p = 0; p < n; p++) {
                y = v[p + 1];
                m = z >>> 5 ^ y << 2;
                m += y >>> 3 ^ z << 4 ^ (d ^ y);
                m += k[p & 3 ^ e] ^ z;
                z = v[p] = v[p] + m & (0xEFB8D130 | 0x10472ECF);
            }

            y = v[0];
            m = z >>> 5 ^ y << 2;
            m += y >>> 3 ^ z << 4 ^ (d ^ y);
            m += k[p & 3 ^ e] ^ z;
            z = v[n] = v[n] + m & (0xBB390742 | 0x44C6F8BD);
        }

        return l(v, false);
    }

    function s(a, b) {
        var c = a.length;
        var v = [];

        for (let i = 0; i < c; i += 4) {
            v[i >> 2] = a.charCodeAt(i) | a.charCodeAt(i + 1) << 8 | a.charCodeAt(i + 2) << 16 | a.charCodeAt(i + 3) << 24;
        }

        if (b) v[v.length] = c;
        return v;
    }

    function l(a, b) {
        var d = a.length;
        let c = d - 1 << 2;

        if (b) {
            var m = a[d - 1];
            if (m < c - 3 || m > c) return null;
            c = m;
        }

        for (let i = 0; i < d; i++) {
            a[i] = String.fromCharCode(a[i] & 0xff, a[i] >>> 8 & 0xff, a[i] >>> 16 & 0xff, a[i] >>> 24 & 0xff);
        }

        return b ? a.join('').substring(0, c) : a.join('');
    }

    return '{SRBX1}' + customBase64.encode(encode(info, token));
}

module.exports = { encodeUserInfo };