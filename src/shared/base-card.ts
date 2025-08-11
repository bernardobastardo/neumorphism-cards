import { HomeAssistant } from "custom-card-helpers";

export class BaseCard extends HTMLElement {
  protected _hass: HomeAssistant;
  protected _config: any;

  setConfig(config: any): void {
    this._config = config;
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    this.render();
  }

  protected render(): void {
    // This method should be implemented by the subclasses
  }
}
