'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import base64ToByteArray from './base64ToByteArray.js';
import corrupt from './corrupt.js';
import PNG_Container from './PNG_Container.js';
import JPEG_Container from './JPEG_Container.js';
import Container from './Container.jsx';

window.onload = () => {

  const el = document.getElementById('container');
  ReactDOM.render(
    <Container></Container>,
    el
  );

  const image = new Image();
  // image.src = './lena_512.jpg';
  // image.src = './lena_256.png';
  // image.src = './test_256.png';
  // image.src = './test.jpeg';
  image.src    = './olympus_01_300.jpg';
  // image.src = './olympus_01_cloned.jpg';
  image.onload = () => {
    const {width, height} = image;
    console.log('image:', width, height); // @DELETEME
    const canvas        = document.getElementById('c');
    canvas.width = width;
    canvas.height = height;
    const ctx           = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    /* PNG */
    // const base64Full = canvas.toDataURL('image/png');
    // const img = new Image();
    // pngGlitch(base64Full)
    //   .then((png) => {
    //     const dataUrl = png.toDataUrl();
    //     const { width, height } = png;
    //     console.log(dataUrl);
    //     img.src = dataUrl;
    //     img.width = width;
    //     img.height = height;
    //     img.onload = () => {
    //       console.log('loaded!!');
    //       const body = document.body;
    //       body.appendChild(img);
    //     };
    //   })
    //   .catch((e) => {
    //     throw e;
    //   });
    //
    // function pngGlitch(base64) {
    //   const byteArray = base64ToByteArray(base64);
    //   const png = new PNG_Container(byteArray);
    //   return new Promise((resolve) => {
    //     png.parse()
    //       .then(() => {
    //         console.log(png);
    //         png.build();
    //
    //         resolve(png);
    //       })
    //       .catch((e) => {
    //         throw e;
    //       });
    //   });
    // }

    (() => {
        const base64Full = canvas.toDataURL('image/jpeg');
        const byteArray = base64ToByteArray(base64Full);
        const jpeg = new JPEG_Container(byteArray);
        jpeg.parse();
        jpeg.build();
        {
          const { byteArray, dest } = jpeg;
          for (let i = 0; i < byteArray.length; i++) {
            let b = byteArray[i];
            if (b !== dest[i]) {
              console.log(i, b, dest[i]);
              break;
            }
          }
        }

        const dataUrl = jpeg.toDataUrl();

        const img = new Image();
        img.src = dataUrl;
        img.width = width;
        img.height = height;
        img.onload = () => {
          const body = document.body;
          body.appendChild(img);
        };
      }
    )();
  };
};