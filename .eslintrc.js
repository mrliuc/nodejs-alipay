module.exports = {
    env: {
        commonjs: true,
        es6: true,
        node: true,
    },
    extends: [
        'airbnb-base',
    ],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
    },
    parserOptions: {
        ecmaVersion: 2018,
    },
    rules: {
        indent: ['error', 4], // 4个空格
        semi: ['error', 'always'], // 行尾分号
        'linebreak-style': ['error', 'windows'],
        'prefer-destructuring': ['error', { object: false, array: false }],
        radix: ['error', 'as-needed'],
        'no-restricted-syntax': 0,
        'no-continue': 0,
        'max-len': ['error', { code: 400 }],
        'no-await-in-loop': 0,
        'consistent-return': 0, // ['error',{'treatUndefinedAsUnspecified':true}]
        'no-console': ['error', { allow: ['log', 'warning', 'error'] }],
        'no-underscore-dangle': 0, // ["error", { "allowAfterThis": true }],
        'no-unused-expressions': ['error', { allowShortCircuit: true }],
        'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],

    },
};
