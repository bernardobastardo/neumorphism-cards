
import { ServiceUtils } from "./utils";
import { buttonStyles } from "../styles/buttons";

export class BaseButton extends HTMLElement {
  private _icon: string = "mdi:help-circle-outline";
  private _active: boolean = false;
  private _selected: boolean = false;
  private _disabled: boolean = false;
  private _small: boolean = false;
  private _name: string = "";
  private _entity: string = "";

  private _lastTapTime: number = 0;
  private _longPressTimer: number | null = null;
  private _singlePressTimer: number | null = null;
  private _longPressed: boolean = false;

  private readonly _doubleClickDelay: number = 200;
  private readonly _longPressDelay: number = 500;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this._icon = this.getAttribute("icon") || "mdi:help-circle-outline";
    this._active = this.hasAttribute("active") && this.getAttribute("active") !== "false";
    this._selected = this.hasAttribute("selected") && this.getAttribute("selected") !== "false";
    this._disabled = this.hasAttribute("disabled") && this.getAttribute("disabled") !== "false";
    this._name = this.getAttribute("name") || "";
    this._small = this.hasAttribute("small");
    this._entity = this.getAttribute("data-entity") || "";

    this.render();
    this._setupEvents();
  }

  disconnectedCallback() {
    this._clearAllTimers();
    this._removeEvents();
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

  private _removeEvents() {
    const button = this.shadowRoot?.querySelector("button");
    if (!button) return;

    button.removeEventListener("mousedown", this._handleStart);
    button.removeEventListener("mouseup", this._handleEnd);
    button.removeEventListener("mouseleave", this._handleCancel);
    button.removeEventListener("click", this._handleClick);
    button.removeEventListener("contextmenu", this._handleContextMenu);
    button.removeEventListener("touchstart", this._handleStart);
    button.removeEventListener("touchend", this._handleEnd);
    button.removeEventListener("touchcancel", this._handleCancel);
  }

  private _handleStart: (e: Event) => void;
  private _handleEnd: (e: Event) => void;
  private _handleCancel: (e: Event) => void;
  private _handleClick: (e: Event) => void;
  private _handleContextMenu: (e: Event) => void;

  private _setupEvents() {
    const button = this.shadowRoot?.querySelector("button");
    if (!button) return;

    this._handleStart = this._onInteractionStart.bind(this);
    this._handleEnd = this._onInteractionEnd.bind(this);
    this._handleCancel = this._onInteractionCancel.bind(this);
    this._handleClick = this._onClick.bind(this);
    this._handleContextMenu = this._onContextMenu.bind(this);

    button.addEventListener("mousedown", this._handleStart);
    button.addEventListener("mouseup", this._handleEnd);
    button.addEventListener("mouseleave", this._handleCancel);
    button.addEventListener("click", this._handleClick);
    button.addEventListener("contextmenu", this._handleContextMenu);
    button.addEventListener("touchstart", this._handleStart, { passive: true });
    button.addEventListener("touchend", this._handleEnd);
    button.addEventListener("touchcancel", this._handleCancel);
  }

  private _onInteractionStart(event: Event) {
    if (this._disabled) return;

    this._setVisualFeedback(true);

    this._longPressed = false;
    this._longPressTimer = window.setTimeout(() => {
      this._longPressed = true;
      ServiceUtils.fireEvent(this, "button-long-press", {
        originalEvent: event,
        active: this._active,
        selected: this._selected,
        entity: this._entity,
      });
      ServiceUtils.fireEvent(this, "haptic", "heavy");
    }, this._longPressDelay);

    this._createRippleEffect(event);
  }

  private _onInteractionEnd(event: Event) {
    if (this._disabled) return;

    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
    }
    this._setVisualFeedback(false);

    if (this._longPressed) {
      this._longPressed = false;
    }
  }

  private _onInteractionCancel(event: Event) {
    this._clearAllTimers();
    this._setVisualFeedback(false);
    this._longPressed = false;
  }

  private _onClick(event: Event) {
    if (this._disabled || this._longPressed) return;
    this._handleTap(event);
  }

  private _handleTap(event: Event) {
    const now = Date.now();
    const timeSinceLastTap = now - this._lastTapTime;

    if (this._singlePressTimer) {
      clearTimeout(this._singlePressTimer);
      this._singlePressTimer = null;
    }

    if (timeSinceLastTap < this._doubleClickDelay) {
      ServiceUtils.fireEvent(this, "button-double-click", {
        originalEvent: event,
        active: this._active,
        selected: this._selected,
        entity: this._entity,
      });
      ServiceUtils.fireEvent(this, "haptic", "medium");
      this._lastTapTime = 0;
    } else {
      this._lastTapTime = now;
      this._singlePressTimer = window.setTimeout(() => {
        ServiceUtils.fireEvent(this, "button-click", {
          originalEvent: event,
          active: this._active,
          selected: this._selected,
          entity: this._entity,
        });
        ServiceUtils.fireEvent(this, "haptic", "light");
        this._singlePressTimer = null;
      }, this._doubleClickDelay);
    }
  }

  private _onContextMenu(event: Event) {
    if (this._disabled) return;
    event.preventDefault();
    ServiceUtils.fireEvent(this, "button-right-click", {
      originalEvent: event,
      active: this._active,
      selected: this._selected,
      entity: this._entity,
    });
    ServiceUtils.fireEvent(this, "haptic", "medium");
  }

  private _setVisualFeedback(active: boolean) {
    const button = this.shadowRoot?.querySelector("button");
    if (!button) return;
    if (active) {
      button.classList.add("pressed");
    } else {
      button.classList.remove("pressed");
    }
  }

  private _createRippleEffect(event: Event) {
    const button = this.shadowRoot?.querySelector("button");
    if (!button) return;

    const existingRipple = this.shadowRoot?.querySelector(".ripple");
    if (existingRipple) {
      existingRipple.remove();
    }

    const ripple = document.createElement("span");
    ripple.classList.add("ripple");

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;

    let x, y;
    if (event instanceof MouseEvent) {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    } else if (event instanceof TouchEvent && event.touches && event.touches[0]) {
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    } else {
      x = rect.width / 2;
      y = rect.height / 2;
    }

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;

    button.appendChild(ripple);

    setTimeout(() => {
      if (ripple && ripple.parentNode) {
        ripple.remove();
      }
    }, 600);
  }

  private render() {
    const buttonClass = `custom-button ${this._active ? "active" : ""} ${this._selected ? "selected" : ""} ${this._disabled ? "unavailable" : ""}`;
    const iconClass = `button-icon ${this._active ? "active" : ""} ${this._selected ? "selected" : ""} ${this._disabled ? "unavailable" : ""}`;

    const html = `
      <style>
        ${buttonStyles}
        
        .custom-button {
          position: relative;
          overflow: hidden;
          transform: translateZ(0);
          transition: transform 0.1s ease-out;
        }
        
        .custom-button.pressed {
          transform: scale(0.96);
        }
        
        .ripple {
          position: absolute;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.4);
          transform: scale(0);
          animation: ripple 0.6s ease-out;
          pointer-events: none;
          z-index: 0;
        }
        
        @keyframes ripple {
          to {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        .button-content {
          position: relative;
          z-index: 1;
        }
      </style>
      
      <div>
        <button class="${buttonClass} ${this._small ? "small" : ""}" type="button" ?disabled="${this._disabled}">
          <ha-icon icon="${this._icon}" class="${iconClass}"></ha-icon>
          <div class="button-content">
            ${this._name ? `<div class="button-name">${this._name}</div>` : ""}
            <slot name="status"></slot>
            <slot></slot>
          </div>
        </button>
      </div>
    `;

    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = html;
    }
  }

  set active(value: boolean) {
    this._active = value;
    this.render();
    this._setupEvents();
  }

  get active(): boolean {
    return this._active;
  }

  set selected(value: boolean) {
    this._selected = value;
    this.render();
    this._setupEvents();
  }

  get selected(): boolean {
    return this._selected;
  }

  set disabled(value: boolean) {
    this._disabled = value;
    this.render();
    this._setupEvents();
  }

  get disabled(): boolean {
    return this._disabled;
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    switch (name) {
      case "active":
        this._active = newValue !== null && newValue !== "false";
        break;
      case "selected":
        this._selected = newValue !== null && newValue !== "false";
        break;
      case "disabled":
        this._disabled = newValue !== null && newValue !== "false";
        break;
      case "icon":
        this._icon = newValue || "mdi:help-circle-outline";
        break;
      case "name":
        this._name = newValue || "";
        break;
      case "data-entity":
        this._entity = newValue || "";
        break;
    }

    this.render();
    this._setupEvents();
  }

  static get observedAttributes() {
    return ["icon", "active", "selected", "disabled", "name", "data-entity"];
  }
}

customElements.define("base-button", BaseButton);
