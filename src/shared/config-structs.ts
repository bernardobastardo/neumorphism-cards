import { any, array, object, optional, string } from "superstruct";

export const entityConfigStruct = object({
  entity: string(),
  name: optional(string()),
  description: optional(string()),
  icon: optional(string()),
  size: optional(any()),
  buttonSize: optional(string()),
});

export const cardConfigStruct = object({
  type: string(),
  title: optional(string()),
  subtitle: optional(string()),
  entities: array(entityConfigStruct),
  view_layout: any(),
});
