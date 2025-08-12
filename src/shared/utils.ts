import { HomeAssistant } from "custom-card-helpers";

export const ServiceUtils = {
  toggleEntity: (hass: HomeAssistant, entityId: string) => {
    hass.callService("homeassistant", "toggle", { entity_id: entityId });
  },

  setBrightness: (hass: HomeAssistant, entityId: string, brightness: number) => {
    hass.callService("light", "turn_on", {
      entity_id: entityId,
      brightness_pct: brightness,
    });
  },

  setColorTemp: (hass: HomeAssistant, entityId: string, temp: number) => {
    hass.callService("light", "turn_on", {
      entity_id: entityId,
      color_temp: temp,
    });
  },

  setInputDatetime: (hass: HomeAssistant, entityId: string, time: string) => {
    hass.callService("input_datetime", "set_datetime", {
      entity_id: entityId,
      time: time,
    });
  },

  fireEvent: (node: HTMLElement, type: string, detail?: any, options?: any) => {
    options = options || {};
    detail = detail === null || detail === undefined ? {} : detail;
    const event = new CustomEvent(type, {
      detail: detail,
      bubbles: options.bubbles === undefined ? true : options.bubbles,
      cancelable: Boolean(options.cancelable),
      composed: options.composed === undefined ? true : options.composed,
    });
    node.dispatchEvent(event);
    return event;
  },

  showMoreInfo: (card: HTMLElement, entityId: string) => {
    ServiceUtils.fireEvent(card, "hass-more-info", { entityId });
  },
};

export const EntityUtils = {
  isEntityActive: (state: any) => {
    return state.state === "on" || state.state === "playing";
  },

  getEntityIcon: (entityId: string, state: any, customIcon?: string) => {
    if (customIcon) return customIcon;
    if (state.attributes.icon) return state.attributes.icon;
    if (entityId.startsWith("light.")) return "mdi:lightbulb";
    if (entityId.startsWith("switch.")) return "mdi:power";
    if (entityId.startsWith("media_player.")) return "mdi:cast";
    return "mdi:power";
  },
};