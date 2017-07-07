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

export default class ResourcesList extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      isUploading,
      isFetching,
      uploadingFile,
      uploadPercentage,
      resourcesList,
      clickFn,
      handleFilesUpload,
    } = this.props;
    let component;
    if(isUploading) {
      component = <div>
        <p style={{textAlign: 'center'}}>
          <span>正在上传文件：</span>
          <span style={{fontSize: 20}}>{uploadingFile}</span>
        </p>
        <p style={{textAlign: 'center'}}>
          <span>进度：</span>
          <span style={{fontSize: 20}}>{uploadPercentage}</span>
        </p>
      </div>
    } else if(isFetching) {
      component = <h3 style={{textAlign: 'center'}}>通信中···</h3>;
    } else {
      component = resourcesList.map(resource => (
        <div className="ResourceListItem"
             key={resource._key}
             onClick={e => {
               e.resource = resource;
               clickFn(e)
             }}
        >
          <img className="ResourceListItemThumb" src={'/rt/' + resource._key} />
          <div className="ResourceListItemText">{fileNameHandler(resource.oname)}</div>
        </div>
      ));
    }

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
              onChange={e => handleFilesUpload(e)}
            />
          </button>
        </div>
        <div className="panel-body">{component}</div>
      </div>
    )
  }
}

/**
 * Created by lz on 2017/7/5.
 */
