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
import zlib from 'zlib';
import DataPNG from './DataPNG.js'

window.onload = () => {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const image = new Image();
  // image.src = './lena_512.jpg';
  image.src = './test_256.png';
  image.onload = () => {
    ctx.drawImage(image, 0, 0);
    /* PNG */
    const base64Full = canvas.toDataURL('image/png');
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
      const png = new DataPNG(byteArray);
      png.parse()
        .then(() => {
          console.log(png);
        })
        .catch(() => {
          throw e;
        });
      return false;
      
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
        let byte = byteArray[i];
        let byte4 = byteArray[i + 4];
        let byte5 = byteArray[i + 5];
        let byte6 = byteArray[i + 6];
        let byte7 = byteArray[i + 7];
        const findTest =
          byte4 === 0x49 // 73 > I
          && byte5 === 0x44 // 68 > D
          && byte6 === 0x41 // 65 > A
          && byte7 === 0x54; // 84 > T

        if (findTest) {
          if (find) {
            writeIndex++;
          }
          find = true;
        }
        if (!find) {
          header.push(byte);
        } else {
          idatArray[writeIndex] = idatArray[writeIndex] || [];
          const idat = idatArray[writeIndex];
          idat.push(byte);
        }
      }

      let idatChunks = [];
      for (let i = 0; i < idatArray.length; i++) {
        let idat = idatArray[i];
        const sizHexDigit0 = idat[0];
        const sizHexDigit1 = idat[1];
        const sizHexDigit2 = idat[2];
        const sizHexDigit3 = idat[3];
        /*
         * | LENGTH | TYPE | CHUNK  | CRC |
         * | 4      | 4    | LENGTH | 4   |
         * TOTAL = LENGTH + 12 bytes
         */
        const sizLength = 4;
        const sizType = 4;
        const sizChunk = (sizHexDigit0 << 24 | sizHexDigit1 << 16 | sizHexDigit2 << 8 | sizHexDigit3) >>> 0;
        const sizCrc = 4;
        const sizTotal = sizChunk + sizLength + sizType + sizCrc;

        const offsetOfChunkStart = sizLength + sizType;
        // console.log('siz(LENGTH, TYPE, CHUNK, CRC, TOTAL):', sizLength, sizType, sizChunk, sizCrc, sizTotal); // @DELETEME
        const data = [];
        let _j;
        for (_j = 0; _j < sizChunk; _j++) {
          let j = _j + offsetOfChunkStart;
          let d = idat[j];
          data.push(d);
        }

        idatChunks = idatChunks.concat(data);
      }

      // console.log(`chunks: ${idatArray.length}`, idatChunks);

      const data = new Uint8Array(idatChunks);

      zlib.inflate(data, (e, imageData) => {
        if (e) {
          console.error(e);
        }
        const height = 256;
        const width = 256;
        const bitPerPixel = 4;
        for (let i_h = 0; i_h < height; i_h++) {
          const rowHead = (i_h * (width * bitPerPixel + 1));
        }

      });
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