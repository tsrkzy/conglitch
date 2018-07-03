import React from 'react';
import {
  Button,
  Card,
  Elevation,
  RadioGroup,
  Radio,
  Intent,
} from '@blueprintjs/core';
import Toaster from './Toaster.jsx';
import Smoke from './Smoke.jsx';
import './handler.css';
import JPEG_Container from './JPEG_Container.js';
import PNG_Container from './PNG_Container.js';
import {convertToJPEG, convertToPNG} from "./convertFormat.js";

class Container extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen   : true,
      imagePath: '',
      method   : 'png',
      format   : 'png',
      images   : [
        //  {name, type, size, coordinate: {i,j}, dataUrl, ...}
      ],
    }
  }

  render() {
    return (
      <div style={{width: '100%'}}>
        <Smoke/>
        <Card interactive={false} elevation={Elevation.TWO}>
          <h5>Conglitch</h5>
          <p>ボタンを押して画像を選択するか、ドラッグ&ドロップしてください。</p>
          <Button minimal={true} icon={'add'} intent={Intent.PRIMARY} onClick={this.onClickHandler.bind(this)}>画像を選択</Button>
          <RadioGroup label="" selectedValue={this.state.method}
                      onChange={(e) => {
                        this.setState({method: e.target.value})
                      }}>
            <Radio label="PNG形式でglitchする" value="png"/>
            <Radio label="JPEG形式でglitchする" value="jpeg"/>
          </RadioGroup>
          <RadioGroup label="" selectedValue={this.state.format}
                      onChange={(e) => {
                        this.setState({format: e.target.value})
                      }}>
            <Radio label="PNG形式で出力" value="png"/>
            <Radio label="JPEG形式で出力" value="jpeg"/>
          </RadioGroup>
          <input id='i' type='file' onChange={this.onInputChangeHandler.bind(this)} style={{display: 'none'}}/>
          <div>
            {this.renderImages()}
          </div>
        </Card>
      </div>
    );
  }

  onClickHandler() {
    const filePicker = document.getElementById('i');
    filePicker.value = '';
    filePicker.click();
  }

  renderImages() {
    const result = [];
    const {images} = this.state;
    for(let i = 0; i < images.length; i++) {
      let image = images[i];
      const {name, height, width, type, size, coordinate, dataUrl,} = image;
      const el = (<div key={i}>
        <img width={width} src={dataUrl}/>
      </div>);
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
    Smoke.on();
    const dataUrl = e.target.result;
    const convertForGlitchFn = this.getConvert(this.state.method);
    convertForGlitchFn(dataUrl)
      .then((convertedBase64) => {
        this.glitch(convertedBase64)
          .then((arrayOfDataUrl) => {
            /* output format */
            const pAll = [];
            for(let i = 0; i < arrayOfDataUrl.length; i++) {
              let dataUrl = arrayOfDataUrl[i];
              const convertFn = this.getConvert(this.state.format);
              const p = new Promise((resolve) => {
                convertFn(dataUrl)
                  .then((dataUrl) => {
                    const image = {dataUrl};
                    resolve(image);
                  });
              });
              pAll.push(p);
            }

            Promise.all(pAll)
              .then((images) => {
                this.setState({images});
                Smoke.off();
              })
          })
      })
      .catch((r) => {
        Toaster.show({message: 'SOMETHING OCCURRED: 処理中にエラーが発生しました'});
        console.error(r);
        Smoke.off();
      });
  }

  /**
   *
   * @param {'png'|'jpeg'} format
   * @return {convertToPNG|convertToJPEG}
   */
  getConvert(format) {
    let method;
    switch(format) {
      case 'png':
        method = convertToPNG;
        break;
      case 'jpeg':
        method = convertToJPEG;
        break;
      default:
        throw new Error(`invalid format: ${format}`);
    }
    return method;
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

    /* glitch method */
    let glitchFn;
    switch(this.state.method) {
      case 'png':
        glitchFn = this.pngGlitch;
        break;
      case 'jpeg':
        glitchFn = this.jpegGlitch;
        break;
      default:
        throw new Error(`invalid method: ${this.state.method}`);
    }
    for(let i = 0; i < 40; i++) {
      Smoke.setTotal(40);
      const p = glitchFn(dataUrl);
      pAll.push(p);
    }

    return Promise.all(pAll)
  }

  /**
   * @return {Promise}
   * @param dataUrl
   */
  jpegGlitch(dataUrl) {
    return new Promise((resolve) => {
      const jpeg = new JPEG_Container(dataUrl);
      jpeg.parse();
      jpeg.glitchShuffle();
      jpeg.glitch();
      jpeg.build();
      const newDataUrl = jpeg.toDataUrl();
      Smoke.progress();
      resolve(newDataUrl);
    });
  }

  /**
   *
   * @return {Promise}
   * @param dataUrl
   */
  pngGlitch(dataUrl) {
    return new Promise((resolve) => {
      const png = new PNG_Container(dataUrl);
      png.parse()
        .then(() => {
          png.glitch();
          png.build()
            .then(() => {
              const newDataUrl = png.toDataUrl();
              Smoke.progress();
              resolve(newDataUrl);
            });
        });
    })
  }
}

module.exports = Container;