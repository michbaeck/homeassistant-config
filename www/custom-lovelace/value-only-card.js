class ValueOnlyCard extends HTMLElement {
  set hass(hass) {
    if (!this.content) {
      const card = document.createElement('ha-card');
      if(this.config.header)
        card.header = this.config.header;  //'Example card';
      this.content = document.createElement('div');
      this.content.style.padding = '16px 16px 16px';
      // this.content.style.minHeight = '50px';
      // this.content.style.maxHeight = '108px';
      this.content.style.fontSize = '150%';
      this.content.style.textAlign = 'center';
      this.content.style.verticalAlign = 'center';
      this.content.style.fontStyle = 'bold';
      this.content.style.color = 'var(--paper-card-header-color';
      card.appendChild(this.content);
      this.appendChild(card);
    }

    const entityId = this.config.entity;
    const state = hass.states[entityId];

    if(this.config.old_state != state) {
      this.config.old_state = state;
      const stateStr = state ? state.state : 'unavailable';

      this.content.innerHTML = `
        ${stateStr}`;
    }
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('You need to define an entity');
    }
    this.config = config;
  }

  // The height of your card. Home Assistant uses this to automatically
  // distribute all cards over the available columns.
  getCardSize() {
    return 1;
  }
}

customElements.define('value-only-card', ValueOnlyCard);