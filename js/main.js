import isMobile from 'ismobilejs';
import html2canvas from 'html2canvas';
import '../css/styles.css';
import '../css/bar-styles.css';
import '../css/icons/ptroiconfont.css';

import WorkLog from './worklog';
import { genId, addDocumentObjectHelpers, KEYS, trim,
  getScrollbarWidth, distance, logError } from './utils';
import PrimitiveTool from './primitive';
import ColorPicker, { HexToRGB, rgbToHex } from './colorPicker';
import { setDefaults, setParam } from './params';
import { tr } from './translation';
import ZoomHelper from './zoomHelper';
import TextTool from './text';
import Resizer from './resizer';
import Inserter from './inserter';
import Settings from './settings';
import printJS from "print-js";

require('es6-promise').polyfill();

class PainterroProc {
  constructor(params) {
    addDocumentObjectHelpers();
    this.params = setDefaults(params);
    this.colorWidgetState = {
      line: {
        target: 'line',
        paletteColor: this.params.activeColor,
        alpha: this.params.activeColorAlpha,
        alphaColor: this.params.activeAlphaColor,
      },
      fill: {
        target: 'fill',
        paletteColor: this.params.activeFillColor,
        alpha: this.params.activeFillColorAlpha,
        alphaColor: this.params.activeFillAlphaColor,
      },
      noteFill: {
        target: 'noteFill',
        paletteColor: this.params.activeNoteFillColor,
        alpha: this.params.activeNoteFillColorAlpha,
        alphaColor: this.params.activeNoteFillAlphaColor,
      },
      bg: {
        target: 'bg',
        paletteColor: this.params.backgroundFillColor,
        alpha: this.params.backgroundFillColorAlpha,
        alphaColor: this.params.backgroundFillAlphaColor,
      },
      stroke: {
        target: 'stroke',
        paletteColor: this.params.textStrokeColor,
        alpha: this.params.textStrokeColorAlpha,
        alphaColor: this.params.textStrokeAlphaColor,
      },
    };
    this.currentBackground = this.colorWidgetState.bg.alphaColor;
    this.currentBackgroundAlpha = this.colorWidgetState.bg.alpha;

    this.tools = [{
      name: 'line',
      hotkey: 'l',
      activate: () => {
        this.toolContainer.style.cursor = 'crosshair';
        this.primitiveTool.activate('line');
      },
      eventListener: () => this.primitiveTool,
    }, {
      name: 'arrow',
      hotkey: 'a',
      activate: () => {
        this.toolContainer.style.cursor = 'crosshair';
        this.primitiveTool.activate('arrow');
      },
      eventListener: () => this.primitiveTool,
    }, {
      name: 'rect',
      activate: () => {
        this.toolContainer.style.cursor = 'crosshair';
        this.primitiveTool.activate('rect');
      },
      eventListener: () => this.primitiveTool,
    }, {
      name: 'ellipse',
      activate: () => {
        this.toolContainer.style.cursor = 'crosshair';
        this.primitiveTool.activate('ellipse');
      },
      eventListener: () => this.primitiveTool,
    }, {
      name: 'brush',
      hotkey: 'b',
      activate: () => {
        this.toolContainer.style.cursor = 'crosshair';
        this.primitiveTool.activate('brush');
      },
      eventListener: () => this.primitiveTool,
    }, {
      name: 'eraser',
      activate: () => {
        this.toolContainer.style.cursor = 'crosshair';
        this.primitiveTool.activate('eraser');
      },
      eventListener: () => this.primitiveTool,
    }, {
      name: 'toggleNotes',
      hotkey: '',
      activate: () => {
        this.notesCanvas.style.display === 'none' ?
            this.notesCanvas.style.display = 'initial' : this.notesCanvas.style.display = 'none';
        this.closeActiveTool();
      }
    }, {
      name: 'note',
      hotkey: 'n',
      activate: () => {
        this.toolContainer.style.cursor = 'crosshair';
      },
      close: () => {
        this.notesTool.close();
      },
      eventListener: () => this.notesTool,
    }, {
      name: 'text',
      hotkey: 't',
      activate: () => {
        this.toolContainer.style.cursor = 'crosshair';
      },
      close: () => {
        this.textTool.close();
      },
      eventListener: () => this.textTool,
    }, {
      name: 'rotateR',
      hotkey: 'r',
      activate: () => {
        this.rotate();
        this.worklog.captureState();
        this.closeActiveTool();
      },
    }, {
      name: 'rotateL',
      hotkey: 'e',
      activate: () => {
        this.rotate(false);
        this.worklog.captureState();
        this.closeActiveTool();
      },
    },{
      name: 'rotate180',
      hotkey: 'm',
      activate: () => {
        this.rotate();
        this.rotate();
        this.worklog.captureState();
        this.closeActiveTool();
      },
    }, {
      name: 'resize',
      activate: () => {
        this.resizer.open();
      },
      close: () => {
        this.resizer.close();
      },
      eventListener: () => this.resizer,
    },
    {
      name: 'undo',
      activate: () => {
        this.worklog.undoState();
        this.closeActiveTool();
      },
      eventListener: () => this.resizer,
    },
    {
      name: 'redo',
      activate: () => {
        this.worklog.redoState();
        this.closeActiveTool();
      },
      eventListener: () => this.resizer,
    }, {
      name: 'settings',
      activate: () => {
        this.settings.open();
      },
      close: () => {
        this.settings.close();
      },
      eventListener: () => this.settings,
    }, {
      name: 'print',
      hotkey: 'p',
      activate: () => {
        const dataUrl = this.imageSaver.asDataURL('image/png', 1.0);
        printJS({printable: dataUrl, type: 'image', style: '@page { size: auto;  margin: 0; }'});
        this.closeActiveTool();
      }
    }, {
      name: 'save',
      right: true,
      hotkey: this.params.saveByEnter ? 'enter' : false,
      activate: () => {
        this.save();
        this.closeActiveTool();
      },
    }, {
      name: 'open',
      right: true,
      activate: () => {
        this.closeActiveTool();
        const input = document.getElementById('ptro-file-input');
        input.click();
        input.onchange = (event) => {
          const files = event.target.files || event.dataTransfer.files;
          if (!files.length) {
            return;
          }
          this.openFile(files[0]);
          input.value = ''; // to allow reopen
        };
      },
    }, {
      name: 'close',
      hotkey: this.params.hideByEsc ? 'esc' : false,
      right: true,
      activate: () => {
        const doClose = () => {
          this.closeActiveTool();
          this.close();
          this.hide();
        };

        if (this.params.onBeforeClose) {
          this.params.onBeforeClose(this.hasUnsaved, doClose);
        } else {
          doClose();
        }
      },
    }];
    this.isMobile = isMobile.any;
    this.toolByName = {};
    this.toolByKeyCode = {};
    this.tools.forEach((t) => {
      this.toolByName[t.name] = t;
      if (t.hotkey) {
        if (!KEYS[t.hotkey]) {
          throw new Error(`Key code for ${t.hotkey} not defined in KEYS`);
        }
        this.toolByKeyCode[KEYS[t.hotkey]] = t;
      }
    });
    this.activeTool = undefined;
    this.zoom = false;
    this.ratioRelation = undefined;
    this.id = this.params.id;
    this.saving = false;

    if (this.id === undefined) {
      this.id = genId();
      this.holderId = genId();
      this.holderEl = document.createElement('div');
      this.holderEl.id = this.holderId;
      this.holderEl.className = 'ptro-holder-wrapper';
      document.body.appendChild(this.holderEl);
      this.holderEl.innerHTML = `<div id='${this.id}' class="ptro-holder"></div>`;
      this.baseEl = document.getElementById(this.id);
    } else {
      this.baseEl = document.getElementById(this.id);
      this.holderEl = null;
    }
    let bar = '';
    let rightBar = '';
    this.tools.filter(t => this.params.hiddenTools.indexOf(t.name) === -1).forEach((b) => {
      const id = genId();
      b.buttonId = id;
      const hotkey = b.hotkey ? ` [${b.hotkey.toUpperCase()}]` : '';
      const btn = `<button type="button" class="ptro-icon-btn ptro-color-control" title="${tr(`tools.${b.name}`)}${hotkey}" ` +
        `id="${id}" >` +
        `<i class="ptro-icon ptro-icon-${b.name}"></i></button>`;
      if (b.right) {
        rightBar += btn;
      } else {
        bar += btn;
      }
    });

    this.inserter = Inserter.get();

    const cropper = '<div class="ptro-crp-el">' +
      `${TextTool.code('text')}${TextTool.code('notes')}</div>`;

    this.loadedName = '';
    this.doc = document;
    this.wrapper = this.doc.createElement('div');
    this.wrapper.id = `${this.id}-wrapper`;
    this.wrapper.className = 'ptro-wrapper';
    this.wrapper.innerHTML =
      '<div class="ptro-scroller">' +
        '<div class="ptro-center-table">' +
          '<div class="ptro-center-tablecell">' +
            `<canvas id="notes-canvas"></canvas>` +
            `<canvas id="${this.id}-canvas"></canvas>` +
            `<div class="ptro-substrate"></div>${cropper}` +
          '</div>' +
        '</div>' +
      `</div>${
        ColorPicker.html() +
        ZoomHelper.html() +
        Resizer.html() +
        Settings.html(this) +
        this.inserter.html()}`;
    this.baseEl.appendChild(this.wrapper);
    this.scroller = this.doc.querySelector(`#${this.id}-wrapper .ptro-scroller`);
    this.bar = this.doc.createElement('div');
    this.bar.id = `${this.id}-bar`;
    this.bar.className = 'ptro-bar ptro-color-main';
    this.bar.innerHTML =
      `<div><span>${bar}</span>` +
      `<span class="ptro-bar-right">${rightBar}</span>` +
      '<input id="ptro-file-input" type="file" style="display: none;" accept="image/x-png,image/png,image/gif,image/jpeg" /></div>';
    if (this.isMobile) {
      this.bar.style['overflow-x'] = 'auto';
    }

    this.baseEl.appendChild(this.bar);
    const style = this.doc.createElement('style');
    style.innerHTML = this.params.styles;
    this.baseEl.appendChild(style);

    this.saveBtn = this.doc.getElementById(this.toolByName.save.buttonId);
    if (this.saveBtn) {
      this.saveBtn.setAttribute('disabled', 'true');
    }
    this.body = this.doc.body;
    this.canvas = this.doc.querySelector(`#${this.id}-canvas`);
    this.notesCanvas = this.doc.querySelector(`#notes-canvas`);
    this.ctx = this.canvas.getContext('2d');
    this.notesCtx = this.notesCanvas.getContext('2d');
    this.toolContainer = this.doc.querySelector(`#${this.id}-wrapper .ptro-crp-el`);
    this.substrate = this.doc.querySelector(`#${this.id}-wrapper .ptro-substrate`);
    this.zoomHelper = new ZoomHelper(this);
    this.resizer = new Resizer(this);
    this.settings = new Settings(this);
    this.primitiveTool = new PrimitiveTool(this);
    this.primitiveTool.setLineWidth(this.params.defaultLineWidth);
    this.primitiveTool.setArrowLength(this.params.defaultArrowLength);
    this.primitiveTool.setEraserWidth(this.params.defaultEraserWidth);
    this.primitiveTool.setPixelSize(this.params.defaultPixelSize);
    this.hasUnsaved = false;
    this.worklog = new WorkLog(this, (state) => {
      if (this.saveBtn && !state.initial) {
        this.saveBtn.removeAttribute('disabled');
        this.hasUnsaved = true;
      }
      this.setToolEnabled(this.toolByName.undo, !state.first);
      this.setToolEnabled(this.toolByName.redo, !state.last);
      if (this.params.onChange) {
        this.params.onChange.call(this, {
          image: this.imageSaver,
          operationsDone: this.worklog.current.prevCount,
          realesedMemoryOperations: this.worklog.clearedCount,
        });
      }
    });
    this.inserter.init(this);
    this.textTool = new TextTool(this, this.ctx, 'text');
    this.notesTool = new TextTool(this, this.notesCtx, 'notes');
    this.colorPicker = new ColorPicker(this, (widgetState) => {
      this.colorWidgetState[widgetState.target] = widgetState;
      this.doc.querySelector(
        `#${this.id} .ptro-color-btn[data-id='${widgetState.target}']`).style['background-color'] =
        widgetState.alphaColor;
      const palletRGB = HexToRGB(widgetState.paletteColor);
      if (palletRGB !== undefined) {
        widgetState.paletteColor = rgbToHex(palletRGB.r, palletRGB.g, palletRGB.b);
        if (widgetState.target === 'line') {
          setParam('activeColor', widgetState.paletteColor);
          setParam('activeColorAlpha', widgetState.alpha);
        } else if (widgetState.target === 'fill') {
          setParam('activeFillColor', widgetState.paletteColor);
          setParam('activeFillColorAlpha', widgetState.alpha);
        } else if (widgetState.target === 'bg') {
          setParam('backgroundFillColor', widgetState.paletteColor);
          setParam('backgroundFillColorAlpha', widgetState.alpha);
        } else if (widgetState.target === 'stroke') {
          setParam('textStrokeColor', widgetState.paletteColor);
          setParam('textStrokeColorAlpha', widgetState.alpha);
        }
      }
    });

    this.defaultTool = this.toolByName[this.params.defaultTool] || this.toolByName.select;

    this.tools.filter(t => this.params.hiddenTools.indexOf(t.name) === -1).forEach((b) => {
      this.getBtnEl(b).onclick = () => {
        if (b === this.defaultTool && this.activeTool === b) {
          return;
        }
        const currentActive = this.activeTool;
        this.closeActiveTool(true);
        if (currentActive !== b) {
          this.setActiveTool(b);
        } else {
          this.setActiveTool(this.defaultTool);
        }
      };
      this.getBtnEl(b).ontouch = this.getBtnEl(b).onclick;
    });

    this.getBtnEl(this.defaultTool).click();

    this.imageSaver = {
      /**
       * Returns image as base64 data url
       * @param {string} type - type of data url, default image/png
       * @param {string} quality - number from 0 to 1, works for `image/jpeg` or `image/webp`
       */
      asDataURL: (type, quality) => {
        let realType = type;
        if (realType === undefined) {
          realType = 'image/png';
        }
        return this.getAsUri(realType, quality);
      },
      asBlob: (type, quality) => {
        let realType = type;
        if (realType === undefined) {
          realType = 'image/png';
        }
        const uri = this.getAsUri(realType, quality);
        const byteString = atob(uri.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i += 1) {
          ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], {
          type: realType,
        });
      },
      suggestedFileName: (type) => {
        let realType = type;
        if (realType === undefined) {
          realType = 'png';
        }
        return `${(this.loadedName || `image-${genId()}`)}.${realType}`;
      },
      getWidth: () => this.size.w,
      getHeight: () => this.size.h,
    };

