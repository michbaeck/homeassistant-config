// //*[@id="states"]/div[1]/hui-toggle-entity-row//hui-generic-entity-row//div/div/div .innerText   (==$0)
// div > div > div

/*
hui-entities-card
hui-entities-card.config
hui-entities-card.config.id = "string"
hui-entities-card.config.theme  = "string"
hui-entities-card.config.type = "string"
hui-entities-card.config.title  = "string"
hui-entities-card.config.entities[] = {entity: "string", name: "string", type: "string", etc... }

hui-entities-card.
  shadowroot.
    querySelector("ha-card").
      querySelector("#states").
        children[ ROWS ].
          firstElementChild.
            shadowroot.
              firstElementChild.
                shadowroot.
                  querySelector("div.flex").
                    querySelector("div.info").
                      appendChild(document.createElement("secondary"))
                      
querySelector("div.secondary").innerText;

innerText
------------------------------------------------------------------------------
ha-card = 'ha-card'
ha-card.title
ha-card.style

  // childNodes (card minus padding)
  #states  = 'div'

    // childNodes (entity rows)
    div = 'div'
    .clientHeight = 40

      // childNodes
      hui-toggle-entity-row.state-card-dialog =
      .__data
      .__data._config.entity
      .__data._config.secondary_info


div.flex
  div.info
    div.secondary

-------------------------------------------------------------------------------
$0. (= hui-entities-card)
  shadowRoot.
    querySelector("ha-card").
      header                                = config.title
      querySelector("#states").
        children[1].                        .foreach
          firstElementChild.
            root.
              querySelector("hui-generic-entity-row").
                root.
                  querySelector("div.flex").
                    querySelector("div.info").
                      querySelector("div.secondary").
                        innerText



$0.shadowRoot.querySelector("ha-card").querySelector("#states").children[1].firstElementChild.root.querySelector("hui-generic-entity-row").root.querySelector("div.flex").querySelector("div.info").querySelector("div.secondary").innerText = "test test"
*/
class NotMyOwnCard extends HTMLElement {
  set hass(hass) {

    if (this.lastChild) {

      this.lastChild.hass = hass

    }
    // this.content.innerHTML = `
    //   The state of ${entityId} is ${stateStr}!
    //   <br><br>
    // `;
  }



  // reads user config, can be used to check validity and setting defaults
  setConfig(config) {
    if (!config.entity) {
      throw new Error('You need to define an entity');
    }

    this.config = config;

    // condition|entity|entity-fold|entity-info
    if (!this.config.type) this.config.type = 'entity';

    
    // make card if not yet existing

      // create new card
      // const maincard = document.createElement('ha-card');
      // maincard.header = this.config.title;

      // create empty content 
      // this.content = document.createElement('div');
      // this.content.style.padding = '0 16px 16px';

      // add content to card
      // card.appendChild(this.content);
      // this.appendChild(card);

      // define vars to display
      if (!this.lastChild) {
        let cardconf = [];
        // cardconf.push({title: this.config.title});

        let cardentities = [];
        cardentities.push({entity: this.config.entity});

        // cardconf.push({entities: cardentities});
    
        // const state = hass.states[entityId];
        // const stateStr = state ? state.state : 'unavailable';
    
        // write html to card
        const card = document.createElement('hui-entities-card');
        card.setConfig({entities: cardentities});
        // card.config.title = this.config.title;
        // card.hass = hass;

        this.appendChild(card);
      }
  

  }

  // The height of your card. Home Assistant uses this to automatically
  // distribute all cards over the available columns.
  getCardSize() {
    return 3;
  }
}

customElements.define('not-my-own-card', NotMyOwnCard);