'use strict';

import zlib from 'zlib';
import crc32 from './crc32.js';

const BYTES_SIGNATURE = 8;
const BYTES_LENGTH = 4;
const BYTES_TYPE = 4;
const BYTES_OFFSET_TYPE = BYTES_LENGTH;
const BYTES_OFFSET_DATA = BYTES_LENGTH + BYTES_TYPE;
const BYTES_CRC = 4;
const BYTES_WIDTH = 4;
const BYTES_HEIGHT = 4;
const BYTES_BITS_DEPTH = 1;
const BYTES_COLOR_TYPE = 1;
const BYTES_COMPRESS_METHOD = 1;
const BYTES_FILTER_METHOD = 1;
const BYTES_INTERACE_METHOD = 1;

const ITERATION_LIMIT_READ_CHUNK = 5000;

const GRAYSCALE = { key: 0, bpp: 1 };
const TRUE_COLOR = { key: 2, bpp: 1 };
const INDEXED = { key: 3, bpp: 2 };
const GRAYSCALE_ALPHA = { key: 4, bpp: 3 };
const TRUE_COLOR_ALPHA = { key: 6, bpp: 4 };

class Chunk {
  constructor(byteArray, index) {
    this.length = this.readLength(byteArray, index);
    this.type = this.readType(byteArray, index);
    this.data = this.readData(byteArray, index);
    this.crc = this.readCrc(byteArray, index);
    this.inflated = false;
  }

  readLength(byteArray, index) {
    const start = index;
    const end = start + BYTES_LENGTH;
    const length = byteArray.slice(start, end);

    return length;
  }

  readType(byteArray, index) {
    const start = index + BYTES_OFFSET_TYPE;
    const end = start + BYTES_TYPE;
    const type = byteArray.slice(start, end);

    return type;
  }

  readData(byteArray, index) {
    const length = this.getLengthAsInt();
    const start = index + BYTES_OFFSET_DATA;
    const end = start + length;
    const data = byteArray.slice(start, end);

    return data;
  }
  readCrc(byteArray, index) {
    const crcOffset = BYTES_OFFSET_DATA + this.getLengthAsInt();
    const start = index + crcOffset;
    const end = start + BYTES_CRC;
    const crc = byteArray.slice(start, end);

    return crc;
  }

  /**
   * @return {number}
   */
  getTotalLength() {
    const totalLength = BYTES_LENGTH + BYTES_TYPE + this.getLengthAsInt() + BYTES_CRC;
    return totalLength;
  }

  /**
   * @return {number}
   */
  getLengthAsInt() {
    const l = this.length;
    const length = ((l[0] << 24) + (l[1] << 16) + (l[2] << 8) + (l[3]));
    return length;
  }

  getTypeAsString() {
    const t = this.type;
    const type = t.map((c) => String.fromCodePoint(c)).join('');
    return type
  }

  /**
   * @return {Promise}
   */
  glitch() {
    return new Promise((resolve) => {
      this.decompressData()
        .then(() => {
          this.glitchProcess();
          this.compressData()
            .then(() => {
              console.log('after decompress&compress');
              this.updateCrc();
              resolve();
            })
        })
        .catch((e) => {
          throw e;
        })
    })
  }

  glitchProcess() {

  }

  updateCrc() {
    const target = this.type.concat(this.data);
    const crc = crc32(target);
    // console.log('crc,type,data', crc, this.type, this.data);
  }

  /**
   * @return {Promise}
   */
  compressData() {
    if (!this.inflated) {
      throw new Error('already compressed.')
    }

    const data = new Uint8Array(this.data);
    const buffer = Buffer.from(data);
    return new Promise((resolve) => {
      zlib.deflate(data, (e, deflated) => {
        if (e) {
          throw e;
        }

        /* v6系ではBufferしか扱えない */
        this.data = deflated;
        this.inflated = false;
        console.log('comp,length', this.data, this.data.length);
        resolve();
      });
    });
  }

  /**
   * @return {Promise}
   */
  decompressData() {
    if (this.inflated) {
      throw new Error('cannot inflate twice.')
    }
    
    /* ArrayBuffer to Buffer */
    const data = new Uint8Array(this.data);
    const buffer = Buffer.from(data);
    return new Promise((resolve) => {
      zlib.inflate(buffer, (e, inflated) => {
        if (e) {
          throw e;
        }

        this.data = inflated;
        this.inflated = true;
        // console.log('decomp,length', this.data, this.data.length);
        resolve();
      });
    });
  }
}

class DataPNG {
  constructor(byteArray) {
    /** @member 入力画像のデータ */
    this.byteArray = byteArray;
    /** @member this.byteArrayについての走査index */
    this.needle = 0;

    this.signature = null;
    /** @member IHDRに対応するデータを保持する */
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
    this.signature = byteArray.slice(0, BYTES_SIGNATURE);

    const length = byteArray.length;
    let i = BYTES_SIGNATURE;
    let limit = 0
    const processList = [];
    while (length > i) {
      const chunk = new Chunk(byteArray, i);
      const totalLength = chunk.getTotalLength();
      const type = chunk.getTypeAsString();
      console.log('i, type, total, chunk: ', i, type, totalLength, chunk);

      switch (type) {
        case 'IHDR':
          break;
        case 'IDAT':
          console.log('before decompress&compress', chunk.data.length);
          chunk.updateCrc();
          const process = chunk.glitch();
          processList.push(process);
          break;
        case 'IEND':

          break;
      }

      i += totalLength

      limit++;
      if (limit > ITERATION_LIMIT_READ_CHUNK) {
        throw new Error(`exceed iteration limit: ${ITERATION_LIMIT_READ_CHUNK}. is this broken file?`);
      }
    };

    return Promise.all(processList)


    return false;

    for (this.needle = BYTES_SIGNATURE; this.needle < byteArray.length; this.needle++) {
      if (this.isIHDR()) {
        this.readIHDR();
      } else if (this.isIDAT()) {
        this.readIDAT();
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

    const crc = data.slice(offset, offset + BYTES_CRC);
    console.log('raw crc:', crc);
    const seed = data.slice(BYTES_LENGTH, BYTES_LENGTH + BYTES_TYPE + 13)
    console.log('seed:', seed);
    console.log('generated crc: ', crc32(seed, true));
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