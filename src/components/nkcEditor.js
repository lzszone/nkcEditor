'use strict';

import React from 'react';
import Draft from 'draft-js';
import {stateToHTML} from 'draft-js-export-html';
import {Map} from 'immutable';
import TexBlock from './TeXBlock';
import ResourcesList from './resourcesList';
import Resource from './Resource';

const {
  EditorState,
  Editor,
  RichUtils,
  CompositeDecorator,
  AtomicBlockUtils,
  Modifier,
  SelectionState
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

function xhrWithPromise(data, that) {
  if(!data || !that) throw 'parameters invalid';
  const formData = new FormData();
  formData.append('file', data);
  return new Promise((resolve, reject) => {
    that.setState({uploadingFile: data.name});
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = e => {
      const uploadPercentage = ((e.loaded / e.total) * 100).toPrecision(1);
      that.setState({uploadPercentage})
    };
    xhr.open('POST', '/api/resources');
    xhr.onreadystatechange = e => {
      if(xhr.readyState === 4) {
        if(xhr.status === 200) {
          resolve(true)
        } else {
          reject(Error(xhr.statusText))
        }
      }
    };
    xhr.onerror = e => {
      reject(Error('XMLHttpRequest failed'))
    };
    xhr.send(formData);
  })
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
  DELETE: {
    textDecoration: 'line-through'
  }
};

const BLOCK_TYPES = [
  {label: 'H', style: 'header-two'},
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
      linkUrlInput: '',
      liveTeXEdits: Map(),
      resourcesList: [],
      showResourcesList: false,
      isFetching: false,
      uploadingFile: false,
      uploadPercentage: false,
      isUploading: false
    };

    this.onChange = editorState => this.setState({editorState});
    this.focus = () => this.refs.editor.focus();

    this._blockRenderer = block => {
      const {editorState} = this.state;
      const entityKey = block.getEntityAt(0);
      let entityType;
      if(entityKey) {
        entityType = editorState.getCurrentContent().getEntity(entityKey).getType();
      }
      if (block.getType() === 'atomic') {
        if(entityType === 'TOKEN') {
          return {
            component: TexBlock,
            editable: false,
            props: {
              onStartEdit: blockKey => {
                const {liveTeXEdits} = this.state;
                this.setState({liveTeXEdits: liveTeXEdits.set(blockKey, true)});
              },
              onFinishEdit: (blockKey, newContentState) => {
                const {liveTeXEdits} = this.state;
                this.setState({
                  liveTeXEdits: liveTeXEdits.remove(blockKey),
                  editorState:EditorState.createWithContent(newContentState),
                });
              },
              onRemove: blockKey => this._removeTeX(blockKey),
            }
          };
        }
        else if(entityType === 'resource') {
          return {
            component: Resource,
            editable: false,
            props: {}
          }
        }
        else {
          return null;
        }
      }
      return null;
    };

    this._removeTeX = blockKey => {
      const {editorState, liveTeXEdits} = this.state;
      const content = editorState.getCurrentContent();
      const block = content.getBlockForKey(blockKey);
      const targetRange = new SelectionState({
        anchorKey: blockKey,
        anchorOffset: 0,
        focusKey: blockKey,
        focusOffset: block.getLength()
      });

      const withoutTex = Modifier.removeRange(content, targetRange, 'backward');
      const resetBlock = Modifier.setBlockType(
        withoutTex,
        withoutTex.getSelectionAfter(),
        'unstyled'
      );
      const newState = EditorState.push(editorState, resetBlock, 'remove-range');
      const newEditorState = EditorState.forceSelection(
        newState,
        resetBlock.getSelectionAfter()
      );
      this.setState({
        liveTeXEdits: liveTeXEdits.remove(blockKey),
        editorState: newEditorState
      });
    };

    this._insertTeX = () => {
      const {editorState} = this.state;
      const contentState = editorState.getCurrentContent();
      const contentStateWithEntity = contentState.createEntity(
        'TOKEN',
        'IMMUTABLE',
        {content: ''}
      );
      const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
      const newEditorState = EditorState.set(
        editorState,
        {currentContent: contentStateWithEntity}
      );
      this.setState({
        liveTeXEdits: Map(),
        editorState:  AtomicBlockUtils.insertAtomicBlock(newEditorState, entityKey, ' ')
      })
    };

    this._resourceClickHandler = (e) => {
      e.preventDefault();
      const resource = e.resource;
      const {editorState} = this.state;
      const contentState = editorState.getCurrentContent();
      const contentStateWithEntity = contentState.createEntity(
        'resource',
        'IMMUTABLE',
        {resource}
      );
      const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
      const newEditorState = EditorState.set(
        editorState,
        {currentContent: contentStateWithEntity}
      );
      this.setState({
        editorState: AtomicBlockUtils.insertAtomicBlock(
          newEditorState,
          entityKey,
          ' '
        )
      })
    };

    this._showResourcesListSwitch = () => {
      const {showResourcesList, resourcesList} = this.state;
      this.setState({
        showResourcesList: !showResourcesList
      });
      if(!showResourcesList && resourcesList.length === 0) {
        this._updateResourcesList();
      }
    };

    this._updateResourcesList = () => {
      this.setState({
        isFetching: true
      });
      nkcAPI('getResourceOfCurrentUser', {quota: 12})
        .then(list => {
          this.setState({
            isFetching: false,
            resourcesList: list
          }, this.render);
        })
        .catch(e => screenTopWarning(e.stack))
    };

    this._handleFilesUpload = e => {
      const files = Array.from(e.target.files);
      //transform a FileList to an Array;
      const uploadQueue = files.map(file => xhrWithPromise(file, this));
      this.setState({isUploading: true});
      Promise.all(uploadQueue)
        .then(() => {
          this.setState({
            isUploading: false,
            uploadingFile: false,
            uploadPercentage: false
          }, this._updateResourcesList);
          screenTopAlert('上传成功')
        })
        .catch(e => {
          this.setState({
            isUploading: false,
            uploadingFile: false,
            uploadPercentage: false
          }, this._updateResourcesList);
          screenTopWarning(e)
        })
    };

    this.promptForLink = e => this._promptForLink(e);
    this.onLinkURLInputChange = e => this.setState({linkUrlInputValue: e.target.value});
    this.confirmLink = e => this._confirmLink(e);
    this.onLinkURLInputKeyDown = e => this._onLinkURLInputKeyDown(e);
    this.removeLink = e => this._removeLink(e);
    this.onTab = e => this._onTab(e);
    this.toggleBlockType = type => this._toggleBlockType(type);
    this.toggleInlineStyle = style => this._toggleInlineStyle(style);
    this.handleKeyCommand = command => this._handleKeyCommand(command);
    this.onSubmit = () => {
      const {editorState} = this.state;
      const contentState = editorState.getCurrentContent();
      let options = {
        inlineStyles: styleMap,
        blockRenderers: this._blockRenderer
      };
      const contentInHTML = stateToHTML(contentState, options);
    }
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
    if(!selection.isCollapsed()) {
      const startKey = selection.getStartKey();
      const startOffset = selection.getStartOffset();
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
    let linkBtn;
    let urlInput;
    const {editorState} = this.state;
    if (this.state.showURLInput) {
      urlInput =
        <div style={styles.urlInputContainer}>
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

    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const entityKey = contentState
      .getBlockForKey(selection.getStartKey())
      .getEntityAt(selection.getStartOffset());
    let entityInstance = {};
    try {
      entityInstance = contentState.getEntity(entityKey);
    } catch(e) {
      entityInstance = {}
    } finally {
      if(entityInstance.type === 'LINK') {
        linkBtn = <button onMouseDown={this.removeLink} className="btn btn-sm btn-default">
          <del>L</del>
        </button>
      }
      else {
        linkBtn = <button onMouseDown={this.promptForLink} className="btn btn-sm btn-default">
          L
        </button>
      }
    }

    let _resourcesList;
    if(this.state.showResourcesList) {
      _resourcesList = <ResourcesList
        resourcesList={this.state.resourcesList}
        clickFn={this._resourceClickHandler}
        isFetching={this.state.isFetching}
        handleFilesUpload={this._handleFilesUpload}
        isUploading={this.state.isUploading}
        uploadingFile={this.state.uploadingFile}
        uploadPercentage={this.state.uploadPercentage}
      />
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
        {linkBtn}
        <button onClick={this._insertTeX} className="btn btn-default btn-sm">式</button>
        <button onClick={this._showResourcesListSwitch} className="btn btn-default btn-sm">资</button>
        {urlInput}
        <div style={styles.editor} className="panel panel-default" onClick={this.focus}>
          <Editor
            blockRendererFn={this._blockRenderer}
            customStyleMap={styleMap}
            editorState={editorState}
            onChange={this.onChange}
            handleKeyCommand={this.handleKeyCommand}
            onTab={this.onTab}
            placeholder="input some fucking shit"
            readOnly={this.state.liveTeXEdits.count()}
            ref="editor"/>
        </div>
        {_resourcesList}
      </div>
    );
  }
}

export default NkcEditor;