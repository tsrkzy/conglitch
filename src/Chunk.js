'use strict';

import {
  crc32,
  intBytes,
} from './crc32.js';

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

  /**
   *
   * @param byteArray
   * @return {Chunk}
   */
  static createIdatFromData(byteArray) {
    const length = intBytes(byteArray.length);
    const type = ['I', 'D', 'A', 'T'].map((c) => c.charCodeAt(0));
    const data = Array.from(byteArray);
    const crc = crc32(byteArray);
    const rawChunk = [].concat(length, type, data, crc);
    const chunk = new Chunk(rawChunk, 0);

    return chunk;
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
   */
  glitch(png, option) {
    this.glitchProcess(png, option);
    this.updateCrc();
  }

  /**
   * @param {PNG_Container} png
   */
  glitchProcess(png, option) {
    const uint8Array = this.data;
    const {width, height, bpp} = png;
    const {continuity, filter, frequency} = option;
    let burning = false;

    for(let i = 0; i < height; i++) {
      const rowHeadIndex = i * (bpp * width + 1);
      const f = uint8Array[rowHeadIndex];
      const glitch = burning
        ? ((Math.random() < continuity) ? 1 : 0)
        : ((Math.random() < frequency) ? 1 : 0);
      burning = glitch === 1;
      const newFilter = (glitch === 1)
        ? filter
        : f;
      uint8Array[rowHeadIndex] = newFilter;

      // if(!burning) {
      //   continue;
      // }
      // for(let j = 0; j < bpp * width; j++) {
      //   const k = j + i;
      //   const glitch = (Math.random() < 0.1) ? 1 : 0;
      //   if(glitch === 0) {
      //     continue;
      //   }
      //   const value = uint8Array[rowHeadIndex + k];
      //   const v = ((value + 128) & 0xFF);
      //   uint8Array[rowHeadIndex + k] = v;
      // }
    }
  }

  updateCrc() {
    const target = this.type.concat(this.data);
    const crc = crc32(target);
    // console.log('crc,type,data', crc, this.type, this.data);
  }

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