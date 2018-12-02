class nmoRow extends Polymer.Element {

  static get template() {
    // max-height: 60px;
    return Polymer.html`
    <style>
      li, ul {
        list-style: none;
      }
      ul {
        transition: max-height 0.5s;
        -webkit-transition: max-height 0.5s;
        overflow: hidden;
        padding: 0 0 0 40px;
        margin: 0;
      }
      .closed > ul {
        max-height: 0;
      }
      .open > ul {
      }
      #head {
        display: flex;
        align-items: center;
      }
      .toggle {
        width: 40px;
        height: 40px;
        align-items: center;
        display: flex;
      }
      .toggle ha-icon {
        flex: 0 0 40px;
      }
      #bar.closed {
        max-height: 0;
      }
      #bar.open {
        height: 1px;
        background-color: var(--secondary-text-color);
        opacity: 0.25;
        margin-left: -16px;
        margin-right: -16px;
        margin-top: 8px;
        margin-bottom: 8px;
      }
    </style>

    <div id=topbar class=nobar></div>
    <div id=head>
      <div class=toggle on-click="doToggle">
      <ha-icon icon="[[_icon]]"></ha-icon>
      </div>
    </div>
    <li id="rows" class="closed">
    </li>
    `
  }

  // tertiary(info) {
  //   return Polymer.html`
  //   <div class="secondary">
  //     ${info.lead}${info.data}${info.trail}
  //   </div>
  //   `;
  // }

  update() {
    this._icon = this.closed ? 'mdi:chevron-up' : 'mdi:chevron-down';   // assign icon depending on open/close state

    // assign class depending on open/close state (assign = do open or close)
    if(this.$) {
      this.$.rows.className = this.closed ? 'closed' : 'open'; // this = FoldRow, $ = shadowRoot
    }
  }

  doToggle(ev) {
    this.closed = !this.closed;
    this.update();
    ev.stopPropagation();
  }

  // ready is called when jquery complete (of this entity row)
  ready() {
    super.ready();    // trigger parent class (hui-entities-card) to call its ready function

    let conf = [];
    let head = this._config.head;
    let items = this._config.items;

    // make string head to object and move string to conf.head.entity
    if(typeof head === 'string') {
      head = {entity: head};
    }

    conf.push(head);    // append head.entity to conf (conf[x].entity = 'domain.entity_name')
      // conf.entity[] == head

    // read group attributes and copy list of entities to items
    if(head.entity && head.entity.startsWith('group')) {
      items = this._hass.states[head.entity].attributes.entity_id;
    }

    // makes string item to object and moves string to conf.entity
    items.forEach((i) => {

      if(typeof i === 'string') i = {entity: i};    // append items.entity to conf (conf[x].entity = 'domain.entity_name')
          // item[0].entity == item0
          // item[1].entity == item1 
          // etc.

      conf.push(Object.assign(i, this._config.group_config));   // append group_config to conf (conf[x].secondary_info = 'last-changed')
          // item[0].secondary_info == last-changed
          // item[1].secondary_info == last-changed 
          // etc.

          // conf[0].entity == head
          // conf[1].entity == item0
          // conf[1].secondary_info == last-changed
          // conf[2].entity == item1
          // conf[2].secondary_info == last-changed
          // etc
    });

    this.items = [];    // declare array

    this.dummy = document.createElement('hui-entities-card'); // create 'hidden' entities-card to take the rows from
    this.dummy.setConfig({entities: conf});   // fill card

    this.dummy.hass = this._hass;   // card.hass = current hass
    this.appendChild(this.dummy);   // attach card to this polymer element

    // declare funtion to find next element child (= nodeType 1) from position 'root'
    const nextChild = (root) => {
      let child = root.firstChild;

      while(child && child.nodeType != 1) child = child.nextSibling; //crawl childs until element reached
      return child;
    }

    this.dummy.updateComplete.then( () => {

      let divs = this.dummy.shadowRoot.querySelector("ha-card").querySelector("#states");
      let child = nextChild(divs)   // take first child of 'hidden' card where child is full entity row

      items.forEach ((item) => {
        if (item.infos) conf.push(item.infos);
        //!conf[1].infos[0].data
        //!conf[1].infos[0].lead
        //!conf[1].infos[0].trail
        //!conf[1].infos[1].data
        //!conf[1].infos[1].lead
        //!conf[1].infos[1].trail
      });

      this._addHeader(child, conf.shift()) // remove conf.shift (= conf[0].entity) and move first row of hidden entities on top

      // remove next entity rows and place below header using custom style template
      while(child = nextChild(divs)) {
        this._addRow(child, conf.shift());
      }

      this.update();
    });
  }

  _addHeader(row, conf)
  {
    this.$.head.insertBefore(row, this.$.head.firstChild); // row = first row of hidden entities card -> insert on top (before first child)

    row.style.width = '100%';

    if(row.tagName === 'DIV') {
      row = row.children[0]; // row = full row container, row.children = entity row
    }

    this.items.push(row);

    if(row.tagName === 'HUI-SECTION-ROW'){
      if(row.updateComplete) {
        row.updateComplete.then( () => {
          row.shadowRoot.querySelector('.divider').style.marginRight = '-53px';
          if (!this.parentElement.previousElementSibling) {
            row.shadowRoot.querySelector('.divider').style.visibility = 'hidden';
            row.shadowRoot.querySelector('.divider').style.marginTop = '0';
          }
        });
      } else {
        row.shadowRoot.querySelector('.divider').style.marginRight = '-53px';
        if (!this.parentElement.previousElementSibling) {
          row.shadowRoot.querySelector('.divider').style.visibility = 'hidden';
          row.shadowRoot.querySelector('.divider').style.marginTop = '0';
        }
      }
    }
  }
  
  _addRow(row, conf)
  {
    // conf.entity
    // conf.secondary_info
    // conf.infos[]
    if(row.tagName === 'DIV') {
      let entity_row = row.children[0];

      // customizing
      // let second;
      // second = entity_row.root.querySelector("hui-generic-entity-row").root.querySelector("div.flex").querySelector("div.info").querySelector("div.secondary");
  

      if(conf.infos) {
        entity_row._config.infos = conf.infos;
        //| conf.infos[0].data = "color_temp"
        //| conf.infos[0].lead = "Temperatur "
        //| conf.infos[0].trail = " mireds"
        // let infos = [];


        // conf.infos.forEach((info) => {
        //   let third = document.createElement('div');
        //   third.style.fontStyle = 'italic';
        //   // third.style.paddingLeft = '16px';
          

        //   if(typeof info === 'string') {
        //     let lead = info + ": ";
        //     let data = this._hass.states[conf.entity].attributes[info];
        //     let trail = "";
        //     info = {data: data, lead: lead, trail: trail};
        //   }

        //   if(info.entity) {
        //     if (info.attribute) {
        //       info.data = this._hass.states[info.entity].attributes[info.attribute];
        //     } else {
        //       info.data = this._hass.states[info.entity].state;
        //     }
        //   }

        //   if(info.template){
        //     // info.data = this._hass.callApi('post', 'template', '{"template": "${info.template}"}');
        //     this._hass.callApi("POST", "template", { template: info.template }).then(
        //       function(processed) {
        //         info.data = "ok"
        //       }.bind(this),
        //       function(error) {
        //         info.data = "fail";
        //       }.bind(this)
        //     );
        //     // info.data = this._hass.callWS({
        //     //   type: 'template',
        //     //   template: info.template,
        //     // });
        //   }

        //   if (!info.lead) info.lead = "";
        //   if (!info.data) info.data = "";
        //   if (!info.trail) info.trail = "";

        //   third.innerHTML = `
        //       ${info.lead}${info.data}${info.trail}
        //   `;
  
        //   second.appendChild(third);

        // });
      }

      // if(second.childElementCount > 6) {
      //   let root = entity_row.root.querySelector("hui-generic-entity-row");
      //   root.style.alignItems = 'flex-start';
      //   root.root.querySelector("div.flex").style.alignItems = 'flex-start';
      // }

      // customizing end
  




      this.items.push(entity_row); // entity-row
    } else {
      this.items.push(row); // text
    }

    let item = document.createElement('ul');
    item.appendChild(row);

    row.classList.add('state-card-dialog');

    row.addEventListener('click', (e) => {
      let ev = new Event('hass-more-info', {
        bubbles: true,
        cancelable: false,
        composed: true,
      });

      const entityId = conf.entity;
      ev.detail = { entityId };
      this.dispatchEvent(ev);
      e.stopPropagation();
    });
    this.$.rows.appendChild(item);
  }

  _updateThirds(item) {

    if(item._config.infos) {
      let row = item.shadowRoot.querySelector("hui-generic-entity-row");
      let second = row.root.querySelector("div.flex");
      second = second.querySelector("div.info").querySelector("div.secondary");
      let count = 0;

      item._config.infos.forEach((info, count) => {

        let data_old = info.data;

        let third;
        let idstring = 'third' + count;
        count++;

        if(typeof info === 'string') {
          let lead = info + ": ";
          let data = this._hass.states[item._config.entity].attributes[info];
          let trail = "";
          info = {data: data, lead: lead, trail: trail};
        }

        if(info.entity) {
          if (info.attribute) {
            info.data = this._hass.states[info.entity].attributes[info.attribute];
          } else {
            info.data = this._hass.states[info.entity].state;
          }
        }

        if(info.template){
          // info.data = this._hass.callApi('post', 'template', '{"template": "${info.template}"}');
          this._hass.callApi("POST", "template", { template: info.template }).then(
            function(processed) {
              info.data = processed;
            }.bind(this),
            function(error) {
              info.data = error.body.message;
            }.bind(this)
          );
          // info.data = this._hass.callWS({
          //   type: 'template',
          //   template: info.template,
          // });
        }

        if (!info.lead) info.lead = "";
        if (!info.data) info.data = "";
        if (!info.trail) info.trail = "";

        if(data_old != info.data) {

          if(!second.querySelector("#"+idstring)) {
            third = document.createElement('div');
            third.style.fontStyle = 'italic';
            third.id = idstring;
            
          } else {
            third = second.querySelector("#"+idstring);
          }

          third.innerHTML = `
              ${info.lead}${info.data}${info.trail}
          `;

          if(!second.querySelector("#"+idstring)) second.appendChild(third);
        }
      });

      if(second.childElementCount > 6) {
        row.style.alignItems = 'flex-start';
        row.root.querySelector("div.flex").style.alignItems = 'flex-start';
      }
    }
  }

  setConfig(config) {
    if (config.entity || config.config) {
      throw new Error("Breaking changes have been introduced. Please see https://github.com/thomasloven/lovelace-fold-entity-row");
    }
    // copy config to local
    this._config = config;
    this.closed = !this._config.open;
    this.update();
  }

  set hass(hass) {
    this._hass = hass;

    // if card already exist update data
    if(this.dummy)
      this.dummy.hass = hass;

    if(this.items && this.items.forEach) {
      this.items.forEach( (item) => item.hass = hass); // update each row with new hass object
      this.items.forEach( (item) => this._updateThirds(item));
    }
  }
}

customElements.define('nmo-row', nmoRow);


/*
.     type: entities
.     title: Folding entities
.     entities:
.       - light.bed_light
*       - type: custom:fold-entity-row
*         head: sensor.yr_symbol
*         items:
*           - sensor.outside_humidity
*           - sensor.outside_temperature
!           - entity: light.bedroom
!             infos:
!               - data: sensor.lux_bedroom
!                 lead: "Illuminance "
!                 trail: "lx"
.       - light.bed_light
*       - type: custom:fold-entity-row
*         head:
*           type: section
*           label: Lights
*         group_config:
*           secondary_info: last-changed
*         items:
*           - light.bed_light
*           - light.ceiling_lights
*           - light.kitchen_lights
.       - light.bed_light
*/