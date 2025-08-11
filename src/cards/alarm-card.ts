import { html, TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { HomeAssistant } from "custom-card-helpers";
import { BaseCard } from "../shared/base-card";
import { EntityUtils, ServiceUtils } from "../shared/utils";
import "../shared/base-button";
import "../shared/card-header";
import { sharedStyles } from "../styles/shared";
import { alarmCardStyles } from "../styles/alarm-card";

class AlarmCard extends BaseCard {
  @property() protected _config: any;

  static getStubConfig() {
    return {
      left_entity: "input_boolean.demo_alarm",
      input_datetime: "input_datetime.demo_alarm_time",
      title: "Alarm Card",
    };
  }

  setConfig(config) {
    if (!config.left_entity) {
      throw new Error("Please define left_entity");
    }
    if (!config.input_datetime) {
      throw new Error("Please define input_datetime entity");
    }
    this._config = config;
  }

  private _formatTime(datetimeState: any): string {
    if (!datetimeState || !datetimeState.attributes) {
      return "";
    }
    if (datetimeState.attributes.has_time) {
      const hours = datetimeState.attributes.hour.toString().padStart(2, "0");
      const minutes = datetimeState.attributes.minute.toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    }
    return "";
  }

  private _handleTimeChange(event: Event) {
    if (!this._config.input_datetime || !this.hass) return;
    const time = (event.target as HTMLInputElement).value;
    if (!time) return;
    this.hass.callService("input_datetime", "set_datetime", {
      entity_id: this._config.input_datetime,
      time: time,
    });
    ServiceUtils.fireEvent(this, "haptic", "light");
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) {
      return html``;
    }

    const leftEntityState = this.hass.states[this._config.left_entity];
    const datetimeState = this.hass.states[this._config.input_datetime];

    if (!leftEntityState || !datetimeState) {
      return html`<div class="error">One or more entities not found. Please check your configuration.</div>`;
    }

    const leftActive = EntityUtils.isEntityActive(leftEntityState);
    const rightEntityState = this._config.right_entity ? this.hass.states[this._config.right_entity] : null;
    const rightActive = rightEntityState ? EntityUtils.isEntityActive(rightEntityState) : false;
    const formattedTime = this._formatTime(datetimeState);

    return html`
      <style>
        ${sharedStyles}
        ${alarmCardStyles}
      </style>
      
      <div class="card-container">
        <div class="card-header">
          <card-header .hass=${this.hass} .title=${this._config.title} .subtitle=${this._config.subtitle}></card-header>
        </div>
        
        <div class="alarm-card-container">
          <base-button
            .icon=${this._config.icon_left || "mdi:alarm"}
            .active=${leftActive}
            .name=${this._config.left_name || ""}
            .entity=${this._config.left_entity}
            @button-click=${() => ServiceUtils.toggleEntity(this.hass, this._config.left_entity)}
            @button-right-click=${() => ServiceUtils.showMoreInfo(this, this._config.left_entity)}
            @button-long-press=${() => ServiceUtils.showMoreInfo(this, this._config.left_entity)}
          >
            <span slot="status" class="alarm-status">${leftActive ? "on" : "off"}</span>
          </base-button>
          
          <div class="time-display">
            <div class="time-input-container">
              <input
                type="time"
                class="time-input"
                .value=${formattedTime}
                @change=${this._handleTimeChange}
                @blur=${this._handleTimeChange}
              >
            </div>
            <div class="time-label">${this._config.time_label || "Alarm Time"}</div>
          </div>
          
          <base-button
            .icon=${this._config.icon_right || "mdi:cog"}
            .name=${this._config.right_name || ""}
            .active=${rightActive}
            ?disabled=${!this._config.right_entity}
            .entity=${this._config.right_entity || ""}
            @button-click=${() => {
              if (this._config.right_entity) ServiceUtils.toggleEntity(this.hass, this._config.right_entity);
            }}
            @button-right-click=${() => {
              if (this._config.right_entity) ServiceUtils.showMoreInfo(this, this._config.right_entity);
            }}
            @button-long-press=${() => {
              if (this._config.right_entity) ServiceUtils.showMoreInfo(this, this._config.right_entity);
            }}
          >
            ${this._config.right_entity
              ? html`<span slot="status" class="alarm-status">${rightActive ? "on" : "off"}</span>`
              : html`<span slot="status" class="alarm-status">No entity</span>`
            }
          </base-button>
        </div>
      </div>
    `;
  }
}

customElements.define("alarm-card", AlarmCard);