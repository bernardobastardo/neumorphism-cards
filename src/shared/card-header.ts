import { LitElement, html, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { HomeAssistant } from "custom-card-helpers";
import "./base-markdown-card";

@customElement("card-header")
export class CardHeader extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() public title: string = "";
  @property() public subtitle: string = "";

  protected render(): TemplateResult {
    if (!this.title && !this.subtitle) {
      return html``;
    }

    const titleContent = this.title
      ? html`<div class="title"><base-markdown-card .hass=${this.hass} .content="${this.title}"></base-markdown-card></div>`
      : "";
    const subtitleContent = this.subtitle
      ? html`<div class="subtitle"><base-markdown-card .hass=${this.hass} .content="${this.subtitle}"></base-markdown-card></div>`
      : "";

    return html`
      <style>
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
      ${titleContent}
      ${subtitleContent}
    `;
  }

  protected createRenderRoot(): HTMLElement {
    return this;
  }
}
