'use strict';

/*
 *
 */

/**
 *
 * @param ffArray
 * @param iSkip
 * @param jSkip
 * @returns {Array}
 */
function corrupt(ffArray, iSkip = [], jSkip = []) {
  const glitchedFFArray = [];
  for (let i = 0; i < ffArray.length; i++) {
    let ff = [].concat(ffArray[i]);
    if (iSkip.indexOf(i) !== -1) {
      continue;
    }
    for (let j = 0; j < ff.length; j++) {
      let f = ff[j];
      if (jSkip.indexOf(j) !== -1) {
        continue;
      }
      glitchedFFArray.push(f);
    }
  }

  return glitchedFFArray;
}


module.exports = corrupt;