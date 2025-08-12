import { LitElement, html, TemplateResult, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { HomeAssistant } from "custom-card-helpers";
import { UnsubscribeFunc } from "home-assistant-js-websocket";
import { subscribeRenderTemplate, RenderTemplateResult } from "../helpers/subscribe-render-template";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

@customElement("base-markdown-card")
export class BaseMarkdownCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() public content: string = "";

  @state() private _renderedContent: string = "";
  private _unsub?: UnsubscribeFunc;

  public connectedCallback(): void {
    super.connectedCallback();
    this._subscribe();
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._unsub) {
      this._unsub();
      this._unsub = undefined;
    }
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (changedProps.has("content") || changedProps.has("hass")) {
      this._subscribe();
    }
  }

  private async _subscribe(): Promise<void> {
    if (!this.hass || !this.content) {
      this._renderedContent = "";
      return;
    }

    if (this._unsub) {
      this._unsub();
      this._unsub = undefined;
    }

    try {
      this._unsub = await subscribeRenderTemplate(
        this.hass,
        (result: RenderTemplateResult) => {
          this._renderedContent = result.result;
          this.requestUpdate();
        },
        {
          template: this.content,
          entity_ids: [], // Let HA figure out the entities
          variables: {},
        }
      );
    } catch (e) {
      this._renderedContent = `<div class="error">Error in template: ${this.content}</div>`;
      console.error(e);
    }
  }

  protected render(): TemplateResult {
    if (!this._renderedContent) {
      return html``;
    }
    return html`${unsafeHTML(this._renderedContent)}`;
  }

  protected createRenderRoot(): HTMLElement {
    return this;
  }
}
