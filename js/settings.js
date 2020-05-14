import { tr } from './translation';
import { trim, KEYS } from './utils';
import { setParam } from './params';

export default class Settings {
  constructor(main) {
    this.main = main;

    this.wrapper = main.wrapper.querySelector('.ptro-settings-widget-wrapper');

    this.applyButton = main.wrapper.querySelector('.ptro-settings-widget-wrapper button.ptro-apply');
    this.closeButton = main.wrapper.querySelector('.ptro-settings-widget-wrapper button.ptro-close');
    this.lineColorSelBtn = main.wrapper.querySelector('.ptro-settings-widget-wrapper .ptro-color-btn[data-id="line"]');
    this.lineWidthInput = main.wrapper.querySelector('.ptro-settings-widget-wrapper .ptro-line-width-input');
    this.noteFillColorSelBtn = main.wrapper.querySelector('.ptro-settings-widget-wrapper .ptro-color-btn[data-id="noteFill"]');
    this.fontColorSelBtn = main.wrapper.querySelector('.ptro-settings-widget-wrapper .ptro-color-btn[data-id="stroke"]');
    this.fontSizeInput = main.wrapper.querySelector('.ptro-settings-widget-wrapper .ptro-font-size-input');
    this.fontInput = main.wrapper.querySelector('.ptro-settings-widget-wrapper .ptro-font-input');
    this.errorHolder = main.wrapper.querySelector('.ptro-settings-widget-wrapper .ptro-error');

    this.lineWidthInput.innerHTML = this.main.params.availableLineWidths.map(x => `<option title="${x}">${x}</option>`).toString();
    this.fontSizeInput.innerHTML = this.main.params.availableFontSizes.map(x => `<option title="${x}">${x}</option>`).toString();
    this.fontInput.innerHTML = this.main.params.availableFonts.map(x => `<option title="${x}">${x}</option>`).toString();

    this.lineColorSelBtn.onclick = () => {
      this.main.colorPicker.open(this.main.colorWidgetState.line);
    };

    this.fontColorSelBtn.onclick = () => {
      this.main.colorPicker.open(this.main.colorWidgetState.stroke);
    };

    this.noteFillColorSelBtn.onclick = () => {
      this.main.colorPicker.open(this.main.colorWidgetState.noteFill);
    };

    this.closeButton.onclick = () => {
      this.startClose();
    };

    this.applyButton.onclick = () => {
      let lineWidthVal = trim(this.lineWidthInput.value);
      let fontSize = trim(this.fontSizeInput.value);
      let font = trim(this.fontInput.value);

      // lineWidth
      this.main.primitiveTool.setLineWidth(lineWidthVal);
      setParam('defaultLineWidth', lineWidthVal);
      // textColor
      this.main.textTool.setFontColor(this.main.colorWidgetState.stroke.alphaColor);
      this.main.notesTool.setFontColor(this.main.colorWidgetState.stroke.alphaColor);
      setParam('textStrokeColor', this.main.colorWidgetState.stroke.palleteColor);
      setParam('textStrokeColorAlpha', this.main.colorWidgetState.stroke.alpha);
      setParam('textStrokeAlphaColor', this.main.colorWidgetState.stroke.alphaColor);
      // textSize
      this.main.textTool.setFontSize(fontSize);
      this.main.notesTool.setFontSize(fontSize);
      setParam('defaultFontSize', fontSize);
      // font
      this.main.textTool.setFont(font);
      this.main.notesTool.setFont(font);
      setParam('font', font);
      // noteFill
      this.main.notesTool.setFillColor(this.main.colorWidgetState.noteFill.alphaColor);
      setParam('activeNoteFillColor', this.main.colorWidgetState.noteFill.palleteColor);
      setParam('activeNoteFillColorAlpha', this.main.colorWidgetState.noteFill.alpha);
      setParam('activeNoteFillAlphaColor', this.main.colorWidgetState.noteFill.alphaColor);

      this.startClose();
      this.errorHolder.setAttribute('hidden', '');
    };
  }

