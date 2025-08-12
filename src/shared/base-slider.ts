import { ServiceUtils } from "./utils";
import { sliderStyles } from "../styles/sliders";
import { sharedStyles } from "../styles/shared";

export class CustomSlider extends HTMLElement {
  private _value: number = 0;
  private _min: number = 0;
  private _max: number = 100;
  private _disabled: boolean = false;
  private _label: string = "";
  private _orientation: "horizontal" | "vertical" = "horizontal";
  private _showFill: boolean = true;
  private _showThumb: boolean = true;

  private _isDragging: boolean = false;
  private _isScrollGesture: boolean = false;
  private _initialMoveHappened: boolean = false;
  private _isReadyToDrag: boolean = false;
  private readonly _dragThreshold: number = 10;
  private _pressTimeout: number | null = null;

  private _startX: number = 0;
  private _startY: number = 0;
  private _lastX: number = 0;
  private _lastY: number = 0;
  private _lastTime: number = 0;
  private _velocityX: number = 0;
  private _velocityY: number = 0;
  private _animId: number | null = null;
  private _posHistory: { x: number; y: number; time: number }[] = [];

  private readonly _friction: number = 0.70; // Increased friction for viscosity
  private readonly _velocityFactor: number = 5; // Reduced factor for less "slip"
  private readonly _minVelocity: number = 0.1;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this._value = this.hasAttribute("value") ? parseFloat(this.getAttribute("value")!) || 0 : 0;
    this._min = this.hasAttribute("min") ? parseFloat(this.getAttribute("min")!) || 0 : 0;
    this._max = this.hasAttribute("max") ? parseFloat(this.getAttribute("max")!) || 100 : 100;
    this._disabled = this.hasAttribute("disabled");
    this._label = this.getAttribute("label") || "";
    this._showFill = !this.hasAttribute("show-fill") || this.getAttribute("show-fill") !== "false";
    this._showThumb = !this.hasAttribute("show-thumb") || this.getAttribute("show-thumb") !== "false";
    this._orientation = (this.getAttribute("orientation") as "vertical" | "horizontal") || "horizontal";

