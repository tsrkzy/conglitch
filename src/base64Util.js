'use strict';

const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const base64map = base64Chars.split('');
const reversedBase64Map = {};
base64map.forEach((v, i) => {
  reversedBase64Map[v] = i;
});

module.exports = {
  base64map,
  reversedBase64Map
};