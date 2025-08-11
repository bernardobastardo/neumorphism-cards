
import { HomeAssistant } from "custom-card-helpers";
import { BaseCard } from "../shared/base-card";
import { EntityUtils, ServiceUtils } from "../shared/utils";

class EntityButtonCard extends BaseCard {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static getStubConfig() {
    return {
      entities: [{ entity: "light.demo_light" }],
      title: "Entity Button Card",
    };
  }

  setConfig(config) {
    if (!config.entities) {
      throw new Error("Please define entities");
    }
    super.setConfig(config);
  }

  private _handleButtonClick(entityId: string, ev: Event) {
    ev.stopPropagation();
    ServiceUtils.toggleEntity(this._hass, entityId);
  }

  private _handleMoreInfo(entityId: string, ev: Event) {
    ev.stopPropagation();
    ServiceUtils.showMoreInfo(this, entityId);
  }

  protected render() {
    if (!this._hass || !this._config) {
      return;
    }

    const entities = this._config.entities.map((entityConf) => {
      const entityId = typeof entityConf === "string" ? entityConf : entityConf.entity;
      const state = this._hass.states[entityId];

      if (!state) {
        return `
          <div class="entity-row size-2">
            <div class="button-description-container">
              <base-button icon="mdi:alert" disabled></base-button>
            </div>
            <div class="entity-info">
              <div class="entity-name">${entityId} (unavailable)</div>
              <div class="entity-description">Entity not available</div>
            </div>
          </div>`;
      }

      const name = entityConf.name || state.attributes.friendly_name || entityId;
      const description = entityConf.description || "";
      const icon = entityConf.icon || state.attributes.icon || "";
      const size = entityConf.size === 1 ? 1 : 2;
      const smallButton = entityConf.buttonSize === "small";

      const isOn = EntityUtils.isEntityActive(state);
      const entityIcon = EntityUtils.getEntityIcon(entityId, state, icon);

      return `
        <div class="entity-row size-${size}">
          <div class="button-description-container">
            <base-button
              .small=${smallButton}
              .icon=${entityIcon}
              .active=${isOn}
              @button-click=${(e) => this._handleButtonClick(entityId, e)}
              @button-right-click=${(e) => this._handleMoreInfo(entityId, e)}
              @button-long-press=${(e) => this._handleMoreInfo(entityId, e)}
            ></base-button>
          </div>
          <div class="entity-info">
            <div class="entity-name">${name}</div>
            <div class="entity-description">${EntityUtils.processTemplate(description, entityId, this._hass)}</div>
          </div>
        </div>`;
    }).join("");

    const title = this._config.title ? `<h1>${this._config.title}</h1>` : "";
    const subtitle = this._config.subtitle ? `<p>${this._config.subtitle}</p>` : "";

    this.shadowRoot.innerHTML = `
      <style>
        @import "/local/neumorphism-cards/styles/shared.css";
      </style>
      <div class="card-container">
        <div class="card-header">
          ${title}
          ${subtitle}
        </div>
        <div class="card-content">
          ${entities}
        </div>
      </div>
    `;
  }
}

customElements.define("entity-button-card", EntityButtonCard);
