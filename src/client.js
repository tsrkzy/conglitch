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
    /* PNG */
    const base64Full = canvas.toDataURL('image/png');
    console.log(base64Full); // @DELETEME
    const img = new Image();
    const glitchedDataURL = pngGlitch(base64Full);
    img.src = glitchedDataURL;
    img.width = 256;
    img.onload = () => {
      const body = document.body;
      body.appendChild(img);
    };

    function pngGlitch(base64) {
      const byteArray = base64ToByteArray(base64);
      splitWith0x490x440x410x54IDAT(byteArray);
      const glitchedByteArray = byteArray;
      const glitchedBase64 = byteArrayToBase64(glitchedByteArray);

      return glitchedBase64;
    }

    function splitWith0x490x440x410x54IDAT(byteArray) {
      const header = [];
      const idatArray = [];
      let writeIndex = 0;
      let find = false;
      for (let i = 0; i < byteArray.length; i++) {
        let byte0 = byteArray[i + 0];
        let byte1 = byteArray[i + 1];
        let byte2 = byteArray[i + 2];
        let byte3 = byteArray[i + 3];
        const findTest =
          byte0 === 0x49
          && byte1 === 0x44
          && byte2 === 0x41
          && byte3 === 0x54;

        if (findTest) {
          if (find) {
            writeIndex++;
          }
          find = true;
        }
        if (!find) {
          header.push(byte0);
        } else {
          idatArray[writeIndex] = idatArray[writeIndex] || [];
          const idat = idatArray[writeIndex];
          idat.push(byte0);
        }
      }
      console.log(idatArray); // @DELETEME
      const sample = idatArray[0];
      sample.splice(0, 4);
      sample.splice(sample.length - 4, 4);
      console.log(sample); // @DELETEME
      const inflate = new Zlib.Inflate(sample);
      const plain = inflate.decompress();
      console.log(plain); // @DELETEME
    }

    /* JPEG glitch */
    // const base64Full = canvas.toDataURL('image/jpeg');
    // const iMax = 10;
    // const jMax = 10;
    // for (let i = 0; i < iMax; i++) {
    //   for (let j = 0; j < jMax; j++) {
    //     const iSkip = [i];
    //     const jSkip = [j];
    //     const option = { iSkip, jSkip };
    //
    //     const glitchedDataURL = glitch(base64Full, option);
    //
    //     const img = new Image();
    //     img.src = glitchedDataURL;
    //     img.width = 128;
    //     img.onload = () => {
    //       const body = document.body;
    //       body.appendChild(img);
    //     };
    //   }
    // }
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