    this.initEventHandlers();
    this.hide();
    this.zoomFactor = 1;
  }

  setToolEnabled(tool, state) {
    const btn = this.doc.getElementById(tool.buttonId);
    if (btn) {
      if (state) {
        btn.removeAttribute('disabled');
      } else {
        btn.setAttribute('disabled', 'true');
      }
    }
  }
  getAsUri(type, quality) {
    let realQuality = quality;
    if (realQuality === undefined) {
      realQuality = 0.92;
    }
    const tmpCan = this.doc.createElement('canvas');
    tmpCan.width = this.size.w;
    tmpCan.height = this.size.h;
    const tmpCtx = tmpCan.getContext('2d');
    tmpCtx.drawImage(this.canvas, 0, 0);
    tmpCtx.drawImage(this.notesCanvas, 0, 0);
    return tmpCan.toDataURL(type, realQuality);
  }

  getBtnEl(tool) {
    return this.doc.getElementById(tool.buttonId);
  }

  save() {
    if (this.saving) {
      return this;
    }
    this.saving = true;
    const btn = this.doc.getElementById(this.toolByName.save.buttonId);
    const icon = this.doc.querySelector(`#${this.toolByName.save.buttonId} > i`);
    if (btn) {
      btn.setAttribute('disabled', 'true');
      this.hasUnsaved = false;
    }
    if (icon) {
      icon.className = 'ptro-icon ptro-icon-loading ptro-spinning';
    }

    if (this.params.saveHandler !== undefined) {
      this.params.saveHandler(this.imageSaver, (hide) => {
        if (hide === true) {
          this.hide();
        }
        if (icon) {
          icon.className = 'ptro-icon ptro-icon-save';
        }
        this.saving = false;
      });
    } else {
      logError('No saveHandler defined, please check documentation');
      if (icon) {
        icon.className = 'ptro-icon ptro-icon-save';
      }
      this.saving = false;
    }
    return this;
  }

  close() {
    if (this.params.onClose !== undefined) {
      this.params.onClose();
    }
  }

  closeActiveTool(doNotSelect) {
    if (this.activeTool !== undefined) {
      if (this.activeTool.close !== undefined) {
        this.activeTool.close();
      }
      const btnEl = this.getBtnEl(this.activeTool);
      if (btnEl) {
        btnEl.className =
        this.getBtnEl(this.activeTool).className.replace(' ptro-color-active-control', '');
      }
      this.activeTool = undefined;
    }
    if (doNotSelect !== true) {
      this.setActiveTool(this.defaultTool);
    }
  }

  handleToolEvent(eventHandler, event) {
    if (this.activeTool && this.activeTool.eventListener) {
      const listener = this.activeTool.eventListener();
      if (listener[eventHandler]) {
        return listener[eventHandler](event);
      }
    }
    return false;
  }

  initEventHandlers() {
    this.documentHandlers = {
      mousedown: (e) => {
        if (this.shown) {
          if (this.worklog.empty &&
             (e.target.className.indexOf('ptro-crp-el') !== -1 ||
              e.target.className.indexOf('ptro-icon') !== -1 ||
              e.target.className.indexOf('ptro-named-btn') !== -1)) {
            this.clearBackground(); // clear initText
          }
          if (this.colorPicker.handleMouseDown(e) !== true) {
            this.handleToolEvent('handleMouseDown', e);
          }
        }
      },
      touchstart: (e) => {
        if (e.touches.length === 1) {
          e.clientX = e.changedTouches[0].clientX;
          e.clientY = e.changedTouches[0].clientY;
          this.documentHandlers.mousedown(e);
        } else if (e.touches.length === 2) {
          const fingersDist = distance({
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY,
          }, {
            x: e.changedTouches[1].clientX,
            y: e.changedTouches[1].clientY,
          });
          this.lastFingerDist = fingersDist;
        }
      },
      touchend: (e) => {
        e.clientX = e.changedTouches[0].clientX;
        e.clientY = e.changedTouches[0].clientY;
        this.documentHandlers.mouseup(e);
      },
      touchmove: (e) => {
        if (e.touches.length === 1) {
          e.clientX = e.changedTouches[0].clientX;
          e.clientY = e.changedTouches[0].clientY;
          this.documentHandlers.mousemove(e);
        } else if (e.touches.length === 2) {
          const fingersDist = distance({
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY,
          }, {
            x: e.changedTouches[1].clientX,
            y: e.changedTouches[1].clientY,
          });

          if (fingersDist > this.lastFingerDist) {
            e.wheelDelta = 1;
            e.ctrlKey = true;
            this.documentHandlers.mousewheel(e);
          } else if (fingersDist > this.lastFingerDist) {
            e.wheelDelta = -1;
            e.ctrlKey = true;
            this.documentHandlers.mousewheel(e);
          }
          this.lastFingerDist = fingersDist;
          e.stopPropagation();
          e.preventDefault();
        }
      },
      mousemove: (e) => {
        if (this.shown) {
          this.handleToolEvent('handleMouseMove', e);
          this.colorPicker.handleMouseMove(e);
          this.zoomHelper.handleMouseMove(e);
          this.curCord = [
            (e.clientX - this.elLeft()) + this.scroller.scrollLeft,
            (e.clientY - this.elTop()) + this.scroller.scrollTop,
          ];
          const scale = this.getScale();
          this.curCord = [this.curCord[0] * scale, this.curCord[1] * scale];
          if (e.target.tagName.toLowerCase() !== 'input' && e.target.tagName.toLowerCase() !== 'button'
        && e.target.tagName.toLowerCase() !== 'i' && e.target.tagName.toLowerCase() !== 'select') {
            e.preventDefault();
          }
        }
      },
      mouseup: (e) => {
        if (this.shown) {
          this.handleToolEvent('handleMouseUp', e);
          this.colorPicker.handleMouseUp(e);
        }
      },
      mousewheel: (e) => {
        if (this.shown) {
          if (e.ctrlKey) {
            // console.log(e.wheelDelta);
            let minFactor = 1;
            if (this.size.w > this.wrapper.documentClientWidth) {
              minFactor = Math.min(minFactor, this.wrapper.documentClientWidth / this.size.w);
            }
            if (this.size.h > this.wrapper.documentClientHeight) {
              minFactor = Math.min(minFactor, this.wrapper.documentClientHeight / this.size.h);
            }
            if (!this.zoom && this.zoomFactor > minFactor) {
              this.zoomFactor = minFactor;
            }
            this.zoomFactor += Math.sign(e.wheelDelta) * 0.2;
            if (this.zoomFactor < minFactor) {
              this.zoom = false;
              this.zoomFactor = minFactor;
            } else {
              this.zoom = true;
            }
            this.adjustSizeFull();
            if (this.zoom) {
              this.scroller.scrollLeft = (this.curCord[0] / this.getScale()) -
                (e.clientX - this.wrapper.documentOffsetLeft);
              this.scroller.scrollTop = (this.curCord[1] / this.getScale()) -
                (e.clientY - this.wrapper.documentOffsetTop);
            }
            e.preventDefault();
          }
        }
      },
      keydown: (e) => {
        if (event.target !== document.body) {
          return; // ignore all focused inputs on page
        }
        if (this.shown) {
          if (this.colorPicker.handleKeyDown(e)) {
            return;
          }
          const evt = window.event ? event : e;
          if (this.handleToolEvent('handleKeyDown', evt)) {
            return;
          }
          if (
            (evt.keyCode === KEYS.y && evt.ctrlKey) ||
            (evt.keyCode === KEYS.z && evt.ctrlKey && evt.shiftKey)) {
            this.worklog.redoState();
            e.preventDefault();
            if (this.params.userRedo) {
              this.params.userRedo.call();
            }
          } else if (evt.keyCode === KEYS.z && evt.ctrlKey) {
            this.worklog.undoState();
            e.preventDefault();
            if (this.params.userUndo) {
              this.params.userUndo.call();
            }
          }
          if (this.toolByKeyCode[event.keyCode]) {
            this.getBtnEl(this.toolByKeyCode[event.keyCode]).click();
            e.stopPropagation();
            e.preventDefault();
          }
          if (this.saveBtn) {
            if (evt.keyCode === KEYS.s && evt.ctrlKey) {
              this.save();
              evt.preventDefault();
            }
          }
        }
      }
    };

    this.windowHandlers = {
      resize: () => {
        if (this.shown) {
          this.adjustSizeFull();
          this.syncToolElement();
        }
      },
    };
    this.listenersInstalled = false;
  }

  attachEventHandlers() {
    if (this.listenersInstalled) {
      return;
    }
    // passive: false fixes Unable to preventDefault inside passive event
    // listener due to target being treated as passive
    Object.keys(this.documentHandlers).forEach((key) => {
      this.doc.addEventListener(key, this.documentHandlers[key], { passive: false });
    });

    Object.keys(this.windowHandlers).forEach((key) => {
      window.addEventListener(key, this.windowHandlers[key], { passive: false });
    });
    this.listenersInstalled = true;
  }

  removeEventHandlers() {
    if (!this.listenersInstalled) {
      return;
    }
    Object.keys(this.documentHandlers).forEach((key) => {
      this.doc.removeEventListener(key, this.documentHandlers[key]);
    });
    Object.keys(this.windowHandlers).forEach((key) => {
      window.removeEventListener(key, this.windowHandlers[key]);
    });

    this.listenersInstalled = false;
  }

  elLeft() {
    return this.toolContainer.documentOffsetLeft + this.scroller.scrollLeft;
  }

  elTop() {
    return this.toolContainer.documentOffsetTop + this.scroller.scrollTop;
  }

  fitImage(img) {
    this.resize(img.naturalWidth, img.naturalHeight);
    this.ctx.drawImage(img, 0, 0);
    this.zoomFactor = (this.wrapper.documentClientHeight / this.size.h) - 0.2;
    this.adjustSizeFull();
    this.worklog.captureState();
  }

  loadImage(source) {
    this.inserter.handleOpen(source);
  }

  show(openImage) {
    this.shown = true;
    this.scrollWidth = getScrollbarWidth();
    if (this.isMobile) {
      this.origOverflowY = this.body.style['overflow-y'];
      if (this.params.fixMobilePageReloader) {
        this.body.style['overflow-y'] = 'hidden';
      }
    }
    this.baseEl.removeAttribute('hidden');
    if (this.holderEl) {
      this.holderEl.removeAttribute('hidden');
    }
    if (typeof openImage === 'string') {
      this.loadedName = trim(
        (openImage.substring(openImage.lastIndexOf('/') + 1) || '').replace(/\..+$/, ''));

      this.loadImage(openImage);
    } else if (openImage !== false) {
      this.clear();
    }
    this.attachEventHandlers();
    return this;
  }

  hide() {
    if (this.isMobile) {
      this.body.style['overflow-y'] = this.origOverflowY;
    }
    this.shown = false;
    this.baseEl.setAttribute('hidden', '');
    if (this.holderEl) {
      this.holderEl.setAttribute('hidden', '');
    }
    this.removeEventHandlers();
    return this;
  }

  openFile(f) {
    if (!f) {
      return;
    }
    this.loadedName = trim((f.name || '').replace(/\..+$/, ''));
    const dataUrl = URL.createObjectURL(f);
    this.loadImage(dataUrl);
  }

  getScale() {
    return this.canvas.getAttribute('width') / this.canvas.offsetWidth;
  }

  adjustSizeFull() {
    const ratio = this.wrapper.documentClientWidth / this.wrapper.documentClientHeight;

    if (this.zoom === false) {
      if (this.size.w > this.wrapper.documentClientWidth ||
        this.size.h > this.wrapper.documentClientHeight) {
        const newRelation = ratio < this.size.ratio;
        this.ratioRelation = newRelation;
        if (newRelation) {
          this.canvas.style.width = `${this.wrapper.clientWidth}px`;
          this.canvas.style.height = 'auto';
          this.notesCanvas.style.width = `${this.wrapper.clientWidth}px`;
          this.notesCanvas.style.height = 'auto';
        } else {
          this.canvas.style.width = 'auto';
          this.canvas.style.height = `${this.wrapper.clientHeight}px`;
          this.notesCanvas.style.width = 'auto';
          this.notesCanvas.style.height = `${this.wrapper.clientHeight}px`;
        }
        this.scroller.style.overflow = 'hidden';
      } else {
        this.scroller.style.overflow = 'hidden';
        this.canvas.style.width = 'auto';
        this.canvas.style.height = 'auto';
        this.notesCanvas.style.width = 'auto';
        this.notesCanvas.style.height = 'auto';
        this.ratioRelation = 0;
      }
    } else {
      this.scroller.style.overflow = 'scroll';
      this.canvas.style.width = `${this.size.w * this.zoomFactor}px`;
      this.canvas.style.height = `${this.size.h * this.zoomFactor}px`;
      this.notesCanvas.style.width = `${this.size.w * this.zoomFactor}px`;
      this.notesCanvas.style.height = `${this.size.h * this.zoomFactor}px`;
      this.ratioRelation = 0;
    }
    this.syncToolElement();
  }

  resize(x, y) {
    this.size = {
      w: x,
      h: y,
      ratio: x / y,
    };
    this.canvas.setAttribute('width', this.size.w);
    this.canvas.setAttribute('height', this.size.h);
    this.notesCanvas.setAttribute('width', this.size.w);
    this.notesCanvas.setAttribute('height', this.size.h);
  }

  rotate(clockwise = true) {
    const w = this.size.w;
    const h = this.size.h;
    const tmpData = this.ctx.getImageData(0, 0, this.size.w, this.size.h);
    const tmpNotesData = this.notesCtx.getImageData(0, 0, this.size.w, this.size.h);
    const tmpCan = this.doc.createElement('canvas');
    const tmpNotesCan = this.doc.createElement('canvas');
    tmpCan.width = w;
    tmpCan.height = h;
    tmpCan.getContext('2d').putImageData(tmpData, 0, 0);
    tmpNotesCan.width = w;
    tmpNotesCan.height = h;
    tmpNotesCan.getContext('2d').putImageData(tmpNotesData, 0, 0);
    this.resize(h, w);
    this.ctx.save();
    this.ctx.translate(h / 2, w / 2);
    this.ctx.rotate((clockwise ? 1 : -1) * (90 * Math.PI) / 180);
    this.ctx.drawImage(tmpCan, -w / 2, -h / 2);
    this.notesCtx.save();
    this.notesCtx.translate(h / 2, w / 2);
    this.notesCtx.rotate((clockwise ? 1 : -1) * (90 * Math.PI) / 180);
    this.notesCtx.drawImage(tmpNotesCan, -w / 2, -h / 2);
    this.adjustSizeFull();
    this.ctx.restore();
    this.notesCtx.restore();
  }

  syncToolElement() {
    const w = Math.round(this.canvas.documentClientWidth);
    const l = this.canvas.offsetLeft;
    const h = Math.round(this.canvas.documentClientHeight);
    const t = this.canvas.offsetTop;
    this.toolContainer.style.left = `${l}px`;
    this.toolContainer.style.width = `${w}px`;
    this.toolContainer.style.top = `${t}px`;
    this.toolContainer.style.height = `${h}px`;
    this.substrate.style.left = `${l}px`;
    this.substrate.style.width = `${w}px`;
    this.substrate.style.top = `${t}px`;
    this.substrate.style.height = `${h}px`;
  }

  clear() {
    const w = this.params.defaultSize.width === 'fill' ? this.wrapper.clientWidth : this.params.defaultSize.width;
    const h = this.params.defaultSize.height === 'fill' ? this.wrapper.clientHeight : this.params.defaultSize.height;
    this.resize(w, h);
    this.clearBackground();
    this.worklog.captureState(true);
    this.worklog.clean = true;
    this.syncToolElement();
    this.adjustSizeFull();

    if (this.params.initText && this.worklog.empty) {
      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = '#fff';
      const div = document.createElement('div');
      this.scroller.appendChild(div);
      div.innerHTML = '<div style="position:absolute;top:50%;width:100%;transform: translateY(-50%);">' +
        `${this.params.initText}</div>`;
      div.style.left = '0';
      div.style.top = '0';
      div.style.right = '0';
      div.style.bottom = '0';
      div.style['text-align'] = 'center';
      div.style.position = 'absolute';
      div.style.color = this.params.initTextColor;
      div.style['font-family'] = this.params.initTextStyle.split(/ (.+)/)[1];
      div.style['font-size'] = this.params.initTextStyle.split(/ (.+)/)[0];

      html2canvas(div, {
        backgroundColor: null,
        logging: false,
        scale: 1,
      }).then((can) => {
        this.scroller.removeChild(div);
        this.ctx.drawImage(can, 0, 0);
      });
    }
  }

  clearBackground() {
    this.ctx.beginPath();
    this.ctx.clearRect(0, 0, this.size.w, this.size.h);
    this.ctx.rect(0, 0, this.size.w, this.size.h);
    this.ctx.fillStyle = this.currentBackground;
    this.ctx.fill();
  }

  setActiveTool(b) {
    this.activeTool = b;
    const btnEl = this.getBtnEl(this.activeTool);
    if (btnEl) {
      btnEl.className += ' ptro-color-active-control';
    }
    b.activate();
  }
}

export default params => new PainterroProc(params);
