import { html, TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { HomeAssistant } from "custom-card-helpers";
import { BaseCard } from "../shared/base-card";
import { ServiceUtils } from "../shared/utils";
import "../shared/base-button";
import "../shared/base-slider";
import "../shared/card-header";
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
  @property() protected _config: any;
  @property() private _selectedPair: CoverEntityPair | null = null;

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
    this._config = config;

    if (config.entity_pairs.length > 0) {
      this._selectedPair = config.entity_pairs[0];
    }
  }

  private _selectPair(pair: CoverEntityPair) {
    this._selectedPair = pair;
  }

  private _getCurrentBlindPosition(): number {
    if (!this._selectedPair || !this._selectedPair.blind || !this.hass) return 0;
    const state = this.hass.states[this._selectedPair.blind];
    if (!state) return 0;
    return state.attributes.current_position !== undefined ? state.attributes.current_position : state.state === "open" ? 100 : 0;
  }

  private _getCurrentCurtainPosition(): number {
    if (!this._selectedPair || !this._selectedPair.curtain || !this.hass) return 0;
    const state = this.hass.states[this._selectedPair.curtain];
    if (!state) return 0;
    return state.attributes.current_position !== undefined ? state.attributes.current_position : state.state === "open" ? 100 : 0;
  }

  private _setBlindPosition(ev: any) {
    if (!this._selectedPair || !this._selectedPair.blind || !this.hass) return;
    const invertedPosition = 100 - ev.detail.value;
    this.hass.callService("cover", "set_cover_position", {
      entity_id: this._selectedPair.blind,
      position: invertedPosition,
    });
  }

  private _setCurtainPosition(ev: any) {
    if (!this._selectedPair || !this._selectedPair.curtain || !this.hass) return;
    const invertedPosition = 100 - ev.detail.value;
    this.hass.callService("cover", "set_cover_position", {
      entity_id: this._selectedPair.curtain,
      position: invertedPosition,
    });
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) {
      return html``;
    }

    const sliderHeight = (this._config?.entity_pairs?.length || 1) * 62;

    return html`
      <style>
        ${sharedStyles}
        ${sliderStyles}
        ${coverControlStyles}
      </style>
      
      <div class="card-container">
        <div class="card-header">
          <card-header .hass=${this.hass} .title=${this._config.title} .subtitle=${this._config.subtitle}></card-header>
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
                  .value=${100 - this._getCurrentBlindPosition()}
                  ?disabled=${!this._selectedPair || !this._selectedPair.blind}
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
                  .value=${100 - this._getCurrentCurtainPosition()}
                  ?disabled=${!this._selectedPair || !this._selectedPair.curtain}
                  @slider-change=${this._setCurtainPosition}
                ></custom-slider>
              </div>
            </div>
            
            <div class="controls-grid">
              ${this._config.entity_pairs.map((pair) => {
                const blindState = pair.blind ? this.hass.states[pair.blind] : null;
                const curtainState = pair.curtain ? this.hass.states[pair.curtain] : null;
                const isBlindAvailable = !!blindState;
                const isCurtainAvailable = !!curtainState;
                const isBlindOpen = isBlindAvailable && (blindState.state === "open" || (blindState.attributes.current_position || 0) > 0);
                const isCurtainOpen = isCurtainAvailable && (curtainState.state === "open" || (curtainState.attributes.current_position || 0) > 0);
                let statusText = "";
                if (isBlindAvailable && isCurtainAvailable) {
                  statusText = `Blind: ${isBlindOpen ? "open" : "closed"} | Curtain: ${isCurtainOpen ? "open" : "closed"}`;
                } else if (isBlindAvailable) {
                  statusText = `Blind: ${isBlindOpen ? "open" : "closed"}`;
                } else if (isCurtainAvailable) {
                  statusText = `Curtain: ${isCurtainOpen ? "open" : "closed"}`;
                }

                return html`
                  <div class="entity-row">
                    <div class="button-description-container">
                      <base-button
                        small
                        .icon=${pair.icon || "mdi:window-shutter"}
                        .active=${isBlindOpen || isCurtainOpen}
                        .selected=${this._selectedPair === pair}
                        ?disabled=${!isBlindAvailable && !isCurtainAvailable}
                        .entity=${pair.blind || pair.curtain || ""}
                        @button-click=${() => this._selectPair(pair)}
                        @button-double-click=${() => {
                          if (pair.blind) ServiceUtils.toggle(this, pair.blind);
                          if (pair.curtain) ServiceUtils.toggle(this, pair.curtain);
                        }}
                        @button-long-press=${() => ServiceUtils.showMoreInfo(this, pair.blind || pair.curtain)}
                        @button-right-click=${() => ServiceUtils.showMoreInfo(this, pair.curtain || pair.blind)}
                      ></base-button>
                      <div class="entity-info">
                        <div class="entity-name">${pair.name}</div>
                        <div class="entity-description">${pair.description || statusText}</div>
                      </div>
                    </div>
                  </div>
                `;
              })}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("blind-curtain-control-card", BlindCurtainControlCard);