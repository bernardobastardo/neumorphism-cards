
import { HomeAssistant } from "custom-card-helpers";
import { BaseCard } from "../shared/base-card";
import { ServiceUtils } from "../shared/utils";
import "../shared/base-button";
import "../shared/base-slider";
import { sharedStyles } from "../styles/shared";
import { lightControlStyles } from "../styles/light-control";

class LightControlCard extends BaseCard {
  private _selectedEntity: string | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static getStubConfig() {
    return {
      entities: ["light.demo_light"],
      title: "Light Control Card",
    };
  }

  setConfig(config) {
    if (!config.entities) {
      throw new Error("Please define entities");
    }
    if (
      config.entities.some((entity) => {
        const entityId = typeof entity === "string" ? entity : entity.entity;
        return !entityId.startsWith("light.");
      })
    ) {
      console.warn("Some entities are not lights, they may not work correctly");
    }
    super.setConfig(config);

    if (config.entities.length > 0) {
      const firstEntity = typeof config.entities[0] === "string" ? config.entities[0] : config.entities[0].entity;
      this._selectedEntity = firstEntity;
    }
  }

  getLayoutOptions() {
    const numEntities = this._config?.entities?.length || 0;
    const columns = 4;
    const hasTitle = this._config?.title ? 1 : 0;
    const hasSubtitle = this._config?.subtitle ? 1 : 0;
    const entityRows = Math.ceil(numEntities / 3);
    const sliderRows = 2;
    const rows = hasTitle + hasSubtitle + entityRows + sliderRows;
    return {
      grid_columns: columns,
      grid_min_columns: 3,
      grid_max_columns: 4,
      grid_rows: rows,
      grid_min_rows: 3,
      grid_max_rows: Math.max(rows, 5),
    };
  }

  private _selectEntity(entityId: string, ev: Event) {
    ev.stopPropagation();
    this._selectedEntity = entityId;
    this.render();
  }

  private _getCurrentBrightness(): number {
    if (!this._selectedEntity || !this._hass) return 100;
    const state = this._hass.states[this._selectedEntity];
    if (!state || state.state === "off") return 0;
    const brightness = state.attributes.brightness || 0;
    return Math.round(brightness / 2.55);
  }

  private _getCurrentColorTemp(): number {
    if (!this._selectedEntity || !this._hass) return 50;
    const state = this._hass.states[this._selectedEntity];
    if (!state || state.state === "off") return 50;
    if (state.attributes.kelvin) {
      const minTemp = 2000;
      const maxTemp = 6500;
      const range = maxTemp - minTemp;
      const kelvin = state.attributes.kelvin || 3500;
      return 100 - Math.round(((kelvin - minTemp) / range) * 100);
    }
    if (state.attributes.color_temp) {
      const minMireds = state.attributes.min_mireds || 153;
      const maxMireds = state.attributes.max_mireds || 500;
      const range = maxMireds - minMireds;
      const mireds = state.attributes.color_temp;
      return Math.round(((mireds - minMireds) / range) * 100);
    }
    return 50;
  }

  private _supportsColorTemp(entityId: string): boolean {
    if (!entityId || !this._hass) return false;
    const state = this._hass.states[entityId];
    if (!state) return false;
    return (
      state.attributes.supported_color_modes &&
      (state.attributes.supported_color_modes.includes("color_temp") ||
        state.attributes.supported_color_modes.includes("kelvin"))
    );
  }

  private _setBrightness(ev: any) {
    if (!this._selectedEntity || !this._hass) return;
    ServiceUtils.setBrightness(this._hass, this._selectedEntity, ev.detail.value);
  }

  private _setColorTemp(ev: any) {
    if (!this._selectedEntity || !this._hass) return;
    ServiceUtils.setColorTemp(this._hass, this._selectedEntity, ev.detail.value);
  }

  protected render() {
    if (!this._hass || !this._config) {
      return;
    }

    const entities = this._config.entities
      .map((entityConf) => {
        const entityId = typeof entityConf === "string" ? entityConf : entityConf.entity;
        const state = this._hass.states[entityId];
        const isAvailable = !!state;
        const name = entityConf.name || (isAvailable ? state.attributes.friendly_name : entityId) || entityId;
        const icon = entityConf.icon || (isAvailable ? state.attributes.icon : "mdi:lightbulb") || "mdi:lightbulb";
        const isOn = isAvailable && state.state === "on";
        const isSelected = entityId === this._selectedEntity;

        return `
        <div class="light-item">
          <base-button
            .icon=${icon}
            .active=${isOn}
            .selected=${isSelected}
            .disabled=${!isAvailable}
            .name=${name}
            .entity=${entityId}
            @button-click=${(e) => this._selectEntity(entityId, e.detail.originalEvent)}
            @button-double-click=${(e) => {
              e.stopPropagation();
              ServiceUtils.toggle(this, entityId);
            }}
            @button-long-press=${(e) => {
              e.stopPropagation();
              ServiceUtils.showMoreInfo(this, entityId);
            }}
            @button-right-click=${(e) => {
              e.stopPropagation();
              ServiceUtils.showMoreInfo(this, entityId);
            }}
          >
            <span slot="status" class="light-status">${isOn ? "on" : "off"}</span>
          </base-button>
        </div>
      `;
      })
      .join("");

    const currentBrightness = this._getCurrentBrightness();
    const currentColorTemp = this._getCurrentColorTemp();
    const supportsColorTemp = this._selectedEntity ? this._supportsColorTemp(this._selectedEntity) : false;

    const title = this._config.title ? `<h1>${this._config.title}</h1>` : "";
    const subtitle = this._config.subtitle ? `<p>${this._config.subtitle}</p>` : "";

    this.shadowRoot.innerHTML = `
      <style>
        ${sharedStyles}
        ${lightControlStyles}
      </style>
      
      <div class="card-container">
        <div class="card-header">
          ${title}
          ${subtitle}
        </div>
        <div class="lights-grid">
          ${entities}
        </div>
        
        <div class="sliders-container">
          <custom-slider
            show-fill="true"
            show-thumb="true"
            show-border="true"
            label="Brightness"
            min="0"
            max="100"
            .value=${currentBrightness}
            ?disabled=${!this._selectedEntity}
            @slider-change=${this._setBrightness}
          ></custom-slider>
          
          <custom-slider
            show-fill="false"
            show-thumb="true"
            show-border="true"
            label="Temperature"
            min="0"
            max="100"
            .value=${currentColorTemp}
            ?disabled=${!this._selectedEntity || !supportsColorTemp}
            @slider-change=${this._setColorTemp}
          ></custom-slider>
        </div>
      </div>
    `;
  }
}

customElements.define("light-control-card", LightControlCard);
