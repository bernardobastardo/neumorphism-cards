import { LitElement, html, TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ServiceUtils } from "./utils";
import { buttonStyles } from "../styles/buttons";

export class BaseButton extends LitElement {
  @property() icon: string = "mdi:help-circle-outline";
  @property({ type: Boolean }) active: boolean = false;
  @property({ type: Boolean }) selected: boolean = false;
  @property({ type: Boolean }) disabled: boolean = false;
  @property({ type: Boolean }) small: boolean = false;
  @property() name: string = "";
  @property() entity: string = "";

  @state() private _isPressed: boolean = false;

  private _lastTapTime: number = 0;
  private _longPressTimer: number | null = null;
  private _singlePressTimer: number | null = null;
  private _longPressed: boolean = false;

  private readonly _doubleClickDelay: number = 200;
  private readonly _longPressDelay: number = 500;

  disconnectedCallback() {
    super.disconnectedCallback();
    this._clearAllTimers();
  }

  private _clearAllTimers() {
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
    }
    if (this._singlePressTimer) {
      clearTimeout(this._singlePressTimer);
      this._singlePressTimer = null;
    }
  }

  private _onInteractionStart(event: Event) {
    if (this.disabled) return;

    this._isPressed = true;
    this._longPressed = false;
    this._longPressTimer = window.setTimeout(() => {
      this._longPressed = true;
      ServiceUtils.fireEvent(this, "button-long-press", { originalEvent: event });
      ServiceUtils.fireEvent(this, "haptic", "heavy");
    }, this._longPressDelay);

    this._createRippleEffect(event);
  }

  private _onInteractionEnd() {
    if (this.disabled) return;

    this._isPressed = false;
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
    }
    if (this._longPressed) {
      this._longPressed = false;
    }
  }

  private _onClick(event: Event) {
    if (this.disabled || this._longPressed) return;
    
    const now = Date.now();
    const timeSinceLastTap = now - this._lastTapTime;

    if (this._singlePressTimer) {
      clearTimeout(this._singlePressTimer);
      this._singlePressTimer = null;
    }

    if (timeSinceLastTap < this._doubleClickDelay) {
      ServiceUtils.fireEvent(this, "button-double-click", { originalEvent: event });
      ServiceUtils.fireEvent(this, "haptic", "medium");
      this._lastTapTime = 0;
    } else {
      this._lastTapTime = now;
      this._singlePressTimer = window.setTimeout(() => {
        ServiceUtils.fireEvent(this, "button-click", { originalEvent: event });
        ServiceUtils.fireEvent(this, "haptic", "light");
        this._singlePressTimer = null;
      }, this._doubleClickDelay);
    }
  }

  private _onContextMenu(event: Event) {
    if (this.disabled) return;
    event.preventDefault();
    ServiceUtils.fireEvent(this, "button-right-click", { originalEvent: event });
    ServiceUtils.fireEvent(this, "haptic", "medium");
  }

  private _createRippleEffect(event: Event) {
    const button = this.shadowRoot?.querySelector("button");
    if (!button) return;

    const ripple = document.createElement("span");
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = (event instanceof MouseEvent ? event.clientX : (event as TouchEvent).touches[0].clientX) - rect.left - size / 2;
    const y = (event instanceof MouseEvent ? event.clientY : (event as TouchEvent).touches[0].clientY) - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add("ripple");
    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  }

  protected render(): TemplateResult {
    return html`
      <style>
        ${buttonStyles}
        .custom-button {
          position: relative;
          overflow: hidden;
          transform: translateZ(0);
          transition: transform 0.1s ease-out;
        }
        .custom-button.pressed {
          transform: scale(0.80);
        }
        .ripple {
          position: absolute;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.4);
          transform: scale(0);
          animation: ripple 0.6s ease-out;
          pointer-events: none;
        }
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
        .button-content {
          position: relative;
          z-index: 1;
        }
      </style>
      <button
        class="custom-button 
          ${this.active ? "active" : ""} 
          ${this.selected ? "selected" : ""} 
          ${this.small ? "small" : ""}
          ${this._isPressed ? "pressed" : ""}"
        ?disabled=${this.disabled}
        @mousedown=${this._onInteractionStart}
        @mouseup=${this._onInteractionEnd}
        @mouseleave=${this._onInteractionEnd}
        @click=${this._onClick}
        @contextmenu=${this._onContextMenu}
        @touchstart=${this._onInteractionStart}
        @touchend=${this._onInteractionEnd}
        @touchcancel=${this._onInteractionEnd}
      >
        <ha-icon .icon=${this.icon} class="button-icon ${this.active ? "active" : ""}"></ha-icon>
        <div class="button-content">
          ${this.name ? html`<div class="button-name">${this.name}</div>` : ""}
          <slot name="status"></slot>
          <slot></slot>
        </div>
      </button>
    `;
  }
}

customElements.define("base-button", BaseButton);
