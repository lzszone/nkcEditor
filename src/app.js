import React from 'react';
import ReactDOM from 'react-dom';
import draft from 'draft-js';

const Editor = draft.Editor;
const EditorState = draft.EditorState;

class nkcEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {editorState: EditorState.createEmpty()};
    this.onChange = editorState => this.setState({editorState});
  }

  render() {
    return (
      <Editor editorState={this.state.editorState} onChange={this.onChange} />
    );
  }
}

ReactDOM.render(
  <nkcEditor />,
  document.getElementById('editor')
);
/**
 * Created by lz on 2017/6/19.
 */
