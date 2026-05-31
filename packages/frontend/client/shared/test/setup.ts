import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement these pointer-related DOM methods; vaul (the drawer
// library) relies on them. Stub them as no-ops so component tests don't crash.
if (typeof Element !== "undefined") {
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = function () {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = function () {};
  }
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = function () {
      return false;
    };
  }
}
