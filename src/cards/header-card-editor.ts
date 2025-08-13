import { LitElement, html, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { HomeAssistant, LovelaceCardEditor, fireEvent } from "custom-card-helpers";
import { any, object, string } from "superstruct";

const cardConfigStruct = object({
  type: string(),
  title: string(),
  subtitle: string(),
  view_layout: any(),
});

@customElement("neumorphism-header-card-editor")
export class HeaderCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: Record<string, any>;

  public setConfig(config: Record<string, any>): void {
    this._config = config;
  }

  get _title(): string {
    return this._config?.title || "";
  }

  get _subtitle(): string {
    return this._config?.subtitle || "";
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) {
      return html``;
    }

    return html`
      <div class="card-config">
        <ha-textfield
          label="Title"
          .value=${this._title}
          .configValue=${"title"}
          @input=${this._valueChanged}
        ></ha-textfield>
        <ha-textfield
          label="Subtitle"
          .value=${this._subtitle}
          .configValue=${"subtitle"}
          @input=${this._valueChanged}
        ></ha-textfield>
      </div>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target as any;
    const newConfig = {
      ...this._config,
      [target.configValue]: target.value,
    };
    fireEvent(this, "config-changed", { config: newConfig });
  }
}
