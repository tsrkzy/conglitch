'use strict';

import zlib from 'zlib';
import crc32 from './crc32.js';

const BYTES_LENGTH = 4;
const BYTES_TYPE = 4;
const BYTES_CRC = 4;
const BYTES_WIDTH = 4;
const BYTES_HEIGHT = 4;
const BYTES_BITS_DEPTH = 1;
const BYTES_COLOR_TYPE = 1;
const BYTES_COMPRESS_METHOD = 1;
const BYTES_FILTER_METHOD = 1;
const BYTES_INTERACE_METHOD = 1;

const GRAYSCALE = { key: 0, bpp: 1 };
const TRUE_COLOR = { key: 2, bpp: 1 };
const INDEXED = { key: 3, bpp: 2 };
const GRAYSCALE_ALPHA = { key: 4, bpp: 3 };
const TRUE_COLOR_ALPHA = { key: 6, bpp: 4 };

class DataPNG {
  constructor(byteArray) {
    this.byteArray = byteArray;
    this.needle = 0;
    this.ihdr = null;
    this.width = -1;
    this.height = -1;
    this.bitsDepth = -1;
    this.colorType = -1;
    // this.compressMethod = -1;
    // this.filter = -1
    // this.interace = -1;
    this.idat = [];
    this.inflated = false;
  }

  parse() {
    const byteArray = this.byteArray;
    for (this.needle = 0; this.needle < byteArray.length; this.needle++) {
      if (this.isIHDR()) {
        this.readIHDR();
        // this.needle += this.readIHDR();
      } else if (this.isIDAT()) {
        this.readIDAT();
        // this.needle += this.readIDAT();
      }
    }
  }

  /**
   * @return {Promise}
   */
  decompressIDAT() {
    this.idat = new Uint8Array(this.idat);

    const p = new Promise((resolve, reject) => {
      zlib.inflate(this.idat, (e, imageData) => {
        if (e) {
          reject(e);
          return false;
        }
        this.idat = imageData;
        this.inflated = true;
        console.log(' -- decompress done.');
        resolve();
      })
    });
    return p;
  }
  
  compressIDAT() {
    this.idat = new Uint8Array(this.idat);
    const p = new Promise((resolve, reject) => {
      zlib.deflate(this.idat, (e, compressed) => {
        if (e) {
          reject(e);
          return false;
        }
        this.idat = compressed;
        this.inflated = false;
        console.log(' -- compress done.');
        resolve();
      })
    })

    return p;
  }

  build() {
    const signature = [];
    const ihdrSiz = [];
    const ihdrType = [];
    const ihdrData = this.ihdr;
    const ihdrCrc = [];
    const idatSiz = [];
    const idatType = [];
    const idatData = this.idat;
    const idatCrc = [];
    const iendSiz = [];
    const iendType = [];
    const iendData = [];
    const iendCrc = [];

  }

  glitch() {
    const rows = this.splitIntoRows();
    /* glitching */
    /* done! */
    this.idat = [];
    for (let i_r = 0; i_r < rows.length; i_r++) {
      const row = rows[i_r];
      this.idat = this.idat.concat(row);
    }
  }

  splitIntoRows() {
    const { width, height } = this;
    const bpp = this.getBitsPerPixel();
    const rowLength = width * bpp + 1;
    const rows = [];
    for (let i_h = 0; i_h < height; i_h++) {
      const rowHead = i_h * rowLength;
      const row = this.idat.slice(rowHead, rowHead + rowLength);
      console.log(row[0]);
      rows.push(row)
    }

    return rows;
  }

  getBitsPerPixel() {
    const { colorType } = this;
    let bpp = -1;
    switch (colorType) {
      case GRAYSCALE.key: {
        bpp = GRAYSCALE.bpp
        break;
      }
      case TRUE_COLOR.key: {
        bpp = TRUE_COLOR.bpp
        break;
      }
      case INDEXED.key: {
        bpp = INDEXED.bpp
        break;
      }
      case GRAYSCALE_ALPHA.key: {
        bpp = GRAYSCALE_ALPHA.bpp
        break;
      }
      case TRUE_COLOR_ALPHA.key: {
        bpp = TRUE_COLOR_ALPHA.bpp
        break;
      }
    }
    return bpp;
  }

