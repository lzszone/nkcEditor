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
    borderRadius: 5,
    border: 1,
    borderStyle: 'solid',
    borderColor: '#ccc'
  },
  link: {
    color: '#3b5998',
    textDecoration: 'underline',
  },
  editor: {
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
    <a href={url} className="btn-info">
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
      bold: false,
      linkNameInput: '',
      linkUrlInput: ''
    };

    this.onChange = editorState => this.setState({editorState});
    this.focus = () => this.refs.editor.focus();
    this.logState = () => {
      const content = this.state.editorState.getSelection();
      console.log(content);
    };
    this.promptForLink = e => this._promptForLink(e);
    this.onLinkURLInputChange = e => this.setState({linkUrlInputValue: e.target.value});
    this.onLinkNameInputChange = e => this.setState({linkNameInputValue: e.target.value});
    this.confirmLink = e => this._confirmLink(e);
    this.onLinkURLInputKeyDown = e => this._onLinkURLInputKeyDown(e);
    this.removeLink = e => this._removeLink(e);
    this.onLinkNameInputKeyDown = e => this._onLinkNameInputKeyDown(e);
  }

  _onBoldClick() {
    const {editorState} = this.state;
    const selection = editorState.getSelection();
    if(selection.isCollapsed()) {
      console.log('eeee')
      this.onChange(EditorState.setInlineStyleOverride(editorState, 'BOLD'));
      return
    }
    this.onChange(RichUtils.toggleInlineStyle(editorState, 'BOLD'));
  }

  _promptForLink(e) {
    e.preventDefault();
    const {editorState} = this.state;
    const selection = editorState.getSelection();
    console.log(selection);
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
        linkUrlInputValue: url
      }, () => setTimeout(() => this.refs.linkUrl.focus(), 0));
    }
  }

  _confirmLink(e) {
    e.preventDefault();
    const {editorState, linkUrlInputValue} = this.state;
    const contentState = editorState.getCurrentContent();
    console.log(contentState);
    const contentStateWithEntity = contentState.createEntity(
      'LINK',
      'IMMUTABLE',
      {url: linkUrlInputValue}
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
        linkUrlInputValue: '',
      },
      () => setTimeout(() => this.refs.editor.focus(), 0)
    )
  }

  _onLinkURLInputKeyDown(e) {
    if(e.which === 13) {
      this._confirmLink(e);
    }
  }

  _onLinkNameInputKeyDown(e) {
    if(e.which === 13) {
      this.refs.linkUrl.focus();
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
          <span>链接名: </span>
          <input
            onChange={this.onLinkNameInputChange}
            ref="linkName"
            style={styles.urlInput}
            type="text"
            value={this.state.linkNameInputValue}
            onKeyDown={this.onLinkNameInputKeyDown}
          />
          <span>URL: </span>
          <input
            onChange={this.onLinkURLInputChange}
            ref="linkUrl"
            style={styles.urlInput}
            type="text"
            value={this.state.linkUrlInputValue}
            onKeyDown={this.onLinkURLInputKeyDown}
          />
          <button onMouseDown={this.confirmLink} className="btn btn-default btn-sm">确定</button>
        </div>;
    }

    return (
      <div style={styles.root}>
        <div className="btn-toolbar">
          <div className="btn-group">
            <button onMouseDown={this.promptForLink} className="btn btn-default">L</button>
            <button onMouseDown={this.removeLink} className="btn btn-default"><s>L</s></button>
          </div>
        </div>
        {urlInput}
        <div style={styles.editor} className="panel panel-default" onClick={this.focus}>
          <Editor
            editorState={this.state.editorState}
            onChange={this.onChange}
            placeholder="input some fucking shit"
            ref="editor"/>
        </div>
        <input
          onClick={this.logState}
          className="btn btn-default"
          type="button"
          value="Log State"
        />
        <button onClick={() => this._onBoldClick()} className="btn btn-default">Bold</button>
      </div>
    );
  }
}

export default NkcEditor;