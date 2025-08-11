#!/bin/bash

mkdir -p /config/www
# Clone lovelace-card-mod if it doesn't already exist
if [ ! -d "/config/www/lovelace-card-mod" ]; then
  git clone https://github.com/thomasloven/lovelace-card-mod /config/www/lovelace-card-mod
fi

# Execute the Home Assistant application
python3 -m homeassistant --config /config "$@"

