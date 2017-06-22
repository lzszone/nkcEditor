import React from 'react';
import Draft from 'draft-js';

const {
  EditorState,
  Editor,
  RichUtils,
  convertToRaw,
  CompositeDecorator
} = Draft;
const styles = {
  root: {
    fontFamily: '\'Helvetica\', sans-serif',
    padding: 20,
    width: 600,
  },
  buttons: {
    marginBottom: 10,
  },
  urlInputContainer: {
    marginBottom: 10,
  },
  urlInput: {
    fontFamily: '\'Georgia\', serif',
    marginRight: 10,
    padding: 3,
  },
  link: {
    color: '#3b5998',
    textDecoration: 'underline',
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

function findLinkEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges(
    character => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === 'LINK'
      );
    },
    callback
  );
}

const Link = props => {
  const {url} = props.contentState.getEntity(props.entityKey).getData();
  return (
    <a href={url} style={styles.link}>
      {props.children}
    </a>
  );
};

class NkcEditor extends React.Component {
  constructor(props) {
    super(props);

    const decorator = new CompositeDecorator([{
      strategy: findLinkEntities,
      component: Link
    }]);

    this.state = {
      editorState: EditorState.createEmpty(decorator),
      showURLInput: false,
      urlValue: '',
    };

    this.onChange = editorState => this.setState({editorState});
    this.focus = () => this.refs.editor.focus();
    this.logState = () => {
      const content = this.state.editorState.getCurrentContent();
      console.log(convertToRaw(content));
    };
    this.handleKeyCommand = command => this.handleKeyCommand(command);
    this.promptForLink = e => this._promptForLink(e);
    this.onURLChange = e => this.setState({urlValue: e.target.value});
    this.confirmLink = e => this._confirmLink(e);
    this.onLinkInputKeyDown = e => this._onLinkInputKeyDown(e);
    this.removeLink = e => this._removeLink(e);
  }

  handleKeyCommand(command) {
    const newState = RichUtils.handleKeyCommand(this.state.editorState, command);
    if(newState) {
      this.onchange(newState);
      return 'handled'
    }
    return 'not-handled'
  };

  _onBoldClick() {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, 'BOLD'));
  }

  _promptForLink(e) {
    e.preventDefault();
    const {editorState} = this.state;
    const selection = editorState.getSelection();
    if(!selection.isCollapsed()) {
      const contentState = editorState.getCurrentContent();
      const startKey = editorState.getSelection().getStartKey();
      const startOffset = editorState.getSelection().getStartOffset();
      const blockWithLinkAtBeginning = contentState.getBlockForKey(startKey);
      const linkKey = blockWithLinkAtBeginning.getEntityAt(startOffset);

      let url = '';
      if(linkKey) {
        const linkInstance = contentState.getEntity(linkKey);
        url = linkInstance.getData().url;
      }

      this.setState({
        showURLInput: true,
        urlValue: url
      }, () => setTimeout(() => this.refs.url.focus(), 0));
    }
  }

  _confirmLink(e) {
    e.preventDefault();
    const {editorState, urlValue} = this.state;
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(
      'LINK',
      'MUTABLE',
      {url: urlValue}
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.set(editorState, {currentContent: contentStateWithEntity});
    this.setState({
        editorState: RichUtils.toggleLink(
          newEditorState,
          newEditorState.getSelection(),
          entityKey
        ),
        showURLInput: false,
        urlValue: '',
      },
      () => setTimeout(() => this.refs.editor.focus(), 0)
    )
  }

  _onLinkInputKeyDown(e) {
    if(e.which === 13) {
      this._confirmLink(e);
    }
  }

  _removeLink(e) {
    e.preventDefault(e);
    const {editorState} = this.state;
    const selection = editorState.getSelection();
    if(!selection.isCollapsed()) {
      this.setState({
        editorState: RichUtils.toggleLink(editorState, selection, null)
      });
    }
  }

  render() {
    let urlInput;
    if (this.state.showURLInput) {
      urlInput =
        <div style={styles.urlInputContainer}>
          <input
            onChange={this.onURLChange}
            ref="url"
            style={styles.urlInput}
            type="text"
            value={this.state.urlValue}
            onKeyDown={this.onLinkInputKeyDown}
          />
          <button onMouseDown={this.confirmLink}>
            Confirm
          </button>
        </div>;
    }

    return (
      <div style={styles.root}>
        <div style={{marginBottom: 10}}>
          Select some text, then use the buttons to add or remove links on the selected text.
        </div>
        <div style={styles.buttons}>
          <button
            onMouseDown={this.promptForLink}
            style={{marginRight: 10}}
          >
            Add Link
          </button>
          <button onMouseDown={this.removeLink}>Remove Link</button>
        </div>
        {urlInput}
        <div style={styles.editor} onClick={this.focus}>
          <Editor
            editorState={this.state.editorState}
            onChange={this.onChange}
            placeholder="input some fucking shit"
            handleKeyCommand={this.handleKeyCommand}
            ref="editor"/>
        </div>
        <input
          onClick={this.logState}
          style={styles.button}
          type="button"
          value="Log State"
        />
        <button onClick={() => this._onBoldClick()} style={styles.button}>Bold</button>
      </div>
    );
  }
}

export default NkcEditor;