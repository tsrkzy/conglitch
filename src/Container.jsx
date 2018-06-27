import React from 'react';
import {
  FileInput,
} from '@blueprintjs/core';
import './handler.css';

class Container extends React.Component {
  constructor(...props) {
    super(...props);

  }

  render() {
    return (
      <div>
        <FileInput disabled={false} text="Choose file..." onInputChange={this.onInputChangeHandler.bind(this)}/>
        <img src={'./test.jpeg'}/>
        <img src={'./test.jpeg'}/>
        <img src={'./test.jpeg'}/>
        <img src={'./test.jpeg'}/>
        <img src={'./test.jpeg'}/>
      </div>
    );
  }

  onInputChangeHandler(e) {
    console.log(e, e.target, e.target.value); // @DELETEME
  }
}

module.exports = Container;