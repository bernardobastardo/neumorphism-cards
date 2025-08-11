
import { HomeAssistant } from "custom-card-helpers";
import { BaseCard } from "../shared/base-card";
import { ServiceUtils } from "../shared/utils";
import "../shared/base-button";
import "../shared/base-slider";
import { sharedStyles } from "../styles/shared";
import { sliderStyles } from "../styles/sliders";
import { coverControlStyles } from "../styles/cover-control";

interface CoverEntityPair {
  name: string;
  description?: string;
  icon?: string;
  blind?: string;
  curtain?: string;
}

class BlindCurtainControlCard extends BaseCard {
  private _selectedPair: CoverEntityPair | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static getStubConfig() {
    return {
      entity_pairs: [{ name: "Demo", blind: "cover.demo_blind" }],
      title: "Blind Curtain Control Card",
    };
  }

  setConfig(config) {
    if (!config.entity_pairs) {
      throw new Error("Please define entity_pairs");
    }
    config.entity_pairs.forEach((pair) => {
      if (!pair.name) {
        throw new Error("Each entity pair must have a name");
      }
      if (!pair.blind && !pair.curtain) {
        throw new Error("Each entity pair must have at least one of blind or curtain");
      }
      if (pair.blind && !pair.blind.startsWith("cover.")) {
        console.warn(`Entity ${pair.blind} might not be a cover entity`);
      }
      if (pair.curtain && !pair.curtain.startsWith("cover.")) {
        console.warn(`Entity ${pair.curtain} might not be a cover entity`);
      }
    });
    super.setConfig(config);

    if (config.entity_pairs.length > 0) {
      this._selectedPair = config.entity_pairs[0];
    }
  }

  getLayoutOptions() {
    const numPairs = this._config?.entity_pairs?.length || 0;
    const columns = 4;
    const hasTitle = this._config?.title ? 1 : 0;
    const hasSubtitle = this._config?.subtitle ? 1 : 0;
    const pairRows = Math.ceil(numPairs / 3);
    const rows = hasTitle + hasSubtitle + pairRows + 1;
    return {
      grid_columns: columns,
      grid_min_columns: 3,
      grid_max_columns: 4,
      grid_rows: rows,
      grid_min_rows: 3,
      grid_max_rows: Math.max(rows, 5),
    };
  }

  private _selectPair(pair: CoverEntityPair, ev: Event) {
    ev.stopPropagation();
    this._selectedPair = pair;
    this.render();
  }

  private _getCurrentBlindPosition(): number {
    if (!this._selectedPair || !this._selectedPair.blind || !this._hass) return 0;
    const state = this._hass.states[this._selectedPair.blind];
    if (!state) return 0;
    return state.attributes.current_position !== undefined ? state.attributes.current_position : state.state === "open" ? 100 : 0;
  }

  private _getCurrentCurtainPosition(): number {
    if (!this._selectedPair || !this._selectedPair.curtain || !this._hass) return 0;
    const state = this._hass.states[this._selectedPair.curtain];
    if (!state) return 0;
    return state.attributes.current_position !== undefined ? state.attributes.current_position : state.state === "open" ? 100 : 0;
  }

  private _setBlindPosition(ev: any) {
    if (!this._selectedPair || !this._selectedPair.blind || !this._hass) return;
    const invertedPosition = 100 - ev.detail.value;
    this._hass.callService("cover", "set_cover_position", {
      entity_id: this._selectedPair.blind,
      position: invertedPosition,
    });
  }

  private _setCurtainPosition(ev: any) {
    if (!this._selectedPair || !this._selectedPair.curtain || !this._hass) return;
    const invertedPosition = 100 - ev.detail.value;
    this._hass.callService("cover", "set_cover_position", {
      entity_id: this._selectedPair.curtain,
      position: invertedPosition,
    });
  }