  isIHDR() {
    const { byteArray } = this;
    const type = this.getChunkType(this.needle);
    const findTest = (() => {
      let j = 0
      return type[j++] === 0x49 // 73 > I
        && type[j++] === 0x48 // 72 > H
        && type[j++] === 0x44 // 68 > D
        && type[j++] === 0x52; // 82 > R
    })()

    return findTest
  }

  isIDAT() {
    const byteArray = this.byteArray;
    const size = this.getChunkSize(this.needle);
    const type = this.getChunkType(this.needle);
    const findTest = (() => {
      let j = 0
      return type[j++] === 0x49 // 73 > I
        && type[j++] === 0x44 // 68 > D
        && type[j++] === 0x41 // 65 > A
        && type[j++] === 0x54; // 84 > T
    })()

    return findTest
  }

  readIHDR() {
    const size = this.getChunkSize(this.needle);
    this.getDataOfIHDR(size);
    return size;
  }

  getDataOfIHDR(chunkSize) {
    const sliceStart = this.needle;
    const sliceEnd = sliceStart + chunkSize;
    const data = this.byteArray.slice(sliceStart, sliceEnd);
    // console.log(data);
    let offset = BYTES_LENGTH + BYTES_TYPE;
    this.width = this.parseInt_4DigitHexaDecimal(data.slice(offset, offset + BYTES_WIDTH));
    offset += BYTES_WIDTH;
    this.height = this.parseInt_4DigitHexaDecimal(data.slice(offset, offset + BYTES_HEIGHT));
    offset += BYTES_HEIGHT;
    this.bitsDepth = data[offset];
    offset += BYTES_BITS_DEPTH
    this.colorType = data[offset];
    offset += BYTES_COLOR_TYPE
    this.compressMethod = data[offset];
    offset += BYTES_COMPRESS_METHOD
    this.filterMethod = data[offset];
    offset += BYTES_FILTER_METHOD
    this.interace = data[offset];
    offset += BYTES_INTERACE_METHOD;
    // const crc = data.slice(offset, offset + BYTES_CRC);
    // console.log('raw crc:', crc);
    // const seed = data.slice(BYTES_LENGTH, BYTES_LENGTH + BYTES_TYPE + 13)
    // console.log('seed:', seed);
    // console.log(crc32(seed, true));
    this.ihdr = data;
  }

  /**
   * @param {number} chunkIndex 
   * @return {number}
   */
  getChunkSize(chunkIndex) {
    const s = this.byteArray.slice(chunkIndex, chunkIndex + BYTES_LENGTH);
    const dataSize = this.parseInt_4DigitHexaDecimal(s);
    const size = BYTES_LENGTH + BYTES_TYPE + dataSize + BYTES_CRC;

    return size;
  }

  /**
   * 配列形式の4桁の10進数表記の16進数を、10進数へ変換する
   */
  parseInt_4DigitHexaDecimal(hex) {
    const decimal = (hex[0] << 24 | hex[1] << 16 | hex[2] << 8 | hex[3]) >>> 0;
    return decimal
  }

  getChunkType(chunkIndex) {
    const type = this.byteArray.slice(chunkIndex + BYTES_LENGTH, chunkIndex + BYTES_LENGTH + BYTES_TYPE);
    return type;
  }

  readIDAT() {
    const size = this.getChunkSize(this.needle);
    console.log(size);
    this.getDataOfIDAT(size);

    return size;
  }

  getDataOfIDAT(chunkSize) {
    const sliceStart = this.needle;
    const sliceEnd = sliceStart + chunkSize;
    const data = this.byteArray.slice(sliceStart, sliceEnd);
    const compressStart = BYTES_LENGTH + BYTES_TYPE;
    const compressEnd = chunkSize - BYTES_CRC;
    const compressed = data.slice(compressStart, compressEnd);
    this.idat = this.idat.concat(compressed);
  }
}

module.exports = DataPNG; 