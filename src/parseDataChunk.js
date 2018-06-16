'use strict';

/**
 *
 * @param afterDA
 * @returns {Array<Array>}
 */
function parseDataChunk(afterDA) {
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
        ffTemp.push(byte);
      } else {
        daArray.push(byte);
      }
    }
    ffArray.push(ffTemp);
  }

  return [daArray, ffArray];
}

module.exports = parseDataChunk;