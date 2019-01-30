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
    
  update() {
    this._icon = this.closed ? 'mdi:chevron-left' : 'mdi:chevron-down';   // assign icon depending on open/close state

    // assign class depending on open/close state (assign = do open or close)
    if(this.$) {
      if(this.$.rows.childElementCount > 0) {
        this.$.rows.className = this.closed ? 'closed' : 'open'; // this = mno, $ = shadowRoot
      } else {
        this.$.head.querySelector("div.toggle").remove();   //  if just head w/o items defined, remove toggle arrow
      }
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
    let items = [];
    if(this._config.items) items = this._config.items;

    if(this._config.head) {
      let head = this._config.head;

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
    }

    // makes string item to object and moves string to conf.entity
    if(items.length > 0) items.forEach((i) => {
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
        //conf[1].infos[0].data
        //conf[1].infos[0].lead
        //conf[1].infos[0].trail
        //conf[1].infos[1].data
        //conf[1].infos[1].lead
        //conf[1].infos[1].trail
      });

      if(this._config.head) { // remove conf.shift (= conf[0].entity) and move first row of hidden entities on top
        // if(this._config.items) {
          this._addHeader(child, conf.shift());
        // } else {
        //   this._addRow(child, conf.shift());
        // }
      }

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

    if(conf.infos) {
      row._config.infos = conf.infos;
      //| conf.infos[0].data = "color_temp"
      //| conf.infos[0].lead = "Temperatur "
      //| conf.infos[0].trail = " mireds"
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
    // cut
    // let arrow = this.$.head.querySelector("div.toggle");
    
    // must be first child here
    // let parent = this.$.head.firstElementChild.firstElementChild.shadowRoot.firstElementChild;
    // parent.insertBefore(arrow, parent.firstChild);

    // new position:
    // this.$.head.firstElementChild.firstElementChild.shadowRoot.firstChildElement.querySelector("div.toggle")

    // $0.$.head.firstElementChild.firstElementChild.shadowRoot.insertBefore($0.$.head.querySelector("div.toggle"),$0.$.head.firstElementChild.firstElementChild.shadowRoot.firstChild)
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
      }
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

    let row = item.shadowRoot.querySelector("hui-generic-entity-row");

    // if(item._config.infos) {
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
          if(this._hass.states[info.entity]) {
            if (info.attribute) {
                info.data = this._hass.states[info.entity].attributes[info.attribute];
            } else {
              info.data = this._hass.states[info.entity].state;
            }
          }
        }


        if(info.template){
          // info.data = this._hass.callApi('post', 'template', '{"template": "${info.template}"}');
          this._hass.callApi("POST", "template", { template: info.template }).then(
            function(processed) {
              info.data = processed;
            }.bind(info),
            function(error) {
              info.data = error.body.message;
            }.bind(info)
          );
        }

        if(info.text) info.data = info.text;

        if(!info.lead) info.lead = "";
        if(!info.data) info.data = "";
        if(!info.trail) info.trail = "";

        if(data_old != info.data || info.template) {
          if(!(info.data == "")) {
            if(!second.querySelector("#"+idstring)) {
              third = document.createElement('div');
              third.style.fontStyle = 'italic';
              third.id = idstring;
            } else {
              third = second.querySelector("#"+idstring);
            }
            
            third.innerHTML = `
                ${info.lead}\t\t${info.data}${info.trail}
            `;

            if(!second.querySelector("#"+idstring)) second.appendChild(third);
          }
        }
      });

      if(second.childElementCount > 6) {
        row.style.alignItems = 'flex-start';
        row.root.querySelector("div.flex").style.alignItems = 'flex-start';
      }
    // }
  }

  _updateHost(item) {

    if(item.hass && item._config.entity) {
      let entity = item._config.entity;
      let new_state;

      if(item.hass.states[entity])
        new_state = item.hass.states[entity];

      if(item._config.icon_color)
        this._iconColor(item);

      if((new_state != item.previous_state || this._config.force_update) && item._config.infos) {
        this._updateThirds(item);
        item.previous_state = new_state;
      }
    }
  }

  _iconColor(item) {
    // TEMP 
      // var x = ( 'hsl(' + (-48/11*state + 1680/11) + ', 100%, 40%)' ); return x;
    // PLANT
      // var x = ( 'hsl(' + (state*1.5) + ', 100%, 50%)'); return x;
    // WLAN
      // var x = ( 'hsl(' + (((state – (-80)) * 100) / 40) + ', 100%, 40%)'); return x;
    // BATTERY + DISK
      // var x = ( 'hsl(' + state + ', 100%, 40%)'); return x;
    // CLIMATE 
      // if (state === 'heat') return 'var(--paper-orange-400)';
      // else if (state === 'cool') return 'var(--paper-blue-400)';
      // else if (state === 'idle') return 'var(--state-icon-color)';
      // else if (state === 'off') return 'var(--primary-background-color)'
    // DEVICE_TRACKER + BINARY_SENSOR + SWITCH + INPUT_BOOLEAN
    // FLUX
    // console.info('iconColor called');

    // if(item._config.icon_color) {
      let row = item.shadowRoot.querySelector("hui-generic-entity-row");
      let style = row.shadowRoot.querySelector("state-badge").shadowRoot.querySelector("ha-icon").style;
      let state = row._stateObj.state;
      let icon_color;
      let rgb;

      function colorTemperatureToRGB(kelvin) {
        // from https://gist.github.com/paulkaplan/5184275
          // From http://www.tannerhelland.com/4435/convert-temperature-rgb-algorithm-code/
            // Start with a temperature, in Kelvin, somewhere between 1000 and 40000.  (Other values may work,
            //  but I can't make any promises about the quality of the algorithm's estimates above 40000 K.)
      
          let temp = kelvin / 100;
          let red, green, blue;
      
          if( temp <= 66 ){ 
              red = 255; 
              green = temp;
              green = 99.4708025861 * Math.log(green) - 161.1195681661;
      
              if( temp <= 19){
                  blue = 0;
              } else {
                  blue = temp-10;
                  blue = 138.5177312231 * Math.log(blue) - 305.0447927307;
              }
          } else {
              red = temp - 60;
              red = 329.698727446 * Math.pow(red, -0.1332047592);
              green = temp - 60;
              green = 288.1221695283 * Math.pow(green, -0.0755148492 );
              blue = 255;
          }
        
          const clamp = ( x, min, max ) => {
              if(x<min){ return min; }
              if(x>max){ return max; }
          
              return x;
          }
      
          return {
              r : clamp(red,   0, 255),
              g : clamp(green, 0, 255),
              b : clamp(blue,  0, 255)
          }
        
      }
      
      if(!item._config.icon_color) item._config.icon_color = "auto";
      if(item._config.icon_color == "auto") item._config.icon_color = row._stateObj.split('.', 1)[0];

      switch(item._config.icon_color){
        case "temp":
          icon_color = 'hsl(' + (-48/11*state + 1680/11) + ', 100%, 40%)';
          break;
        case "plant":
          icon_color = 'hsl(' + (state*1.5) + ', 100%, 50%)';
          break;
        case "wlan":
          icon_color = 'hsl(' + (((state - (-80)) * 100) / 40) + ', 100%, 40%)';
          break;
        case "battery":
        case "disk":
          icon_color = 'hsl(' + state + ', 100%, 40%)';
          break;
        case "lux":
          icon_color = 'hsl(60, 50%, ' + clamp(state,0,100) + '%)';
          break;
        case "mired":
          let kelvin = 1000000/state;
          rgb = colorTemperatureToRGB(kelvin);
          icon_color = 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
          break;
        case "kelvin":
          rgb = colorTemperatureToRGB(state);
          icon_color = 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
          break;
        case "device_tracker":
        case "binary_sensor":
        case "switch":
        case "input_boolean":
          if(state === ('on'||'home'||'true'||true)) {
            icon_color = 'var(--state-icon-active-color)';
          } else {
            icon_color = 'var(--label-badge-red)';
          }
          break;
        case "climate":
          if (state === 'heat') {
            icon_color = 'var(--label-badge-red)';
          } else if (state === 'cool') {
            icon_color = 'var(--label-badge-blue)';
          } else if (state === 'idle') {
            icon_color = 'var(--state-icon-color)';
          } else if (state === 'off') {
            icon_color = 'var(--primary-background-color)'
          }
          break;
        case "window":
          if(state === 'on') icon_color = 'var(--label-badge-blue)';
          break;
        case "lock":
          if(state === 'locked') {
            icon_color = 'var(--google-red-500)';
          } else {
            icon_color = 'var(--google-green-500)';
          }
          break;
        case "cover":
          if(state === 'open') icon_color = 'var(--state-icon-active-color)';
          break;
        default:
          icon_color = item._config.icon_color;
          break;
      }
      style.color = icon_color;
    // }
  }

  setConfig(config) {
    if (config.entity || config.config) {
      throw new Error("Breaking changes have been introduced. Please see https://github.com/thomasloven/lovelace-fold-entity-row");
    }
    // copy config to local
    this._config = config;
    this.closed = !this._config.open;
    this.update();

    if(this.items && this.items.forEach) {
      this.items.forEach( (item) => this._updateHost(item));
    }
  }

  set hass(hass) {
    this._hass = hass;

    // if card already exist update data
    if(this.dummy)
      this.dummy.hass = hass;

    if(this.items && this.items.forEach) {
      this.items.forEach( (item) => item.hass = hass); // update each row with new hass object
      this.items.forEach( (item) => this._updateHost(item));
    }
  }
}

