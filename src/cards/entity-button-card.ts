import { html, TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { BaseCard } from "../shared/base-card";
import { EntityUtils, ServiceUtils } from "../shared/utils";
import { sharedStyles } from "../styles/shared";
import "../shared/base-button";
import "../shared/base-markdown-card";
import "../shared/card-header";

interface EntityConfig {
  entity: string;
  name?: string;
  description?: string;
  icon?: string;
  size?: "full" | "half" | 1 | 2;
  buttonSize?: "small" | "big";
}

interface CardConfig {
  entities: EntityConfig[];
  title?: string;
  subtitle?: string;
}

class EntityButtonCard extends BaseCard {
  @property() protected _config!: CardConfig;

  public static async getConfigElement() {
    await import("./entity-button-card-editor");
    return document.createElement("neumorphism-entity-button-card-editor");
  }

  static getStubConfig() {
    return {
      entities: [{ entity: "light.demo_light" }],
      title: "Entity Button Card",
    };
  }

  setConfig(config: CardConfig) {
    if (!config.entities) {
      throw new Error("Please define entities");
    }
    this._config = config;
  }

  private _handleButtonClick(entityId: string) {
    ServiceUtils.toggleEntity(this.hass, entityId);
  }

  private _handleMoreInfo(entityId: string) {
    ServiceUtils.showMoreInfo(this, entityId);
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) {
      return html``;
    }

    return html`
      <style>
        ${sharedStyles}
      </style>
      <div class="card-container">
        <div class="card-header">
          <card-header .hass=${this.hass} .title=${this._config.title} .subtitle=${this._config.subtitle}></card-header>
        </div>
        <div class="card-content">
          ${this._config.entities.map((entityConf: EntityConfig) => {
            const entityId = entityConf.entity;
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
            const size = (entityConf.size as any) == "half" || (entityConf.size as any) == 1 ? 1 : 2;
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
                  <div class="entity-description">
                    <base-markdown-card .hass=${this.hass} .content="${description}"></base-markdown-card>
                  </div>
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