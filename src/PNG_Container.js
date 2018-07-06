'use strict';

import byteArrayToBase64 from './byteArrayToBase64';
import base64ToByteArray from './base64ToByteArray.js';
import {intBytesToDecimal} from './crc32';
import zlib from 'zlib';
import Chunk from './Chunk.js';

const BYTES_SIGNATURE = 8;
const BYTES_WIDTH = {start: 0, length: 4};
const BYTES_HEIGHT = {start: 4, length: 4};
const BYTES_BITS_DEPTH = {start: 8, length: 1};
const BYTES_COLOR_TYPE = {start: 9, length: 1};
const BYTES_COMPRESS_METHOD = {start: 10, length: 1};
const BYTES_FILTER_METHOD = {start: 11, length: 1};
const BYTES_INTERLACE_METHOD = {start: 12, length: 1};

const ITERATION_LIMIT_READ_CHUNK = 5000;

const GRAYSCALE = {key: 0, bpp: 1};
const TRUE_COLOR = {key: 2, bpp: 1};
const INDEXED = {key: 3, bpp: 2};
const GRAYSCALE_ALPHA = {key: 4, bpp: 3};
const TRUE_COLOR_ALPHA = {key: 6, bpp: 4};

class PNG_Container {
  constructor(dataUrl) {
    this.dataUrl = dataUrl;
    /** @member {Array} 入力画像のデータ */
    this.byteArray = base64ToByteArray(this.dataUrl);

    this.signature = null;
    /** @member IHDRに対応するデータを保持する */
    this.ihdr = null;
    this.width = -1;
    this.height = -1;
    this.bitsDepth = -1;
    this.colorType = -1;
    this.compressMethod = -1;
    this.interlace = -1;
    this.idat = [];
    this.inflated = false;
    this.plainBytes = null;
    this.dest = null;
  }

  /**
   *
   * @returns {Promise<[any]>}
   */
  parse() {
    Chunk.init();
    const byteArray = this.byteArray;
    this.signature = byteArray.slice(0, BYTES_SIGNATURE);

    const length = byteArray.length;
    let i = BYTES_SIGNATURE;
    let limit = 0;
    const processList = [];
    while(length > i) {
      const chunk = new Chunk(byteArray, i);
      const totalLength = chunk.getTotalLength();
      const type = chunk.getTypeAsString();
      // console.log('i, type, total, chunk: ', i, type, totalLength, chunk);

      switch(type) {
        case 'IHDR':
          this.ihdr = chunk;
          this.readMetaData();
          break;
        case 'IDAT':
          this.idat = this.idat || [];
          this.idat.push(chunk);
          break;
        case 'IEND':
          this.iend = chunk;
          break;
        default :
          console.log('ignore chunk: ', chunk);
          break;
      }

      i += totalLength;

      limit++;
      if(limit > ITERATION_LIMIT_READ_CHUNK) {
        throw new Error(`exceed iteration limit: ${ITERATION_LIMIT_READ_CHUNK}. is this broken file?`);
      }
    }

    const p = this.inflate();
    processList.push(p);

    return Promise.all(processList);
  }

  /**
   * @return {Promise}
   */
  inflate() {
    if(this.inflated) {
      throw new Error('cannot inflate twice.');
    }

    const idat = this.idat;
    let cypher = [];
    for(let i = 0; i < idat.length; i++) {
      let d = idat[i];
      const {data} = d;
      cypher = cypher.concat(data);
    }

    const cypherUint8 = new Uint8Array(cypher);
    return new Promise((resolve) => {
      zlib.inflate(cypherUint8, (e, inflated) => {
        if(e) {
          throw e;
        }
        this.inflated = true;
        const mergedChunk = Chunk.createIdatFromData(inflated);
        this.idat = mergedChunk;
        resolve();
      });
    });
  }

