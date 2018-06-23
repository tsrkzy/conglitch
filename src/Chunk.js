'use strict';

import {
  crc32,
  intBytes,
} from './crc32.js';
import zlib from 'zlib';

const BYTES_LENGTH = 4;
const BYTES_TYPE = 4;
const BYTES_OFFSET_TYPE = BYTES_LENGTH;
const BYTES_OFFSET_DATA = BYTES_LENGTH + BYTES_TYPE;
const BYTES_CRC = 4;

class Chunk {
  constructor(byteArray, index) {
    this.id = Chunk.id++;
    this.length = this.readLength(byteArray, index);
    this.type = this.readType(byteArray, index);
    this.data = this.readData(byteArray, index);
    this.crc = this.readCrc(byteArray, index);
    this.inflated = false;
  }

  static init() {
    Chunk.id = 0;
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
    return type;
  }

  /**
   * @param {PNG_Container} png
   * @return {Promise}
   */
  glitch(png) {
    return new Promise((resolve) => {
      this.decompressData()
        .then(() => {
          this.glitchProcess(png);
          this.compressData()
            .then(() => {
              this.updateCrc();
              resolve();
            });
        })
        .catch((e) => {
          console.log(e);
          // なんやこれ
          resolve(e);
          // throw e;
        });
    });
  }

  /**
   * @param {PNG_Container} png
   */
  glitchProcess(png) {
    const uint8Array = this.data;
    const { width, height, bpp } = png;

    for (let i = 0; i < height; i++) {
      const rowHeadIndex = i * (bpp * width + 1);
      // filter
      uint8Array[rowHeadIndex] = 4;
    }
  }

  updateCrc() {
    const target = this.type.concat(this.data);
    const crc = crc32(target);
    // console.log('crc,type,data', crc, this.type, this.data);
  }

  /**
   * node zlib version
   * @return {Promise}
   */
  compressData() {
    if (!this.inflated) {
      throw new Error('already compressed.');
    }

    /* Array to TypedArray(ArrayBuffer) */
    const data = new Uint8Array(this.data);
    return new Promise((resolve) => {
      zlib.deflate(data, (e, deflated) => {
        if (e) {
          throw e;
        }

        this.data = deflated;
        this.inflated = false;
        // console.log('comp,length', this.data, this.data.length);
        resolve();
      });
    });
  }

  // /**
  //  * imaya zlib version {@link https://github.com/imaya/zlib.js}
  //  *
  //  * @returns {Promise<any>}
  //  */
  // compressData() {
  //   const data = new Uint8Array(this.data);
  //   return new Promise((resolve) => {
  //     const deflator = new Zlib.Deflate(data);
  //     const deflated = deflator.compress();
  //     console.log('comp', this.id, deflated); // @DELETEME
  //     this.data = deflated;
  //     this.inflated = false;
  //     resolve();
  //   });
  // }

  /**
   * nodejs zlib version
   * @return {Promise}
   */
  decompressData() {
    if (this.inflated) {
      throw new Error('cannot inflate twice.');
    }

    /* Array to TypedArray(ArrayBuffer) */
    const data = new Uint8Array(this.data);
    return new Promise((resolve) => {
      zlib.inflate(data, (e, inflated) => {
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

  // /**
  //  * imaya zlib version {@link https://github.com/imaya/zlib.js}
  //  *
  //  * @returns {Promise<any>}
  //  */
  // decompressData() {
  //   const data = new Uint8Array(this.data);
  //   return new Promise((resolve) => {
  //     const inflater = new Zlib.RawInflate(data);
  //     const plain = inflater.decompress();
  //     console.log('plain', this.id, plain); // @DELETEME
  //     this.data = plain;
  //     this.inflated = true;
  //     resolve();
  //   });
  // }

  serialize() {
    this.updateLength();
    const serial = [];
    const length = this.length;
    const type = this.type;
    const data = Array.from(this.data);
    const crc = this.crc;

    return serial.concat(length, type, data, crc);
  }

  updateLength() {
    this.length = intBytes(this.data.length);
  }
}

module.exports = Chunk;