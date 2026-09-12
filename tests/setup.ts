import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom has no layout engine. Shadcn's controls observe dimensions in browsers;
// interaction tests only need observer lifecycle support. Real sizing is browser-tested.
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Element.prototype.hasPointerCapture = () => false;
Element.prototype.setPointerCapture = () => {};
Element.prototype.releasePointerCapture = () => {};
Element.prototype.scrollIntoView = () => {};
// input-otp checks for password-manager overlays; jsdom cannot hit-test layout.
document.elementFromPoint = () => null;
// Base UI hides inset slider thumbs until their track has measurable dimensions.
// Supply only that geometry; jsdom still does not perform browser layout.
const getBoundingClientRect = Element.prototype.getBoundingClientRect;
Element.prototype.getBoundingClientRect = function () {
  if (this.hasAttribute("data-base-ui-slider-control")) return new DOMRect(0, 0, 200, 20);
  if (this.getAttribute("data-slot") === "slider-thumb") return new DOMRect(0, 0, 12, 12);
  return getBoundingClientRect.call(this);
};

afterEach(cleanup);
