'use strict';

import {base64map} from './base64Util';

function byteArrayToBase64(byteArray) {
  console.log(byteArray); // @DELETEME
  if (!(byteArray instanceof Array)) {
    throw new Error('argument type miss match');
  }

  let byteNum;
  let previousByte;
  const base64Array = ['data:image/jpeg;base64,'];

  for (let i = 0, len = byteArray.length; i < len; i++) {
    const current = byteArray[i];
    byteNum = i % 3;

    switch (byteNum) {
      case 0:
        /* first byte */
        base64Array.push(base64map[current >> 2]);
        break;
      case 1:
        /* second byte */
        base64Array.push(base64map[(previousByte & 3) << 4 | (current >> 4)]);
        break;
      case 2:
        /* third byte */
        base64Array.push(base64map[(previousByte & 0x0f) << 2 | (current >> 6)]);
        base64Array.push(base64map[current & 0x3f]);
        break;
    }
    previousByte = current;
  }

  if (byteNum === 0) {
    base64Array.push(base64map[(previousByte & 3) << 4]);
    base64Array.push('==');
  } else {
    if (byteNum === 1) {
      base64Array.push(base64map[(previousByte & 0x0f) << 2]);
      base64Array.push('=');
    }
  }
  const dataUrl = base64Array.join('');

  return dataUrl;
}

module.exports = byteArrayToBase64;