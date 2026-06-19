// Warm Mode is a cross-system emotional state (light + character), never a CSS filter
// over the whole screen. This is the single source of truth for what the "light" half
// of that state looks like, so the landing/session screens stay in sync and future
// systems (audio pacing, character posture) have one place to read the same intent from.

const WARM_LIGHT = { r: 200, g: 130, b: 20 };

function warmOverlayStyle(active, { position = "65% 40%", fade = "100%", transitionMs = 1500, fixed = false } = {}) {
  const { r, g, b } = WARM_LIGHT;
  return {
    position: fixed ? "fixed" : "absolute",
    inset: 0,
    pointerEvents: "none",
    background: `radial-gradient(ellipse at ${position}, rgba(${r},${g},${b},0.16) 0%, rgba(${r - 40},${g - 30},${b - 10},0.08) 50%, transparent ${fade})`,
    opacity: active ? 1 : 0,
    transition: `opacity ${transitionMs}ms ease`,
  };
}

export { warmOverlayStyle };
