'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import Container from './Container.jsx';

window.onload = () => {
  const el = document.getElementById('container');
  ReactDOM.render(<Container></Container>, el);
};