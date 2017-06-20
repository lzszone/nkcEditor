import React from 'react';
import ReactDOM from 'react-dom';
import {EditorState, Editor} from 'draft-js';

const styles = {
  root: {
    fontFamily: '\'Helvetica\', sans-serif',
    padding: 20,
    width: 600,
  },
  editor: {
    border: '1px solid #ccc',
    cursor: 'text',
    minHeight: 80,
    padding: 10,
  },
  button: {
    marginTop: 10,
    textAlign: 'center',
  },
};

class NkcEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {editorState: EditorState.createEmpty()};
    this.onChange = editorState => this.setState({editorState});
    this.focus = () => this.refs.editor.focus();
    this.logState = () => console.log(this.state.editorState.toJS());
  }

  render() {
    return (
      <div style={styles.root}>
        <div style={styles.editor} onClick={this.focus}>
          <Editor editorState={this.state.editorState} onChange={this.onChange} placeholder="input some shit" ref="editor"/>
        </div>
        <input
          onClick={this.logState}
          style={styles.button}
          type="button"
          value="Log State"
        />
      </div>
    );
  }
}

ReactDOM.render(
  <NkcEditor />,
  document.getElementById('editor')
);
/**
 * Created by lz on 2017/6/19.
 */
