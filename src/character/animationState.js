// Maps role/mood/talk-state to animation identifiers, decoupled from SVG string building.
// This is the seam future Rive state-machine input wiring will plug into: same inputs
// (roleKey, mood, isTalking), different output (state machine inputs instead of CSS anim names).

const GESTURE_BY_ROLE = {
  interviewer: "gesturePoint 3.5s ease-in-out infinite",
  journalist: "gesturePoint 2.8s ease-in-out infinite",
  opponent: "gesturePoint 2.5s ease-in-out infinite",
  prosecutor: "gesturePoint 3s ease-in-out infinite",
  negotiator: "gestureNegotiate 4s ease-in-out infinite",
  ceo: "gestureNegotiate 4.5s ease-in-out infinite",
  executive: "gestureNegotiate 4.5s ease-in-out infinite",
  friend_female: "gestureOpen 3s ease-in-out infinite",
  best_friend: "gestureOpen 2.8s ease-in-out infinite",
  friend_male: "gestureOpen 3.5s ease-in-out infinite",
};

function getAnimationState(roleKey, mood, isTalking) {
  const gestureAnim = isTalking ? (GESTURE_BY_ROLE[roleKey] || null) : null;

  // Blink/gaze timing offset per role so multiple characters on screen don't move in lockstep.
  const blinkDuration = 3.8 + (roleKey?.length || 0) % 3 * 0.6;
  const blinkAnim = `blink ${blinkDuration}s ease-in-out infinite`;
  const eyeAnim = isTalking ? null : `eyeDrift ${5 + (roleKey?.length || 0) % 4}s ease-in-out infinite`;

  const browAnim = (mood === "surprised" || mood === "amused")
    ? "browFlash 2.5s ease-in-out infinite"
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
  default: "coachNod 4s ease-in-out infinite",
  journalist: "journalistSway 3s ease-in-out infinite",
  critic: "journalistSway 3s ease-in-out infinite",
  judge: "judgeTap 5s ease-in-out infinite",
  cross_examiner: "judgeTap 4.5s ease-in-out infinite",
  prosecutor: "judgeTap 4.5s ease-in-out infinite",
  friend_female: "friendBob 2.8s ease-in-out infinite",
  best_friend: "friendBob 2.6s ease-in-out infinite",
  crush: "friendBob 3s ease-in-out infinite",
  romantic_interest: "friendBob 3s ease-in-out infinite",
  date: "friendBob 2.8s ease-in-out infinite",
  blind_date: "friendBob 3.2s ease-in-out infinite",
  friend_male: "friendBob 3.2s ease-in-out infinite",
  negotiator: "negotiatorLean 4s ease-in-out infinite",
  ceo: "negotiatorLean 4.5s ease-in-out infinite",
  executive: "negotiatorLean 4.5s ease-in-out infinite",
  diplomat: "negotiatorLean 5s ease-in-out infinite",
  acquirer: "negotiatorLean 4s ease-in-out infinite",
  board_member: "negotiatorLean 5s ease-in-out infinite",
};

function getIdleAnimation(roleKey) {
  return IDLE_BY_ROLE[roleKey] || "idleBreathe 3.5s ease-in-out infinite";
}

// Mood → motion. "thinking" and "listening" are presence states (see getPresenceMood),
// not emotions, but they need their own motion the same way emotions do.
const MOOD_MOTION = {
  surprised: "moodSurprised .6s ease forwards",
  amused: "moodAmused 1.5s ease-in-out infinite",
  skeptical: "moodSkeptical 2s ease-in-out infinite",
  serious: "moodSerious 3s ease-in-out infinite",
  thinking: "moodThinking 2.5s ease-in-out infinite",
  warm: "moodWarm 2s ease-in-out infinite",
  uncomfortable: "moodUncomf .5s ease forwards",
  listening: "listenSettle 2.8s ease-in-out infinite",
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
