
import { css } from "lit";

export const mediaPlayerStyles = css`
  .entity-info {
    flex: 1;
    transition: opacity 0.3s ease, transform 0.3s ease;
    opacity: 1;
    transform: translateX(0);
  }

  .entity-info.hidden {
    opacity: 0;
    position: absolute;
    transform: translateX(-20px);
    pointer-events: none;
  }

  .media-card-container {
    transition: all 0.3s ease-in-out;
    overflow: visible;
  }

  .media-card-container.collapsed {
    max-height: 80px;
  }

  .media-card-container.expanded {
    max-height: 400px;
  }

  .media-layout {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 16px;
  }

  .entity-main {
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    gap: 16px;
    min-width: 180px;
  }

  .controls-container {
    display: flex;
    flex-direction: column;
    overflow: visible;
    opacity: 0;
    transition: all 0.3s ease-in-out;
    margin-left: -16px;
  }

  .expanded .controls-container {
    width: auto;
    opacity: 1;
    margin-left: 0;
  }

  .control-button {
    background-color: var(--card-background-color);
    border: none;
    border-radius: 12px;
    width: 48px;
    height: 48px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: var(--ha-card-box-shadow, 0px 2px 2px -1px rgba(0, 0, 0, 0.2), 0px 2px 3px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12));
  }

  .control-button:hover {
    background-color: rgba(var(--rgb-primary-text-color, 255, 255, 255), 0.1);
  }

  .control-button:active {
    transform: scale(0.95);
    box-shadow: inset 0px 2px 4px -1px rgba(0, 0, 0, 0.2), inset 0px 4px 5px 0px rgba(0, 0, 0, 0.14), inset 0px 1px 10px 0px rgba(0, 0, 0, 0.12));
  }

  .control-button ha-icon {
    color: var(--primary-text-color);
    --mdc-icon-size: 24px;
  }

  .section-title {
    font-size: 0.75rem;
    color: var(--secondary-text-color);
    text-align: center;
    margin-bottom: 4px;
  }

  .grid-buttons {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    width: 100%;
    justify-items: center;
  }

  .media-info {
    white-space: nowrap;
    overflow: visible;
    text-overflow: ellipsis;
    transition: opacity 0.3s ease, height 0.3s ease, margin 0.3s ease, padding 0.3s ease;
    opacity: 1;
    height: auto;
    margin-bottom: 4px;
  }

  .expanded .media-info {
    opacity: 0;
    height: 0;
    margin: 0;
    padding: 0;
  }

  .nav-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 8px;
    width: 100%;
    justify-items: center;
  }

  .dpad-center {
    background-color: var(--primary-color, #03a9f4);
  }

  .dpad-center ha-icon {
    color: var(--text-primary-color, white);
  }

  @media (max-width: 380px) {
    .control-button {
      width: 40px;
      height: 40px;
    }

    .control-button ha-icon {
      --mdc-icon-size: 20px;
    }

    .controls-grid {
      gap: 8px;
    }
  }

  .error {
    color: var(--error-color, #db4437);
    text-align: center;
    padding: 16px;
  }

  .right-side-content {
    width: 100%;
    overflow: visible;
  }

  .left-side-content {
    display: flex;
    flex-direction: column;
    gap: 26px;
    overflow: visible;
    padding-right: 26px;
  }

  .media-control-buttons {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    justify-items: center;
    gap: 8px;
    padding-bottom: 16px;
    margin-bottom: 16px;
    border-bottom: 1.5px solid var(--primary-text-color);
  }

  .tv-on-container.hidden {
    opacity: 0;
    position: absolute;
    pointer-events: none;
  }

  .tv-on-container {
    display: flex;
    flex-direction: column;
    align-items: start;
    gap: 16px;
  }
`;
