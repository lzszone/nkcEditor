'use strict';

import React, {Component} from 'react'

function fileNameHandler(fileName) {
  const arr = fileName.split('.');
  const name1 = arr[1];
  const name2 = arr[2];
  if(name1.length > 15) {
    return name1.substring(0,15) + '.' + name2
  }
  return fileName
}

export default class ResourceList extends Component {
  constructor(props) {
    super(props);
    const {resourcesList} = props;
    this.state = {resourcesList}
  }

  _onFilesChange(e) {
    e.preventDefault();
    const files = Array.from(e.target.files);
    //translate a FileList Obj to an Array Obj, in order to use Array.map()

  }

  render() {
    const list = this.state.resourcesList.map(resource => (
      <div className="ResourceListItem"
           key={resource._key}
           onClick={e => {
             e.resource = resource;
             this.props.clickFn(e)
           }}
      >
        <img className="ResourceListItemThumb" src={'/rt/' + resource._key} />
        <div className="ResourceListItemText">{fileNameHandler(resource.oname)}</div>
      </div>
    ));
    return(
      <div className="panel panel-default">
        <div className="panel-heading">
          我的附件
          <button
            className="btn btn-default"
            style={{
              float: 'right',
              marginTop: -7,
              width: 60,
              height: 33,
              overflow: 'hidden'
            }}
            onClick={() => this.refs.files.click()}
          >
            上传
            <input
              type="file"
              multiple={true}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: 0
              }}
              ref="files"
              onChange={this._onFilesChange}
            />
          </button>
        </div>
        <div className="panel-body">{list}</div>
      </div>
    )
  }
}

/**
 * Created by lz on 2017/7/5.
 */