  protected render() {
    if (!this._hass || !this._config) {
      return;
    }

    const pairs = this._config.entity_pairs
      .map((pair) => {
        const name = pair.name;
        const description = pair.description || "";
        const icon = pair.icon || "mdi:window-shutter";
        const blindState = pair.blind ? this._hass.states[pair.blind] : null;
        const curtainState = pair.curtain ? this._hass.states[pair.curtain] : null;
        const isBlindAvailable = !!blindState;
        const isCurtainAvailable = !!curtainState;
        const isBlindOpen = isBlindAvailable && (blindState.state === "open" || (blindState.attributes.current_position || 0) > 0);
        const isCurtainOpen = isCurtainAvailable && (curtainState.state === "open" || (curtainState.attributes.current_position || 0) > 0);
        const isSelected = this._selectedPair === pair;
        const isActive = isBlindOpen || isCurtainOpen;
        let statusText = "";
        if (isBlindAvailable && isCurtainAvailable) {
          statusText = `Blind: ${isBlindOpen ? "open" : "closed"} | Curtain: ${isCurtainOpen ? "open" : "closed"}`;
        } else if (isBlindAvailable) {
          statusText = `Blind: ${isBlindOpen ? "open" : "closed"}`;
        } else if (isCurtainAvailable) {
          statusText = `Curtain: ${isCurtainOpen ? "open" : "closed"}`;
        }
        const entityId = pair.blind || pair.curtain;

        return `
        <div class="entity-row">
          <div class="button-description-container">
            <base-button
              small
              .icon=${icon}
              .active=${isActive}
              .selected=${isSelected}
              .disabled=${!isBlindAvailable && !isCurtainAvailable}
              .entity=${entityId || ""}
              @button-click=${(e) => this._selectPair(pair, e.detail.originalEvent)}
              @button-double-click=${(e) => {
                if (pair.blind) ServiceUtils.toggle(this, pair.blind);
                if (pair.curtain) ServiceUtils.toggle(this, pair.curtain);
              }}
              @button-long-press=${(e) => {
                const entity = pair.blind || pair.curtain;
                if (entity) ServiceUtils.showMoreInfo(this, entity);
              }}
              @button-right-click=${(e) => {
                const entity = pair.curtain || pair.blind;
                if (entity) ServiceUtils.showMoreInfo(this, entity);
              }}
            ></base-button>
            <div class="entity-info">
              <div class="entity-name">${name}</div>
              <div class="entity-description">${description || statusText}</div>
            </div>
          </div>
        </div>
      `;
      })
      .join("");

    const currentBlindPosition = this._getCurrentBlindPosition();
    const currentCurtainPosition = this._getCurrentCurtainPosition();
    const hasBlind = this._selectedPair && this._selectedPair.blind && this._hass.states[this._selectedPair.blind] !== undefined;
    const hasCurtain = this._selectedPair && this._selectedPair.curtain && this._hass.states[this._selectedPair.curtain] !== undefined;
    const sliderHeight = (this._config?.entity_pairs?.length || 1) * 62;

    const title = this._config.title ? `<h1>${this._config.title}</h1>` : "";
    const subtitle = this._config.subtitle ? `<p>${this._config.subtitle}</p>` : "";

    this.shadowRoot.innerHTML = `
      <style>
        ${sharedStyles}
        ${sliderStyles}
        ${coverControlStyles}
      </style>
      
      <div class="card-container">
        <div class="card-header">
          ${title}
          ${subtitle}
        </div>
        
        <div class="card-content">
          <div class="container">
            <div class="sliders-container">
              <div class="slider-column">
                <div class="slider-label">B</div>
                <custom-slider
                  style="height: ${sliderHeight}px"
                  orientation="vertical"
                  show-fill="true"
                  show-thumb="false"
                  min="0"
                  max="100"
                  .value=${100 - currentBlindPosition}
                  ?disabled=${!hasBlind}
                  @slider-change=${this._setBlindPosition}
                ></custom-slider>
              </div>
              
              <div class="slider-column">
                <div class="slider-label">C</div>
                <custom-slider
                  style="height: ${sliderHeight}px"
                  orientation="vertical"
                  show-fill="true"
                  show-thumb="false"
                  min="0"
                  max="100"
                  .value=${100 - currentCurtainPosition}
                  ?disabled=${!hasCurtain}
                  @slider-change=${this._setCurtainPosition}
                ></custom-slider>
              </div>
            </div>
            
            <div class="controls-grid">
              ${pairs}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("blind-curtain-control-card", BlindCurtainControlCard);
