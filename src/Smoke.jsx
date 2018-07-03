import React from 'react';
import {
  Dialog,
  Spinner,
} from '@blueprintjs/core';
import './handler.css';

class Smoke extends React.Component {
  constructor(props) {
    if(typeof Smoke.instance === 'object') {
      return Smoke.instance;
    }
    super(props);
    Smoke.instance = this;
    window.Smoke = Smoke;
    this.state = {
      show    : false,
      progress: void 0,
      total   : void 0,
      p       : void 0,
    };
  }

  static off() {
    const {instance} = Smoke;
    if(!instance) {
      return false;
    }
    instance.setState({show: false})
  }

  static on() {
    const {instance} = Smoke;
    if(!instance) {
      return false;
    }
    instance.setState({show: true, p: null});
  }

  /**
   * Smokeインスタンスが非表示または未作成の場合は作成し、progressを設定する
   * @param {?number} total
   */
  static setTotal(total) {
    return false;

    const {instance} = Smoke;
    if(!instance || !instance.state.show) {
      Smoke.on();
    }
    const progress = 0;
    const p = Number.isNaN(progress / total)
      ? null
      : (progress / total);
    instance.setState({p, progress, total})
  }

  static progress() {
    return false;

    const {instance} = Smoke;
    let {progress = 0, total} = instance.state;
    progress++;
    const p = Number.isNaN(progress / total)
      ? null
      : (progress / total);
    instance.setState({p, progress});
  }

  render() {
    return (
      <Dialog
        isOpen={this.state.show}
        canEscapeKeyClose={false}
        canOutsideClickClose={false}
        isCloseButtonShown={false}
        title={'処理中'}
      >
        <div
          style={{
            marginTop     : '20px',
            display       : 'flex',
            justifyContent: 'center',
          }}
        >
          <Spinner
            value={this.state.p}
          />
        </div>
        <p
          style={{
            textAlign: 'center',
          }}
          className={'pt-text-muted'}>しばらくお待ち下さい</p>
      </Dialog>
    )
  }
}

module.exports = Smoke;
