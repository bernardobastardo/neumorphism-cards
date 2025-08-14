import { html, TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { BaseCard } from "../../shared/base-card";
import { ServiceUtils } from "../../shared/utils";
import "../../shared/base-button";
import "../../shared/base-slider";
import "../../shared/card-header";
import { sharedStyles } from "../../styles/shared";
import { sliderStyles } from "../../styles/sliders";
import { coverControlStyles } from "../../styles/cover-control";

interface CoverEntityPair {
  name: string;
  description?: string;
  icon?: string;
  blind?: string;
  shutter?: string;
}

interface CardConfig {
  entity_pairs: CoverEntityPair[];
  title?: string;
  subtitle?: string;
}

class WindowCard extends BaseCard {
  @property() protected _config!: CardConfig;
  @property() private _selectedPair: CoverEntityPair | null = null;

  static getStubConfig() {
    return {
      entity_pairs: [{ name: "Demo", blind: "cover.demo_blind" }],
      title: "Window Control Card",
    };
  }

  setConfig(config: CardConfig) {
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

  private _getCurrentShutterPosition(): number {
    if (!this._selectedPair || !this._selectedPair.shutter || !this.hass) return 0;
    const state = this.hass.states[this._selectedPair.shutter];
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

  private _setShutterPosition(ev: any) {
    if (!this._selectedPair || !this._selectedPair.shutter || !this.hass) return;
    const invertedPosition = 100 - ev.detail.value;
    this.hass.callService("cover", "set_cover_position", {
      entity_id: this._selectedPair.shutter,
      position: invertedPosition,
    });
  }

  private _toggleCover(entityId: string) {
    const state = this.hass.states[entityId];
    if (!state) return;
    const service = state.state === "open" ? "close_cover" : "open_cover";
    this.hass.callService("cover", service, { entity_id: entityId });
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
        .controls-grid base-button {
          --active-icon-color: var(--primary-text-color);
        }
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
                  .showFill=${true}
                  .showThumb=${false}
                  min="0"
                  max="100"
                  .value=${100 - this._getCurrentBlindPosition()}
                  ?disabled=${!this._selectedPair || !this._selectedPair.blind}
                  @slider-change=${this._setBlindPosition}
                ></custom-slider>
              </div>

              <div class="slider-column">
                <div class="slider-label">S</div>
                <custom-slider
                  style="height: ${sliderHeight}px"
                  orientation="vertical"
                  .showFill=${true}
                  .showThumb=${false}
                  fill-style="striped"
                  min="0"
                  max="100"
                  .value=${100 - this._getCurrentShutterPosition()}
                  ?disabled=${!this._selectedPair || !this._selectedPair.shutter}
                  @slider-change=${this._setShutterPosition}
                ></custom-slider>
              </div>
            </div>

            <div class="controls-grid">
              ${this._config.entity_pairs.map((pair) => {
                const blindState = pair.blind ? this.hass.states[pair.blind] : null;
                const shutterState = pair.shutter ? this.hass.states[pair.shutter] : null;
                const isBlindAvailable = !!blindState;
                const isShutterAvailable = !!shutterState;
                const isBlindOpen =
                  isBlindAvailable && (blindState.state === "open" || (blindState.attributes.current_position || 0) > 0);
                const isShutterOpen =
                  isShutterAvailable &&
                  (shutterState.state === "open" || (shutterState.attributes.current_position || 0) > 0);
                let statusText = "";
                if (isBlindAvailable && isShutterAvailable) {
                  statusText = `Blind: ${isBlindOpen ? "open" : "closed"} | Shutter: ${
                    isShutterOpen ? "open" : "closed"
                  }`;
                } else if (isBlindAvailable) {
                  statusText = `Blind: ${isBlindOpen ? "open" : "closed"}`;
                } else if (isShutterAvailable) {
                  statusText = `Shutter: ${isShutterOpen ? "open" : "closed"}`;
                }

                return html`
                  <div class="entity-row">
                    <div class="button-description-container">
                      <base-button
                        small
                        .icon=${pair.icon || "mdi:window-shutter"}
                        .active=${isBlindOpen || isShutterOpen}
                        .selected=${this._selectedPair === pair}
                        ?disabled=${!isBlindAvailable && !isShutterAvailable}
                        .entity=${pair.blind || pair.shutter || ""}
                        @button-click=${() => this._selectPair(pair)}
                        @button-double-click=${() => {
                          if (pair.blind) this._toggleCover(pair.blind);
                          if (pair.shutter) this._toggleCover(pair.shutter);
                        }}
                        @button-long-press=${() => {
                          const entityId = pair.blind || pair.shutter;
                          if (entityId) ServiceUtils.showMoreInfo(this, entityId);
                        }}
                        @button-right-click=${() => {
                          const entityId = pair.shutter || pair.blind;
                          if (entityId) ServiceUtils.showMoreInfo(this, entityId);
                        }}
                      ></base-button>
                      <div class="entity-info">
                        <div class="entity-name">${pair.name}</div>
                        <div class="entity-description">
                          <base-markdown-card
                            .hass=${this.hass}
                            .content=${pair.description || statusText}
                          ></base-markdown-card>
                        </div>
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

customElements.define("window-card", WindowCard);
