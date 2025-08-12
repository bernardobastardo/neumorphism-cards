import { css } from "lit";

export const alarmCardStyles = css`
  .alarm-card-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 8px;
    margin-bottom: 12px;
  }

  .time-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    margin: 0 16px;
  }

  .time-input-container {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
  }

  .time-input-container.focused {
    transform: scale(1.02);
  }

  .time-input {
    background-color: var(--card-background-color);
    border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.1));
    border-radius: var(--ha-card-border-radius, 12px);
    box-shadow: none;
    color: var(--primary-text-color);
    font-size: 1.8rem;
    font-weight: bold;
    font-family: inherit;
    text-align: center;
    width: 100%;
    cursor: text;
    transition: transform 0.3s ease;
    -webkit-appearance: none;
    -moz-appearance: textfield;
    appearance: none;
    touch-action: manipulation;
    box-sizing: border-box;
    position: relative;
  }

  .oculto {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
    height: 100%;
    cursor: pointer;
  }

  .time-label {
    font-size: 0.9rem;
    color: var(--secondary-text-color);
    justify-content: center;
    text-align: center;
  }

  .alarm-status {
    font-size: 0.75rem;
    color: var(--secondary-text-color);
  }

  .options-container {
    margin-top: 16px;
    padding: 16px;
    border-top: 1px solid var(--divider-color, rgba(0, 0, 0, 0.1));
  }

  .options-message {
    text-align: center;
    color: var(--secondary-text-color);
    padding: 16px;
    font-style: italic;
  }

  .options-error {
    text-align: center;
    color: var(--error-color, #db4437);
    padding: 16px;
  }

  .error {
    color: var(--error-color, #db4437);
    text-align: center;
    padding: 16px;
  }
`;
