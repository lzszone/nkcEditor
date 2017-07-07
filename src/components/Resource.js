'use strict';

import React, {Component} from 'react';

function fileSizeHandler(num) {
  const size = Number(num);
  return (size>1024)?
    ((size>1048576)?
      (size/1048576).toPrecision(3)+'M':
        (size/1024).toPrecision(3)+'k'):
    size.toPrecision(3)+'b'
}

export default class Resource extends Component {
  constructor(props) {
    super(props);
    this.state = {
      resource: this._getResource()
    }
  }

  _getResource() {
    return this.props.contentState
      .getEntity(this.props.block.getEntityAt(0))
      .getData().resource;
  }

  _preventDefault(e) {
    e.preventDefault()
  }

  render() {
    const resource = this.state.resource;
    if(['png', 'bmp', 'jpg', 'jpeg', 'gif', 'svg'].indexOf(resource.ext) > -1) {
      return(
        <a href={"/r/" + resource._key} target="_blank" title={resource.oname} onClick={this._preventDefault}>
          <img className="PostContentImage" src={'/r/' + resource._key} alt={resource._key} />
        </a>
      )
    }
    return (
      <div>
        <a href={'/r/' + resource._key} onClick={this._preventDefault}>
          <img src="/default/default_thumbnail.png" />
          {resource.oname}
        </a>
        <span className="PostResourceFileSize">
          {fileSizeHandler(resource.size)}
        </span>
        <span className="PostResourceCounter">
          {(resource.hits || 0) + '次'}
        </span>
      </div>
    )
  }
}

/**
 * Created by lz on 2017/7/6.
 */
