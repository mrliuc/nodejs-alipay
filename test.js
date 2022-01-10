const fs = require('fs');
const Alipay = require('./index');

const pay = new Alipay({
    rquestUrl: 'https://openapi.alipaydev.com/gateway.do',
    app_id: 'XXXXXXX',
    return_url: 'http://XXXXX/alipay_return',
    notify_url: 'http://XXXXX/bl/alipay_notify',
    app_private_key: fs.readFileSync('./pem/private_2048.txt'), // 支付宝商户应用私钥
    alipay_public_key: fs.readFileSync('./pem/public_2048.txt'),
});

const paramStr = pay.buildSignOrderParam({
    boby: '余额充值',
    subject: '余额充值',
    out_trade_no: new Date().getTime(),
    total_amount: 1,
    product_code: 'FAST_INSTANT_TRADE_PAY',
});

console.log(paramStr);
