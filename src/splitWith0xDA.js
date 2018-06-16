'use strict';

/**
 *
 * @param bytes
 * @returns {Array<Array>}
 */
function splitWith0xDA(bytes) {
  const beforeDA = [];
  const afterDA = [];
  let indexDA = void 0;
  let find = false;
  for (let i = 0; i < bytes.length; i++) {
    let byte = bytes[i];
    let next = bytes[i + 1];
    if (!find && byte === 0xFF && next === 0xDA) {
      indexDA = i;
      find = true;
    }
    if (!find) {
      beforeDA.push(byte);
    } else {
      afterDA.push(byte);
    }
  }

  return [beforeDA, afterDA];
}

module.exports = splitWith0xDA;