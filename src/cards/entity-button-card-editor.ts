import { LitElement, html, TemplateResult, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { HomeAssistant, LovelaceCardEditor, fireEvent } from "custom-card-helpers";
import { assert } from "superstruct";
import { cardConfigStruct } from "../shared/config-structs";

const cardSchema = [
  { name: "title", selector: { text: {} } },
  { name: "subtitle", selector: { text: {} } },
];

const entitySchema = [
  { name: "entity", required: true, selector: { entity: {} } },
  {
    type: "grid",
    schema: [
      { name: "name", selector: { text: {} } },
      { name: "icon", selector: { icon: {} } },
    ],
  },
  { name: "description", selector: { text: { multiline: true } } },
  {
    type: "grid",
    schema: [
      {
        name: "buttonSize",
        selector: { select: { mode: "dropdown", options: ["big", "small"] } },
      },
      {
        name: "size",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: 2, label: "Full width" },
              { value: 1, label: "Half width" },
            ],
          },
        },
      },
    ],
  },
];

@customElement("neumorphism-entity-button-card-editor")
export class EntityButtonCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: Record<string, any>;

  public setConfig(config: Record<string, any>): void {
    assert(config, cardConfigStruct);
    this._config = config;
  }

  private _computeLabel(schema: { name: string }) {
    return schema.name;
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) {
      return html``;
    }

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${cardSchema}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._valueChanged}
      ></ha-form>
      <h3>Entities</h3>
      ${this._config.entities.map((entityConf: any, index: number) => {
        return html`
          <div class="entity-editor">
            <div class="header">
              <ha-icon-button
                class="remove-icon"
                icon="mdi:close"
                @click=${() => this._removeEntity(index)}
              ></ha-icon-button>
            </div>
            <ha-form
              .hass=${this.hass}
              .data=${entityConf}
              .schema=${entitySchema}
              .computeLabel=${this._computeLabel}
              @value-changed=${(e: CustomEvent) => this._entityValueChanged(e, index)}
            ></ha-form>
          </div>
        `;
      })}
      <mwc-button @click=${this._addEntity}>Add Entity</mwc-button>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    const newConfig = { ...this._config, ...ev.detail.value };
    fireEvent(this, "config-changed", { config: newConfig });
  }

  private _entityValueChanged(ev: CustomEvent, index: number): void {
    if (!this._config || !this.hass) return;
    const entities = [...this._config.entities];
    entities[index] = ev.detail.value;
    const newConfig = { ...this._config, entities };
    fireEvent(this, "config-changed", { config: newConfig });
  }

  private _addEntity(): void {
    if (!this._config || !this.hass) return;
    const entities = [...this._config.entities, { entity: "" }];
    const newConfig = { ...this._config, entities };
    fireEvent(this, "config-changed", { config: newConfig });
  }

  private _removeEntity(index: number): void {
    if (!this._config || !this.hass) return;
    const entities = [...this._config.entities];
    entities.splice(index, 1);
    const newConfig = { ...this._config, entities };
    fireEvent(this, "config-changed", { config: newConfig });
  }

  static styles = css`
    .entity-editor {
      border: 1px solid var(--divider-color);
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .header {
      display: flex;
      justify-content: flex-end;
    }
    ha-icon-button {
      color: var(--primary-text-color);
    }
  `;
}
