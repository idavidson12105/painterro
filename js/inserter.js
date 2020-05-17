import { tr } from './translation';
import { genId, KEYS, copyToClipboard, imgToDataURL } from './utils';

let instance = null;
export default class Inserter {
  constructor() {
    this.pasteOptions = {
      replace_all: {
        internalName: 'fit',
        handle: (img) => {
          this.main.fitImage(img);
        },
      }
    };
    this.activeOption = this.pasteOptions;
  }

  init(main) {
    this.CLIP_DATA_MARKER = 'painterro-image-data';
    this.ctx = main.ctx;
    this.main = main;
    this.worklog = main.worklog;
    this.selector = main.wrapper.querySelector('.ptro-paster-select-wrapper');
    this.cancelChoosing();
    this.img = null;
    Object.keys(this.pasteOptions).forEach((k) => {
      const o = this.pasteOptions[k];
      this.main.doc.getElementById(o.id).onclick = () => {
        if (this.loading) {
          this.doLater = o.handle;
        } else {
          o.handle(this.img);
        }
        this.cancelChoosing();
      };
    });
    this.loading = false;
    this.doLater = null;
  }

  cancelChoosing() {
    this.selector.setAttribute('hidden', '');
    this.waitChoice = false;
  }

  loaded(img) {
    this.img = img;
    this.loading = false;
    if (this.doLater) {
      this.doLater(img);
      this.doLater = null;
    }
  }

  handleOpen(src) {
    this.startLoading();
    const handleIt = (source) => {
      const img = new Image();
      const empty = this.main.worklog.clean;
      img.onload = () => {
        if (empty) {
          this.main.fitImage(img);
        } else {
          this.loaded(img);
        }
        this.finishLoading();
      };
      img.src = source;
      if (!empty) {
        if (Object.keys(this.activeOption).length !== 1) {
          this.selector.removeAttribute('hidden');
          this.waitChoice = true;
        } else {
          this.doLater = this.activeOption[Object.keys(this.activeOption)[0]].handle;
        }
      }
    };

    if (src.indexOf('data') !== 0) {
      imgToDataURL(src, (dataUrl) => { // if CORS will not allow,
        // better see error in console than have different canvas mode
        handleIt(dataUrl);
      });
    } else {
      handleIt(src);
    }
  }

  startLoading() {
    this.loading = true;
    const btn = this.main.doc.getElementById(this.main.toolByName.open.buttonId);
    const icon = this.main.doc.querySelector(`#${this.main.toolByName.open.buttonId} > i`);
    if (btn) {
      btn.setAttribute('disabled', 'true');
    }
    if (icon) {
      icon.className = 'ptro-icon ptro-icon-loading ptro-spinning';
    }
  }

  finishLoading() {
    const btn = this.main.doc.getElementById(this.main.toolByName.open.buttonId);
    const icon = this.main.doc.querySelector(`#${this.main.toolByName.open.buttonId} > i`);
    if (btn) {
      btn.removeAttribute('disabled');
    }
    if (icon) {
      icon.className = 'ptro-icon ptro-icon-open';
    }
    if (this.main.params.onImageLoaded) {
      this.main.params.onImageLoaded();
    }
  }

  static get() {
    if (instance) {
      return instance;
    }
    instance = new Inserter();
    return instance;
  }

  html() {
    let buttons = '';
    Object.keys(this.pasteOptions).forEach((k) => {
      const o = this.pasteOptions[k];
      o.id = genId();
      buttons += `<button type="button" id="${o.id}" class="ptro-selector-btn ptro-color-control">` +
        `<div><i class="ptro-icon ptro-icon-paste_${o.internalName}"></i></div>` +
        `<div>${tr(`pasteOptions.${o.internalName}`)}</div>` +
      '</button>';
    });
    return '<div class="ptro-paster-select-wrapper" hidden><div class="ptro-paster-select ptro-v-middle">' +
      '<div class="ptro-in ptro-v-middle-in">' +
      `<div class="ptro-paste-label">${tr('pasteOptions.how_to_paste')}</div>${
        buttons}</div></div></div>`;
  }
}
