import { html, TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { BaseCard } from "../shared/base-card";
import { ServiceUtils } from "../shared/utils";
import { sharedStyles } from "../styles/shared";
import { mediaPlayerStyles } from "../styles/media-player";
import "../shared/base-button";
import "../shared/card-header";

interface CardConfig {
  entity: string;
  title?: string;
  subtitle?: string;
}

class MediaPlayerCard extends BaseCard {
  @property() protected _config!: CardConfig;

  static getStubConfig() {
    return {
      entity: "media_player.demo_player",
      title: "Media Player Card",
    };
  }

  setConfig(config: CardConfig) {
    if (!config.entity) {
      throw new Error("Please define an entity");
    }
    this._config = config;
  }

  private _handlePlayPause() {
    this.hass.callService("media_player", "media_play_pause", { entity_id: this._config.entity });
  }

  private _handlePrevious() {
    this.hass.callService("media_player", "media_previous_track", { entity_id: this._config.entity });
  }

  private _handleNext() {
    this.hass.callService("media_player", "media_next_track", { entity_id: this._config.entity });
  }

  private _handleVolumeChange(e: any) {
    const volume = parseFloat(e.target.value);
    this.hass.callService("media_player", "volume_set", {
      entity_id: this._config.entity,
      volume_level: volume,
    });
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) {
      return html``;
    }

    const state = this.hass.states[this._config.entity];
    if (!state) {
      return html` <ha-card>Entity not found: ${this._config.entity}</ha-card> `;
    }

    const isPlaying = state.state === "playing";
    const artwork = state.attributes.entity_picture_local || state.attributes.entity_picture;
    const volume = state.attributes.volume_level || 0;

    return html`
      <style>
        ${sharedStyles}
        ${mediaPlayerStyles}
      </style>
      <div class="card-container">
        <card-header .hass=${this.hass} .title=${this._config.title} .subtitle=${this._config.subtitle}></card-header>
        <div class="artwork-container" style="background-image: url(${artwork})"></div>
        <div class="controls-container">
          <div class="track-info">
            <div class="track-title">${state.attributes.media_title || "Unknown Title"}</div>
            <div class="track-artist">${state.attributes.media_artist || "Unknown Artist"}</div>
          </div>
          <div class="media-controls">
            <base-button icon="mdi:skip-previous" @click=${this._handlePrevious}></base-button>
            <base-button .icon=${isPlaying ? "mdi:pause" : "mdi:play"} @click=${this._handlePlayPause}></base-button>
            <base-button icon="mdi:skip-next" @click=${this._handleNext}></base-button>
          </div>
          <div class="volume-container">
            <ha-icon icon="mdi:volume-low"></ha-icon>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              .value=${volume}
              @input=${this._handleVolumeChange}
              class="volume-slider"
            />
            <ha-icon icon="mdi:volume-high"></ha-icon>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("media-player-card", MediaPlayerCard);