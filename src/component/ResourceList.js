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

  render() {
    const list = this.state.resourcesList.map(item => (
      <div className="ResourceListItem"
           key={item._key}
           onClick={e => {
             e.rid = item._key;
             this.props.clickFn(e)
           }}
      >
        <img className="ResourceListItemThumb" src={'/rt/' + item._key} />
        <div className="ResourceListItemText">{fileNameHandler(item.oname)}</div>
      </div>
    ));
    return(
      <div className="ResourceList">
        {list}
      </div>
    )
  }
}

/**
 * Created by lz on 2017/7/5.
 */
