'use strict';

var SALT = 'YjBjNWM4YjJkODBlMzJmOWYzOWY4ZDgxY2VkODdiNWI5OTgxMDE4MjFhZjcwMWM2M2Q';
var B64_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' + '0123456789' + '+/'; // 64 chars
// Below are 2 predefined sets of chars that will appear in the final password
var CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' + '0123456789' + '~`!@#$%^&*()_-+={[}]|:;<,>.?/'; // 91 chars
var CHARS_WEAKER = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' + '0123456789' + '~!@#$%&_-+=?'; // 74 chars

function logBytesAsHex(str) {
    var len = str.length;
    var result = '';
    for (var i = 0; i < len; i++) {
        result += str.charCodeAt(i).toString(16);
    }
    console.log(result);
}

function assertTargetLength(len) {
    if ([16, 24, 32].indexOf(len) === -1) {
        throw new Error('targetLength should be 16, 24, or 32');
    }
}

function getDigestBytes(variant, text, inputFormat, outputFormat) {
    var r;
    if ('undefined' === typeof inputFormat) {
        inputFormat = 'BYTES';
    }
    if ('undefined' === typeof outputFormat) {
        outputFormat = 'BYTES';
    }
    r = new jsSHA(variant, inputFormat);
    r.update(text);
    return r.getHash('BYTES');
}

function preprocess(password, key, targetLength) {
    var r;
    // The underlying function in jsSHA by default uses UTF-8
    r = getDigestBytes('SHA-512', SALT + password + key, 'TEXT');
    r = getDigestBytes('SHA-512', SALT + r);
    r = getDigestBytes('SHA-512', SALT + r);

    assertTargetLength(targetLength);
    switch (targetLength) {
        case 16:
            r = getDigestBytes('SHA-1', SALT + r);
            break;
        case 24:
            r = getDigestBytes('SHA-256', SALT + r);
            break;
        case 32:
            r = getDigestBytes('SHA-512', SALT + r);
            break;
        default:
            throw new Error('targetLength should be 16, 24, or 32');
    }
    return r;

}

function generateAlphabet(preprocessed, charsAvail) {
    var rules = getDigestBytes('SHA-512', SALT + preprocessed);
    var alphabet = [];
    var lenChars = charsAvail.length;
    for (var i = 0; i < 64; i++) {
        var f = rules.charCodeAt(i) % lenChars;
        alphabet[i] = charsAvail[f];
    }
    return alphabet;
}

function finalise(preprocessed, alphabet, targetLength) {
    assertTargetLength(targetLength);
    var original = Base64.btoa(preprocessed);
    var ret = '';
    for (var i = 0; i < targetLength; i++) {
        var char = original.charAt(i);
        var index = B64_ALPHABET.indexOf(char);
        char = alphabet[index];
        ret += char;
    }
    return ret;
}

function gpw(password, key, targetLength, charsAvail) {
    if ('undefined' === typeof targetLength) {
        targetLength = 16;
    }
    if ('undefined' === typeof charsAvail) {
        charsAvail = CHARS;
    }
    assertTargetLength(targetLength);
    var p = preprocess(password, key, targetLength);
    var a = generateAlphabet(p, charsAvail);
    return finalise(p, a, targetLength);
}