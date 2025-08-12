import { LitElement, html, css, TemplateResult, PropertyValues } from "lit";
import { customElement, property, state, query } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import { ServiceUtils } from "./utils";
import { sliderStyles } from "../styles/sliders";
import { sharedStyles } from "../styles/shared";

@customElement("custom-slider")
export class CustomSlider extends LitElement {
  // External properties
  @property({ type: Number }) value: number = 0;
  @property({ type: Number }) min: number = 0;
  @property({ type: Number }) max: number = 100;
  @property({ type: Boolean, reflect: true }) disabled: boolean = false;
  @property({ type: String }) label: string = "";
  @property({ type: String }) orientation: "horizontal" | "vertical" = "horizontal";
  @property({ type: Boolean, attribute: "show-fill" }) showFill: boolean = true;
  @property({ type: Boolean, attribute: "show-thumb" }) showThumb: boolean = true;
  @property({ type: String, attribute: "fill-style" }) fillStyle: "solid" | "striped" = "solid";

  // Internal state
  @state() private _isDragging: boolean = false;
  @state() private _isPressing: boolean = false;
  @state() private _isScrollGesture: boolean = false;

  // Inertia physics properties
  private _posHistory: { x: number; y: number; time: number }[] = [];
  private readonly _friction: number = 0.9; // Lower friction for more glide
  private readonly _velocityFactor: number = 2; // Adjust for desired "flick" sensitivity
  private readonly _minVelocity: number = 0.1;
  private _velocityX: number = 0;
  private _velocityY: number = 0;
  private _animId: number | null = null;

  private _initialMoveHappened: boolean = false;
  private readonly _dragThreshold: number = 10;
  private _startX: number = 0;
  private _startY: number = 0;
  private _originalValue: number = 0;

  @query(".slider-track") private _trackEl!: HTMLElement;
  @query(".slider-thumb") private _thumbEl!: HTMLElement;

  // Event handlers bound in constructor
  private _handleMouseMove: (e: MouseEvent) => void;
  private _handleMouseUp: (e: MouseEvent) => void;
  private _handleTouchMove: (e: TouchEvent) => void;
  private _handleTouchEnd: (e: TouchEvent) => void;

