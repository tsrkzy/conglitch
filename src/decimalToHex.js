'use strict';

function decimalToHex(decimal) {
  const h = decimal.toString(16).toUpperCase();
  const hex = h.padStart(2, '0');

  return hex;
}

module.exports = decimalToHex;