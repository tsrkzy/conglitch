import React from 'react';
import {
  Card,
  Elevation,
} from '@blueprintjs/core';
import './handler.css';

class Container extends React.Component {
  render() {
    const style = {
      card: {
      }
    };
    return (
      <Card elevation={Elevation.ONE} style={style.card}>

      </Card>
    );
  }
}

module.exports = Container;