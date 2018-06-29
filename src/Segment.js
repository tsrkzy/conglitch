'use strict';

const BYTES_TYPE = 2;
const BYTES_LENGTH = 2;
const BYTES_OFFSET_LENGTH = 2;
const BYTES_OFFSET_DATA = 4;

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

module.exports = Segment;