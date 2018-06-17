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
import corrupt from './corrupt.js';

window.onload = () => {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const image = new Image();
  image.src = './lena_512.jpg';
  image.onload = () => {
    ctx.drawImage(image, 0, 0);
    const base64Full = canvas.toDataURL('image/jpeg');
    const iMax = 10;
    const jMax = 10;
    for (let i = 0; i < iMax; i++) {
      for (let j = 0; j < jMax; j++) {
        const iSkip = [i];
        const jSkip = [j];
        const option = { iSkip, jSkip };

        const glitchedDataURL = glitch(base64Full, option);

        const img = new Image();
        img.src = glitchedDataURL;
        img.width = 128;
        img.onload = () => {
          const body = document.body;
          body.appendChild(img);
        };
      }
    }
  };
};

function d2h(decimal) {
  let hex = `0x${decimal.toString(16).toUpperCase()}`;
  return hex;
}

function glitch(dataUrl, option) {
  const { iSkip = [], jSkip = [] } = option;
  const bytes = base64ToByteArray(dataUrl);
  const [beforeDA, afterDA] = splitWith0xDA(bytes);
  const [daArray, ffArray] = parseDataChunk(afterDA);
  const headerArray = beforeDA.concat(daArray);

  const glitchedFFArray = corrupt(ffArray, iSkip, jSkip);
  const glitchedArray = headerArray.concat(glitchedFFArray);
  const glitchedDataURL = byteArrayToBase64(glitchedArray);

  return glitchedDataURL;
}