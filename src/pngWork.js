"use strict";

import PNG_Container from "./PNG_Container";

onmessage = (e) => {
  const {dataUrl, taskPerProcess} = e.data;

  const pAll = [];
  for(let i = 0; i < taskPerProcess; i++) {
    const p = new Promise((resolve) => {
      const png = new PNG_Container(dataUrl);
      png.parse()
        .then(() => {
          png.glitch();
          png.build()
            .then(() => {
              const newDataUrl = png.toDataUrl();
              resolve(newDataUrl);
            });
        });
    });
    pAll.push(p);
  }

  Promise.all(pAll).then((newDataUrlArray) => {
    postMessage(newDataUrlArray);
  })
};