    this.render();
    this._setupEvents();
  }

  disconnectedCallback() {
    this._cleanupEvents();
  }

  private _handleMouseDown: (e: MouseEvent) => void;
  private _handleTouchStart: (e: TouchEvent) => void;
  private _handleMouseMove: (e: MouseEvent) => void;
  private _handleTouchMove: (e: TouchEvent) => void;
  private _handleMouseUp: (e: MouseEvent) => void;
  private _handleTouchEnd: (e: TouchEvent) => void;

  private _cleanupEvents() {
    document.removeEventListener("mousemove", this._handleMouseMove);
    document.removeEventListener("mouseup", this._handleMouseUp);
    document.removeEventListener("touchmove", this._handleTouchMove);
    document.removeEventListener("touchend", this._handleTouchEnd);
    document.removeEventListener("touchcancel", this._handleTouchEnd);
    if (this._pressTimeout) {
      clearTimeout(this._pressTimeout);
      this._pressTimeout = null;
    }
  }

  private _setupEvents() {
    this._handleMouseDown = this._onStart.bind(this, "mouse") as (e: MouseEvent) => void;
    this._handleTouchStart = this._onStart.bind(this, "touch") as (e: TouchEvent) => void;
    this._handleMouseMove = this._onMove.bind(this, "mouse") as (e: MouseEvent) => void;
    this._handleTouchMove = this._onMove.bind(this, "touch") as (e: TouchEvent) => void;
    this._handleMouseUp = this._onEnd.bind(this, "mouse") as (e: MouseEvent) => void;
    this._handleTouchEnd = this._onEnd.bind(this, "touch") as (e: TouchEvent) => void;

    const track = this.shadowRoot?.querySelector(".slider-track");
    if (!track) return;

    track.addEventListener("mousedown", this._handleMouseDown);
    track.addEventListener("touchstart", this._handleTouchStart, { passive: false });
  }

  private _onStart(type: "mouse" | "touch", e: MouseEvent | TouchEvent) {
    if (this._disabled) return;

    const x = type === "mouse" ? (e as MouseEvent).clientX : (e as TouchEvent).touches[0].clientX;
    const y = type === "mouse" ? (e as MouseEvent).clientY : (e as TouchEvent).touches[0].clientY;

    this._isDragging = true;
    this._isScrollGesture = false;
    this._initialMoveHappened = false;
    this._isReadyToDrag = false;
    this._startX = x;
    this._startY = y;

    const track = this.shadowRoot?.querySelector(".slider-track");
    if (!track) return;

    track.classList.add("is-pressing");
    this._updateVisuals(this._calculateValueFromPosition(x, y));

    this._pressTimeout = window.setTimeout(() => {
      this._isReadyToDrag = true;
      this._pressTimeout = null;
    }, 200);

    document.addEventListener("mousemove", this._handleMouseMove);
    document.addEventListener("mouseup", this._handleMouseUp);
    document.addEventListener("touchmove", this._handleTouchMove, { passive: false });
    document.addEventListener("touchend", this._handleTouchEnd);
    document.addEventListener("touchcancel", this._handleTouchEnd);
  }

  private _onMove(type: "mouse" | "touch", e: MouseEvent | TouchEvent) {
    if (!this._isDragging) return;

    const x = type === "mouse" ? (e as MouseEvent).clientX : (e as TouchEvent).touches[0].clientX;
    const y = type === "mouse" ? (e as MouseEvent).clientY : (e as TouchEvent).touches[0].clientY;

    if (!this._initialMoveHappened) {
      const deltaX = Math.abs(x - this._startX);
      const deltaY = Math.abs(y - this._startY);

      if (deltaX > this._dragThreshold || deltaY > this._dragThreshold) {
        this._initialMoveHappened = true;
        if (type === 'touch') {
          const isScrolling = (this._orientation === 'horizontal' && deltaY > deltaX) || 
                              (this._orientation === 'vertical' && deltaX > deltaY);

          if (isScrolling) {
            this._isScrollGesture = true;
            if (this._pressTimeout) {
              clearTimeout(this._pressTimeout);
              this._pressTimeout = null;
            }
            this.shadowRoot?.querySelector(".slider-track")?.classList.remove("is-pressing");
            this._updateVisuals(this._value);
            return;
          }
        }
      }
    }

    if (this._isScrollGesture) return;

    if (this._isReadyToDrag) {
      if (type === "touch") e.preventDefault();
      this._addPositionToHistory(x, y);
      this._value = this._calculateValueFromPosition(x, y);
      this._updateVisuals(this._value);
      this._emitEvent("input");
    }
  }

  private _onEnd(type: "mouse" | "touch", e: MouseEvent | TouchEvent) {
    if (!this._isDragging) return;

    const track = this.shadowRoot?.querySelector(".slider-track");
    track?.classList.remove("is-pressing");

    if (this._pressTimeout) {
      clearTimeout(this._pressTimeout);
      this._pressTimeout = null;
      if (!this._initialMoveHappened && !this._isScrollGesture) {
        const x = type === "mouse" ? (e as MouseEvent).clientX : (e as TouchEvent).changedTouches[0].clientX;
        const y = type === "mouse" ? (e as MouseEvent).clientY : (e as TouchEvent).changedTouches[0].clientY;
        this._value = this._calculateValueFromPosition(x, y);
        this._emitEvent("change");
      } else {
        this._updateVisuals(this._value);
      }
    } else if (!this._isScrollGesture) {
      this._calculateFinalVelocity();
      const velocity = this._orientation === 'vertical' ? Math.abs(this._velocityY) : Math.abs(this._velocityX);
      if (velocity > this._minVelocity) {
        this._animateInertia();
      } else {
        this._emitEvent("change");
      }
    }

    this._isDragging = false;
    this._isScrollGesture = false;
    this._initialMoveHappened = false;

    this._cleanupEvents();
  }

  private _addPositionToHistory(x: number, y: number) {
    const now = Date.now();
    this._posHistory.push({ x, y, time: now });
    if (this._posHistory.length > 5) {
      this._posHistory.shift();
    }
  }

  private _calculateFinalVelocity() {
    if (this._posHistory.length < 2) {
      this._velocityX = 0;
      this._velocityY = 0;
      return;
    }
    const newest = this._posHistory[this._posHistory.length - 1];
    const oldest = this._posHistory[0];
    const deltaX = newest.x - oldest.x;
    const deltaY = newest.y - oldest.y;
    const deltaTime = newest.time - oldest.time;
    if (deltaTime <= 0) {
      this._velocityX = 0;
      this._velocityY = 0;
      return;
    }
    this._velocityX = (deltaX / deltaTime) * this._velocityFactor;
    this._velocityY = (deltaY / deltaTime) * this._velocityFactor;
  }

  private _animateInertia() {
    const velocity = this._orientation === 'vertical' ? this._velocityY : this._velocityX;
    if (Math.abs(velocity) < this._minVelocity) {
      this._emitEvent("change");
      return;
    }

    this._velocityX *= this._friction;
    this._velocityY *= this._friction;

    const valueChange = this._orientation === 'vertical' ? -this._velocityY : this._velocityX;
    const newValue = this._value + valueChange;
    this._value = Math.round(Math.max(this._min, Math.min(this._max, newValue)));
    
    this._updateVisuals(this._value);
    this._emitEvent("input");

    if (this._value === this._min || this._value === this._max) {
      this._emitEvent("change");
      return;
    }

    this._animId = requestAnimationFrame(() => this._animateInertia());
  }

  private _calculateValueFromPosition(x: number, y: number): number {
    const track = this.shadowRoot?.querySelector(".slider-track") as HTMLElement;
    if (!track) return this._value;

    const trackRect = track.getBoundingClientRect();
    const thumb = this.shadowRoot?.querySelector(".slider-thumb") as HTMLElement;
    const thumbSize = thumb ? thumb.offsetWidth : 0;
    let ratio = 0;

    if (this._orientation === "vertical") {
      const effectiveTop = trackRect.top + thumbSize / 2;
      const effectiveHeight = trackRect.height - thumbSize;
      if (effectiveHeight <= 0) return this._value;
      const relativeY = y - effectiveTop;
      ratio = relativeY / effectiveHeight;
    } else {
      const effectiveLeft = trackRect.left + thumbSize / 2;
      const effectiveWidth = trackRect.width - thumbSize;
      if (effectiveWidth <= 0) return this._value;
      const relativeX = x - effectiveLeft;
      ratio = relativeX / effectiveWidth;
    }

    const constrainedRatio = Math.max(0, Math.min(1, ratio));
    return Math.round(this._min + constrainedRatio * (this._max - this._min));
  }

  private _updateVisuals(value: number) {
    const fill = this.shadowRoot?.querySelector(".slider-fill") as HTMLElement;
    const track = this.shadowRoot?.querySelector(".slider-track") as HTMLElement;
    const input = this.shadowRoot?.querySelector("input");

    if (!fill || !track || !input) return;

    const percent = (value - this._min) / (this._max - this._min);

    if (this._orientation === "vertical") {
      fill.style.height = `${percent * 100}%`;
    } else {
      fill.style.width = `${percent * 100}%`;
    }

    if (this._showThumb) {
      const thumb = this.shadowRoot?.querySelector(".slider-thumb") as HTMLElement;
      if (thumb) {
        const thumbSize = thumb.offsetWidth;
        if (this._orientation === "vertical") {
          const trackHeight = track.offsetHeight;
          const effectiveTrackHeight = trackHeight - thumbSize;
          const thumbPosition = (thumbSize / 2) + (percent * effectiveTrackHeight);
          thumb.style.top = `${thumbPosition}px`;
          thumb.style.transform = 'translateX(-50%) translateY(-50%)';
        } else {
          const trackWidth = track.offsetWidth;
          const effectiveTrackWidth = trackWidth - thumbSize;
          const thumbPosition = (thumbSize / 2) + (percent * effectiveTrackWidth);
          thumb.style.left = `${thumbPosition}px`;
          thumb.style.transform = 'translateX(-50%) translateY(-50%)';
        }
      }
    }

    input.value = value.toString();
  }

  private _emitEvent(type: "input" | "change") {
    const eventName = type === "input" ? "slider-input" : "slider-change";
    ServiceUtils.fireEvent(this, eventName, { value: this._value });
    if (type === "change") {
      ServiceUtils.fireEvent(this, "haptic", "light");
    }
  }

  get value(): number {
    return this._value;
  }

  set value(val: number) {
    if (this._value === val) return;
    this._value = Math.max(this._min, Math.min(this._max, val || 0));
    this._updateVisuals(this._value);
  }

  static get observedAttributes() {
    return ["value", "min", "max", "disabled", "label", "show-fill", "show-thumb", "orientation"];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    switch (name) {
      case "value":
        this.value = parseFloat(newValue) || 0;
        break;
      case "min":
        this._min = parseFloat(newValue) || 0;
        break;
      case "max":
        this._max = parseFloat(newValue) || 100;
        break;
      case "disabled":
        this._disabled = newValue !== null;
        break;
      case "label":
        this._label = newValue || "";
        break;
      case "show-fill":
        this._showFill = newValue !== "false";
        break;
      case "show-thumb":
        this._showThumb = newValue !== "false";
        break;
      case "orientation":
        this._orientation = (newValue as "vertical" | "horizontal") || "horizontal";
        break;
    }
    this.render();
  }

  private render() {
    const orientationClass = this._orientation === "vertical" ? "vertical" : "horizontal";

    const html = `
      <style>
        ${sliderStyles}
        ${sharedStyles}
      </style>
      
      <div class="slider-container ${orientationClass}">
        ${this._label ? `<div class="custom-label">${this._label}</div>` : ""}
        <div class="slider-wrapper">
          <div class="slider-track ${this._disabled ? "disabled" : ""}">
            ${this._showFill ? `<div class="slider-fill"></div>` : ""}
            <input type="range" min="${this._min}" max="${this._max}" .value="${this._value}" 
              ?disabled="${this._disabled}" style="display: none;">
            ${this._showThumb ? `<div class="slider-thumb"></div>` : ""}
          </div>
        </div>
      </div>
    `;

    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = html;
    }

    this._setupEvents();
    requestAnimationFrame(() => this._updateVisuals(this._value));
  }
}

customElements.define("custom-slider", CustomSlider);