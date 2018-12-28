'use babel';

import { CompositeDisposable } from 'atom';
import { dirname, basename } from 'path'
import { execFile } from 'child_process'
import targets from './targets'
import PandocPublishView from './pandoc-publish-view';

const NAMESPACE = "pandoc-publish";

console.log('HI BEN!')

export default {

  pandocPublishView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.pandocPublishView = new PandocPublishView(state.pandocPublishViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.pandocPublishView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    Object.keys(targets).forEach(target => {
      const action = `${NAMESPACE}:${target}`

      this.subscriptions.add(atom.commands.add('atom-workspace', action, () => {
        this.publish(target)
      }))
    });
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.pandocPublishView.destroy();
  },

  serialize() {
    return {
      pandocPublishViewState: this.pandocPublishView.serialize()
    };
  },

  error(message) {
    atom.notifications.addError(`${NAMESPACE}<br/>${message}`)
  },

  success(message) {
    atom.notifications.addSuccess(`${NAMESPACE}<br/>${message}`)
  },

  info(message) {
    atom.notifications.addInfo(`${NAMESPACE}<br/>${message}`)
  },

  publish(target) {
    const editor = atom.workspace.getActiveTextEditor()
    const pandoc = atom.config.get(`${NAMESPACE}.pandocBinary`)

    if (editor.isModified() || !editor.getPath()) {
      return this.error('Save changes before publishing!')
    }

    const fullPath = editor.getPath()
    const cwd = dirname(fullPath)
    const inFile = basename(fullPath)
    const format = targets[target].format || target
    const ext = targets[target].ext
    const outFile = inFile.substr(0, inFile.lastIndexOf(".")) + `.${ext}`;
    this.info(`**Starting:** ${inFile} --> ${outFile}`)
    switch (format) {
      case "latex":
      // PDF Conversion
        const t = atom.config.get(`${NAMESPACE}.latexTemplate`)
        // if template spec is set then use, otherwise default to nothing
        t ? template = `--template=${t}` : template = ''

          execFile(pandoc, [
           template,
           `--to=${format}`,
           `--output=${outFile}`,
           '--listings',
           inFile
         ], { cwd }, (error) => {
            if (error) {
              console.log("error")
              this.error(error.message)
            } else {
              console.log('success')
              this.success(`**Success:** \`${outFile}\``)
            }})
        break;
      case "docx":
        break;
      case "slideshow":
        break;
      case "text":
        break;
      default:
        console.log(`format: ${format}`)
    }
  },
};
