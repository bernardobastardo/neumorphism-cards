import { html, TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { HomeAssistant } from "custom-card-helpers";
import { BaseCard } from "../../shared/base-card";
import { ServiceUtils } from "../../shared/utils";
import "../../shared/base-button";
import "../../shared/base-slider";
import "../../shared/card-header";
import { sharedStyles } from "../../styles/shared";
import { lightControlStyles } from "../../styles/light-control";

interface LightEntityConfig {
  entity: string;
  name?: string;
  icon?: string;
}

interface CardConfig {
  entities: (string | LightEntityConfig)[];
  title?: string;
  subtitle?: string;
}

class LightControlCard extends BaseCard {
  @property() protected _config!: CardConfig;
  @property() private _selectedEntity: string | null = null;

  static getStubConfig() {
    return {
      entities: ["light.demo_light"],
      title: "Light Control Card",
    };
  }

  setConfig(config: CardConfig) {
    if (!config.entities) {
      throw new Error("Please define entities");
    }
    this._config = config;

    if (config.entities.length > 0) {
      const firstEntity = typeof config.entities[0] === "string" ? config.entities[0] : config.entities[0].entity;
      this._selectedEntity = firstEntity;
    }
  }

  private _selectEntity(entityId: string) {
    this._selectedEntity = entityId;
  }

  private _getCurrentBrightness(): number {
    if (!this._selectedEntity || !this.hass) return 100;
    const state = this.hass.states[this._selectedEntity];
    if (!state || state.state === "off") return 0;
    const brightness = state.attributes.brightness || 0;
    return Math.round(brightness / 2.55);
  }

  private _getCurrentColorTemp(): number {
    if (!this._selectedEntity || !this.hass) return 50;
    const state = this.hass.states[this._selectedEntity];
    if (!state || state.state === "off") return 50;

    if (state.attributes.kelvin) {
      const minKelvin = state.attributes.min_kelvin || 2000;
      const maxKelvin = state.attributes.max_kelvin || 6500;
      const range = maxKelvin - minKelvin;
      const kelvin = state.attributes.kelvin;
      return Math.round(((kelvin - minKelvin) / range) * 100);
    }

    if (state.attributes.color_temp) {
      const minMireds = state.attributes.min_mireds || 153;
      const maxMireds = state.attributes.max_mireds || 500;
      const range = maxMireds - minMireds;
      const mireds = state.attributes.color_temp;
      return Math.round(((maxMireds - mireds) / range) * 100);
    }

    return 50;
  }

  private _supportsColorTemp(entityId: string): boolean {
    if (!entityId || !this.hass) return false;
    const state = this.hass.states[entityId];
    if (!state) return false;
    return (
      state.attributes.supported_color_modes &&
      (state.attributes.supported_color_modes.includes("color_temp") ||
        state.attributes.supported_color_modes.includes("kelvin"))
    );
  }

  private _setBrightness(ev: any) {
    if (!this._selectedEntity || !this.hass) return;
    ServiceUtils.setBrightness(this.hass, this._selectedEntity, ev.detail.value);
  }

  private _setColorTemp(ev: any) {
    if (!this._selectedEntity || !this.hass) return;

    const state = this.hass.states[this._selectedEntity];
    if (!state) return;

    const sliderValue = ev.detail.value;
    let serviceData: { entity_id: string; kelvin?: number; color_temp?: number } = { entity_id: this._selectedEntity };

    if (state.attributes.supported_color_modes.includes("kelvin")) {
      const minKelvin = state.attributes.min_kelvin || 2000;
      const maxKelvin = state.attributes.max_kelvin || 6500;
      const range = maxKelvin - minKelvin;
      serviceData.kelvin = Math.round(minKelvin + (sliderValue / 100) * range);
    } else if (state.attributes.supported_color_modes.includes("color_temp")) {
      const minMireds = state.attributes.min_mireds || 153;
      const maxMireds = state.attributes.max_mireds || 500;
      const range = maxMireds - minMireds;
      serviceData.color_temp = Math.round(maxMireds - (sliderValue / 100) * range);
    }

    this.hass.callService("light", "turn_on", serviceData);
  }

  private _handleToggle(entityId: string) {
    if (!this.hass) return;
    this.hass.callService("light", "toggle", { entity_id: entityId });
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) {
      return html``;
    }

    return html`
      <style>
        ${sharedStyles}
        ${lightControlStyles}
      </style>

      <div class="card-container">
        <div class="card-header">
          <card-header .hass=${this.hass} .title=${this._config.title} .subtitle=${this._config.subtitle}></card-header>
        </div>
        <div class="lights-grid">
          ${this._config.entities.map((entityConf) => {
            const entityId = typeof entityConf === "string" ? entityConf : entityConf.entity;
            const state = this.hass.states[entityId];
            const isAvailable = !!state;
            const name = (typeof entityConf !== 'string' && entityConf.name) || (isAvailable ? state.attributes.friendly_name : entityId) || entityId;
            const icon = (typeof entityConf !== 'string' && entityConf.icon) || (isAvailable ? state.attributes.icon : "mdi:lightbulb") || "mdi:lightbulb";
            const isOn = isAvailable && state.state === "on";
            const isSelected = entityId === this._selectedEntity;

            return html`
              <div class="light-item">
                <base-button
                  .icon=${icon}
                  .active=${isOn}
                  .selected=${isSelected}
                  ?disabled=${!isAvailable}
                  .name=${name}
                  .entity=${entityId}
                  @button-click=${() => this._selectEntity(entityId)}
                  @button-double-click=${() => this._handleToggle(entityId)}
                  @button-long-press=${() => ServiceUtils.showMoreInfo(this, entityId)}
                  @button-right-click=${() => ServiceUtils.showMoreInfo(this, entityId)}
                >
                  <span slot="status" class="light-status">${isOn ? "on" : "off"}</span>
                </base-button>
              </div>
            `;
          })}
        </div>

        <div class="sliders-container">
          <custom-slider
            show-fill="true"
            show-thumb="true"
            show-border="true"
            label="Brightness"
            min="0"
            max="100"
            .value=${this._getCurrentBrightness()}
            ?disabled=${!this._selectedEntity}
            @slider-change=${this._setBrightness}
          ></custom-slider>

          <custom-slider
            show-fill="true"
            show-thumb="true"
            show-border="true"
            label="Temperature"
            min="0"
            max="100"
            .value=${this._getCurrentColorTemp()}
            ?disabled=${!this._selectedEntity || !this._supportsColorTemp(this._selectedEntity)}
            @slider-change=${this._setColorTemp}
          ></custom-slider>
        </div>
      </div>
    `;
  }
}

customElements.define("light-control-card", LightControlCard);