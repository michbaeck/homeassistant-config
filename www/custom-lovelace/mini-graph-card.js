import { LitElement, html, svg } from 'https://unpkg.com/@polymer/lit-element@^0.6.2/lit-element.js?module';
import Graph from './mini-graph-lib.js';

const FONT_SIZE = 14;
const ICON = {
  humidity: 'hass:water-percent',
  illuminance: 'hass:brightness-5',
  temperature: 'hass:thermometer',
  battery: 'hass:battery'
};

class MiniGraphCard extends LitElement {
  constructor() {
    super();
    this.conf = {};
  }

  createRenderRoot() {
    return this;
  }

  set hass(hass) {
    this._hass = hass;
    const entity = hass.states[this.config.entity];
    if (entity && this.entity !== entity) {
      this.entity = entity;
      this.getHistory();
    }
  }

  static get properties() {
    return {
      _hass: Object,
      config: Object,
      entity: Object,
      line: String
    };
  }

  setConfig(config) {
    if (!config.entity || config.entity.split('.')[0] !== 'sensor')
      throw new Error('Specify an entity from within the sensor domain.');

    this.style = 'display: flex; flex-direction: column;';
    const conf = Object.assign({
      icon: false,
      more_info: true,
      hours_to_show: 24,
      accuracy: 10,
      height: 100,
      line_color: 'var(--accent-color)',
      line_width: 5,
      font_size: FONT_SIZE,
      hide_icon: false
    }, config);
    conf.font_size = (config.font_size  / 100) * FONT_SIZE || FONT_SIZE;
    conf.accuracy = Number(conf.accuracy);
    conf.height = Number(conf.height);
    conf.line_width = Number(conf.line_width);

    this.config = conf;
  }

  async getHistory({config} = this) {
    const endTime = new Date();
    const startTime = new Date();
    startTime.setHours(endTime.getHours() - config.hours_to_show);
    const stateHistory = await this.fetchRecent(config.entity, startTime, endTime);
    const history = stateHistory[0];
    const valArray = [history[history.length - 1]];

    let pos = history.length - 1;
    const accuracy = (this.config.accuracy) <= pos ? this.config.accuracy : pos;
    let increment = Math.ceil(history.length / accuracy);
    if (accuracy === pos) increment = 1;
    increment = (increment <= 0) ? 1 : increment;
    for (let i = accuracy; i >= 1; i--) {
      pos -= increment;
      valArray.unshift(pos >= 0 ? history[pos] : history[0]);
    }
    this.line = Graph(valArray, 500, this.config.height, config.line_width);
  }

  shouldUpdate(changedProps) {
    return (
      changedProps.has('entity') ||
      changedProps.has('line')
    );
  }

  render({config, entity} = this) {
    return html`
      ${this._style()}
      <ha-card ?group=${config.group} @click='${(e) => this.handleMore()}'
        ?more-info=${config.more_info} style='font-size: ${config.font_size}px;'>
        <div class='flex title' ?hide=${config.hide_icon}>
          <div class='icon'>
            <ha-icon .icon=${this.computeIcon(entity)}></ha-icon>
          </div>
          <div class='header'>
            <span class='name ellipsis'>${this.computeName(entity)}</span>
          </div>
        </div>
        <div class='flex info'>
          <span id='value' class='ellipsis'>${entity.state}</span>
          <span id='measurement' class='ellipsis'>${this.computeUom(entity)}</span>
        </div>
        <div class='graph'>
          <div>
            ${this.line ? svg`
            <svg width='100%' viewBox='0 0 500 ${this.config.height}'>
              <path d=${this.line} fill='none' stroke=${this.computeColor()}
                stroke-width=${config.line_width} stroke-linecap='round' stroke-linejoin='round' />
            </svg>` : '' }
          </div>
        </div>
      </ha-card>`;
  }

  handleMore({config} = this) {
    if(config.more_info)
      this.fire('hass-more-info', { entityId: config.entity });
  }

  fire(type, detail, options) {
    options = options || {};
    detail = (detail === null || detail === undefined) ? {} : detail;
    const e = new Event(type, {
      bubbles: options.bubbles === undefined ? true : options.bubbles,
      cancelable: Boolean(options.cancelable),
      composed: options.composed === undefined ? true : options.composed
    });
    e.detail = detail;
    this.dispatchEvent(e);
    return e;
  }

  computeColor() {
    const state = Number(this.entity.state) || 0;
    const above = this.config.line_value_above;
    const below = this.config.line_value_below;
    if (above && state > above) return this.config.line_color_above
    if (below && state < below) return this.config.line_color_below
    return this.config.line_color;
  }

  computeName() {
    return this.config.name || this.entity.attributes.friendly_name;
  }

  computeIcon(entity) {
    return this.config.icon ||
      entity.attributes.icon ||
      ICON[entity.attributes.device_class] ||
      ICON.temperature;
  }

  computeUom(entity) {
    return this.config.unit || entity.attributes.unit_of_measurement || '';
  }

  async fetchRecent(entityId, startTime, endTime) {
    let url = 'history/period';
    if (startTime) url += '/' + startTime.toISOString();
    url += '?filter_entity_id=' + entityId;
    if (endTime) url += '&end_time=' + endTime.toISOString();

    return await this._hass.callApi('GET', url);
  }

  _style() {
    return html`
      <style>
        :host {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        ha-card {
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: 16px;
          position: relative;
        }
        ha-card[more-info] {
          cursor: pointer;
        }
        .flex {
          display: flex;
          display: -webkit-flex;
          min-width: 0;
        }
        .justify {
          justify-content: space-between;
          -webkit-justify-content: space-between;
        }
        .header {
          display: flex;
          min-width: 0;
          align-items: center;
          position: relative;
          opacity: .8;
        }
        .name {
          font-size: 1.2rem;
          font-weight: 500;
          max-height: 1.4rem;
          opacity: .75;
        }
        .icon {
          display: inline-block;
          position: relative;
          flex: 0 0 40px;
          width: 40px;
          line-height: 40px;
          text-align: center;
          color: var(--paper-item-icon-color, #44739e);
        }
        .info {
          margin: 1em 8px;
          flex-wrap: wrap;
          font-weight: 300;
        }
        .title[hide] .icon {
          display: none;
        }
        .title[hide] .header {
          margin-left: 8px;
        }
        #value {
          font-size: 2.4em;
          line-height: 1em;
          display: inline-block;
          margin-right: 4px;
          max-size: 100%;
        }
        #measurement {
          display: inline-block;
          font-size: 1.4em;
          font-weight: 400;
          line-height: 1.2em;
          margin-top: .1em;
          vertical-align: bottom;
          align-self: flex-end;
          opacity: .6;
        }
        .graph {
          align-self: flex-end;
          margin: auto;
          margin-bottom: 0px;
          position: relative;
          width: 100%;
        }
        .graph > div {
          align-self: flex-end;
          margin: auto 8px;
        }
        .ellipsis {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      </style>`;
  }

  getCardSize() {
    return 1;
  }
}

customElements.define('mini-graph-card', MiniGraphCard);