  /**
   *
   * @return {Promise}
   */
  deflate() {
    if(!this.inflated) {
      throw new Error('cannot deflate twice.');
    }

    const idat = (this.idat instanceof Array) ? this.idat : [this.idat];
    let plain = [];
    for(let i = 0; i < idat.length; i++) {
      let d = idat[i];
      const {data} = d;
      plain = plain.concat(data);
    }

    const plainUint8 = new Uint8Array(plain);
    return new Promise((resolve) => {
      zlib.deflate(plainUint8, (e, deflated) => {
        if(e) {
          throw e;
        }
        this.inflated = false;
        const mergedChunk = Chunk.createIdatFromData(deflated);
        this.idat = mergedChunk;
        resolve();
      });
    });
  }

  /**
   * @return {Promise}
   */
  build() {
    const png = [];
    const signature = this.signature;
    const ihdr = this.ihdr.serialize();
    const iend = this.iend.serialize();
    return this.deflate()
      .then(() => {
        const idat = this.idat.serialize();
        this.dest = png.concat(signature, ihdr, idat, iend);
      });
  }

  toDataUrl() {
    const byteArray = this.dest;
    const dataUrl = byteArrayToBase64(byteArray);

    return dataUrl;
  }

  readMetaData() {
    this.readWidth();
    this.readHeight();
    this.readBitsDepth();
    this.readColorType();
    this.readCompressMethod();
    this.readFilterMethod();
    this.readInterlace();
  }

  readWidth() {
    const {data} = this.ihdr;
    const {start, length} = BYTES_WIDTH;
    const widthBytes = data.slice(start, start + length);
    this.width = intBytesToDecimal(widthBytes);
  }

  readHeight() {
    const {data} = this.ihdr;
    const {start, length} = BYTES_HEIGHT;
    const heightBytes = data.slice(start, start + length);
    this.height = intBytesToDecimal(heightBytes);
  }

  readBitsDepth() {
    const {data} = this.ihdr;
    const {start, length} = BYTES_BITS_DEPTH;
    const bitsDepth = data.slice(start, start + length);
    this.bitsDepth = bitsDepth[0];
  }

  readColorType() {
    const {data} = this.ihdr;
    const {start, length} = BYTES_COLOR_TYPE;
    const colorType = data.slice(start, start + length);
    this.colorType = colorType[0];
    this.setBitsPerPixel();
  }

  setBitsPerPixel() {
    const colorType = this.colorType;
    switch(colorType) {
      case GRAYSCALE.key: {
        this.bpp = GRAYSCALE.bpp;
        break;
      }
      case TRUE_COLOR.key: {
        this.bpp = TRUE_COLOR.bpp;
        break;
      }
      case INDEXED.key: {
        this.bpp = INDEXED.bpp;
        break;
      }
      case GRAYSCALE_ALPHA.key: {
        this.bpp = GRAYSCALE_ALPHA.bpp;
        break;
      }
      case TRUE_COLOR_ALPHA.key: {
        this.bpp = TRUE_COLOR_ALPHA.bpp;
        break;
      }
    }
  }

  readCompressMethod() {
    const {data} = this.ihdr;
    const {start, length} = BYTES_COMPRESS_METHOD;
    const compressMethod = data.slice(start, start + length);
    this.compressMethod = compressMethod[0];
  }

  readFilterMethod() {
    const {data} = this.ihdr;
    const {start, length} = BYTES_FILTER_METHOD;
    const filterMethod = data.slice(start, start + length);
    this.filterMethod = filterMethod[0];
  }

  readInterlace() {
    const {data} = this.ihdr;
    const {start, length} = BYTES_INTERLACE_METHOD;
    const interlace = data.slice(start, start + length);
    this.interlace = interlace[0];
  }

  glitch() {
    const filter = 4;
    const continuity = 0.9;
    const frequency = 0.02;
    this.idat.glitch(this, {filter, continuity, frequency});
  }
}

module.exports = PNG_Container;