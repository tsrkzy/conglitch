'use strict';

import byteArrayToBase64 from './byteArrayToBase64';
import base64ToByteArray from "./base64ToByteArray";
import Segment from './Segment.js';
import Scan from './Scan.js';

const BYTES_SOI = 2;
const BYTES_EOI = 2;

const ITERATION_LIMIT_READ_CHUNK = 1024 * 1024;

class JPEG_Container {
  constructor(dataUrl,i) {
    this.dataUrl = dataUrl;
    /** @member {Array} 入力画像のデータ */
    this.byteArray = base64ToByteArray(this.dataUrl);
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
    while (length > i) {
      const segment = new Segment(byteArray, i);
      const totalLength = segment.getTotalLength();
      const type = segment.getTypeAsString();
      // console.log('i, type, total, segment:', i, type, totalLength, segment);

      i += totalLength;

      if (segment.isSos()) {
        this.sos = segment;
        break;
      }
      this.segments.push(segment);

      limit++;
      if (limit > ITERATION_LIMIT_READ_CHUNK) {
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
    while (length > i) {
      const line = new Scan(dataChunk, i);
      line.run();
      i = line.index;
      this.lines.push(line);

      if (line.isEoi()) {
        break;
      }

      limit++;
      if (limit > ITERATION_LIMIT_READ_CHUNK) {
        throw new Error(`exceed iteration limit: ${ITERATION_LIMIT_READ_CHUNK}. is this broken file?`);
      }
    }

    this.eoi = dataChunk.slice(i, i + BYTES_EOI);
  }

  glitch() {
    const targetLine = (() => {
      const lines = this.lines;
      const length = lines.length;
      const index = Math.floor((length * Math.random()) % length)
      return lines[index];
    })();

    const data = targetLine.data;
    const length = data.length;
    const index = Math.floor((length * Math.random()) % length);

    // const target = data[index];
    // const error = 0xF0;
    // data[index] = (target + error) & 0xFF;

    // targetLine.data.splice(index, 1);

    targetLine.data = targetLine.data.reverse()
  }

  glitchError() {
    const targetLine = (() => {
      const lines = this.lines;
      const length = lines.length;
      const index = Math.floor((length * Math.random()) % length)
      return lines[index];
    })();

    const data = targetLine.data;
    const length = data.length;
    const index = Math.floor((length * Math.random()) % length);

    const target = data[index];
    const error = 0xF0;
    data[index] = (target + error) & 0xFF;
  }

  glitchSplice() {
    const targetLine = (() => {
      const lines = this.lines;
      const length = lines.length;
      const index = Math.floor((length * Math.random()) % length)
      return lines[index];
    })();

    const data = targetLine.data;
    const length = data.length;
    const index = Math.floor((length * Math.random()) % length);

    targetLine.data.splice(index, 1);
  }

  glitchReverse() {
    const targetLine = (() => {
      const lines = this.lines;
      const length = lines.length;
      const index = Math.floor((length * Math.random()) % length)
      return lines[index];
    })();

    targetLine.data = targetLine.data.reverse()
  }

  glitchShuffle() {
    const lines = this.lines;
    const length = lines.length;
    const start = Math.floor(Math.random() * (length - 1))
    const edge = lines.splice(start, 1)[0];
    lines.unshift(edge);
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

module.exports = JPEG_Container;