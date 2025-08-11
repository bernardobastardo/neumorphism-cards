import { html, TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { HomeAssistant } from "custom-card-helpers";
import { BaseCard } from "../shared/base-card";
import { ServiceUtils } from "../shared/utils";
import "../shared/base-button";
import { sharedStyles } from "../styles/shared";
import { mediaPlayerStyles } from "../styles/media-player";

class MediaPlayerCard extends BaseCard {
  @property() protected _config: any;

  static getStubConfig() {
    return {
      entity: "media_player.demo_media_player",
      title: "Media Player Card",
    };
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("Please define a media_player entity");
    }
    this._config = config;
  }

  private _handleMediaCommand(command: string) {
    const entityId = this._config.entity;
    if (!entityId || !this.hass) return;

    const commandMap = {
      play: ["media_player", "media_play"],
      pause: ["media_player", "media_pause"],
      play_pause: ["media_player", "media_play_pause"],
      next: ["media_player", "media_next_track"],
      previous: ["media_player", "media_previous_track"],
      volume_up: ["media_player", "volume_up"],
      volume_down: ["media_player", "volume_down"],
      volume_mute: ["media_player", "volume_mute", { is_volume_muted: true }],
      volume_unmute: ["media_player", "volume_mute", { is_volume_muted: false }],
      up: ["remote", "send_command", { command: "UP" }],
      down: ["remote", "send_command", { command: "DOWN" }],
      left: ["remote", "send_command", { command: "LEFT" }],
      right: ["remote", "send_command", { command: "RIGHT" }],
      enter: ["remote", "send_command", { command: "SELECT" }],
      back: ["remote", "send_command", { command: "BACK" }],
      home: ["remote", "send_command", { command: "HOME" }],
    };

    const [domain, service, additionalData] = commandMap[command] || [];
    if (!domain || !service) {
      console.error(`Unknown command: ${command}`);
      return;
    }

    const serviceData = { entity_id: entityId, ...additionalData };
    this.hass.callService(domain, service, serviceData);
    ServiceUtils.fireEvent(this, "haptic", "light");
  }

  private _handleSourceChange(ev: Event) {
    const entityId = this._config.entity;
    const source = (ev.target as HTMLSelectElement).value;
    if (source && this.hass) {
      this.hass.callService("media_player", "select_source", {
        entity_id: entityId,
        source: source,
      });
    }
  }

  private _handleToggle() {
    ServiceUtils.toggleEntity(this.hass, this._config.entity);
  }

  private _handleMoreInfo() {
    ServiceUtils.showMoreInfo(this, this._config.entity);
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) {
      return html``;
    }

    const entityId = this._config.entity;
    const state = this.hass.states[entityId];

    if (!state) {
      return html`
        <style>
          ${sharedStyles}
          ${mediaPlayerStyles}
        </style>
        <div class="card-container">
          <div class="error">Media player entity not found: ${entityId}</div>
        </div>
      `;
    }

    const name = this._config.name || state.attributes.friendly_name || entityId.split(".")[1];
    const icon = this._config.icon || state.attributes.icon || "mdi:cast";
    const isOn = ["playing", "paused", "on", "idle"].includes(state.state);
    const mediaTitle = state.attributes.media_title || "";
    const mediaArtist = state.attributes.media_artist || "";
    const mediaSeries = state.attributes.media_series_title || "";
    let mediaInfo = "";
    if (mediaTitle) {
      mediaInfo += mediaTitle;
      if (mediaArtist) mediaInfo += ` - ${mediaArtist}`;
      if (mediaSeries && mediaSeries !== mediaTitle) mediaInfo += ` (${mediaSeries})`;
    } else {
      mediaInfo = state.state;
    }
    const isTvRemote = this._config.remote_type === "tv" || entityId.includes("tv") || state.attributes.device_class === "tv";
    const containerClass = isOn ? "expanded" : "collapsed";
    const currentSource = isOn ? state.attributes.source || "" : "";
    const sourceList = isOn && state.attributes.source_list ? state.attributes.source_list : [];

    const title = this._config.title ? html`<h1>${this._config.title}</h1>` : "";
    const subtitle = this._config.subtitle ? html`<p>${this._config.subtitle}</p>` : "";

    return html`
      <style>
        ${sharedStyles}
        ${mediaPlayerStyles}
      </style>
      
      <div class="card-container">
        <div class="card-header">
          ${title}
          ${subtitle}
        </div>
        
        <div class="media-card-container ${containerClass}">
          <div class="media-layout">
            <div class="left-side-content">
              <base-button
                .icon=${icon}
                .active=${isOn}
                .entity=${entityId}
                @button-click=${this._handleToggle}
                @button-long-press=${this._handleMoreInfo}
                @button-right-click=${this._handleMoreInfo}
              >
                <span slot="status" class="media-status">${isOn ? "" : state.state}</span>
              </base-button>
              
              <div class="tv-on-container ${isOn ? "" : "hidden"}">
                <div class="entity-info">
                  <div class="entity-name">${name}</div>
                  <div class="entity-description">${mediaInfo}</div>
                </div>
                
                <div class="custom-selector-container">
                  <div class="custom-label">Source</div>
                  <select class="custom-selector" .entity=${entityId} @change=${this._handleSourceChange}>
                    ${sourceList.map((source) => html`<option value="${source}" ?selected=${source === currentSource}>${source}</option>`)}
                  </select>
                </div>
              </div>
            </div>
            
            <div class="right-side-content">
              <div class="entity-info ${isOn ? "hidden" : ""}">
                <div class="entity-name">${name}</div>
                <div class="entity-description">${mediaInfo}</div>
              </div>
              
              <div class="controls-container ${isOn ? "visible" : ""}">
                <div class="media-control-buttons">
                  <button class="control-button" @click=${() => this._handleMediaCommand("previous")}><ha-icon icon="mdi:skip-previous"></ha-icon></button>
                  <button class="control-button" @click=${() => this._handleMediaCommand("play_pause")}><ha-icon icon="${state.state === "playing" ? "mdi:pause" : "mdi:play"}"></ha-icon></button>
                  <button class="control-button" @click=${() => this._handleMediaCommand("next")}><ha-icon icon="mdi:skip-next"></ha-icon></button>
                </div>
                
                <div class="media-control-buttons">
                  <button class="control-button" @click=${() => this._handleMediaCommand("volume_down")}><ha-icon icon="mdi:volume-minus"></ha-icon></button>
                  <button class="control-button" @click=${() => this._handleMediaCommand(state.attributes.is_volume_muted ? "volume_unmute" : "volume_mute")}><ha-icon icon="${state.attributes.is_volume_muted ? "mdi:volume-off" : "mdi:volume-high"}"></ha-icon></button>
                  <button class="control-button" @click=${() => this._handleMediaCommand("volume_up")}><ha-icon icon="mdi:volume-plus"></ha-icon></button>
                </div>
                
                ${isTvRemote
                  ? html`
                <div class="grid-buttons">
                  <button class="control-button" @click=${() => this._handleMediaCommand("back")}><ha-icon icon="mdi:keyboard-return"></ha-icon></button>
                  <button class="control-button" @click=${() => this._handleMediaCommand("up")}><ha-icon icon="mdi:chevron-up"></ha-icon></button>
                  <button class="control-button" @click=${() => this._handleMediaCommand("home")}><ha-icon icon="mdi:home"></ha-icon></button>
                  <button class="control-button" @click=${() => this._handleMediaCommand("left")}><ha-icon icon="mdi:chevron-left"></ha-icon></button>
                  <button class="control-button" @click=${() => this._handleMediaCommand("enter")}><ha-icon icon="mdi:checkbox-blank-circle"></ha-icon></button>
                  <button class="control-button" @click=${() => this._handleMediaCommand("right")}><ha-icon icon="mdi:chevron-right"></ha-icon></button>
                  <div></div>
                  <button class="control-button" @click=${() => this._handleMediaCommand("down")}><ha-icon icon="mdi:chevron-down"></ha-icon></button>
                  <div></div>
                </div>
                `
                  : ""}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("media-player-card", MediaPlayerCard);