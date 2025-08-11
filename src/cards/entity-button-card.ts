import { html, TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { BaseCard } from "../shared/base-card";
import { EntityUtils, ServiceUtils } from "../shared/utils";
import { sharedStyles } from "../styles/shared";
import "../shared/base-button";
import "../shared/base-markdown-card";

class EntityButtonCard extends BaseCard {
  @property() protected _config: any;

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
    this._config = config;
  }

  private _handleButtonClick(entityId: string) {
    console.log("Button clicked for entity:", entityId); // Temporary log
    ServiceUtils.toggleEntity(this.hass, entityId);
  }

  private _handleMoreInfo(entityId: string) {
    ServiceUtils.showMoreInfo(this, entityId);
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) {
      return html``;
    }

    const title = this._config.title ? html`<div class="title"><base-markdown-card .hass=${this.hass} .content="${this._config.title}"></base-markdown-card></div>` : "";
    const subtitle = this._config.subtitle ? html`<div class="subtitle"><base-markdown-card .hass=${this.hass} .content="${this._config.subtitle}"></base-markdown-card></div>` : "";

    return html`
      <style>
        ${sharedStyles}
        .title {
          font-size: 1.2em;
          font-weight: bold;
          margin-bottom: 4px;
        }
        .subtitle {
          font-size: 0.9em;
          color: var(--secondary-text-color);
        }
      </style>
      <div class="card-container">
        <div class="card-header">
          ${title}
          ${subtitle}
        </div>
        <div class="card-content">
          ${this._config.entities.map((entityConf) => {
            const entityId = typeof entityConf === "string" ? entityConf : entityConf.entity;
            const state = this.hass.states[entityId];

            if (!state) {
              return html`
                <div class="entity-row size-2">
                  <div class="button-description-container">
                    <base-button icon="mdi:alert" disabled></base-button>
                  </div>
                  <div class="entity-info">
                    <div class="entity-name">${entityId} (unavailable)</div>
                    <div class="entity-description">Entity not available</div>
                  </div>
                </div>
              `;
            }

            const name = entityConf.name || state.attributes.friendly_name || entityId;
            const description = entityConf.description || "";
            const icon = entityConf.icon || state.attributes.icon || "";
            const size = entityConf.size === 1 ? 1 : 2;
            const smallButton = entityConf.buttonSize === "small";
            const isOn = EntityUtils.isEntityActive(state);
            const entityIcon = EntityUtils.getEntityIcon(entityId, state, icon);

            return html`
              <div class="entity-row size-${size}">
                <div class="button-description-container">
                  <base-button
                    .small=${smallButton}
                    .icon=${entityIcon}
                    .active=${isOn}
                    @button-click=${() => this._handleButtonClick(entityId)}
                    @button-right-click=${() => this._handleMoreInfo(entityId)}
                    @button-long-press=${() => this._handleMoreInfo(entityId)}
                  ></base-button>
                </div>
                <div class="entity-info">
                  <div class="entity-name">${name}</div>
                  <div class="entity-description">${EntityUtils.processTemplate(description, entityId, this.hass)}</div>
                </div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }
}

customElements.define("entity-button-card", EntityButtonCard);
