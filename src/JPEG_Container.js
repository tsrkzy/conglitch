'use strict';

import byteArrayToBase64 from './byteArrayToBase64';

const BYTES_SOI = 2;
const BYTES_TYPE = 2;
const BYTES_LENGTH = 2;
const BYTES_OFFSET_LENGTH = 2;
const BYTES_OFFSET_DATA = 4;

const BYTES_EOI = 2;

const ITERATION_LIMIT_READ_CHUNK = 100;
const JPEG_SCAN_ITERATION_LIMIT = 1000000;

class JPEG_Container {
  constructor(byteArray) {
    this.byteArray = byteArray;
    this.soi = null;
    this.sos = null;
    this.eoi = null;
    this.segments = [];
    this.lines = [];
  }

  /**
   * 0xFFD8 (SOI) 255 216
   * 0xFFDA (SOS) 255 218
   * 0xFFD9 (EOI) 255 217
   */
  parse() {
    Segment.init();
    const byteArray = this.byteArray;
    this.soi = byteArray.slice(0, BYTES_SOI);

    const length = byteArray.length;
    let i = BYTES_SOI;
    let limit = 0;
    while(length > i) {
      const segment = new Segment(byteArray, i);
      const totalLength = segment.getTotalLength();
      const type = segment.getTypeAsString();
      // console.log('i, type, total, segment:', i, type, totalLength, segment);

      i += totalLength;

      if(segment.isSos()) {
        this.sos = segment;
        break;
      }
      this.segments.push(segment);

      limit++;
      if(limit > ITERATION_LIMIT_READ_CHUNK) {
        throw new Error(`exceed iteration limit: ${ITERATION_LIMIT_READ_CHUNK}. is this broken file?`);
      }
    }
    const dataChunk = byteArray.slice(i);
    this.parseDataChunk(dataChunk);
  }

  parseDataChunk(dataChunk) {
    let i = 0;
    let limit = 0;
    const length = dataChunk.length;
    Scan.init();
    while(length > i) {
      const line = new Scan(dataChunk, i);
      line.run();
      i = line.index;
      this.lines.push(line);

      if(line.isEoi()) {
        break;
      }

      limit++;
      if(limit > ITERATION_LIMIT_READ_CHUNK) {
        throw new Error(`exceed iteration limit: ${ITERATION_LIMIT_READ_CHUNK}. is this broken file?`);
      }
    }

    this.eoi = dataChunk.slice(i, i + BYTES_EOI);
  }

  build() {
    let jpeg = [];
    const soi = this.soi;
    jpeg = jpeg.concat(soi);

    const segments = this.segments;
    for (let i = 0; i < segments.length; i++) {
      let segment = segments[i];
      const seg = segment.serialize();
      jpeg = jpeg.concat(seg);
    }
    const sos = this.sos;
    const s = sos.serialize();
    jpeg = jpeg.concat(s);

    const lines = this.lines;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const l = line.serialize();
      jpeg = jpeg.concat(l);
    }

    const eoi = this.eoi;
    jpeg = jpeg.concat(eoi);

    this.dest = jpeg;
  }

  toDataUrl() {
    const byteArray = this.dest;
    const dataUrl = byteArrayToBase64(byteArray);

    return dataUrl;
  }
}

class Scan {
  constructor(byteArray, index) {
    this.id = Scan.id++;
    this.byteArray = byteArray;
    this.head = index;
    this.index = index;
    this.marker = [0xFF, 0x00];
    this.data = [];
    this._isNextScan = false;
    this._isEoi = false;
  }

  static init() {
    Scan.id = 0;
  }

  run() {
    let firstTime = true;
    let limit = 0;
    while (firstTime || (!this.isNextScan() && !this.isEoi())) {
      firstTime = false;
      this.index++;
      limit++;
      this.updateFlag();
      if(limit > JPEG_SCAN_ITERATION_LIMIT) {
        throw new Error(`exceed iteration limit: ${JPEG_SCAN_ITERATION_LIMIT}. is this broken file?`);
      }
    }

    const {byteArray, head, index} = this;
    this.data = byteArray.slice(head, index);
    this.byteArray = null;
  }

  updateFlag() {
    const {byteArray, index} = this;
    const byte = byteArray[index];
    const next = byteArray[index + 1];
    this._isNextScan = (byte === 255 && next === 0);
    this._isEoi = (byte === 255 && next === 217);
  }

  isNextScan() {
    return this._isNextScan;
  }

  isEoi() {
    return this._isEoi;
  }

  getLength() {
    return this.data.length;
  }

  serialize() {
    return this.data;
  }
}

class Segment {
  constructor(byteArray, index) {
    this.id = Segment.id++;
    this.type = this.readType(byteArray, index);
    this.length = this.readLength(byteArray, index);
    this.data = this.readData(byteArray, index);
    this.byteArray = null;
  }

  static init() {
    Segment.id = 0;
  }

  isSos() {
    return (this.getTypeAsString() === '0xFFDA');
  }

  readType(byteArray, index) {
    const start = index;
    const end = start + BYTES_TYPE;
    const type = byteArray.slice(start, end);
    return type;
  }

  readLength(byteArray, index) {
    const start = index + BYTES_OFFSET_LENGTH;
    const end = start + BYTES_LENGTH;
    const length = byteArray.slice(start, end);

    return length;
  }

  readData(byteArray, index) {
    const length = this.getLengthAsInt();
    const start = index + BYTES_OFFSET_DATA;
    const end = start + length;
    const data = byteArray.slice(start, end);

    return data;
  }

  getLengthAsInt() {
    const l = this.length;
    const length = ((l[0] << 8) + (l[1]));
    return length - BYTES_LENGTH;
  }

  getTotalLength() {
    const totalLength = BYTES_TYPE + BYTES_LENGTH + this.getLengthAsInt();
    return totalLength;
  }

  getTypeAsString() {
    const type = this.type;
    let digit_1 = type[0].toString(16).toUpperCase();
    let digit_2 = type[1].toString(16).toUpperCase();
    return `0x${digit_1}${digit_2}`
  }

  serialize() {
    const marker = this.type;
    const length = this.length;
    const data = this.data;
    const segment = [].concat(marker, length, data);
    return segment;
  }
}

module.exports = JPEG_Container;