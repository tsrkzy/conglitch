'use strict';


/**
 * @param base64
 * @return {Promise}
 */
const convertToPNG = function (base64) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const {width, height} = img;
      const canvas = document.createElement('CANVAS');
      canvas.width = width;
      canvas.height = height;
      const x = canvas.getContext('2d');
      x.drawImage(img, 0, 0);
      const convertedBase64 = canvas.toDataURL('image/png');

      resolve(convertedBase64);
    };
  })
};
const convertToJPEG = function (base64) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const {width, height} = img;
      const canvas = document.createElement('CANVAS');
      canvas.width = width;
      canvas.height = height;
      const x = canvas.getContext('2d');
      x.drawImage(img, 0, 0);
      const convertedBase64 = canvas.toDataURL('image/jpeg', 1);

      resolve(convertedBase64);
    };
  })
};

const convertToHalf = function (base64){
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const {width, height} = img;
      const canvas = document.createElement('CANVAS');
      canvas.width = width;
      canvas.height = height;
      const x = canvas.getContext('2d');
      x.drawImage(img, 0, 0);
      const convertedBase64 = canvas.toDataURL('image/jpeg', 1);

      resolve(convertedBase64);
    };
  })
};

module.exports = {convertToJPEG, convertToPNG};