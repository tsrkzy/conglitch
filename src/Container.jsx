import React from 'react';
import {
  FileInput,
  Dialog,
  Button,
  Card,
  Elevation,
  RadioGroup,
  Radio,
} from '@blueprintjs/core';
import Toaster from './Toaster.jsx';
import './handler.css';
import JPEG_Container from './JPEG_Container.js';
import { convertToJPEG, convertToPNG } from "./convertFormat.js";

class Container extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: true,
      imagePath: '',
      format: 'png',
      images: [
        //  {name, type, size, coordinate: {i,j}, dataUrl, ...}
      ],
    }
  }

  render() {
    return (
      <div style={{ width: '100%' }}>
        <Card interactive={false} elevation={Elevation.TWO}>
          <h5>Conglitch</h5>
          <p>ボタンを押して画像を選択するか、ドラッグ&ドロップしてください。</p>
          <Button onClick={() => document.getElementById('i').click()}>画像を選択</Button>
          <RadioGroup label="出力フォーマット" selectedValue={this.state.format}
            onChange={(e) => { this.setState({ format: e.target.value }) }} >
            <Radio label="PNG" value="png" />
            <Radio label="JPEG" value="jpeg" />
          </RadioGroup>
          <input id='i' type='file' onChange={this.onInputChangeHandler.bind(this)} style={{ display: 'none' }} />
          <div>
            {this.renderImages()}
          </div>
        </Card>
      </div>
    );
  }

  renderImages() {
    const result = [];
    const { images } = this.state;
    for (let i = 0; i < images.length; i++) {
      let image = images[i];
      const { name, height, width, type, size, coordinate, dataUrl, } = image;
      const el = <img width={width} src={dataUrl} key={i} />;
      result.push(el);
    }
    return result;
  }

  onInputChangeHandler(e) {
    const { files } = e.target;
    if (files.length === 0) {
      console.warn('ファイル指定なし');
      return false;
    }

    const f = files[0];
    const { name, type, size } = f;
    if (/^image\/(bmp|gif|png|jpe?g)/.test(type.toLowerCase()) === false) {
      Toaster.show({ message: 'MIME TYPE MISMATCH: サポートしていない圧縮形式です' });
    }
    console.log(name, type, size); // @DELETEME

    const reader = new FileReader();
    reader.onload = this.onFileLoadHandler.bind(this);
    reader.readAsDataURL(f);
  }

  onFileLoadHandler(e) {
    const dataUrl = e.target.result;
    convertToJPEG(dataUrl)
      .then((convertedBase64) => {
        this.glitch(convertedBase64)
          .then((arrayOfDataUrl) => {
            const images = [];
            for (let i = 0; i < arrayOfDataUrl.length; i++) {
              let dataUrl = arrayOfDataUrl[i];
              const image = { dataUrl };
              images.push(image);
            }
            this.setState({ images });
          })
      })
      .catch((r) => {
        Toaster.show({ message: 'SOMETHING OCCURRED: 処理中にエラーが発生しました' });
        console.error(r);
      });
  }

  /**
   * @param {string} dataUrl
   * @return {Promise}
   */
  glitch(dataUrl) {
    const pAll = [];

    /* through */
    const pRaw = new Promise((resolve) => {
      resolve(dataUrl);
    });
    pAll.push(pRaw);

    /* JPEG glitch */
    for (let i = 0; i < 40; i++) {
      const p = new Promise((resolve) => {
        const jpeg = new JPEG_Container(dataUrl);
        jpeg.parse();
        jpeg.glitchShuffle();
        // jpeg.glitch();
        jpeg.build();
        const newDataUrl = jpeg.toDataUrl();
        resolve(newDataUrl);
      });
      pAll.push(p);
    }

    return Promise.all(pAll)
  }
}

module.exports = Container;