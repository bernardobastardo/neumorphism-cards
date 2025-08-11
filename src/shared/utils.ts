import { HomeAssistant } from "custom-card-helpers";

export const EntityUtils = {
  isEntityActive: function (state: any): boolean {
    if (!state) return false;
    return ["on", "open", "unlocked", "active", "home", "playing"].includes(
      state.state.toLowerCase()
    );
  },

  getEntityIcon: function (entity: string, state: any, customIcon?: string): string {
    if (customIcon) return customIcon;
    if (!state) return "mdi:alert";

    const isOn = this.isEntityActive(state);
    const domain = entity.split(".")[0];

    switch (domain) {
      case "light":
        return isOn ? "mdi:lightbulb" : "mdi:lightbulb-outline";
      case "switch":
        return isOn ? "mdi:toggle-switch" : "mdi:toggle-switch-off-outline";
      case "cover":
        return isOn ? "mdi:window-shutter-open" : "mdi:window-shutter";
      case "climate":
        return "mdi:thermostat";
      case "fan":
        return isOn ? "mdi:fan" : "mdi:fan-off";
      case "media_player":
        return isOn ? "mdi:cast-connected" : "mdi:cast";
      default:
        return isOn ? "mdi:flash" : "mdi:flash-outline";
    }
  },
};

export const ServiceUtils = {
  toggleEntity: function (hass: HomeAssistant, entityId: string): void {
    if (!hass || !entityId) return;

    const state = hass.states[entityId];
    if (!state) return;

    const domain = entityId.split(".")[0];

    if (domain === "lock") {
      const service = state.state === "locked" ? "unlock" : "lock";
      hass.callService(domain, service, { entity_id: entityId });
    } else if (domain === "cover") {
      const service = state.state === "open" ? "close_cover" : "open_cover";
      hass.callService(domain, service, { entity_id: entityId });
    } else {
      hass.callService(domain, "toggle", { entity_id: entityId });
    }
  },

  setBrightness: function (hass: HomeAssistant, entityId: string, brightness: number): void {
    if (!hass || !entityId) return;

    hass.callService("light", "turn_on", {
      entity_id: entityId,
      brightness: Math.round(brightness * 2.55),
    });
  },

  setColorTemp: function (hass: HomeAssistant, entityId: string, temp: number): void {
    if (!hass || !entityId) return;

    const minTemp = 2000;
    const maxTemp = 6500;
    const range = maxTemp - minTemp;

    const value = 100 - temp;
    const colorTemp = Math.round(minTemp + (value / 100) * range);

    hass.callService("light", "turn_on", {
      entity_id: entityId,
      kelvin: colorTemp,
    });
  },

  fireEvent: function (node: HTMLElement, type: string, detail: any = {}, options: any = {}): void {
    const event = new CustomEvent(type, {
      bubbles: options.bubbles === undefined ? true : options.bubbles,
      cancelable: Boolean(options.cancelable),
      composed: options.composed === undefined ? true : options.composed,
      detail,
    });
    node.dispatchEvent(event);
  },

  showMoreInfo: function (node: HTMLElement, entityId: string): void {
    const event = new CustomEvent("hass-more-info", {
      bubbles: true,
      composed: true,
      detail: { entityId },
    });
    node.dispatchEvent(event);
  },

  toggle: function (node: any, entityId: string): void {
    const domain = entityId.split(".")[0];
    node._hass.callService(domain, "toggle", { entity_id: entityId });
  },
};