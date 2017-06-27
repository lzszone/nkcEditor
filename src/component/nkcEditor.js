'use strict';

import React from 'react';
import Draft from 'draft-js';

const {
  EditorState,
  Editor,
  RichUtils,
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

class StyleButton extends React.Component {
  constructor() {
    super();
    this.onToggle = e => {
      e.preventDefault();
      this.props.onToggle(this.props.style);
    };
  }

  render() {
    if(this.props.active) {
      return(
        <button className="btn btn-default" onMouseDown={this.onToggle}>
          <del>{this.props.label}</del>
        </button>
      )
    }
    return(
      <button className="btn btn-default" onMouseDown={this.onToggle}>
        {this.props.label}
      </button>
    )
  }
}

const styleMap = {
  CODE: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2,
  },
};

function getBlockStyle(block) {
  switch (block.getType()) {
    case 'blockquote': return null;
    default: return null;
  }
}

const BLOCK_TYPES = [
  {label: 'H1', style: 'header-one'},
  {label: 'H2', style: 'header-two'},
  {label: 'H3', style: 'header-three'},
  {label: '引', style: 'blockquote'},
  {label: '列', style: 'unordered-list-item'},
  {label: '数列', style: 'ordered-list-item'},
  {label: '码', style: 'code-block'}
];

const BlockStyleController = props => {
  const {editorState} = props;
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  return(
    <div className="btn-toolbar">
      <div className="btn-group-sm">
        {BLOCK_TYPES.map(type =>
          <StyleButton
            key={type.label}
            active={type.style === blockType}
            label={type.label}
            onToggle={props.onToggle}
            style={type.style}
          />
        )}
      </div>
    </div>
  )
};

const INLINE_STYLES = [
  {label: '粗', style: 'BOLD'},
  {label: '斜', style: 'ITALIC'},
  {label: '_', style: 'UNDERLINE'},
  {label: '删', style: 'DELETE'},
  {label: '等宽', style: 'CODE'}
];

const InlineStyleController = props => {
  const currentStyle = props.editorState.getCurrentInlineStyle();
  return(
    <div className="btn-toolbar">
      <div className="btn-group-sm">
        {INLINE_STYLES.map(type =>
          <StyleButton
            key={type.label}
            active={currentStyle.has(type.style)}
            label={type.label}
            onToggle={props.onToggle}
            style={type.style}
          />
        )}
      </div>
    </div>
  )
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
    this.onTab = e => this._onTab(e);
    this.toggleBlockType = type => this._toggleBlockType(type);
    this.toggleInlineStyle = style => this._toggleInlineStyle(style);
    this.handleKeyCommand = command => this._handleKeyCommand(command);
  }

  _handleKeyCommand(command) {
    const {editorState} = this.state;
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if(newState) {
      this.onChange(newState);
      return true;
    }
    return false;
  }

  _onTab(e) {
    const maxDepth = 2;
    this.onChange(RichUtils.onTab(e, this.state.editorState, maxDepth));
  }

  _toggleBlockType(blockType) {
    this.onChange(RichUtils.toggleBlockType(this.state.editorState, blockType))
  }

  _toggleInlineStyle(style) {
    this.onChange(
      RichUtils.toggleInlineStyle(
        this.state.editorState,
        style
      )
    )
  }

  _promptForLink(e) {
    e.preventDefault();
    const {editorState} = this.state;
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const text = contentState.getPlainText();
    console.log('selection: \n');
    console.log(selection);
    if(!selection.isCollapsed()) {
      const startKey = selection.getStartKey();
      const startOffset = selection.getStartOffset();
      const blockWithLinkAtBeginning = contentState.getBlockForKey(startKey);
      const linkKey = blockWithLinkAtBeginning.getEntityAt(startOffset);
      console.log('contentState: \n');
      console.log(contentState.getPlainText());
      let url = '';
      let name = text;
      if(linkKey) {
        const linkInstance = contentState.getEntity(linkKey);
        url = linkInstance.getData().url;
        name = linkInstance.getData().name;
      }

      this.setState({
        showURLInput: true,
        linkUrlInputValue: url,
        linkNameInputValue: name
      }, () => setTimeout(() => this.refs.linkUrl.focus(), 0));
    }
  }

  _confirmLink(e) {
    e.preventDefault();
    const {editorState, linkUrlInputValue} = this.state;
    const contentState = editorState.getCurrentContent();
    const text = contentState.getPlainText();
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
    const {editorState} = this.state;
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
        <BlockStyleController
          editorState={editorState}
          onToggle={this.toggleBlockType}
        />
        <InlineStyleController
          editorState={editorState}
          onToggle={this.toggleInlineStyle}
        />
        <div className="btn-toolbar-sm">
          <div className="btn-group">
            <button onMouseDown={this.promptForLink} className="btn btn-default">L</button>
            <button onMouseDown={this.removeLink} className="btn btn-default"><s>L</s></button>
          </div>
        </div>
        {urlInput}
        <div style={styles.editor} className="panel panel-default" onClick={this.focus}>
          <Editor
            blockStyleFn={getBlockStyle}
            customStyleMap={styleMap}
            editorState={editorState}
            onChange={this.onChange}
            handleKeyCommand={this.handleKeyCommand}
            onTab={this.onTab}
            placeholder="input some fucking shit"
            ref="editor"/>
        </div>
        <input
          onClick={this.logState}
          className="btn btn-default"
          type="button"
          value="Log State"
        />
      </div>
    );
  }
}

export default NkcEditor;