'use strict';

function crc32(byteArray = []) {
  const start = 0;
  const end = byteArray.length;
  const crc = calcCRC32(byteArray, start, end);

  return crc;
}

/**
 * 255 -> [0, 0, 15, 15]
 *
 * @param {number} decimal
 * @returns {Array<number>} - hexDecimal Array
 */
function intBytes(decimal) {
  return [(decimal >>> 24) & 0xFF, (decimal >>> 16) & 0xFF, (decimal >>> 8) & 0xFF, decimal & 0xFF];
}

/**
 * 配列形式の4桁の10進数表記の16進数を、10進数へ変換する
 * @param {Array<number>} hex
 * @return {number}
 */
function intBytesToDecimal(hex) {
  const decimal = (hex[0] << 24 | hex[1] << 16 | hex[2] << 8 | hex[3]) >>> 0;
  return decimal;
}

function calcCRC32(byteArray, start, end) {
  let crc = new CRC();
  crc.update(byteArray, start, end);
  const checksum = crc.crc ^ 0xFFFFFFFF;
  return intBytes(checksum);
}

/**
 * PNG形式の圧縮では、
 * <ul>
 * <li> crcの値を0ではなく1で初期化する </li>
 * <li> 入力データは、最下位ビット(LSB)からビットシフトする </li>
 * </ul>
 * @see http://www.ietf.org/rfc/rfc2083.txt
 * @see https://gist.github.com/ictrobot/bc24d73ac3515e3a856a1483e1f229d2
 * @see https://qiita.com/mikecat_mixc/items/e5d236e3a3803ef7d3c5
 */
class CRC {
  constructor() {
    /* 1で初期化 */
    this.crc = 0xFFFFFFFF;
    CRC.table = null;
  }

  update(array, startPos, endPos) {
    if(CRC.table == null) {
      CRC.makeTable();
    }

    let crc = this.crc;
    const table = CRC.table;

    let len = endPos - startPos;
    let index = startPos;
    while(len >= 8) {
      crc = table[(crc ^ array[index++]) & 0xFF] ^ (crc >>> 8);
      crc = table[(crc ^ array[index++]) & 0xFF] ^ (crc >>> 8);
      crc = table[(crc ^ array[index++]) & 0xFF] ^ (crc >>> 8);
      crc = table[(crc ^ array[index++]) & 0xFF] ^ (crc >>> 8);
      crc = table[(crc ^ array[index++]) & 0xFF] ^ (crc >>> 8);
      crc = table[(crc ^ array[index++]) & 0xFF] ^ (crc >>> 8);
      crc = table[(crc ^ array[index++]) & 0xFF] ^ (crc >>> 8);
      crc = table[(crc ^ array[index++]) & 0xFF] ^ (crc >>> 8);
      len -= 8;
    }
    if(len) {
      do {
        crc = table[(crc ^ array[index++]) & 0xFF] ^ (crc >>> 8);
      } while(--len);
    }
    this.crc = crc;
    return crc;
  }

  /**
   * ビットシフト時のXOR演算に使用するのはデータ下位の8ビットとなる
   * 予め、その8ビットのパターン(256通り = テーブル)を求めておくことで計算を高速化する
   */
  static makeTable() {
    const table = [];
    for(let n = 0; n < 256; n++) {
      let c = n;
      for(let k = 0; k < 8; k++) {
        if(c & 1) {
          c = 0xEDB88320 ^ (c >>> 1);
        } else {
          c = c >>> 1;
        }
      }
      table[n] = c;
    }
    CRC.table = table;
  }
}

module.exports = {crc32, intBytes, intBytesToDecimal};