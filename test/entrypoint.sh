#!/bin/bash

source ./.env

function ensure_hass_config() {
    hass --script ensure_config -c /config
}

function create_hass_user() {
    local username=${HASS_USERNAME:-dev}
    local password=${HASS_PASSWORD:-dev}
    echo "Creating Home Assistant User ${username}:${password}"
    hass --script auth -c /config add ${username} ${password}
}

function bypass_onboarding() {
    cat > /config/.storage/onboarding << EOF
{
    "data": {
        "done": [
            "user",
            "core_config",
            "integration"
        ]
    },
    "key": "onboarding",
    "version": 3
}
EOF
}

function install_lovelace_plugins() {
  mkdir -p /config/www
  # Clone lovelace-card-mod if it doesn't already exist
  if [ ! -d "/config/www/lovelace-card-mod" ]; then
    git clone https://github.com/thomasloven/lovelace-card-mod /config/www/lovelace-card-mod
  fi
  if [ ! -d "/config/www/lovelace-layout-card" ]; then
    git clone https://github.com/thomasloven/lovelace-layout-card /config/www/lovelace-layout-card
  fi
}

function setup() {
    ensure_hass_config
    create_hass_user
    bypass_onboarding
    install_lovelace_plugins
}

setup

# Execute the Home Assistant application
python3 -m homeassistant --config /config "$@"

