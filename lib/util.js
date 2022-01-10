/* eslint-disable camelcase */
/* eslint-disable guard-for-in */
/* eslint-disable prefer-rest-params */
/* eslint-disable no-use-before-define */
const xml2js = require('xml2js');
const crypt = require('crypto');
const moment = require('moment');
const querystr = require('querystring');

exports.buildXML = function (json) {
    const xmlBody = `${Object.keys(json).sort().filter((key) => json[key] !== undefined && json[key] !== '' && ['pfx', 'partner_key', 'sign', 'key'].indexOf(key) < 0).map((key) => `<${key}>${json[key]}</${key}>`)
        .join('')}<sign>${json.sign}</sign>`;
    return `<xml>${xmlBody}</xml>`;
    // var builder = new xml2js.Builder();
    // return builder.buildObject(json);
};

exports.parseXML = function (xml, fn) {
    const parser = new xml2js.Parser({ trim: true, explicitArray: false, explicitRoot: false });
    parser.parseString(xml, fn || (() => {}));
};

exports.parseRaw = function () {
    return function (req, res, next) {
        const buffer = [];
        req.on('data', (trunk) => {
            buffer.push(trunk);
        });
        req.on('end', () => {
            req.rawbody = Buffer.concat(buffer).toString('utf8');
            next();
        });
        req.on('error', (err) => {
            next(err);
        });
    };
};

exports.pipe = function (stream, fn) {
    const buffers = [];
    stream.on('data', (trunk) => {
        buffers.push(trunk);
    });
    stream.on('end', () => {
        fn(null, Buffer.concat(buffers));
    });
    stream.once('error', fn);
};

exports.mix = function () {
    const root = arguments[0];
    if (arguments.length === 1) {
        return root;
    }
    for (let i = 1; i < arguments.length; i++) {
        for (const k in arguments[i]) {
            root[k] = arguments[i][k];
        }
    }
    return root;
};

exports.generateNonceString = function (length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const maxPos = chars.length;
    let noceStr = '';
    for (let i = 0; i < (length || 32); i++) {
        noceStr += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return noceStr;
};

exports.formatDate = function (dt, format) {
    return moment(dt).format(format || 'YYYY-MM-DD HH:mm:ss');
};

exports.sign = function (param, privateKey, charset, signType) {
    if (!param) {
        throw new Error('missing param');
    }
    if (!privateKey) {
        throw new Error('missing private key');
    }

    let str = exports.buildQueryString(param);

    switch (signType) {
    case 'MD5':
        str += `&key=${privateKey}`;
        return crypt.createHash('md5').update(str, charset).digest('hex').toUpperCase();
    case 'RSA':
        return rsa_sha1_Sign(str, privateKey, charset);
    case 'RSA2':
        return rsa_sha256_Sign(str, privateKey, charset);
    default:
        return rsa_sha256_Sign(str, privateKey, charset);
    }
};

exports.verify = function (param, publicKey, charset, signType) {
    if (!param) {
        throw new Error('missing param');
    }
    if (!publicKey) {
        throw new Error('missing public key');
    }

    const str = exports.buildQueryString(param);
    switch (signType) {
    case 'MD5':
    {
        const sign = exports.sign(param, publicKey, charset, 'MD5');
        return sign === param.sign;
    }
    case 'RSA':
        return rsa_sha1_verify(str, param.sign, publicKey, charset);
    case 'RSA2':
        return rsa_sha256_verify(str, param.sign, publicKey, charset);
    default:
        return rsa_sha256_verify(str, param.sign, publicKey, charset);
    }
};

exports.buildQueryString = function (param, encodeValue) {
    const str = Object.keys(param).filter((key) => param[key] !== undefined && param[key] !== '' && ['app_private_key', 'partner_key', 'sign', 'key'].indexOf(key) < 0).sort().map((key) => {
        let val = param[key];
        if (typeof val === 'object') {
            let val_str = JSON.stringify(val);
            if (encodeValue) {
                val_str = querystr.escape(val_str);
            }
            return `${key}=${val_str}`;
        }
        if (encodeValue) {
            val = querystr.escape(val);
        }
        return `${key}=${val}`;
    })
        .join('&');
    return str;
};

function rsa_sha1_Sign(strParam, privateKey, charset) {
    const signer = crypt.createSign('RSA-SHA1');
    signer.update(strParam, charset);
    const sign = signer.sign(privateKey.toString(charset), 'base64');
    return sign;
}

function rsa_sha256_Sign(strParam, privateKey, charset) {
    const signer = crypt.createSign('RSA-SHA256');
    // console.log(strParam)
    signer.update(strParam, charset);
    const sign = signer.sign(privateKey.toString(charset), 'base64');
    return sign;
}

function rsa_sha1_verify(strParam, sign, publicKey, charset) {
    const verify = crypt.createVerify('RSA-SHA1');
    verify.update(strParam, charset);
    const result = verify.verify(publicKey.toString(charset), sign, 'base64');
    return result;
}

function rsa_sha256_verify(strParam, sign, publicKey, charset) {
    const result = crypt.createVerify('RSA-SHA256').update(strParam, charset).verify(publicKey.toString(), sign, 'base64');
    return result;
}
