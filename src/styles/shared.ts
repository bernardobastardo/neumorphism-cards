import { css } from "lit";

export const sharedStyles = css`
  :host {
    --card-background-color: var(--ha-card-background, var(--card-background-color, #1c1c1c));
    --selected-color: var(--primary-color, #03a9f4);
    --light-color: var(--warning-color, #ffa500);
    --light-off-color: var(--disabled-text-color, #777777);
  }

  .card-container {
    background-color: var(--card-background-color);
    border-radius: var(--ha-card-border-radius, 12px);
    padding: 16px;
    color: var(--primary-text-color);
  }

  .card-header {
    margin-bottom: 32px;
  }

  .card-title {
    font-size: 1.5rem;
    margin-bottom: 8px;
    color: var(--primary-text-color);
  }

  .card-subtitle {
    font-size: 1rem;
    color: var(--secondary-text-color);
    font-weight: normal;
  }

  .card-content {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .entity-row {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .entity-row.size-2 {
    flex-basis: 100%;
  }

  .entity-row.size-1 {
    flex-basis: calc(50% - 8px);
  }

  .button-description-container {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .entity-info {
    flex: 1;
    overflow: hidden;
  }

  .entity-name {
    font-weight: bold;
  }

  .entity-description {
    color: var(--secondary-text-color);
    font-size: 0.9rem;
  }

  .custom-selector {
    height: 40px;
    background-color: var(--card-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    padding: 0 8px;
    color: var(--primary-text-color);
  }

  .custom-label {
    font-size: 0.9rem;
    color: var(--secondary-text-color);
    margin-bottom: 4px;
  }

  @media (max-width: 480px) {
    .custom-label {
      font-size: 0.8rem;
    }
  }
`;
