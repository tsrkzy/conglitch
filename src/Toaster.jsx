import React from 'react';
import {
  Position,
  Toaster,
} from '@blueprintjs/core';
import './handler.css';

const AppToaster = Toaster.create({
  className: "sample",
  position: Position.TOP,
});

module.exports = AppToaster;
