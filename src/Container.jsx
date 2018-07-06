import React from 'react';
import {
  Button,
  Card,
  Elevation,
  RadioGroup,
  Radio,
  Intent,
  Popover,
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
      method   : 'jpeg',
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

  pop(index) {
    const {images} = this.state;
    for(let i = 0; i < images.length; i++) {
      let image = images[i];
      image.pop = (i === index);
    }
    this.setState({images});
  }

  renderImages() {
    const result = [];
    const {images} = this.state;
    for(let i = 0; i < images.length; i++) {
      let image = images[i];
      const {dataUrl} = image;
      const el = (
        <div key={i} style={{display: 'inline'}}>
          <Popover isOpen={this.state.images[i].pop}>
            <img src={dataUrl}
                 onClick={() => {
                   this.pop(i)
                 }}
                 style={{cursor: 'pointer'}}
            />
            <div>
              <div style={{
                display       : "flex",
                justifyContent: "center",
                margin        : 10
              }}>
                <Button
                  style={{marginRight: 10}}
                  onClick={() => {
                    this.onClickDownloadHandler.call(this, dataUrl)
                    this.pop();
                  }}>
                  ダウンロード
                </Button>
                <Button onClick={() => {
                  this.onRetryHandler.call(this, dataUrl)
                  this.pop();
                }}>
                  この画像を再度glitchする
                </Button>
              </div>
            </div>
          </Popover>
        </div>);
      result.push(el);
    }
    return result;
  }

  onClickDownloadHandler(dataUrl) {
    const anchor = document.createElement('A');
    anchor.setAttribute('download', 'glitched');
    anchor.href = dataUrl;
    anchor.click();
  }

  onRetryHandler(dataUrl) {
    this.onFileLoadHandler(dataUrl);
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

    const reader = new FileReader();
    reader.onload = this.onFileLoadHandler.bind(this);
    reader.readAsDataURL(f);
  }

  onFileLoadHandler(e) {
    Smoke.on();
    const dataUrl = (typeof e === 'string')
      ? e
      : e.target.result;
    const convertForGlitchFn = this.getConvert(this.state.method);
    convertForGlitchFn(dataUrl)
      .then((convertedBase64) => {
        this.glitch(convertedBase64)
          .then((arrayOfDataUrl) => {
            /* output format */
            const pAll = [];
            for(let i = 0; i < arrayOfDataUrl.length; i++) {
              const dataUrl = arrayOfDataUrl[i];
              const dataUrlArray = dataUrl instanceof Array ? dataUrl : [dataUrl];
              const convertFn = this.getConvert(this.state.format);
              for(let j = 0; j < dataUrlArray.length; j++) {
                let dataUrl = dataUrlArray[j];
                const p = new Promise((resolve) => {
                  convertFn(dataUrl)
                    .then((convertedDataUrl) => {
                      const image = {dataUrl: convertedDataUrl};
                      resolve(image);
                    });
                });
                pAll.push(p);
              }
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

    const processCount = navigator.hardwareConcurrency;
    const taskPerProcess = 10;
    for(let i = 0; i < processCount; i++) {
      let p = new Promise((resolve) => {
        const w = new Worker(`${this.state.method}Work.bundle.js`);
        const task = {dataUrl, taskPerProcess};
        w.onmessage = (e) => {
          const newDataUrlArray = e.data;
          resolve(newDataUrlArray);
          w.terminate();
        };
        w.postMessage(task);
      });
      pAll.push(p);
    }

    return Promise.all(pAll)
  }

}

module.exports = Container;