  constructor() {
    super();
    this._handleMouseMove = this._onMove.bind(this);
    this._handleMouseUp = this._onEnd.bind(this);
    this._handleTouchMove = this._onMove.bind(this);
    this._handleTouchEnd = this._onEnd.bind(this);
    this._animateInertia = this._animateInertia.bind(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._cleanupEvents();
    if (this._animId) {
      cancelAnimationFrame(this._animId);
    }
  }

  private _onStart(e: MouseEvent | TouchEvent) {
    if (this.disabled) return;

    if (this._animId) {
      cancelAnimationFrame(this._animId);
      this._animId = null;
    }

    this._originalValue = this.value;
    const isTouch = e.type === "touchstart";
    const x = isTouch ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    const y = isTouch ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

    this._isDragging = true;
    this._isScrollGesture = false;
    this._initialMoveHappened = false;
    this._startX = x;
    this._startY = y;
    this._isPressing = true;
    this._posHistory = [{ x, y, time: Date.now() }];

    this.value = this._calculateValueFromPosition(x, y);
    this._emitEvent("slider-input");

    document.addEventListener("mousemove", this._handleMouseMove);
    document.addEventListener("mouseup", this._handleMouseUp);
    document.addEventListener("touchmove", this._handleTouchMove, { passive: false });
    document.addEventListener("touchend", this._handleTouchEnd);
    document.addEventListener("touchcancel", this._handleTouchEnd);
  }

  private _onMove(e: MouseEvent | TouchEvent) {
    if (!this._isDragging) return;

    const isTouch = e.type.startsWith("touch");
    const x = isTouch ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    const y = isTouch ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

    if (!this._initialMoveHappened) {
      const deltaX = Math.abs(x - this._startX);
      const deltaY = Math.abs(y - this._startY);

      if (deltaX > this._dragThreshold || deltaY > this._dragThreshold) {
        this._initialMoveHappened = true;
        if (isTouch) {
          const isScrolling =
            (this.orientation === "horizontal" && deltaY > deltaX) ||
            (this.orientation === "vertical" && deltaX > deltaY);
          if (isScrolling) {
            this._isScrollGesture = true;
            this.value = this._originalValue;
            this._onEnd();
            return;
          }
        }
      }
    }

    if (this._isScrollGesture) return;

    if (isTouch) e.preventDefault();
    this._addPositionToHistory(x, y);
    this.value = this._calculateValueFromPosition(x, y);
    this._emitEvent("slider-input");
  }

  private _onEnd() {
    if (!this._isDragging) return;

    this._isPressing = false;

    if (!this._isScrollGesture) {
      this._calculateFinalVelocity();
      const velocity = this.orientation === "vertical" ? Math.abs(this._velocityY) : Math.abs(this._velocityX);
      if (velocity > this._minVelocity) {
        this._animateInertia();
      } else {
        this._emitEvent("slider-change");
        ServiceUtils.fireEvent(this, "haptic", "light");
      }
    }

    this._isDragging = false;
    this._isScrollGesture = false;
    this._initialMoveHappened = false;
    this._cleanupEvents();
  }

  private _cleanupEvents() {
    document.removeEventListener("mousemove", this._handleMouseMove);
    document.removeEventListener("mouseup", this._handleMouseUp);
    document.removeEventListener("touchmove", this._handleTouchMove);
    document.removeEventListener("touchend", this._handleTouchEnd);
    document.removeEventListener("touchcancel", this._handleTouchEnd);
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
    const velocity = this.orientation === "vertical" ? this._velocityY : this._velocityX;
    if (Math.abs(velocity) < this._minVelocity) {
      this._emitEvent("slider-change");
      ServiceUtils.fireEvent(this, "haptic", "light");
      return;
    }

    this._velocityX *= this._friction;
    this._velocityY *= this._friction;

    const valueChange = this.orientation === "vertical" ? -this._velocityY : this._velocityX;
    const newValue = this.value + valueChange;
    this.value = Math.round(Math.max(this.min, Math.min(this.max, newValue)));

    this._emitEvent("slider-input");

    if (this.value === this.min || this.value === this.max) {
      this._emitEvent("slider-change");
      ServiceUtils.fireEvent(this, "haptic", "light");
      return;
    }

    this._animId = requestAnimationFrame(this._animateInertia);
  }

  private _calculateValueFromPosition(x: number, y: number): number {
    if (!this._trackEl) return this.value;

    const trackRect = this._trackEl.getBoundingClientRect();
    const thumbSize = this.showThumb && this._thumbEl ? this._thumbEl.offsetWidth : 0;
    let ratio = 0;

    if (this.orientation === "vertical") {
      const effectiveTop = trackRect.top + thumbSize / 2;
      const effectiveHeight = trackRect.height - thumbSize;
      ratio = (y - effectiveTop) / (effectiveHeight > 0 ? effectiveHeight : 1);
    } else {
      const effectiveLeft = trackRect.left + thumbSize / 2;
      const effectiveWidth = trackRect.width - thumbSize;
      ratio = (x - effectiveLeft) / (effectiveWidth > 0 ? effectiveWidth : 1);
    }

    const constrainedRatio = Math.max(0, Math.min(1, ratio));
    return Math.round(this.min + constrainedRatio * (this.max - this.min));
  }

  private _emitEvent(type: "slider-input" | "slider-change") {
    ServiceUtils.fireEvent(this, type, { value: this.value });
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (this.showThumb && (changedProperties.has("value") || changedProperties.has("orientation"))) {
      this._updateThumbPosition();
    }
  }

  private _updateThumbPosition() {
    if (!this.showThumb || !this._thumbEl || !this._trackEl) return;

    const percent = (this.value - this.min) / (this.max - this.min);
    const thumbSize = this._thumbEl.offsetWidth;

    if (this.orientation === "vertical") {
      const trackHeight = this._trackEl.offsetHeight;
      const effectiveTrackHeight = trackHeight - thumbSize;
      const thumbPosition = thumbSize / 2 + percent * effectiveTrackHeight;
      this._thumbEl.style.top = `${thumbPosition}px`;
    } else {
      const trackWidth = this._trackEl.offsetWidth;
      const effectiveTrackWidth = trackWidth - thumbSize;
      const thumbPosition = thumbSize / 2 + percent * effectiveTrackWidth;
      this._thumbEl.style.left = `${thumbPosition}px`;
    }
  }

  render(): TemplateResult {
    const percent = (this.value - this.min) / (this.max - this.min);

    const containerClasses = { "slider-container": true, [this.orientation]: true };
    const trackClasses = { "slider-track": true, disabled: this.disabled, "is-pressing": this._isPressing };
    const fillStyles = { [this.orientation === "vertical" ? "height" : "width"]: `${percent * 100}%` };

    return html`
      <div class=${classMap(containerClasses)}>
        ${this.label ? html`<div class="custom-label">${this.label}</div>` : ""}
        <div class="slider-wrapper">
          <div class="slider-track ${classMap(trackClasses)}" @mousedown=${this._onStart} @touchstart=${this._onStart}>
            ${this.showFill ? html`<div class="slider-fill ${this.fillStyle}" style=${styleMap(fillStyles)}></div>` : ""}
            ${this.showThumb ? html`<div class="slider-thumb"></div>` : ""}
          </div>
        </div>
      </div>
    `;
  }

  static styles = [
    sharedStyles,
    sliderStyles,
    css`
      .slider-thumb {
        transform: translate(-50%, -50%);
      }
    `,
  ];
}
