
import { ServiceUtils } from "./utils";

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
  private _startX: number = 0;
  private _startY: number = 0;
  private _lastX: number = 0;
  private _lastY: number = 0;
  private _lastTime: number = 0;
  private _velocityX: number = 0;
  private _velocityY: number = 0;
  private _animId: number | null = null;
  private _posHistory: { x: number; y: number; time: number }[] = [];

  private readonly _friction: number = 0.85;
  private readonly _velocityFactor: number = 15;
  private readonly _minVelocity: number = 1;

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
    if (this._animId) {
      cancelAnimationFrame(this._animId);
      this._animId = null;
    }
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

    const input = this.shadowRoot?.querySelector("input");
    if (input) {
      input.addEventListener("input", (e) => {
        this._value = parseFloat((e.target as HTMLInputElement).value);
        this._updateVisuals();
        this._emitEvent("input");
      });
    }
  }

  private _onStart(type: "mouse" | "touch", e: MouseEvent | TouchEvent) {
    if (this._disabled) return;

    if (type === "touch") {
      e.preventDefault();
    }

    const x = type === "mouse" ? (e as MouseEvent).clientX : (e as TouchEvent).touches[0].clientX;
    const y = type === "mouse" ? (e as MouseEvent).clientY : (e as TouchEvent).touches[0].clientY;

    this._isDragging = true;
    this._startX = x;
    this._startY = y;
    this._lastX = x;
    this._lastY = y;
    this._lastTime = Date.now();
    this._velocityX = 0;
    this._velocityY = 0;
    this._posHistory = [];

    this._addPositionToHistory(x, y);

    if (this._animId) {
      cancelAnimationFrame(this._animId);
      this._animId = null;
    }

    this._updateValueFromPosition(x, y);

    document.addEventListener("mousemove", this._handleMouseMove);
    document.addEventListener("mouseup", this._handleMouseUp);
    document.addEventListener("touchmove", this._handleTouchMove, { passive: false });
    document.addEventListener("touchend", this._handleTouchEnd);
    document.addEventListener("touchcancel", this._handleTouchEnd);
  }

  private _onMove(type: "mouse" | "touch", e: MouseEvent | TouchEvent) {
    if (!this._isDragging) return;

    if (type === "touch") {
      e.preventDefault();
    }

    const x = type === "mouse" ? (e as MouseEvent).clientX : (e as TouchEvent).touches[0].clientX;
    const y = type === "mouse" ? (e as MouseEvent).clientY : (e as TouchEvent).touches[0].clientY;
    const now = Date.now();

    this._addPositionToHistory(x, y);
    this._updateValueFromPosition(x, y);

    this._lastX = x;
    this._lastY = y;
    this._lastTime = now;
  }

  private _onEnd(type: "mouse" | "touch", e: MouseEvent | TouchEvent) {
    if (!this._isDragging) return;

    this._isDragging = false;
    this._calculateFinalVelocity();

    const velocity = this._orientation === "vertical" ? Math.abs(this._velocityY) : Math.abs(this._velocityX);

    if (velocity > 0.5) {
      this._animateInertia();
    } else {
      this._emitEvent("change");
    }

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
    const velocity = this._orientation === "vertical" ? this._velocityY : this._velocityX;

    if (Math.abs(velocity) < this._minVelocity) {
      this._velocityX = 0;
      this._velocityY = 0;
      this._emitEvent("change");
      return;
    }

    this._velocityX *= this._friction;
    this._velocityY *= this._friction;

    const track = this.shadowRoot?.querySelector(".slider-track");
    if (track) {
      const trackRect = track.getBoundingClientRect();
      const thumb = this.shadowRoot?.querySelector(".slider-thumb") as HTMLElement;
      const thumbSize = thumb ? parseInt(getComputedStyle(thumb).width) || 14 : 14;

      if (this._orientation === "vertical") {
        const effectiveHeight = trackRect.height - thumbSize;
        const pixelsPerValue = effectiveHeight / (this._max - this._min);
        const valueChange = -this._velocityY / pixelsPerValue;
        const newValue = this._value + valueChange;
        const prevValue = this._value;
        this._value = Math.max(this._min, Math.min(this._max, newValue));
        const hitMin = this._value === this._min && prevValue !== this._min && valueChange < 0;
        const hitMax = this._value === this._max && prevValue !== this._max && valueChange > 0;
        if (hitMin || hitMax) {
          this._velocityY = 0;
          this._updateVisuals();
          this._emitEvent("change");
          return;
        }
      } else {
        const effectiveWidth = trackRect.width - thumbSize;
        const pixelsPerValue = effectiveWidth / (this._max - this._min);
        const valueChange = this._velocityX / pixelsPerValue;
        const newValue = this._value + valueChange;
        const prevValue = this._value;
        this._value = Math.max(this._min, Math.min(this._max, newValue));
        const hitMin = this._value === this._min && prevValue !== this._min && valueChange < 0;
        const hitMax = this._value === this._max && prevValue !== this._max && valueChange > 0;
        if (hitMin || hitMax) {
          this._velocityX = 0;
          this._updateVisuals();
          this._emitEvent("change");
          return;
        }
      }
      this._updateVisuals();
      this._emitEvent("input");
    }
    this._animId = requestAnimationFrame(() => this._animateInertia());
  }

  private _updateValueFromPosition(x: number, y: number) {
    const track = this.shadowRoot?.querySelector(".slider-track");
    if (!track) return;

    const trackRect = track.getBoundingClientRect();
    const thumb = this.shadowRoot?.querySelector(".slider-thumb") as HTMLElement;
    const thumbSize = thumb ? parseInt(getComputedStyle(thumb).width) || 14 : 14;

    if (this._orientation === "vertical") {
      const effectiveTop = trackRect.top + thumbSize / 2;
      const effectiveHeight = trackRect.height - thumbSize;
      const relativeY = y - effectiveTop;
      const ratio = relativeY / effectiveHeight;
      const constrainedRatio = Math.max(0, Math.min(1, ratio));
      this._value = Math.round(this._min + constrainedRatio * (this._max - this._min));
    } else {
      const effectiveLeft = trackRect.left + thumbSize / 2;
      const effectiveWidth = trackRect.width - thumbSize;
      const relativeX = x - effectiveLeft;
      const ratio = relativeX / effectiveWidth;
      const constrainedRatio = Math.max(0, Math.min(1, ratio));
      this._value = Math.round(this._min + constrainedRatio * (this._max - this._min));
    }

    this._updateVisuals();
    this._emitEvent("input");
  }

  private _updateVisuals() {
    const thumb = this.shadowRoot?.querySelector(".slider-thumb") as HTMLElement;
    const fill = this.shadowRoot?.querySelector(".slider-fill") as HTMLElement;
    const track = this.shadowRoot?.querySelector(".slider-track");
    const input = this.shadowRoot?.querySelector("input");

    if (!track) return;

    const percent = (this._value - this._min) / (this._max - this._min);

    if (this._orientation === "vertical") {
      if (fill) {
        fill.style.height = `${percent * 100}%`;
        fill.style.width = "100%";
        fill.style.top = "0";
        fill.style.bottom = "auto";
      }
      if (thumb) {
        const thumbSize = parseInt(getComputedStyle(thumb).width) || 14;
        const trackHeight = (track as HTMLElement).offsetHeight;
        const effectiveTrackHeight = trackHeight - thumbSize;
        const thumbPosition = thumbSize / 2 + percent * effectiveTrackHeight;
        thumb.style.top = `${thumbPosition}px`;
        thumb.style.bottom = "auto";
        thumb.style.left = "50%";
        thumb.style.transform = "translateY(-50%)";
      }
    } else {
      if (fill) {
        fill.style.width = `${percent * 100}%`;
        fill.style.height = "100%";
        fill.style.top = "0";
        fill.style.bottom = "auto";
      }
      if (thumb) {
        const thumbSize = parseInt(getComputedStyle(thumb).width) || 14;
        const trackWidth = (track as HTMLElement).offsetWidth;
        const effectiveTrackWidth = trackWidth - thumbSize;
        const thumbPosition = thumbSize + percent * effectiveTrackWidth;
        thumb.style.top = "50%";
        thumb.style.bottom = "auto";
        thumb.style.left = `${thumbPosition}px`;
        thumb.style.transform = "translateX(-50%)";
      }
    }

    if (input) {
      input.value = this._value.toString();
    }
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
    this._value = Math.max(this._min, Math.min(this._max, val || 0));
    this._updateVisuals();
  }

  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(val: boolean) {
    this._disabled = val;
    this.toggleAttribute("disabled", this._disabled);
  }

  get orientation(): "horizontal" | "vertical" {
    return this._orientation;
  }

  set orientation(val: "horizontal" | "vertical") {
    this._orientation = val;
    this.setAttribute("orientation", this._orientation);
    this.render();
  }

  static get observedAttributes() {
    return ["value", "min", "max", "disabled", "label", "show-fill", "show-thumb", "orientation"];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    switch (name) {
      case "value":
        this._value = parseFloat(newValue) || 0;
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
        @import "/local/neumorphism-cards/styles/sliders.css";
        @import "/local/neumorphism-cards/styles/shared.css";
      </style>
      
      <div class="slider-container ${orientationClass}">
        ${this._label ? `<div class="custom-label">${this._label}</div>` : ""}
        <div class="slider-wrapper">
          <div class="slider-track ${this._disabled ? "disabled" : ""} ${orientationClass}">
            ${this._showFill ? `<div class="slider-fill"></div>` : ""}
            <input type="range" min="${this._min}" max="${this._max}" .value="${this._value}" 
              ?disabled="${this._disabled}">
            ${this._showThumb ? `<div class="slider-thumb"></div>` : ""}
          </div>
        </div>
      </div>
    `;

    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = html;
    }

    this._setupEvents();
    requestAnimationFrame(() => this._updateVisuals());
  }
}

customElements.define("custom-slider", CustomSlider);
