import React from 'react';
import {
  FileInput,
  Dialog,
  Button,
} from '@blueprintjs/core';
import Toaster from './Toaster.jsx';
import './handler.css';
import JPEG_Container from './JPEG_Container.js';
import {convertToJPEG, convertToPNG} from "./convertFormat.js";

class Container extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      imagePath: '',
      images   : [
        //  {name, type, size, coordinate: {i,j}, dataUrl, ...}
      ],
    }
  }

  render() {
    return (
      <div>
        <Dialog
          icon="inbox"
          isOpen={true}
          onClose={() => {
          }}
          title="Dialog header"
        >
          <FileInput disabled={false} text="" onInputChange={this.onInputChangeHandler.bind(this)}/>
        </Dialog>
        <div>
          {this.renderImages()}
        </div>
      </div>
    );
  }

  renderImages() {
    const result = [];
    const {images} = this.state;
    for(let i = 0; i < images.length; i++) {
      let image = images[i];
      const {name, height, width, type, size, coordinate, dataUrl,} = image;
      const el = <img src={dataUrl} key={i}/>;
      result.push(el);
    }
    return result;
  }

  onInputChangeHandler(e) {
    const {files} = e.target;
    if(files.length === 0) {
      console.warn('ファイル指定なし');
      return false;
    }

    const f = files[0];
    const {name, type, size} = f;
    if(/^image\/(bmp|gif|png|jpe?g)/.test(type.toLowerCase()) === false) {
      Toaster.show({message: 'MIME TYPE MISMATCH: サポートしていない圧縮形式です'});
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
            for(let i = 0; i < arrayOfDataUrl.length; i++) {
              let dataUrl = arrayOfDataUrl[i];
              const image = {dataUrl};
              images.push(image);
            }
            this.setState({images});
          })
      })
      .catch((r) => {
        Toaster.show({message: 'SOMETHING OCCURRED: 処理中にエラーが発生しました'});
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
    const p = new Promise((resolve) => {
      const jpeg = new JPEG_Container(dataUrl);
      console.log(jpeg); // @DELETEME
      jpeg.parse();
      jpeg.glitch();
      jpeg.build();
      const newDataUrl = jpeg.toDataUrl();
      resolve(newDataUrl);
    });
    pAll.push(p);

    return Promise.all(pAll)
  }
}

module.exports = Container;