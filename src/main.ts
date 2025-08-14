console.info("%c NEUMORPHISM-CARDS LOADED ", "color: white; background: #03a9f4; font-weight: 700;");

import "./cards/entity-button/entity-button-card";
import "./cards/light-control/light-control-card";
import "./cards/window/window-card";
import "./cards/alarm/alarm-card";
import "./cards/media-player/media-player-card";
import "./cards/header/header-card";

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push(
  {
    type: "entity-button-card",
    name: "Neumorphism Entity Button Card",
    preview: true,
    description: "A card with buttons for entities.",
  },
  {
    type: "neumorphism-header-card",
    name: "Neumorphism Header Card",
    preview: true,
    description: "A simple header card.",
  },
  {
    type: "light-control-card",
    name: "Neumorphism Light Control Card",
    preview: true,
    description: "A card to control lights with sliders.",
  },
  {
    type: "window-card",
    name: "Neumorphism Window Card",
    preview: true,
    description: "A card to control blinds and shutters.",
  },
  {
    type: "alarm-card",
    name: "Neumorphism Alarm Card",
    preview: true,
    description: "A card to set an alarm time.",
  },
  {
    type: "media-player-card",
    name: "Neumorphism Media Player Card",
    preview: true,
    description: "A card to control a media player.",
  }
);
