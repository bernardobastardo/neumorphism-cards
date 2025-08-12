import { HomeAssistant } from "custom-card-helpers";
import { LitElement, html, TemplateResult } from "lit";
import { property } from "lit/decorators.js";

export class BaseCard extends LitElement {
  @property({ attribute: false })
  public hass!: HomeAssistant;

  protected _config: any;

  public setConfig(config: any): void {
    this._config = config;
  }

  protected render(): TemplateResult {
    return html``;
  }
}
