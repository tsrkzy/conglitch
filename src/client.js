'use strict';

import React from 'react';
import base64ToByteArray from './base64ToByteArray.js';
import splitWith0xDA from './splitWith0xDA.js';
import parseDataChunk from './parseDataChunk.js';
import byteArrayToBase64 from './byteArrayToBase64.js';
import corrupt from './corrupt.js';
import PNG_Container from './PNG_Container.js';

window.onload = () => {
  const image = new Image();
  // image.src = './lena_512.jpg';
  // image.src = './lena_256.png';
  // image.src = './test_256.png';
  // image.src = './test.jpeg';
  image.src = './olympus_01_300.jpg';
  // image.src = './olympus_01_cloned.jpg';
  image.onload = () => {
    const { width, height } = image;
    console.log('image:',width,height); // @DELETEME
    const canvas = document.getElementById('c');
    canvas.style.width = width;
    canvas.style.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    /* PNG */
    const base64Full = canvas.toDataURL('image/png');
    const img = new Image();
    pngGlitch(base64Full)
      .then((png) => {
        const dataUrl = png.toDataUrl();
        const { width, height } = png;
        console.log(dataUrl);
        img.src = dataUrl;
        img.width = width;
        img.height = height;
        img.onload = () => {
          console.log('loaded!!');
          const body = document.body;
          body.appendChild(img);
        };
      })
      .catch((e) => {
        throw e;
      });

    function pngGlitch(base64) {
      const byteArray = base64ToByteArray(base64);
      const png = new PNG_Container(byteArray);
      return new Promise((resolve) => {
        png.parse()
          .then(() => {
            console.log(png);
            png.build();

            resolve(png);
          })
          .catch((e) => {
            throw e;
          });
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