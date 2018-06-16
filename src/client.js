'use strict';

import React from 'react';

window.onload = () => {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const image = new Image();
  image.src = './lena_512.jpg';
  image.onload = () => {
    ctx.drawImage(image, 0, 0);
    const base64Full = canvas.toDataURL('image/jpeg');
    const base64 = base64Full.split(',')[1];
    const bytes = [];
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const base64map = base64Chars.split('');
    const reversedBase64Map = {};
    base64map.forEach((v, i) => {
      reversedBase64Map[v] = i;
    });

    const len = base64.length;
    let prev;
    for (let i = 0; i < len; i++) {
      const current = reversedBase64Map[base64.charAt(i)];
      const digitNum = i % 4;
      /*
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

    let length, blength, alength;
    length = bytes.length;

    const beforeDA = [];
    const afterDA = [];
    let indexDA = void 0;
    let find = false;
    for (let i = 0; i < bytes.length; i++) {
      let byte = bytes[i];
      let next = bytes[i + 1];
      if (!find && byte === 0xFF && next === 0xDA) {
        indexDA = i;
        find = true;
      }
      if (!find) {
        beforeDA.push(byte);
      } else {
        afterDA.push(byte);
      }
    }

    blength = beforeDA.length;
    alength = afterDA.length;


    // console.log(length, blength, alength, length === (blength + alength)); // @DELETEME
    const dump = [];
    const daArray = [];
    const ffArray = [];
    {
      let ffTemp = [];
      let find = false;
      for (let i = 0; i < afterDA.length; i++) {
        let byte = afterDA[i];
        let next = afterDA[i + 1];
        if (byte === 0xFF && next === 0x00) {
          if (find) {
            ffArray.push(ffTemp);
          }
          find = true;
          ffTemp = [];
        }

        if (find) {
          // ffTemp.push(d2h(byte));
          ffTemp.push(byte);
          dump.push(byte);
        } else {
          daArray.push(byte);
          dump.push(byte);
        }
      }
      ffArray.push(ffTemp);
    }


    // const glitchedByteArray = beforeDA.concat(dump);// 4795
    const glitchedByteArray = beforeDA.concat(daArray);
    for (let i = 0; i < ffArray.length; i++) {
      let ff = ffArray[i];
      for (let j = 0; j < ff.length; j++) {

        /* flip order */
        // const k = ff.length - 1 - j;
        // let f = ff[k];

        let f = ff[j];
        glitchedByteArray.push(f);
      }
    }
    // const glitchedByteArray = beforeDA.concat(afterDA);
    console.log(glitchedByteArray); // @DELETEME
    console.log(glitchedByteArray.length, daArray.length, ffArray.length); // @DELETEME

    let byteNum;
    let previousByte;
    const result = ['data:image/jpeg;base64,'];
    for (let i = 0, len = glitchedByteArray.length; i < len; i++) {
      const current = glitchedByteArray[i];
      byteNum = i % 3;

      switch (byteNum) {
        case 0: // first byte
          result.push(base64map[current >> 2]);
          break;
        case 1: // second byte
          result.push(base64map[(previousByte & 3) << 4 | (current >> 4)]);
          break;
        case 2: // third byte
          result.push(base64map[(previousByte & 0x0f) << 2 | (current >> 6)]);
          result.push(base64map[current & 0x3f]);
          break;
      }

      previousByte = current;
    }

    if (byteNum === 0) {
      result.push(base64map[(previousByte & 3) << 4]);
      result.push('==');
    } else {
      if (byteNum === 1) {
        result.push(base64map[(previousByte & 0x0f) << 2]);
        result.push('=');
      }
    }

    const glitchedDataURL = result.join('');
    const img = new Image();
    img.src = glitchedDataURL;
    img.onload = () => {
      const body = document.body;
      body.appendChild(img);
    };
  };
};

function d2h(decimal) {
  let hex = `0x${decimal.toString(16).toUpperCase()}`;
  return hex;
}