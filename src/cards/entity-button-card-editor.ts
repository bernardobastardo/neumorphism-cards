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

@customElement("neumorphism-entity-button-card-editor")
export class EntityButtonCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: Record<string, any>;
  @state() private _selectedTab = 0;
  @state() private _yamlTabs = new Set<number>();

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
            @value-changed=${this._valueChanged}
          ></ha-form>
          <div class="tab-bar">
            <sl-tab-group @sl-tab-show=${this._handleTabSelected}>
              ${entities.map(
                (entityConf: any, i: number) =>
                  html`<sl-tab slot="nav" .panel=${String(i)} ?active=${
                    this._selectedTab === i
                  }>
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
    const isYaml = this._yamlTabs.has(this._selectedTab);

    return html`
      <div class="tab-content">
        <div class="toolbar">
          <ha-icon-button
            @click=${this._toggleYaml}
            class=${isYaml ? "active" : ""}
          >
            <ha-icon icon="mdi:code-braces"></ha-icon>
          </ha-icon-button>
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
        ${isYaml
          ? html`<ha-yaml-editor
              .defaultValue=${entityConf}
              @value-changed=${this._entityYamlChanged}
            ></ha-yaml-editor>`
          : this._renderManualForm(entityConf)}
      </div>
    `;
  }

  private _renderManualForm(entityConf: any): TemplateResult {
    const entityIds = this.hass ? Object.keys(this.hass.states) : [];
    return html`
      <div class="form-container">
        <ha-combo-box
          .hass=${this.hass}
          .value=${entityConf.entity}
          .label="Entity"
          .items=${entityIds}
          .configValue=${"entity"}
          @value-changed=${this._entityAttributeChanged}
          allow-custom-entity
        ></ha-combo-box>
        <ha-textfield
          .value=${entityConf.name || ""}
          .label="Name"
          .configValue=${"name"}
          @input=${this._entityAttributeChanged}
        ></ha-textfield>
        <ha-icon-picker
          .value=${entityConf.icon || ""}
          .label="Icon"
          .configValue=${"icon"}
          @value-changed=${this._entityAttributeChanged}
        ></ha-icon-picker>
        <ha-textfield
          .value=${entityConf.description || ""}
          .label="Description"
          .configValue=${"description"}
          @input=${this._entityAttributeChanged}
        ></ha-textfield>
        <ha-select
          .label=${"Button Size"}
          .value=${entityConf.buttonSize || "big"}
          .configValue=${"buttonSize"}
          @selected=${this._entityAttributeChanged}
          @closed=${(e: Event) => e.stopPropagation()}
        >
          <mwc-list-item value="big">Big</mwc-list-item>
          <mwc-list-item value="small">Small</mwc-list-item>
        </ha-select>
        <ha-select
          .label=${"Row Size"}
          .value=${entityConf.size || "full"}
          .configValue=${"size"}
          @selected=${this._entityAttributeChanged}
          @closed=${(e: Event) => e.stopPropagation()}
        >
          <mwc-list-item value="full">Full width</mwc-list-item>
          <mwc-list-item value="half">Half width</mwc-list-item>
        </ha-select>
      </div>
    `;
  }

  private _toggleYaml(): void {
    if (this._yamlTabs.has(this._selectedTab)) {
      this._yamlTabs.delete(this._selectedTab);
    } else {
      this._yamlTabs.add(this._selectedTab);
    }
    this.requestUpdate();
  }

  private _handleTabSelected(ev: CustomEvent): void {
    this._selectedTab = Number(ev.detail.name);
  }

  private _valueChanged(ev: CustomEvent): void {
    const newConfig = { ...this._config, ...ev.detail.value };
    fireEvent(this, "config-changed", { config: newConfig });
  }

  private _entityAttributeChanged(ev: CustomEvent): void {
    if (!this._config || !this.hass) return;

    const target = ev.target as any;
    const attribute = target.configValue;
    const value = ev.detail?.value ?? target.value;

    const entities = [...this._config.entities];
    let entityConf = { ...entities[this._selectedTab] };

    entityConf[attribute] = value;
    entities[this._selectedTab] = entityConf;

    const newConfig = { ...this._config, entities };
    fireEvent(this, "config-changed", { config: newConfig });
  }

  private _entityYamlChanged(ev: CustomEvent): void {
    if (!this._config || !this.hass || !ev.detail.isValid) return;
    const entities = [...this._config.entities];
    entities[this._selectedTab] = ev.detail.value;
    const newConfig = { ...this._config, entities };
    fireEvent(this, "config-changed", { config: newConfig });
  }

  private _addEntity(): void {
    if (!this._config || !this.hass) return;
    const entities = [
      ...this._config.entities,
      {
        entity: "",
        name: "",
        icon: "",
        description: "",
        buttonSize: "big",
        size: "full",
      },
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

  static styles = css`
    ha-card {
      overflow: hidden;
    }
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
      justify-content: space-between;
      align-items: center;
    }
    .actions {
      display: flex;
      align-items: center;
    }
    ha-icon-button {
      color: var(--secondary-text-color);
    }
    ha-icon-button.active {
      color: var(--primary-color);
    }
    .form-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-gap: 16px;
      padding-top: 8px;
    }
    ha-combo-box,
    ha-textfield[label="Description"] {
      grid-column: span 2;
    }
  `;
}
