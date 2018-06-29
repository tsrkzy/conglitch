'use strict';

const JPEG_SCAN_ITERATION_LIMIT = 1024 * 1024;


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
    while(firstTime || (!this.isNextScan() && !this.isEoi())) {
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

module.exports = Scan;