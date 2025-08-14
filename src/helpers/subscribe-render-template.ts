import { HomeAssistant } from "custom-card-helpers";
import { UnsubscribeFunc } from "home-assistant-js-websocket";

export interface RenderTemplateResult {
  result: string;
  listeners: {
    all: boolean;
    domains: string[];
    entities: string[];
    time: boolean;
  };
}

export interface Template {
  template: string;
  entity_ids?: string[];
  variables?: Record<string, any>;
}

const subscribeRenderTemplate = (
  hass: HomeAssistant,
  onChange: (result: RenderTemplateResult) => void,
  params: Template
): Promise<UnsubscribeFunc> =>
  hass.connection.subscribeMessage(onChange, {
    type: "render_template",
    ...params,
  });

export { subscribeRenderTemplate };
