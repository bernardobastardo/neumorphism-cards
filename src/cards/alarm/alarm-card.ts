import { html, TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { BaseCard } from "../../shared/base-card";
import { ServiceUtils } from "../../shared/utils";
import { sharedStyles } from "../../styles/shared";
import { alarmCardStyles } from "../../styles/alarm-card";
import "../../shared/base-button";
import "../../shared/card-header";

interface CardConfig {
  left_entity?: string;
  right_entity?: string;
  input_datetime: string;
  title?: string;
  subtitle?: string;
}

class AlarmCard extends BaseCard {
  @property() protected _config!: CardConfig;

  static getStubConfig() {
    return {
      input_datetime: "input_datetime.alarm_time",
      left_entity: "input_boolean.alarm_status",
      title: "Alarm Card",
    };
  }

  setConfig(config: CardConfig) {
    if (!config.input_datetime) {
      throw new Error("Please define an input_datetime entity");
    }
    this._config = config;
  }

  private _handleTimeChange(e: Event) {
    const time = (e.target as HTMLInputElement).value;
    ServiceUtils.setInputDatetime(this.hass, this._config.input_datetime, time);
  }

  private _handleToggle(entity: string) {
    ServiceUtils.toggleEntity(this.hass, entity);
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) {
      return html``;
    }

    const timeEntityState = this.hass.states[this._config.input_datetime];
    const timeValue = timeEntityState ? `${timeEntityState.attributes.hour}:${timeEntityState.attributes.minute}` : "00:00";

    const leftEntityState = this._config.left_entity ? this.hass.states[this._config.left_entity] : undefined;
    const rightEntityState = this._config.right_entity ? this.hass.states[this._config.right_entity] : undefined;

    return html`
      <style>
        ${sharedStyles}
        ${alarmCardStyles}
      </style>
      <div class="card-container">
        <card-header .hass=${this.hass} .title=${this._config.title} .subtitle=${this._config.subtitle}></card-header>
        <div class="alarm-content">
          <input type="time" class="time-input" .value=${timeValue} @change=${this._handleTimeChange} />
          <div class="button-row">
            ${leftEntityState
              ? html`
                  <base-button
                    .icon=${leftEntityState.attributes.icon || "mdi:bell"}
                    .active=${leftEntityState.state === "on"}
                    @click=${() => this._handleToggle(this._config.left_entity!)}
                  >
                    ${leftEntityState.attributes.friendly_name || this._config.left_entity}
                  </base-button>
                `
              : ""}
            ${rightEntityState
              ? html`
                  <base-button
                    .icon=${rightEntityState.attributes.icon || "mdi:bell-sleep"}
                    .active=${rightEntityState.state === "on"}
                    @click=${() => this._handleToggle(this._config.right_entity!)}
                  >
                    ${rightEntityState.attributes.friendly_name || this._config.right_entity}
                  </base-button>
                `
              : ""}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("alarm-card", AlarmCard);