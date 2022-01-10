"use strict";

/* eslint-disable camelcase */

/* eslint-disable no-param-reassign */

/* eslint-disable guard-for-in */

/* eslint-disable prefer-rest-params */

/* eslint-disable no-prototype-builtins */

/* eslint-disable no-var */
var request = require('request');

var querystr = require('querystring');

var util = require('./util'); // eslint-disable-next-line


exports = module.exports = Payment;

function Payment() {
  if (!(this instanceof Payment)) {
    // eslint-disable-next-line prefer-rest-params
    return new Payment(arguments[0]);
  }

  this.requestUrl = 'https://openapi.alipay.com/gateway.do'; // eslint-disable-next-line prefer-rest-params

  this.options = arguments[0];
  this.options.charset = this.options.charset || 'utf-8';
  this.options.sign_type = this.options.sign_type || 'RSA2';
  this.options.version = this.options.version || '1.0';
  this.requestUrl = this.options.requestUrl || this;
  this.alipayCommonParam = {
    app_id: this.options.app_id,
    charset: this.options.charset,
    sign_type: this.options.sign_type,
    version: this.options.version,
    notify_url: this.options.notify_url,
    return_url: this.options.return_url
  };
}

Payment.mix = function () {
  switch (arguments.length) {
    case 1:
      {
        var obj = arguments[0]; // eslint-disable-next-line guard-for-in

        for (var key in obj) {
          if (Payment.prototype.hasOwnProperty(key)) {
            throw new Error("Prototype method exist. method: ".concat(key));
          }

          Payment.prototype[key] = obj[key];
        }

        break;
      }

    case 2:
      {
        var _key = arguments[0].toString();

        var fn = arguments[1];

        if (Payment.prototype.hasOwnProperty(_key)) {
          throw new Error("Prototype method exist. method: ".concat(_key));
        }

        Payment.prototype[_key] = fn;
      }
      break;

    default:
      break;
  }
};

Payment.mix('option', function (option) {
  for (var k in option) {
    this.options[k] = option[k];
  }
});
Payment.mix('sign', function (param) {
  var sign = util.sign(param, this.options.app_private_key, this.options.charset, this.options.sign_type);
  return sign;
});
Payment.mix('verify', function (param) {
  var result = util.verify(param, this.options.alipay_public_key, this.options.charset, this.options.sign_type);
  return result;
});
Payment.mix('buildSignOrderParam', function (opts) {
  var param = {};
  param.method = 'alipay.trade.page.pay'; // , 'alipay.trade.app.pay';

  param.timestamp = opts.timestamp || util.formatDate(Date.now()); // param.nonce_str = opts.nonce_str || util.generateNonceString();

  param.biz_content = opts;
  util.mix(param, this.alipayCommonParam);
  var str = util.buildQueryString(param, true);
  str += "&sign=".concat(querystr.escape(this.sign(param))); // console.log('--------------')
  // console.log(str)

  return str;
});
Payment.mix('createUnifiedOrder', function (opts, fn) {
  opts.method = 'alipay.trade.app.pay';
  opts.timestamp = opts.timestamp || util.formatDate(Date.now()); // opts.nonce_str = opts.nonce_str || util.generateNonceString();

  util.mix(opts, this.alipayCommonParam);
  opts.sign = this.sign(opts); // console.log(opts);

  request({
    url: this.requestUrl,
    method: 'POST',
    body: util.buildXML(opts),
    agentOptions: {
      pfx: this.options.pfx,
      passphrase: this.options.mch_id
    }
  }, function (err, response, body) {
    // console.log(err, body);
    util.parseXML(body, fn);
  });
});
Payment.mix('notify', function (callback) {
  return function (req, res, next) {
    var _this = this;

    res.success = function () {
      res.end('success');
    };

    res.fail = function () {
      res.end('fail');
    };

    util.pipe(req, function (err, data) {
      console.log(err);
      console.log('notify:', data);
      var xml = data.toString('utf8');
      util.parseXML(xml, function (e, msg) {
        if (e) {
          console.error(e);
        }

        req.alipayMessage = msg;
        callback.apply(_this, [msg, req, res, next]);
      });
    });
  };
});
Payment.mix('buildFundAccountQuery', function (userId) {
  var param = {};
  param.method = 'alipay.fund.account.query';
  param.timestamp = util.formatDate(Date.now()); // param.nonce_str = opts.nonce_str || util.generateNonceString();

  param.biz_content = {
    alipay_user_id: userId,
    account_type: 'ACCTRANS_ACCOUNT'
  };
  util.mix(param, this.alipayCommonParam);
  var str = util.buildQueryString(param, true);
  str += "&sign=".concat(querystr.escape(this.sign(param)));
  return str;
});