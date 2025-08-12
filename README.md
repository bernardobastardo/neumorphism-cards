# Neumorphism Cards for Home Assistant

A collection of neumorphic-designed cards for Home Assistant's Lovelace UI.

## Screenshots

<!--
  ADD SCREENSHOTS HERE
  For example:
  ![Light Control Card](https://example.com/light-control-card.png)
-->

## Installation

This repository contains both the Neumorphism cards and a matching theme.

### HACS (Recommended)

1.  This repository is available in [HACS](https://hacs.xyz/) (Home Assistant Community Store).
2.  Search for "Neumorphism" and click `Install`. HACS will install both the cards and the theme.
3.  **Card Installation:** Add the following to your Lovelace resources:
    ```yaml
    lovelace:
      resources:
        - url: /hacsfiles/neumorphism-cards/dist/neumorphism-cards.js
          type: module
    ```
4.  **Theme Installation:** After restarting Home Assistant, enable the theme by navigating to your **Profile > Theme** and selecting `Neumorphism`.

### Manual Installation

1.  **Cards:** Download `neumorphism-cards.js` from the `dist/` folder in the [latest release](https://github.com/your-username/your-repo-name/releases).
2.  Copy the file to your `www/community/neumorphism-cards` directory.
3.  **Theme:** Download `neumorphism.yaml` from the `themes/` folder in the [latest release](https://github.com/your-username/your-repo-name/releases).
4.  Copy the file to your `themes` directory.
5.  Add the following to your `configuration.yaml`:
    ```yaml
    frontend:
      themes: !include_dir_merge_named themes
    ```
6.  Add the card resources to your Lovelace configuration:
    ```yaml
    resources:
      - url: /local/community/neumorphism-cards/neumorphism-cards.js
        type: module
    ```
7.  Restart Home Assistant and enable the theme in your profile.

## Development

To get started with development:

1.  Clone this repository.
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run watch
    ```
    This will automatically recompile the `neumorphism-cards.js` file when you make changes to the source code.

## Available Cards

### Entity Button Card

A simple card with a button to toggle an entity.

**Options:**

| Name          | Type   | Description                               |
| ------------- | ------ | ----------------------------------------- |
| `entity`      | string | The entity ID to control.                 |
| `name`        | string | A custom name for the entity.             |
| `icon`        | string | A custom icon for the entity.             |
| `size`        | number | The size of the button (1 or 2).          |
| `buttonSize`  | string | The size of the button ('small' or 'big').|

**Example:**

```yaml
type: 'custom:entity-button-card'
title: 'Living Room'
entities:
  - entity: light.living_room
    name: 'Living Room Light'
  - entity: switch.living_room_fan
    name: 'Living Room Fan'
```

### Light Control Card

A card for controlling lights, with sliders for brightness and color temperature.

**Options:**

| Name       | Type    | Description                               |
| ---------- | ------- | ----------------------------------------- |
| `entities` | list    | A list of light entities to control.      |
| `title`    | string  | The title of the card.                    |
| `subtitle` | string  | The subtitle of the card.                 |

**Example:**

```yaml
type: 'custom:light-control-card'
title: 'Bedroom Lights'
entities:
  - light.bedroom_ceiling
  - light.bedroom_lamp
```

### Blind & Shutter Control Card

A card for controlling blinds and shutters with vertical sliders.

**Options:**

| Name           | Type   | Description                               |
| -------------- | ------ | ----------------------------------------- |
| `entity_pairs` | list   | A list of blind and shutter entity pairs. |
| `title`        | string | The title of the card.                    |
| `subtitle`     | string | The subtitle of the card.                 |

**Example:**

```yaml
type: 'custom:window-card'
title: 'Window Coverings'
entity_pairs:
  - name: 'Living Room'
    blind: cover.living_room_blind
    shutter: cover.living_room_shutter
```

### Alarm Card

A card for setting an alarm time and toggling an alarm entity.

**Options:**

| Name            | Type   | Description                               |
| --------------- | ------ | ----------------------------------------- |
| `left_entity`   | string | The entity to toggle with the left button.|
| `right_entity`  | string | The entity to toggle with the right button.|
| `input_datetime`| string | The `input_datetime` entity for the alarm.|
| `title`         | string | The title of the card.                    |
| `subtitle`      | string | The subtitle of the card.                 |

**Example:**

```yaml
type: 'custom:alarm-card'
title: 'Weekday Alarm'
left_entity: input_boolean.weekday_alarm
input_datetime: input_datetime.weekday_alarm_time
```

### Media Player Card

A card for controlling a media player.

**Options:**

| Name       | Type   | Description                               |
| ---------- | ------ | ----------------------------------------- |
| `entity`   | string | The media player entity to control.       |
| `title`    | string | The title of the card.                    |
| `subtitle` | string | The subtitle of the card.                 |

**Example:**

```yaml
type: 'custom:media-player-card'
title: 'Living Room TV'
entity: media_player.living_room_tv
```