"use strict";

import JPEG_Container from "./JPEG_Container";

onmessage = (e) => {
  const {dataUrl, taskPerProcess} = e.data;

  const pAll = [];
  for(let i = 0; i < taskPerProcess; i++) {
    const p = new Promise((resolve) => {
        const jpeg = new JPEG_Container(dataUrl);
        jpeg.parse();
        jpeg.glitchShuffle();
        jpeg.glitch();
        jpeg.build();
        const newDataUrl = jpeg.toDataUrl();
        resolve(newDataUrl);
      }
    );
    pAll.push(p);
  }

  Promise.all(pAll).then((newDataUrlArray) => {
    postMessage(newDataUrlArray);
  })
};