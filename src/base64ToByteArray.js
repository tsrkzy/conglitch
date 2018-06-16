'use strict';

import {reversedBase64Map} from './base64Util';

function base64ToByteArray(base64String) {
  if (typeof  base64String !== 'string') {
    throw new Error('argument type miss match');
  }

  /* peel MIME type */
  const base64 = /([a-zA-Z0-9+\/]+)=+$/.exec(base64String)[1];

  const bytes = [];
  const len = base64.length;
  let prev;
  for (let i = 0; i < len; i++) {
    const current = reversedBase64Map[base64.charAt(i)];
    const digitNum = i % 4;
    /*
     * base64 is 2^6, byte is 2^8, every 4 base64 values create three bytes
     * @refs https://github.com/mutaphysis/smackmyglitchupjs/blob/master/glitch.html
     *
     * 4 base64 == 3 bytes
     * digit(桁):     [0]       [1]         [2]        [3]
     * base64   : | 012345 | 01   2345 | 0123   45 | 012345 |
     * bytes    : | 012345   01 | 2345   0123 | 45   012345 |
     */
    switch (digitNum) {
      case 0:
        break;
      case 1:
        bytes.push(prev << 2 | current >> 4);
        break;
      case 2:
        bytes.push((prev & 0x0f) << 4 | current >> 2);
        break;
      case 3:
        bytes.push((prev & 3) << 6 | current);
        break;
      default:
        break;
    }
    prev = current;
  }

  return bytes;
}

module.exports = base64ToByteArray;