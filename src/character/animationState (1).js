// Maps role/mood/talk-state to animation identifiers, decoupled from SVG string building.
// This is the seam future Rive state-machine input wiring will plug into: same inputs
// (roleKey, mood, isTalking), different output (state machine inputs instead of CSS anim names).

// CSS's built-in `ease-in-out` (cubic-bezier(.42,0,.58,1)) accelerates/decelerates
// slightly unevenly — fine for UI transitions, but it reads as a small mechanical
// "snap" on a sustained breathing/swaying loop where the eye expects a smooth sine
// arc. EASE_LOOP approximates easeInOutSine, which removes that snap from every
// idle/gesture/mood loop below without touching durations or amplitudes.
const EASE_LOOP = "cubic-bezier(.45,0,.55,1)";
// Sharper, deliberate deceleration for one-shot reactive moods (surprise, discomfort)
// — these should still feel like a snap, just a controlled one rather than a linear jolt.
const EASE_SNAP = "cubic-bezier(.16,1,.3,1)";

const GESTURE_BY_ROLE = {
  interviewer: `gesturePoint 3.5s ${EASE_LOOP} infinite`,
  journalist: `gesturePoint 2.8s ${EASE_LOOP} infinite`,
  opponent: `gesturePoint 2.5s ${EASE_LOOP} infinite`,
  prosecutor: `gesturePoint 3s ${EASE_LOOP} infinite`,
  negotiator: `gestureNegotiate 4s ${EASE_LOOP} infinite`,
  ceo: `gestureNegotiate 4.5s ${EASE_LOOP} infinite`,
  executive: `gestureNegotiate 4.5s ${EASE_LOOP} infinite`,
  friend_female: `gestureOpen 3s ${EASE_LOOP} infinite`,
  best_friend: `gestureOpen 2.8s ${EASE_LOOP} infinite`,
  friend_male: `gestureOpen 3.5s ${EASE_LOOP} infinite`,
};

function getAnimationState(roleKey, mood, isTalking) {
  const gestureAnim = isTalking ? (GESTURE_BY_ROLE[roleKey] || null) : null;

  // Blink/gaze timing offset per role so multiple characters on screen don't move in lockstep.
  const blinkDuration = 3.8 + (roleKey?.length || 0) % 3 * 0.6;
  const blinkAnim = `blink ${blinkDuration}s ${EASE_LOOP} infinite`;
  const eyeAnim = isTalking ? null : `eyeDrift ${5 + (roleKey?.length || 0) % 4}s ${EASE_LOOP} infinite`;

  const browAnim = (mood === "surprised" || mood === "amused")
    ? `browFlash 2.5s ${EASE_LOOP} infinite`
    : null;

  return { gestureAnim, blinkAnim, eyeAnim, browAnim };
}

// ── Presence layer ──────────────────────────────────────────────────────────
// What mood/animation the character shows is not just a 1:1 echo of the AI's [MOOD] tag —
// it also has to register the user's own turn (listening) and the gap before a reply
// (thinking), or the rig reads as inert exactly when the user is paying the most attention.

// Per-role idle motion — sustained, low-amplitude, always running underneath whatever
// mood/talk animation is layered on top (callers should never let this be replaced by
// the mood animation; nest them instead of swapping one for the other).
const IDLE_BY_ROLE = {
  default: `coachNod 4s ${EASE_LOOP} infinite`,
  journalist: `journalistSway 3s ${EASE_LOOP} infinite`,
  critic: `journalistSway 3s ${EASE_LOOP} infinite`,
  judge: `judgeTap 5s ${EASE_LOOP} infinite`,
  cross_examiner: `judgeTap 4.5s ${EASE_LOOP} infinite`,
  prosecutor: `judgeTap 4.5s ${EASE_LOOP} infinite`,
  friend_female: `friendBob 2.8s ${EASE_LOOP} infinite`,
  best_friend: `friendBob 2.6s ${EASE_LOOP} infinite`,
  crush: `friendBob 3s ${EASE_LOOP} infinite`,
  romantic_interest: `friendBob 3s ${EASE_LOOP} infinite`,
  date: `friendBob 2.8s ${EASE_LOOP} infinite`,
  blind_date: `friendBob 3.2s ${EASE_LOOP} infinite`,
  friend_male: `friendBob 3.2s ${EASE_LOOP} infinite`,
  negotiator: `negotiatorLean 4s ${EASE_LOOP} infinite`,
  ceo: `negotiatorLean 4.5s ${EASE_LOOP} infinite`,
  executive: `negotiatorLean 4.5s ${EASE_LOOP} infinite`,
  diplomat: `negotiatorLean 5s ${EASE_LOOP} infinite`,
  acquirer: `negotiatorLean 4s ${EASE_LOOP} infinite`,
  board_member: `negotiatorLean 5s ${EASE_LOOP} infinite`,
};

function getIdleAnimation(roleKey) {
  return IDLE_BY_ROLE[roleKey] || `idleBreathe 3.5s ${EASE_LOOP} infinite`;
}

// Mood → motion. "thinking" and "listening" are presence states (see getPresenceMood),
// not emotions, but they need their own motion the same way emotions do.
const MOOD_MOTION = {
  surprised: `moodSurprised .6s ${EASE_SNAP} forwards`,
  amused: `moodAmused 1.5s ${EASE_LOOP} infinite`,
  skeptical: `moodSkeptical 2s ${EASE_LOOP} infinite`,
  serious: `moodSerious 3s ${EASE_LOOP} infinite`,
  thinking: `moodThinking 2.5s ${EASE_LOOP} infinite`,
  warm: `moodWarm 2s ${EASE_LOOP} infinite`,
  uncomfortable: `moodUncomf .5s ${EASE_SNAP} forwards`,
  listening: `listenSettle 2.8s ${EASE_LOOP} infinite`,
};

function getMoodAnimation(mood, isTalking) {
  if (isTalking) return null; // talk animation takes priority over mood motion while speaking
  return MOOD_MOTION[mood] || null;
}

// What the character should visibly be "in" right now. The AI's [MOOD] tag describes the
// character's emotional read of the conversation, but it says nothing about the two states
// that matter most for feeling alive in real time: the user is mid-turn (listening), or a
// reply is being generated (thinking). Both should visibly override the last emotional mood
// until the next message resolves it.
function getPresenceMood(currentMood, { loading, isListening }) {
  if (loading) return "thinking";
  if (isListening) return "listening";
  return currentMood;
}

export { getAnimationState, getIdleAnimation, getMoodAnimation, getPresenceMood };
