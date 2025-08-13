import { html, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { BaseCard } from "../shared/base-card";
import { sharedStyles } from "../styles/shared";
import "../shared/card-header";

@customElement("neumorphism-header-card")
export class HeaderCard extends BaseCard {
  
  static getStubConfig() {
    return {
      title: "My Header",
      subtitle: "This is a subtitle",
    };
  }

  protected render(): TemplateResult {
    if (!this._config) {
      return html``;
    }

    return html`
      <style>
        ${sharedStyles}
      </style>
      <div class="card-container">
        <card-header .hass=${this.hass} .title=${this._config.title} .subtitle=${this._config.subtitle}></card-header>
      </div>
    `;
  }
}
