
import { HomeAssistant } from "custom-card-helpers";
import { BaseCard } from "../shared/base-card";
import { ServiceUtils } from "../shared/utils";
import "../shared/base-button";

class MediaPlayerCard extends BaseCard {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

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
    if (!config.entity.startsWith("media_player.")) {
      console.warn(`Entity ${config.entity} might not be a media player entity`);
    }
    super.setConfig(config);
  }

  private _handleMediaCommand(command: string, ev: Event) {
    ev.stopPropagation();
    const entityId = this._config.entity;
    if (!entityId || !this._hass) return;

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
    this._hass.callService(domain, service, serviceData);
    ServiceUtils.fireEvent(this, "haptic", "light");
  }

  private _handleSourceChange(entityId: string, ev: Event) {
    ev.stopPropagation();
    const source = (ev.target as HTMLSelectElement).value;
    if (source && this._hass) {
      this._hass.callService("media_player", "select_source", {
        entity_id: entityId,
        source: source,
      });
    }
  }

  private _handleToggle(ev: Event) {
    ev.stopPropagation();
    ServiceUtils.toggleEntity(this._hass, this._config.entity);
  }

  private _handleMoreInfo(ev: Event) {
    ev.stopPropagation();
    ServiceUtils.showMoreInfo(this, this._config.entity);
  }

  protected render() {
    if (!this._hass || !this._config) {
      return;
    }

    const entityId = this._config.entity;
    const state = this._hass.states[entityId];

    if (!state) {
      this.shadowRoot.innerHTML = `
        <style>
          @import "/local/neumorphism-cards/styles/shared.css";
          @import "/local/neumorphism-cards/styles/media-player.css";
        </style>
        <div class="card-container">
          <div class="error">Media player entity not found: ${entityId}</div>
        </div>
      `;
      return;
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

    const title = this._config.title ? `<h1>${this._config.title}</h1>` : "";
    const subtitle = this._config.subtitle ? `<p>${this._config.subtitle}</p>` : "";

    this.shadowRoot.innerHTML = `
      <style>
        @import "/local/neumorphism-cards/styles/shared.css";
        @import "/local/neumorphism-cards/styles/media-player.css";
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
                  <select class="custom-selector" .entity=${entityId} @change=${(e) => this._handleSourceChange(entityId, e)}>
                    ${sourceList
                      .map((source) => `<option value="${source}" ${source === currentSource ? "selected" : ""}>${source}</option>`)
                      .join("")}
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
                  <button class="control-button" @click=${(e) => this._handleMediaCommand("previous", e)}><ha-icon icon="mdi:skip-previous"></ha-icon></button>
                  <button class="control-button" @click=${(e) => this._handleMediaCommand("play_pause", e)}><ha-icon icon="${state.state === "playing" ? "mdi:pause" : "mdi:play"}"></ha-icon></button>
                  <button class="control-button" @click=${(e) => this._handleMediaCommand("next", e)}><ha-icon icon="mdi:skip-next"></ha-icon></button>
                </div>
                
                <div class="media-control-buttons">
                  <button class="control-button" @click=${(e) => this._handleMediaCommand("volume_down", e)}><ha-icon icon="mdi:volume-minus"></ha-icon></button>
                  <button class="control-button" @click=${(e) => this._handleMediaCommand(state.attributes.is_volume_muted ? "volume_unmute" : "volume_mute", e)}><ha-icon icon="${state.attributes.is_volume_muted ? "mdi:volume-off" : "mdi:volume-high"}"></ha-icon></button>
                  <button class="control-button" @click=${(e) => this._handleMediaCommand("volume_up", e)}><ha-icon icon="mdi:volume-plus"></ha-icon></button>
                </div>
                
                ${isTvRemote
                  ? `
                <div class="grid-buttons">
                  <button class="control-button" @click=${(e) => this._handleMediaCommand("back", e)}><ha-icon icon="mdi:keyboard-return"></ha-icon></button>
                  <button class="control-button" @click=${(e) => this._handleMediaCommand("up", e)}><ha-icon icon="mdi:chevron-up"></ha-icon></button>
                  <button class="control-button" @click=${(e) => this._handleMediaCommand("home", e)}><ha-icon icon="mdi:home"></ha-icon></button>
                  <button class="control-button" @click=${(e) => this._handleMediaCommand("left", e)}><ha-icon icon="mdi:chevron-left"></ha-icon></button>
                  <button class="control-button" @click=${(e) => this._handleMediaCommand("enter", e)}><ha-icon icon="mdi:checkbox-blank-circle"></ha-icon></button>
                  <button class="control-button" @click=${(e) => this._handleMediaCommand("right", e)}><ha-icon icon="mdi:chevron-right"></ha-icon></button>
                  <div></div>
                  <button class="control-button" @click=${(e) => this._handleMediaCommand("down", e)}><ha-icon icon="mdi:chevron-down"></ha-icon></button>
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
