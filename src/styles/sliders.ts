
import { css } from "lit";

export const sliderStyles = css`
  :host {
    display: block;
    width: 100%;
    --thumb-size: 14px;
    --track-height: 16px;
  }

  .slider-container {
    width: 100%;
    margin: 0;
    padding: 0;
  }

  .slider-container.vertical {
    height: 100%;
    width: var(--track-height);
    min-height: 150px;
    display: flex;
    flex-direction: column;
  }

  .slider-container.vertical .slider-wrapper {
    height: 100%;
    width: var(--track-height);
    flex: 1;
    position: relative;
  }

  .slider-container.vertical .slider-track {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    bottom: 0;
    left: 0;
    right: auto;
    border-radius: var(--ha-card-border-radius, 14px);
  }

  .slider-container.vertical .slider-fill {
    position: absolute;
    width: 100%;
    height: 0;
    top: 0;
    bottom: auto;
    left: 0;
    right: 0;
  }

  .slider-container.vertical input[type="range"] {
    transform: rotate(90deg);
    transform-origin: left bottom;
    width: 100%;
    height: 100%;
    -webkit-appearance: slider-vertical;
  }

  .slider-label {
    font-size: 0.75rem;
    color: var(--secondary-text-color);
    margin-bottom: 4px;
  }

  .slider-container.vertical .slider-label {
    writing-mode: vertical-lr;
    transform: rotate(180deg);
    margin-right: 4px;
    height: auto;
    line-height: normal;
    text-align: center;
    margin-bottom: 8px;
  }

  .slider-wrapper {
    position: relative;
    height: var(--track-height);
    width: 100%;
    touch-action: none;
  }

  .slider-track {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    background-color: var(--card-background-color, var(--ha-card-background, var(--card-background-color, white)));
    border-radius: var(--ha-card-border-radius, 14px);
    box-shadow: var(--ha-card-box-shadow, 0px 2px 2px -1px rgba(0, 0, 0, 0.2), 0px 2px 3px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12));
    overflow: hidden;
    cursor: pointer;
  }

  .slider-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background-color: rgba(var(--rgb-primary-text-color, 33, 150, 243), 0.2);
    pointer-events: none;
  }

  .is-pressing .slider-fill {
    transition: width 0.2s ease-out, height 0.2s ease-out;
  }

  .slider-thumb {
    position: absolute;
    top: 50%;
    left: 0;
    width: var(--thumb-size);
    height: var(--thumb-size);
    background-color: var(--primary-text-color, #03a9f4);
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    pointer-events: none;
    transform-origin: center;
    will-change: transform;
    z-index: 2;
  }

  .is-pressing .slider-thumb {
    transition: left 0.2s ease-out, top 0.2s ease-out;
  }

  .slider-container.vertical .slider-thumb {
    left: 50%;
    top: auto;
  }

  input[type="range"] {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
    z-index: 1;
  }

  .slider-track.active .slider-thumb {
    transform: scale(1.2);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.25);
  }

  .slider-track.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    .slider-container.vertical {
      min-height: 100px;
    }
  }
`;