customElements.define('nmo-row', nmoRow);


/*
.     type: entities
.     title: Folding entities
.     entities:
.       - light.bed_light
=       - type: custom:fold-entity-row
=         head: sensor.yr_symbol
=         items:
=           - sensor.outside_humidity
=           - sensor.outside_temperature
=           - entity: light.bedroom
=             secondary_info: last-changed
*             infos:    # add additional infos (along with secondary_infos 'entity-id' or 'last-changed')
*               - entity: sensor.lux_bedroom    # define a value to show
*                 lead: "Illuminance "    # append strings (remarks, descriptions, units, etc.) before...
*                 trail: "lx"   # ...or behind that value
*               - text: this is just a static remark    # add a static plain comment
*               - template: '{{ state_attr("sun.sun", "elecation")|string + "°" }}'   # use templates as you're used to
*                 lead: 'sun is at: '
*           - entity: sensor.temp_bedroom
*             icon_color: temp    # change icon color dynamically (choose from predefined settings: [temp,plant,mired,kelvin,battery,disc,wlan...])
*           - entity: light.ceiling
*             icon_color: '#FF0000'   # or choose a static one
*             infos:
*               - color_temp    # just use an attribute name to show the attribute from parent entity...
*               - entity:   # ...use an entity_id to show its state
*                 attribute   # ...add an attribute to show this instead
.       - light.bed_light
=       - type: custom:fold-entity-row
=         head:
=           type: section
=           label: Lights
=         group_config:
=           secondary_info: last-changed
=         items:
=           - light.bed_light
=           - light.ceiling_lights
=           - light.kitchen_lights
.       - light.bed_light
=       - type: custom:fold-entity-row
=         head:   # you can define the header only without items (the control arrow will be hidden in that case)
=           entity: light.bedroom
*           infos: 
*             - template: >   # use conditional templates (line will not be shown, if template results in emtpy string)
*                 {% if is_state("input_boolean.show_details", "on") %}
*                   {{ states("sensor.lux_bedroom")|string + "lx" }}
*                 {% endif %}
.       - light.bed_light


!tree:

* cut
let arrow = this.$.head.querySelector("div.toggle") 

* must be first child here
let parent = this.$.head.firstElementChild.firstElementChild.shadowRoot
parent.insertBefore(arrow, parent.firstElementChild)

this.$.rows.

nmo-row

!icons
this.$.head.
  firstElementChild.firstElementChild.shadowRoot.querySelector("hui-generic-entity-row").shadowRoot.querySelector("state-badge").$.icon.style.color

this.$.rows.forEach...

*/

