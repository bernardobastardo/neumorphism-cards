import { LitElement, html, TemplateResult, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  HomeAssistant,
  LovelaceCardEditor,
  fireEvent,
} from "custom-card-helpers";
import { assert } from "superstruct";
import { cardConfigStruct } from "../shared/config-structs";

const cardSchema = [
  { name: "title", selector: { text: {} } },
  { name: "subtitle", selector: { text: {} } },
];

const entitySchema = [
  { name: "entity", selector: { entity: {} } },
  {
    type: "grid",
    schema: [
      { name: "icon", selector: { icon: {} } },
      { name: "name", selector: { text: {} } },
    ],
  },
  { name: "description", selector: { text: {} } },
  {
    type: "grid",
    schema: [
      {
        name: "buttonSize",
        selector: {
          select: {
            options: [
              { value: "big", label: "Big" },
              { value: "small", label: "Small" },
            ],
          },
        },
      },
      {
        name: "size",
        selector: {
          select: {
            options: [
              { value: "full", label: "Full width" },
              { value: "half", label: "Half width" },
            ],
          },
        },
      },
    ],
  },
];

@customElement("neumorphism-entity-button-card-editor")
export class EntityButtonCardEditor
  extends LitElement
  implements LovelaceCardEditor
{
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: Record<string, any>;
  @state() private _selectedTab = 0;

  public setConfig(config: Record<string, any>): void {
    assert(config, cardConfigStruct);
    this._config = config;
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) {
      return html``;
    }

    const entities = this._config.entities || [];

    return html`
      <ha-card>
        <div class="card-content">
          <ha-form
            .hass=${this.hass}
            .data=${this._config}
            .schema=${cardSchema}
            .computeLabel=${this._computeLabel}
            @value-changed=${this._valueChanged}
          ></ha-form>
          <div class="tab-bar">
            <sl-tab-group @sl-tab-show=${this._handleTabSelected}>
              ${entities.map(
                (entityConf: any, i: number) =>
                  html`<sl-tab
                    slot="nav"
                    .panel=${String(i)}
                    ?active=${this._selectedTab === i}
                  >
                    ${entityConf.name || `Entity ${i + 1}`}
                  </sl-tab>`
              )}
            </sl-tab-group>
            <ha-icon-button class="add-btn" @click=${this._addEntity}>
              <ha-icon icon="mdi:plus"></ha-icon>
            </ha-icon-button>
          </div>
          ${entities.length > 0 ? this._renderEntityEditor() : ""}
        </div>
      </ha-card>
    `;
  }

  private _renderEntityEditor(): TemplateResult {
    if (!this._config) return html``;
    const entities = this._config.entities || [];
    const entityConf = entities[this._selectedTab];

    return html`
      <div class="tab-content">
        <div class="toolbar">
          <div class="actions">
            <ha-icon-button
              @click=${() => this._moveEntity(-1)}
              .disabled=${this._selectedTab === 0}
            >
              <ha-icon icon="mdi:arrow-left"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              @click=${() => this._moveEntity(1)}
              .disabled=${this._selectedTab === entities.length - 1}
            >
              <ha-icon icon="mdi:arrow-right"></ha-icon>
            </ha-icon-button>
            <ha-icon-button @click=${this._duplicateEntity}>
              <ha-icon icon="mdi:content-duplicate"></ha-icon>
            </ha-icon-button>
            <ha-icon-button @click=${this._removeEntity}>
              <ha-icon icon="mdi:delete"></ha-icon>
            </ha-icon-button>
          </div>
        </div>
        <ha-form
          .hass=${this.hass}
          .data=${entityConf}
          .schema=${entitySchema}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._entityValueChanged}
        ></ha-form>
      </div>
    `;
  }

  private _handleTabSelected(ev: CustomEvent): void {
    this._selectedTab = Number(ev.detail.name);
  }

  private _valueChanged(ev: CustomEvent): void {
    const newConfig = { ...this._config, ...ev.detail.value };
    fireEvent(this, "config-changed", { config: newConfig });
  }

  private _entityValueChanged(ev: CustomEvent): void {
    if (!this._config || !this.hass) return;
    const entities = [...this._config.entities];
    entities[this._selectedTab] = ev.detail.value;
    const newConfig = { ...this._config, entities };
    fireEvent(this, "config-changed", { config: newConfig });
  }

  private _addEntity(): void {
    if (!this._config || !this.hass) return;
    const entities = [
      ...this._config.entities,
      { entity: "", name: "", icon: "", description: "", buttonSize: "big", size: "full" },
    ];
    const newConfig = { ...this._config, entities };
    this._selectedTab = entities.length - 1;
    fireEvent(this, "config-changed", { config: newConfig });
  }

  private _removeEntity(): void {
    if (!this._config || !this.hass) return;
    const entities = [...this._config.entities];
    entities.splice(this._selectedTab, 1);
    if (this._selectedTab >= entities.length) {
      this._selectedTab = entities.length - 1;
    }
    const newConfig = { ...this._config, entities };
    fireEvent(this, "config-changed", { config: newConfig });
  }

  private _duplicateEntity(): void {
    if (!this._config || !this.hass) return;
    const entityConf = this._config.entities[this._selectedTab];
    const newEntityConf = JSON.parse(JSON.stringify(entityConf));
    const entities = [...this._config.entities, newEntityConf];
    this._selectedTab = entities.length - 1;
    const newConfig = { ...this._config, entities };
    fireEvent(this, "config-changed", { config: newConfig });
  }

  private _moveEntity(direction: number): void {
    if (!this._config || !this.hass) return;
    const entities = [...this._config.entities];
    const source = this._selectedTab;
    const target = source + direction;
    const item = entities.splice(source, 1)[0];
    entities.splice(target, 0, item);
    this._selectedTab = target;
    const newConfig = { ...this._config, entities };
    fireEvent(this, "config-changed", { config: newConfig });
  }

  private _computeLabel(schema: any) {
    return schema.name;
  }

  static styles = css`
    .card-content {
      padding: 16px;
    }
    .tab-bar {
      display: flex;
      align-items: center;
    }
    sl-tab-group {
      flex-grow: 1;
    }
    .add-btn {
      color: var(--secondary-text-color);
    }
    .tab-content {
      border-top: 1px solid var(--divider-color);
      margin-top: 6px;
      padding-top: 6px;
    }
    .toolbar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }
    .actions {
      display: flex;
      align-items: center;
    }
    ha-icon-button {
      color: var(--secondary-text-color);
    }
  `;
}