'use strict';

import React from 'react';
import {
  base64map,
  reversedBase64Map
} from './base64Util.js';
import base64ToByteArray from './base64ToByteArray.js';
import splitWith0xDA from './splitWith0xDA.js';
import parseDataChunk from './parseDataChunk.js';
import byteArrayToBase64 from './byteArrayToBase64.js';

window.onload = () => {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const image = new Image();
  image.src = './lena_512.jpg';
  image.onload = () => {
    ctx.drawImage(image, 0, 0);
    const base64Full = canvas.toDataURL('image/jpeg');
    const bytes = base64ToByteArray(base64Full);
    const [beforeDA, afterDA] = splitWith0xDA(bytes);
    const [daArray, ffArray] = parseDataChunk(afterDA);

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
    const glitchedDataURL = byteArrayToBase64(glitchedByteArray);

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