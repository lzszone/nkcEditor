'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import NkcEditor from './components/nkcEditor';

const render = Component => {
  ReactDOM.render(
    <Component />,
    document.getElementById('editor')
  )
};

render(NkcEditor);

if(module.hot) {
  module.hot.accept('./component/nkcEditor.js', () => {render(NkcEditor)})
}

/**
 * Created by lz on 2017/6/19.
 */