  handleKeyDown(event) {
    if (event.keyCode === KEYS.enter) {
      return true; // mark as handled - user might expect doing save by enter
    }
    if (event.keyCode === KEYS.esc) {
      this.startClose();
      return true;
    }
    return false;
  }

  open() {
    this.wrapper.removeAttribute('hidden');
    this.opened = true;
    this.lineWidthInput.value = this.main.primitiveTool.lineWidth;
    this.fontSizeInput.value = this.main.textTool.fontSize;
    this.lineColorSelBtn.style['background-color'] = this.main.colorWidgetState.line.alphaColor;
    this.noteFillColorSelBtn.style['background-color'] = this.main.colorWidgetState.noteFill.alphaColor;
    this.fontColorSelBtn.style['background-color'] = this.main.colorWidgetState.stroke.alphaColor;
  }

  close() {
    this.wrapper.setAttribute('hidden', 'true');
    this.opened = false;
  }

  startClose() {
    this.errorHolder.setAttribute('hidden', '');
    this.main.closeActiveTool();
  }

  static html() {
    return '' +
      '<div class="ptro-settings-widget-wrapper ptro-common-widget-wrapper ptro-v-middle" hidden>' +
        '<div class="ptro-settings-widget ptro-color-main ptro-v-middle-in">' +
            '<table style="margin-top: 5px">' +
              '<tr>' +
                `<td class="ptro-label ptro-resize-table-left" style="height:30px;">${tr('lineColorFull')}</td>` +
                '<td class="ptro-strict-cell">' +
                  '<button type="button" data-id="line" class="ptro-color-btn ptro-bordered-btn" ' +
                    'style="margin-top: -12px;"></button>' +
                  '<span class="ptro-btn-color-checkers"></span>' +
                '</td>' +
              '</tr>' +
              '<tr>' +
                `<td class="ptro-label ptro-resize-table-left" style="height:30px;">${tr('noteFillColorFull')}</td>` +
                '<td class="ptro-strict-cell">' +
                  '<button type="button" data-id="noteFill" class="ptro-color-btn ptro-bordered-btn" ' +
                  'style="margin-top: -12px;"></button>' +
                  '<span class="ptro-btn-color-checkers"></span>' +
                '</td>' +
              '</tr>' +
              '<tr>' +
                `<td class="ptro-label ptro-resize-table-left" style="height:30px;">${tr('lineWidthFull')}</td>` +
                '<td class="ptro-strict-cell" colspan="2">' +
                  '<select class="ptro-input ptro-line-width-input"></select>' +
                '</td>' +
              '</tr>' +
              '<tr>' +
                `<td class="ptro-label ptro-resize-table-left" style="height:30px;">${tr('fontNameFull')}</td>` +
                '<td class="ptro-strict-cell" colspan="2">' +
                  '<select class="ptro-input ptro-font-input"></select>' +
                '</td>' +
              '</tr>' +
              '<tr>' +
                `<td class="ptro-label ptro-resize-table-left" style="height:30px;">${tr('textColorFull')}</td>` +
                '<td class="ptro-strict-cell">' +
                  '<button type="button" data-id="stroke" class="ptro-color-btn ptro-bordered-btn" ' +
                  'style="margin-top: -12px;"></button>' +
                  '<span class="ptro-btn-color-checkers"></span>' +
                '</td>' +
              '</tr>' +
              '<tr>' +
                `<td class="ptro-label ptro-resize-table-left" style="height:30px;">${tr('textSizeFull')}</td>` +
                '<td class="ptro-strict-cell" colspan="2">' +
                  '<select class="ptro-input ptro-font-size-input"></select>' +
                '</td>' +
              '</tr>' +
            '</table>' +
            '<div class="ptro-error" hidden></div>' +
            '<div style="margin-top: 20px">' +
              '<button type="button" class="ptro-named-btn ptro-apply ptro-color-control">' +
                    `${tr('apply')}</button>` +
              `<button type="button" class="ptro-named-btn ptro-close ptro-color-control">${tr('cancel')}</button>` +
            '</div>' +
        '</div>' +
      '</div>';
  }
}
