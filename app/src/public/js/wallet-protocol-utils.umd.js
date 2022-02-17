(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.walletProtocolUtils = {}));
})(this, (function (exports) { 'use strict';

    var styleCss = ".wallet-protocol-overlay {\n    position: absolute;\n    display: flex;\n    height: 100%;\n    width: 100%;\n    top: 0;\n    left: 0;\n    align-items: center;\n    justify-content: center;\n    background-color: #000000AA;\n    font-family: 'sans-serif';\n    color: #202531;\n}\n\n.wallet-protocol-overlay .modal {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    justify-content: center;\n    border: 2px solid #1A1E27;\n    border-radius: 5px;\n    padding: 10px 20px;\n    background-image: linear-gradient(to bottom left, white, #D2D6E1);\n}\n\n.wallet-protocol-overlay .title {\n    font-weight: bold;\n    padding: 5px;\n}\n\n.wallet-protocol-overlay .message {\n    opacity: 0.5;\n    padding: 5px;\n    font-size: 15px\n}\n\n.wallet-protocol-overlay .input-box {\n    display: flex;\n    margin: 20px;\n    height: 32px;\n}\n\n.wallet-protocol-overlay input {\n    border-radius: 3px;\n    border-top-right-radius: 0;\n    border-bottom-right-radius: 0;\n    outline: none;\n    padding: 5px;\n    border: 2px solid #1A1E27;\n    border-right: none;\n}\n\n.wallet-protocol-overlay button {\n    height: 100%;\n    padding: 5px;\n    border-radius: 3px;\n    border: 2px solid #1A1E27;\n    border-top-left-radius: 0;\n    border-bottom-left-radius: 0;\n    cursor: pointer;\n}\n";

    const openModal = () => {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            document.body.appendChild(overlay);
            overlay.className = 'wallet-protocol-overlay';
            const style = document.createElement('style');
            overlay.appendChild(style);
            style.innerText = styleCss;
            const modal = document.createElement('div');
            overlay.appendChild(modal);
            modal.className = 'modal';
            const title = document.createElement('span');
            modal.appendChild(title);
            title.className = 'title';
            title.innerText = 'Connecting to your wallet...';
            const message = document.createElement('span');
            modal.appendChild(message);
            message.className = 'message';
            message.innerText = 'Set up your wallet on pairing mode and put the PIN here';
            const inputBox = document.createElement('div');
            modal.appendChild(inputBox);
            inputBox.className = 'input-box';
            const pinInput = document.createElement('input');
            inputBox.appendChild(pinInput);
            pinInput.setAttribute('placeholder', 'pin...');
            const pairButton = document.createElement('button');
            inputBox.appendChild(pairButton);
            pairButton.innerText = 'Syncronize';
            const close = (value) => {
                document.body.removeChild(overlay);
                resolve(value ?? '');
            };
            pairButton.addEventListener('click', () => close(pinInput.value));
            overlay.addEventListener('click', (ev) => {
                if (ev.target === overlay) {
                    close();
                }
            });
        });
    };

    /**
     * Array of bytes to Base64 string decoding
     * @param sBase64 - a base64-encoded string
     * @returns
     */
    function base64DecToArr(sB64Enc) {
        const nInLen = sB64Enc.length;
        const nOutLen = nInLen * 3 + 1 >> 2;
        const taBytes = new Uint8Array(nOutLen);
        for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
            nMod4 = nInIdx & 3;
            nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 6 * (3 - nMod4);
            if (nMod4 === 3 || nInLen - nInIdx === 1) {
                for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
                    taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
                }
                nUint24 = 0;
            }
        }
        return taBytes;
    }
    /**
     * Base64 string to array encoding
     * @param aBytes - a buffer
     * @returns a base64-encoded string
     */
    function base64EncArr(aBytes) {
        let nMod3 = 2;
        let sB64Enc = '';
        for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
            nMod3 = nIdx % 3;
            if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) {
                sB64Enc += '\r\n';
            }
            nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
            if (nMod3 === 2 || aBytes.length - nIdx === 1) {
                sB64Enc += String.fromCharCode(uint6ToB64(nUint24 >>> 18 & 63), uint6ToB64(nUint24 >>> 12 & 63), uint6ToB64(nUint24 >>> 6 & 63), uint6ToB64(nUint24 & 63));
                nUint24 = 0;
            }
        }
        return sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) + (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==');
    }
    function b64ToUint6(nChr) {
        return nChr > 64 && nChr < 91
            ? nChr - 65
            : nChr > 96 && nChr < 123
                ? nChr - 71
                : nChr > 47 && nChr < 58
                    ? nChr + 4
                    : nChr === 43
                        ? 62
                        : nChr === 47
                            ? 63
                            : 0;
    }
    function uint6ToB64(nUint6) {
        return nUint6 < 26
            ? nUint6 + 65
            : nUint6 < 52
                ? nUint6 + 71
                : nUint6 < 62
                    ? nUint6 - 4
                    : nUint6 === 62
                        ? 43
                        : nUint6 === 63
                            ? 47
                            : 65;
    }

    /**
     * Base64url for both node.js and brwser javascript. It can work with ArrayBuffer|TypedArray|Buffer
     *
     * @remarks Bowser code by https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
     * @packageDocumentation
     */
    /**
     * Base64Url encoding of a buffer input or a string (UTF16 in browsers, UTF8 in node)
     * @param input
     * @param urlsafe - if true Base64 URL encoding is used ('+' and '/' are replaced by '-', '_')
     * @param padding - if false, padding (trailing '=') is removed
     * @returns a string with the base64-encoded representation of the input
     */
    function encode(input, urlsafe = false, padding = true) {
        let base64 = '';
        {
            const bytes = (typeof input === 'string')
                ? (new TextEncoder()).encode(input)
                : new Uint8Array(input);
            base64 = base64EncArr(bytes);
        }
        if (urlsafe)
            base64 = base64ToBase64url(base64);
        if (!padding)
            base64 = removeBase64Padding(base64);
        return base64;
    }
    /**
     * Base64url decoding (binary output) of base64url-encoded string
     * @param base64 - a base64 string
     * @param stringOutput - if true a UTF16 (browser) or UTF8 (node) string is returned
     * @returns a buffer or unicode string
     */
    function decode(base64, stringOutput = false) {
        {
            let urlsafe = false;
            if (/^[0-9a-zA-Z_-]+={0,2}$/.test(base64)) {
                urlsafe = true;
            }
            else if (!/^[0-9a-zA-Z+/]*={0,2}$/.test(base64)) {
                throw new Error('Not a valid base64 input');
            }
            if (urlsafe)
                base64 = base64urlToBase64(base64);
            const bytes = base64DecToArr(base64);
            return stringOutput
                ? (new TextDecoder()).decode(bytes)
                : bytes;
        }
    }
    function base64ToBase64url(base64) {
        return base64.replace(/\+/g, '-').replace(/\//g, '_');
    }
    function base64urlToBase64(base64url) {
        return base64url.replace(/-/g, '+').replace(/_/g, '/').replace(/=/g, '');
    }
    function removeBase64Padding(str) {
        return str.replace(/=/g, '');
    }

    /**
     * PBKDF2 following RFC 2898 using HMAC (with SHA-1, SHA-256, SHA-384, SHA-512) as the PRF
     *
     * @packageDocumentation
     */
    const HASHALGS = {
        'SHA-1': { outputLength: 20, blockSize: 64 },
        'SHA-256': { outputLength: 32, blockSize: 64 },
        'SHA-384': { outputLength: 48, blockSize: 128 },
        'SHA-512': { outputLength: 64, blockSize: 128 }
    };
    /**
      * The PBKDF2-HMAC function used below denotes the PBKDF2 algorithm (RFC2898)
      * used with one of the SHA algorithms as the hash function for the HMAC
      *
      * @param P - a unicode string with a password
      * @param S - a salt. This should be a random or pseudo-random value of at least 16 bytes. You can easily get one with crypto.getRandomValues(new Uint8Array(16))
      * @param c - iteration count, a positive integer
      * @param dkLen - intended length in octets of the derived key
      * @param hash - hash function to use for the HMAC. One of 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'
      *
      * @returns an ArrayBuffer with the derived key
      */
    function pbkdf2Hmac(P, S, c, dkLen, hash = 'SHA-256') {
        return new Promise((resolve, reject) => {
            if (!(hash in HASHALGS)) {
                reject(new RangeError(`Valid hash algorithm values are any of ${Object.keys(HASHALGS).toString()}`));
            }
            if (typeof P === 'string')
                P = new TextEncoder().encode(P); // encode S as UTF-8
            else if (P instanceof ArrayBuffer)
                P = new Uint8Array(P);
            else if (!ArrayBuffer.isView(P))
                reject(RangeError('P should be string, ArrayBuffer, TypedArray, DataView'));
            if (typeof S === 'string')
                S = new TextEncoder().encode(S); // encode S as UTF-8
            else if (S instanceof ArrayBuffer)
                S = new Uint8Array(S);
            else if (ArrayBuffer.isView(S))
                S = new Uint8Array(S.buffer, S.byteOffset, S.byteLength);
            else
                reject(RangeError('S should be string, ArrayBuffer, TypedArray, DataView'));
            {
                crypto.subtle.importKey('raw', P, 'PBKDF2', false, ['deriveBits']).then((PKey) => {
                    const params = { name: 'PBKDF2', hash: hash, salt: S, iterations: c }; // pbkdf2 params
                    crypto.subtle.deriveBits(params, PKey, dkLen * 8).then(derivedKey => resolve(derivedKey), 
                    // eslint-disable-next-line node/handle-callback-err
                    err => {
                        // Try our native implementation if browser's native one fails (firefox one fails when dkLen > 256)
                        _pbkdf2(P, S, c, dkLen, hash).then(derivedKey => resolve(derivedKey), error => reject(error));
                    });
                }, err => reject(err));
            }
        });
    }
    async function _pbkdf2(P, S, c, dkLen, hash) {
        if (!(hash in HASHALGS)) {
            throw new RangeError(`Valid hash algorithm values are any of ${Object.keys(HASHALGS).toString()}`);
        }
        if (!Number.isInteger(c) || c <= 0)
            throw new RangeError('c must be a positive integer');
        /*
         1.  If dkLen > (2^32 - 1) * hLen, output "derived key too long"
                 and stop.
         */
        const hLen = HASHALGS[hash].outputLength;
        if (!Number.isInteger(dkLen) || dkLen <= 0 || dkLen >= (2 ** 32 - 1) * hLen)
            throw new RangeError('dkLen must be a positive integer < (2 ** 32 - 1) * hLen');
        /*
         2.  Let l be the number of hLen-octet blocks in the derived key,
             rounding up, and let r be the number of octets in the last
             block:
               l = CEIL (dkLen / hLen)
               r = dkLen - (l - 1) * hLen
         */
        const l = Math.ceil(dkLen / hLen);
        const r = dkLen - (l - 1) * hLen;
        /*
         3.  For each block of the derived key apply the function F defined
             below to the password P, the salt S, the iteration count c,
             and the block index to compute the block:
      
                       T_1 = F (P, S, c, 1) ,
                       T_2 = F (P, S, c, 2) ,
                       ...
                       T_l = F (P, S, c, l) ,
         */
        const T = new Array(l);
        if (P.byteLength === 0)
            P = new Uint8Array(HASHALGS[hash].blockSize); // HMAC does not accept an empty ArrayVector
        const Pkey = await crypto.subtle.importKey('raw', P, {
            name: 'HMAC',
            hash: { name: hash }
        }, true, ['sign']);
        const HMAC = async function (key, arr) {
            const hmac = await crypto.subtle.sign('HMAC', key, arr);
            return new Uint8Array(hmac);
        };
        for (let i = 0; i < l; i++) {
            T[i] = await F(Pkey, S, c, i + 1);
        }
        /*
             where the function F is defined as the exclusive-or sum of the
             first c iterates of the underlying pseudorandom function PRF
             applied to the password P and the concatenation of the salt S
             and the block index i:
      
                       F (P, S, c, i) = U_1 \xor U_2 \xor ... \xor U_c
      
             where
                       U_1 = PRF (P, S || INT (i)) ,
                       U_2 = PRF (P, U_1) ,
                       ...
                       U_c = PRF (P, U_{c-1}) .
      
             Here, INT (i) is a four-octet encoding of the integer i, most
             significant octet first.
         */
        /**
          *
          * @param P - password
          * @param S - salt
          * @param c - iterations
          * @param i - block index
          */
        async function F(P, S, c, i) {
            function INT(i) {
                const buf = new ArrayBuffer(4);
                const view = new DataView(buf);
                view.setUint32(0, i, false);
                return new Uint8Array(buf);
            }
            const Uacc = await HMAC(P, concat(S, INT(i)));
            let UjMinus1 = Uacc;
            for (let j = 1; j < c; j++) {
                UjMinus1 = await HMAC(P, UjMinus1);
                xorMe(Uacc, UjMinus1);
            }
            return Uacc;
        }
        /*
         4.  Concatenate the blocks and extract the first dkLen octets to
             produce a derived key DK:
                       DK = T_1 || T_2 ||  ...  || T_l<0..r-1>
      
         5.  Output the derived key DK.
         */
        T[l - 1] = T[l - 1].slice(0, r);
        return concat(...T).buffer;
    }
    function concat(...arrs) {
        // sum of individual array lengths
        const totalLength = arrs.reduce((acc, value) => acc + value.length, 0);
        if (arrs.length === 0)
            throw new RangeError('Cannot concat no arrays');
        const result = new Uint8Array(totalLength);
        // for each array - copy it over result
        // next array is copied right after the previous one
        let length = 0;
        for (const array of arrs) {
            result.set(array, length);
            length += array.length;
        }
        return result;
    }
    function xorMe(arr1, arr2) {
        for (let i = 0; i < arr1.length; i++) {
            arr1[i] ^= arr2[i];
        }
    }

    function isObject(val) {
        return (val != null) && (typeof val === 'object') && !(Array.isArray(val));
    }
    function objectToArraySortedByKey(obj) {
        if (!isObject(obj) && !Array.isArray(obj)) {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map((item) => {
                if (Array.isArray(item) || isObject(item)) {
                    return objectToArraySortedByKey(item);
                }
                return item;
            });
        }
        // if it is an object convert to array and sort
        return Object.keys(obj) // eslint-disable-line
            .sort()
            .map((key) => {
            return [key, objectToArraySortedByKey(obj[key])];
        });
    }
    /**
     * If the input object is not an Array, this function converts the object to an array, all the key-values to 2-arrays [key, value] and then sort the array by the keys. All the process is done recursively so objects inside objects or arrays are also ordered. Once the array is created the method returns the JSON.stringify() of the sorted array.
     *
     * @param {object} obj the object
     *
     * @returns {string} a JSON stringify of the created sorted array
     */
    function hashable (obj) {
        return JSON.stringify(objectToArraySortedByKey(obj));
    }

    /**
     * My module description. Please update with your module data.
     *
     * @remarks
     * This module runs perfectly in node.js and browsers
     *
     * @packageDocumentation
     */
    /**
      * Returns a string with a hexadecimal representation of the digest of the input object using a given hash algorithm.
      * It first creates an array of the object values ordered by the object keys (using hashable(obj));
      * then, it JSON.stringify-es it; and finally it hashes it.
      *
      * @param obj - An Object
      * @param algorithm - For compatibility with browsers it should be 'SHA-1', 'SHA-256', 'SHA-384' and 'SHA-512'.
      *
      * @throws {RangeError}
      * Thrown if an invalid hash algorithm is selected.
      *
      * @returns a promise that resolves to a string with hexadecimal content.
      */
    function digest(obj, algorithm = 'SHA-256') {
        const algorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
        if (!algorithms.includes(algorithm)) {
            throw RangeError(`Valid hash algorithm values are any of ${JSON.stringify(algorithms)}`);
        }
        return (async function (obj, algorithm) {
            const encoder = new TextEncoder();
            const hashInput = encoder.encode(hashable(obj)).buffer;
            let digest = '';
            {
                const buf = await crypto.subtle.digest(algorithm, hashInput);
                const h = '0123456789abcdef';
                (new Uint8Array(buf)).forEach((v) => {
                    digest += h[v >> 4] + h[v & 15];
                });
            }
            /* eslint-enable no-lone-blocks */
            return digest;
        })(obj, algorithm);
    }

    const PORT_LENGTH = 12;
    const DEFAULT_RANDOM_LENGTH = 36; // In bits
    const DEFAULT_TIMEOUT = 30000; // in milliseconds
    const PORT_SPACE = 2 ** PORT_LENGTH;
    const INITIAL_PORT = 29170;
    const NONCE_LENGTH = 128; // In bits
    const COMMITMENT_LENGTH = 256; // In bits

    var protocolConstants = /*#__PURE__*/Object.freeze({
        __proto__: null,
        PORT_LENGTH: PORT_LENGTH,
        DEFAULT_RANDOM_LENGTH: DEFAULT_RANDOM_LENGTH,
        DEFAULT_TIMEOUT: DEFAULT_TIMEOUT,
        PORT_SPACE: PORT_SPACE,
        INITIAL_PORT: INITIAL_PORT,
        NONCE_LENGTH: NONCE_LENGTH,
        COMMITMENT_LENGTH: COMMITMENT_LENGTH
    });

    const RPC_URL_PATH = '.well-known/wallet-protocol';

    var httpConstants = /*#__PURE__*/Object.freeze({
        __proto__: null,
        RPC_URL_PATH: RPC_URL_PATH
    });

    ({
        ...protocolConstants,
        ...httpConstants
    });
    class BaseRandom {
        async randomFill(buffer, start, size) {
            throw new Error('not implemented');
        }
        async randomFillBits(buffer, start, size) {
            const byteLen = Math.ceil(size / 8);
            const randomBytes = new Uint8Array(byteLen);
            await this.randomFill(randomBytes, 0, byteLen);
            bufferUtils.insertBits(randomBytes, buffer, 0, start, size);
        }
    }
    class BaseCipher {
        constructor(algorithm, key) {
            this.algorithm = algorithm;
            this.key = key;
        }
        async encrypt(payload) {
            throw new Error('not implemented');
        }
        async decrypt(ciphertext) {
            throw new Error('not implemented');
        }
    }

    class BrowserRandom extends BaseRandom {
        async randomFill(buffer, start, size) {
            const newBuffer = new Uint8Array(size);
            crypto.getRandomValues(newBuffer);
            for (let i = 0; i < size; i++) {
                buffer[start + i] = newBuffer[i];
            }
        }
    }
    const random = new BrowserRandom();

    const NODE_TO_BROWSER_CIPHER_ALGORITHMS = {
        'aes-256-gcm': {
            name: 'AES-GCM',
            tagLength: 16 * 8
        }
    };
    class Cipher extends BaseCipher {
        async encrypt(message) {
            const iv = new Uint8Array(12);
            await random.randomFill(iv, 0, iv.length);
            const alg = NODE_TO_BROWSER_CIPHER_ALGORITHMS[this.algorithm];
            const cryptoKey = await crypto.subtle.importKey('raw', this.key, alg, false, ['encrypt']);
            const ciphertext = await crypto.subtle.encrypt({
                ...alg,
                iv
            }, cryptoKey, message);
            const buffers = [];
            buffers.push(iv);
            buffers.push(new Uint8Array(ciphertext));
            return bufferUtils.join(...buffers);
        }
        async decrypt(cryptosecuence) {
            const sizes = [];
            switch (this.algorithm) {
                case 'aes-256-gcm':
                    sizes[0] = 12; // IV Size
                    break;
            }
            sizes[1] = cryptosecuence.length - sizes[0];
            const [iv, ciphertext] = bufferUtils.split(cryptosecuence, ...sizes);
            const alg = NODE_TO_BROWSER_CIPHER_ALGORITHMS[this.algorithm];
            const cryptoKey = await crypto.subtle.importKey('raw', this.key, alg, false, ['decrypt']);
            const message = await crypto.subtle.decrypt({
                ...alg,
                iv
            }, cryptoKey, ciphertext);
            return new Uint8Array(message);
        }
    }

    const format = {
        utf2U8Arr: (text) => {
            return new TextEncoder().encode(text);
        },
        u8Arr2Utf: (arr) => {
            return new TextDecoder().decode(arr);
        },
        num2U8Arr: (num, len) => {
            if (len === undefined) {
                len = 1;
                while (2 ** (len * 8) < num) {
                    len++;
                }
            }
            const arr = new Uint8Array(len);
            let rest = num;
            for (let i = len - 1; i >= 0; i--) {
                const nextRest = rest >> 8;
                const num = rest - (nextRest << 8);
                arr[i] = num;
                rest = nextRest;
            }
            return arr;
        },
        u8Arr2Num: (buffer) => {
            let num = 0;
            for (let i = 0; i < buffer.length; i++) {
                num += buffer[i] << ((buffer.length - 1) - i);
            }
            return num;
        },
        hex2U8Arr: (hex) => {
            const match = hex.match(/.{1,2}/g);
            if (match === null) {
                throw new Error(`not a hex: ${hex}`);
            }
            return new Uint8Array(match.map(byte => parseInt(byte, 16)));
        },
        u8Arr2Hex: (arr) => {
            return arr.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
        },
        u8Arr2Base64: (arr) => {
            return encode(arr, true, false);
        },
        base642U8Arr: (b64) => {
            return decode(b64, false);
        }
    };

    const bufferUtils = {
        join: (...list) => {
            const size = list.reduce((a, b) => a + b.length, 0);
            const buffer = new Uint8Array(size);
            let accLen = 0;
            for (const el of list) {
                buffer.set(el, accLen);
                accLen += el.length;
            }
            return buffer;
        },
        split: (buffer, ...sizes) => {
            const list = [];
            let start = 0;
            for (const size of sizes) {
                list.push(buffer.slice(start, start + size));
                start += size;
            }
            return list;
        },
        insertBytes: (src, dst, fromStart, toStart, size) => {
            for (let i = 0; i < size; i++) {
                dst[i + toStart] = src[i + fromStart];
            }
        },
        insertBits: (src, dst, fromStart, toStart, size) => {
            let fromByteIndex = Math.floor(fromStart / 8);
            let fromBitIndex = fromStart % 8;
            let toByteIndex = Math.floor(toStart / 8);
            let toBitIndex = toStart % 8;
            let currFromByte = src[fromByteIndex] ?? 0;
            const deltaOffset = toBitIndex - fromBitIndex;
            for (let i = 0; i < size; i++) {
                let currBit;
                if (deltaOffset >= 0) {
                    currBit = ((currFromByte & (128 >> fromBitIndex)) << deltaOffset);
                }
                else {
                    currBit = ((currFromByte & (128 >> fromBitIndex)));
                }
                const bitSet = ((dst[toByteIndex] & ~(128 >> toBitIndex)) | currBit);
                dst[toByteIndex] = bitSet;
                // Move pointers
                fromBitIndex++;
                toBitIndex++;
                if (fromBitIndex >= 8) {
                    fromByteIndex++;
                    fromBitIndex = 0;
                    currFromByte = src[fromByteIndex] ?? 0;
                }
                if (toBitIndex >= 8) {
                    toByteIndex++;
                    toBitIndex = 0;
                }
            }
        },
        extractBits: (buf, start, size) => {
            const byteSize = Math.ceil(size / 8);
            const dst = new Uint8Array(byteSize);
            bufferUtils.insertBits(buf, dst, start, 0, size);
            return dst;
        }
    };

    const deriveKey = async (from, to, secret) => {
        // Prepare data
        const salt = new Uint8Array(16);
        const pbkdf2Input = new Uint8Array(32 * 3);
        const fromBuffer = format.hex2U8Arr(from);
        const toBuffer = format.hex2U8Arr(to);
        // Prepare input
        bufferUtils.insertBytes(secret, pbkdf2Input, 0, 0, 32);
        bufferUtils.insertBytes(fromBuffer, pbkdf2Input, 0, 32, 32);
        bufferUtils.insertBytes(toBuffer, pbkdf2Input, 0, 32 * 2, 32);
        const derivatedSecret = await pbkdf2Hmac(pbkdf2Input, salt, 1, 32);
        return new Uint8Array(derivatedSecret);
    };
    class MasterKey {
        constructor(port, from, to, na, nb, secret, encryptKey, decryptKey) {
            this.port = port;
            this.from = from;
            this.to = to;
            this.na = na;
            this.nb = nb;
            this.secret = secret;
            this.cipher = new Cipher('aes-256-gcm', encryptKey);
            this.decipher = new Cipher('aes-256-gcm', decryptKey);
        }
        async encrypt(message) {
            return await this.cipher.encrypt(message);
        }
        async decrypt(ciphertext) {
            return await this.decipher.decrypt(ciphertext);
        }
        toJSON() {
            return {
                from: this.from,
                to: this.to,
                port: this.port,
                na: format.u8Arr2Base64(this.na),
                nb: format.u8Arr2Base64(this.nb),
                secret: format.u8Arr2Base64(this.secret)
            };
        }
        async fromHash() {
            return await digest(this.from);
        }
        async toHash() {
            return await digest(this.to);
        }
        static async fromSecret(port, from, to, na, nb, secret) {
            const fromHash = await digest(from);
            const toHash = await digest(to);
            const encryptKey = await deriveKey(fromHash, toHash, secret);
            const decryptKey = await deriveKey(toHash, fromHash, secret);
            return new MasterKey(port, from, to, na, nb, secret, encryptKey, decryptKey);
        }
        static async fromJSON(data) {
            const na = format.base642U8Arr(data.na);
            const nb = format.base642U8Arr(data.nb);
            const secret = format.base642U8Arr(data.secret);
            return await this.fromSecret(data.port, data.from, data.to, na, nb, secret);
        }
    }

    class Session {
        constructor(transport, masterKey, code) {
            this.transport = transport;
            this.masterKey = masterKey;
            this.code = code;
        }
        async send(request) {
            return await this.transport.send(this.masterKey, this.code, request);
        }
        toJSON() {
            return {
                masterKey: this.masterKey.toJSON(),
                code: format.u8Arr2Hex(this.code)
            };
        }
        static async fromJSON(TransportOrConstructor, json) {
            const masterKey = await MasterKey.fromJSON(json.masterKey);
            const code = format.hex2U8Arr(json.code);
            let transport;
            if (typeof TransportOrConstructor === 'object') {
                transport = TransportOrConstructor;
            }
            else if (TransportOrConstructor instanceof Function) {
                transport = new TransportOrConstructor();
            }
            else {
                throw new Error('First param must be transport or constructor of transport');
            }
            return new Session(transport, masterKey, code);
        }
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    function isFunction(value) {
        return typeof value === 'function';
    }

    function createErrorClass(createImpl) {
        var _super = function (instance) {
            Error.call(instance);
            instance.stack = new Error().stack;
        };
        var ctorFunc = createImpl(_super);
        ctorFunc.prototype = Object.create(Error.prototype);
        ctorFunc.prototype.constructor = ctorFunc;
        return ctorFunc;
    }

    var UnsubscriptionError = createErrorClass(function (_super) {
        return function UnsubscriptionErrorImpl(errors) {
            _super(this);
            this.message = errors
                ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function (err, i) { return i + 1 + ") " + err.toString(); }).join('\n  ')
                : '';
            this.name = 'UnsubscriptionError';
            this.errors = errors;
        };
    });

    function arrRemove(arr, item) {
        if (arr) {
            var index = arr.indexOf(item);
            0 <= index && arr.splice(index, 1);
        }
    }

    var Subscription = (function () {
        function Subscription(initialTeardown) {
            this.initialTeardown = initialTeardown;
            this.closed = false;
            this._parentage = null;
            this._teardowns = null;
        }
        Subscription.prototype.unsubscribe = function () {
            var e_1, _a, e_2, _b;
            var errors;
            if (!this.closed) {
                this.closed = true;
                var _parentage = this._parentage;
                if (_parentage) {
                    this._parentage = null;
                    if (Array.isArray(_parentage)) {
                        try {
                            for (var _parentage_1 = __values(_parentage), _parentage_1_1 = _parentage_1.next(); !_parentage_1_1.done; _parentage_1_1 = _parentage_1.next()) {
                                var parent_1 = _parentage_1_1.value;
                                parent_1.remove(this);
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (_parentage_1_1 && !_parentage_1_1.done && (_a = _parentage_1.return)) _a.call(_parentage_1);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                    }
                    else {
                        _parentage.remove(this);
                    }
                }
                var initialTeardown = this.initialTeardown;
                if (isFunction(initialTeardown)) {
                    try {
                        initialTeardown();
                    }
                    catch (e) {
                        errors = e instanceof UnsubscriptionError ? e.errors : [e];
                    }
                }
                var _teardowns = this._teardowns;
                if (_teardowns) {
                    this._teardowns = null;
                    try {
                        for (var _teardowns_1 = __values(_teardowns), _teardowns_1_1 = _teardowns_1.next(); !_teardowns_1_1.done; _teardowns_1_1 = _teardowns_1.next()) {
                            var teardown_1 = _teardowns_1_1.value;
                            try {
                                execTeardown(teardown_1);
                            }
                            catch (err) {
                                errors = errors !== null && errors !== void 0 ? errors : [];
                                if (err instanceof UnsubscriptionError) {
                                    errors = __spreadArray(__spreadArray([], __read(errors)), __read(err.errors));
                                }
                                else {
                                    errors.push(err);
                                }
                            }
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (_teardowns_1_1 && !_teardowns_1_1.done && (_b = _teardowns_1.return)) _b.call(_teardowns_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
                if (errors) {
                    throw new UnsubscriptionError(errors);
                }
            }
        };
        Subscription.prototype.add = function (teardown) {
            var _a;
            if (teardown && teardown !== this) {
                if (this.closed) {
                    execTeardown(teardown);
                }
                else {
                    if (teardown instanceof Subscription) {
                        if (teardown.closed || teardown._hasParent(this)) {
                            return;
                        }
                        teardown._addParent(this);
                    }
                    (this._teardowns = (_a = this._teardowns) !== null && _a !== void 0 ? _a : []).push(teardown);
                }
            }
        };
        Subscription.prototype._hasParent = function (parent) {
            var _parentage = this._parentage;
            return _parentage === parent || (Array.isArray(_parentage) && _parentage.includes(parent));
        };
        Subscription.prototype._addParent = function (parent) {
            var _parentage = this._parentage;
            this._parentage = Array.isArray(_parentage) ? (_parentage.push(parent), _parentage) : _parentage ? [_parentage, parent] : parent;
        };
        Subscription.prototype._removeParent = function (parent) {
            var _parentage = this._parentage;
            if (_parentage === parent) {
                this._parentage = null;
            }
            else if (Array.isArray(_parentage)) {
                arrRemove(_parentage, parent);
            }
        };
        Subscription.prototype.remove = function (teardown) {
            var _teardowns = this._teardowns;
            _teardowns && arrRemove(_teardowns, teardown);
            if (teardown instanceof Subscription) {
                teardown._removeParent(this);
            }
        };
        Subscription.EMPTY = (function () {
            var empty = new Subscription();
            empty.closed = true;
            return empty;
        })();
        return Subscription;
    }());
    var EMPTY_SUBSCRIPTION = Subscription.EMPTY;
    function isSubscription(value) {
        return (value instanceof Subscription ||
            (value && 'closed' in value && isFunction(value.remove) && isFunction(value.add) && isFunction(value.unsubscribe)));
    }
    function execTeardown(teardown) {
        if (isFunction(teardown)) {
            teardown();
        }
        else {
            teardown.unsubscribe();
        }
    }

    var config = {
        onUnhandledError: null,
        onStoppedNotification: null,
        Promise: undefined,
        useDeprecatedSynchronousErrorHandling: false,
        useDeprecatedNextContext: false,
    };

    var timeoutProvider = {
        setTimeout: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var delegate = timeoutProvider.delegate;
            return ((delegate === null || delegate === void 0 ? void 0 : delegate.setTimeout) || setTimeout).apply(void 0, __spreadArray([], __read(args)));
        },
        clearTimeout: function (handle) {
            return (clearTimeout)(handle);
        },
        delegate: undefined,
    };

    function reportUnhandledError(err) {
        timeoutProvider.setTimeout(function () {
            {
                throw err;
            }
        });
    }

    function noop() { }

    function errorContext(cb) {
        {
            cb();
        }
    }

    var Subscriber = (function (_super) {
        __extends(Subscriber, _super);
        function Subscriber(destination) {
            var _this = _super.call(this) || this;
            _this.isStopped = false;
            if (destination) {
                _this.destination = destination;
                if (isSubscription(destination)) {
                    destination.add(_this);
                }
            }
            else {
                _this.destination = EMPTY_OBSERVER;
            }
            return _this;
        }
        Subscriber.create = function (next, error, complete) {
            return new SafeSubscriber(next, error, complete);
        };
        Subscriber.prototype.next = function (value) {
            if (this.isStopped) ;
            else {
                this._next(value);
            }
        };
        Subscriber.prototype.error = function (err) {
            if (this.isStopped) ;
            else {
                this.isStopped = true;
                this._error(err);
            }
        };
        Subscriber.prototype.complete = function () {
            if (this.isStopped) ;
            else {
                this.isStopped = true;
                this._complete();
            }
        };
        Subscriber.prototype.unsubscribe = function () {
            if (!this.closed) {
                this.isStopped = true;
                _super.prototype.unsubscribe.call(this);
                this.destination = null;
            }
        };
        Subscriber.prototype._next = function (value) {
            this.destination.next(value);
        };
        Subscriber.prototype._error = function (err) {
            try {
                this.destination.error(err);
            }
            finally {
                this.unsubscribe();
            }
        };
        Subscriber.prototype._complete = function () {
            try {
                this.destination.complete();
            }
            finally {
                this.unsubscribe();
            }
        };
        return Subscriber;
    }(Subscription));
    var SafeSubscriber = (function (_super) {
        __extends(SafeSubscriber, _super);
        function SafeSubscriber(observerOrNext, error, complete) {
            var _this = _super.call(this) || this;
            var next;
            if (isFunction(observerOrNext)) {
                next = observerOrNext;
            }
            else if (observerOrNext) {
                (next = observerOrNext.next, error = observerOrNext.error, complete = observerOrNext.complete);
                var context_1;
                if (_this && config.useDeprecatedNextContext) {
                    context_1 = Object.create(observerOrNext);
                    context_1.unsubscribe = function () { return _this.unsubscribe(); };
                }
                else {
                    context_1 = observerOrNext;
                }
                next = next === null || next === void 0 ? void 0 : next.bind(context_1);
                error = error === null || error === void 0 ? void 0 : error.bind(context_1);
                complete = complete === null || complete === void 0 ? void 0 : complete.bind(context_1);
            }
            _this.destination = {
                next: next ? wrapForErrorHandling(next) : noop,
                error: wrapForErrorHandling(error !== null && error !== void 0 ? error : defaultErrorHandler),
                complete: complete ? wrapForErrorHandling(complete) : noop,
            };
            return _this;
        }
        return SafeSubscriber;
    }(Subscriber));
    function wrapForErrorHandling(handler, instance) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            try {
                handler.apply(void 0, __spreadArray([], __read(args)));
            }
            catch (err) {
                {
                    reportUnhandledError(err);
                }
            }
        };
    }
    function defaultErrorHandler(err) {
        throw err;
    }
    var EMPTY_OBSERVER = {
        closed: true,
        next: noop,
        error: defaultErrorHandler,
        complete: noop,
    };

    var observable = (function () { return (typeof Symbol === 'function' && Symbol.observable) || '@@observable'; })();

    function identity(x) {
        return x;
    }

    function pipeFromArray(fns) {
        if (fns.length === 0) {
            return identity;
        }
        if (fns.length === 1) {
            return fns[0];
        }
        return function piped(input) {
            return fns.reduce(function (prev, fn) { return fn(prev); }, input);
        };
    }

    var Observable = (function () {
        function Observable(subscribe) {
            if (subscribe) {
                this._subscribe = subscribe;
            }
        }
        Observable.prototype.lift = function (operator) {
            var observable = new Observable();
            observable.source = this;
            observable.operator = operator;
            return observable;
        };
        Observable.prototype.subscribe = function (observerOrNext, error, complete) {
            var _this = this;
            var subscriber = isSubscriber(observerOrNext) ? observerOrNext : new SafeSubscriber(observerOrNext, error, complete);
            errorContext(function () {
                var _a = _this, operator = _a.operator, source = _a.source;
                subscriber.add(operator
                    ?
                        operator.call(subscriber, source)
                    : source
                        ?
                            _this._subscribe(subscriber)
                        :
                            _this._trySubscribe(subscriber));
            });
            return subscriber;
        };
        Observable.prototype._trySubscribe = function (sink) {
            try {
                return this._subscribe(sink);
            }
            catch (err) {
                sink.error(err);
            }
        };
        Observable.prototype.forEach = function (next, promiseCtor) {
            var _this = this;
            promiseCtor = getPromiseCtor(promiseCtor);
            return new promiseCtor(function (resolve, reject) {
                var subscription;
                subscription = _this.subscribe(function (value) {
                    try {
                        next(value);
                    }
                    catch (err) {
                        reject(err);
                        subscription === null || subscription === void 0 ? void 0 : subscription.unsubscribe();
                    }
                }, reject, resolve);
            });
        };
        Observable.prototype._subscribe = function (subscriber) {
            var _a;
            return (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber);
        };
        Observable.prototype[observable] = function () {
            return this;
        };
        Observable.prototype.pipe = function () {
            var operations = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                operations[_i] = arguments[_i];
            }
            return pipeFromArray(operations)(this);
        };
        Observable.prototype.toPromise = function (promiseCtor) {
            var _this = this;
            promiseCtor = getPromiseCtor(promiseCtor);
            return new promiseCtor(function (resolve, reject) {
                var value;
                _this.subscribe(function (x) { return (value = x); }, function (err) { return reject(err); }, function () { return resolve(value); });
            });
        };
        Observable.create = function (subscribe) {
            return new Observable(subscribe);
        };
        return Observable;
    }());
    function getPromiseCtor(promiseCtor) {
        var _a;
        return (_a = promiseCtor !== null && promiseCtor !== void 0 ? promiseCtor : config.Promise) !== null && _a !== void 0 ? _a : Promise;
    }
    function isObserver(value) {
        return value && isFunction(value.next) && isFunction(value.error) && isFunction(value.complete);
    }
    function isSubscriber(value) {
        return (value && value instanceof Subscriber) || (isObserver(value) && isSubscription(value));
    }

    var ObjectUnsubscribedError = createErrorClass(function (_super) {
        return function ObjectUnsubscribedErrorImpl() {
            _super(this);
            this.name = 'ObjectUnsubscribedError';
            this.message = 'object unsubscribed';
        };
    });

    var Subject = (function (_super) {
        __extends(Subject, _super);
        function Subject() {
            var _this = _super.call(this) || this;
            _this.closed = false;
            _this.observers = [];
            _this.isStopped = false;
            _this.hasError = false;
            _this.thrownError = null;
            return _this;
        }
        Subject.prototype.lift = function (operator) {
            var subject = new AnonymousSubject(this, this);
            subject.operator = operator;
            return subject;
        };
        Subject.prototype._throwIfClosed = function () {
            if (this.closed) {
                throw new ObjectUnsubscribedError();
            }
        };
        Subject.prototype.next = function (value) {
            var _this = this;
            errorContext(function () {
                var e_1, _a;
                _this._throwIfClosed();
                if (!_this.isStopped) {
                    var copy = _this.observers.slice();
                    try {
                        for (var copy_1 = __values(copy), copy_1_1 = copy_1.next(); !copy_1_1.done; copy_1_1 = copy_1.next()) {
                            var observer = copy_1_1.value;
                            observer.next(value);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (copy_1_1 && !copy_1_1.done && (_a = copy_1.return)) _a.call(copy_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                }
            });
        };
        Subject.prototype.error = function (err) {
            var _this = this;
            errorContext(function () {
                _this._throwIfClosed();
                if (!_this.isStopped) {
                    _this.hasError = _this.isStopped = true;
                    _this.thrownError = err;
                    var observers = _this.observers;
                    while (observers.length) {
                        observers.shift().error(err);
                    }
                }
            });
        };
        Subject.prototype.complete = function () {
            var _this = this;
            errorContext(function () {
                _this._throwIfClosed();
                if (!_this.isStopped) {
                    _this.isStopped = true;
                    var observers = _this.observers;
                    while (observers.length) {
                        observers.shift().complete();
                    }
                }
            });
        };
        Subject.prototype.unsubscribe = function () {
            this.isStopped = this.closed = true;
            this.observers = null;
        };
        Object.defineProperty(Subject.prototype, "observed", {
            get: function () {
                var _a;
                return ((_a = this.observers) === null || _a === void 0 ? void 0 : _a.length) > 0;
            },
            enumerable: false,
            configurable: true
        });
        Subject.prototype._trySubscribe = function (subscriber) {
            this._throwIfClosed();
            return _super.prototype._trySubscribe.call(this, subscriber);
        };
        Subject.prototype._subscribe = function (subscriber) {
            this._throwIfClosed();
            this._checkFinalizedStatuses(subscriber);
            return this._innerSubscribe(subscriber);
        };
        Subject.prototype._innerSubscribe = function (subscriber) {
            var _a = this, hasError = _a.hasError, isStopped = _a.isStopped, observers = _a.observers;
            return hasError || isStopped
                ? EMPTY_SUBSCRIPTION
                : (observers.push(subscriber), new Subscription(function () { return arrRemove(observers, subscriber); }));
        };
        Subject.prototype._checkFinalizedStatuses = function (subscriber) {
            var _a = this, hasError = _a.hasError, thrownError = _a.thrownError, isStopped = _a.isStopped;
            if (hasError) {
                subscriber.error(thrownError);
            }
            else if (isStopped) {
                subscriber.complete();
            }
        };
        Subject.prototype.asObservable = function () {
            var observable = new Observable();
            observable.source = this;
            return observable;
        };
        Subject.create = function (destination, source) {
            return new AnonymousSubject(destination, source);
        };
        return Subject;
    }(Observable));
    var AnonymousSubject = (function (_super) {
        __extends(AnonymousSubject, _super);
        function AnonymousSubject(destination, source) {
            var _this = _super.call(this) || this;
            _this.destination = destination;
            _this.source = source;
            return _this;
        }
        AnonymousSubject.prototype.next = function (value) {
            var _a, _b;
            (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.next) === null || _b === void 0 ? void 0 : _b.call(_a, value);
        };
        AnonymousSubject.prototype.error = function (err) {
            var _a, _b;
            (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.call(_a, err);
        };
        AnonymousSubject.prototype.complete = function () {
            var _a, _b;
            (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.complete) === null || _b === void 0 ? void 0 : _b.call(_a);
        };
        AnonymousSubject.prototype._subscribe = function (subscriber) {
            var _a, _b;
            return (_b = (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber)) !== null && _b !== void 0 ? _b : EMPTY_SUBSCRIPTION;
        };
        return AnonymousSubject;
    }(Subject));

    var BehaviorSubject = (function (_super) {
        __extends(BehaviorSubject, _super);
        function BehaviorSubject(_value) {
            var _this = _super.call(this) || this;
            _this._value = _value;
            return _this;
        }
        Object.defineProperty(BehaviorSubject.prototype, "value", {
            get: function () {
                return this.getValue();
            },
            enumerable: false,
            configurable: true
        });
        BehaviorSubject.prototype._subscribe = function (subscriber) {
            var subscription = _super.prototype._subscribe.call(this, subscriber);
            !subscription.closed && subscriber.next(this._value);
            return subscription;
        };
        BehaviorSubject.prototype.getValue = function () {
            var _a = this, hasError = _a.hasError, thrownError = _a.thrownError, _value = _a._value;
            if (hasError) {
                throw thrownError;
            }
            this._throwIfClosed();
            return _value;
        };
        BehaviorSubject.prototype.next = function (value) {
            _super.prototype.next.call(this, (this._value = value));
        };
        return BehaviorSubject;
    }(Subject));

    class LocalSessionManager {
        constructor(protocol, options = {}) {
            this.protocol = protocol;
            this.fetch = (...args) => {
                if (!this.session) {
                    throw new Error('no session');
                }
                return this.session.send(...args);
            };
            this.opts = {
                localStorageKey: options.localStorageKey ?? 'wallet-session'
            };
            this.$session = new BehaviorSubject(undefined);
        }
        get hasSession() {
            return this.session !== undefined;
        }
        async createIfNotExists() {
            if (this.session !== undefined) {
                return this.session;
            }
            const session = await this.protocol.run();
            this.setSession(session);
            return session;
        }
        removeSession() {
            this.setSession();
        }
        setSession(session) {
            this.session = session;
            if (session === undefined) {
                localStorage.removeItem('wallet-session');
            }
            else {
                const sessionJson = session.toJSON();
                localStorage.setItem('wallet-session', JSON.stringify(sessionJson));
            }
            this.$session.next(session);
        }
        async loadSession() {
            let session;
            const sessionJson = localStorage.getItem('wallet-session');
            if (sessionJson !== null) {
                session = await Session.fromJSON(this.protocol.transport, JSON.parse(sessionJson));
            }
            this.setSession(session);
        }
    }

    exports.LocalSessionManager = LocalSessionManager;
    exports.openModal = openModal;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=wallet-protocol-utils.umd.js.map
