// SVG character rig builder. Extracted from App.jsx unchanged (behavior-preserving move)
// so character/scene rendering can be developed and eventually replaced (Rive rigs) in
// isolation from screen/session logic.
import { CHARS, MOOD_DATA, darken, lighten, tint } from "./characterData.js";
import { getAnimationState } from "./animationState.js";

// SVG <defs> ids (outfitGrad, pantsGrad, etc.) are plain string literals below.
// When multiple characters render on the same page (e.g. the gallery), the
// browser resolves url(#id) document-wide, so every instance would pick up
// whichever character's gradient happened to be defined first — every shirt
// rendering as the first character's color. Each call gets its own numeric
// suffix appended to every def id (and matching url(#...) ref) right before
// returning, so gradients never collide across simultaneously-rendered characters.
let _svgUidCounter = 0;

function buildSVG(charOrKey, mood, isTalking, scene = "role") {
  const c = (typeof charOrKey === "object" && charOrKey !== null)
    ? charOrKey
    : (CHARS[charOrKey] || CHARS.default);
  const roleKey = c.roleKey || (typeof charOrKey === "string" ? charOrKey : "default");
  const isCoach = !!c.isCoach;
  const s = c.skin, h = c.hair, b = c.bodyColor;
  const p = c.pantsColor || darken(b, 28); // pants — distinct garment from the shirt/torso color
  const md = MOOD_DATA[mood] || MOOD_DATA.neutral;
  const hairDark = isCoach ? "#B0AAA0" : darken(h, 25);

  // ── Hair ──────────────────────────────────────────────────────────────
  const hairStyle = c.hairStyle || (c.hairLong ? "long" : "short");
  const hairStyles = {
    long: `<ellipse cx="80" cy="46" rx="34" ry="20" fill="url(#hairGrad)"/>
       <rect x="46" y="46" width="68" height="22" fill="url(#hairGrad)"/>
       <ellipse cx="47" cy="88" rx="11" ry="34" fill="url(#hairGrad)"/>
       <ellipse cx="113" cy="88" rx="11" ry="34" fill="url(#hairGrad)"/>
       <ellipse cx="80" cy="130" rx="34" ry="14" fill="url(#hairGrad)" opacity=".7"/>`,
   romantic_long: `
  <ellipse cx="80" cy="46" rx="34" ry="20" fill="url(#hairGrad)"/>
  <rect x="46" y="46" width="68" height="22" fill="url(#hairGrad)"/>
  <ellipse cx="50" cy="82" rx="12" ry="26" fill="url(#hairGrad)"/>
  <ellipse cx="110" cy="82" rx="12" ry="26" fill="url(#hairGrad)"/>
`,
    bun: `<ellipse cx="80" cy="46" rx="33" ry="19" fill="url(#hairGrad)"/>
       <rect x="47" y="46" width="66" height="21" fill="url(#hairGrad)"/>
       <ellipse cx="46" cy="74" rx="9" ry="22" fill="url(#hairGrad)"/>
       <ellipse cx="114" cy="74" rx="9" ry="22" fill="url(#hairGrad)"/>
       <circle cx="80" cy="30" r="13" fill="url(#hairGrad)"/>`,
   long_flowing: `
  <!-- Top hair -->
  <ellipse cx="80" cy="46" rx="34" ry="20" fill="url(#hairGrad)"/>
  <rect x="46" y="46" width="68" height="22" fill="url(#hairGrad)"/>

  <!-- Long side hair -->
  <ellipse cx="48" cy="96" rx="13" ry="44" fill="url(#hairGrad)"/>
  <ellipse cx="112" cy="96" rx="13" ry="44" fill="url(#hairGrad)"/>

  <!-- Lower hair ends -->
  <ellipse cx="60" cy="158" rx="12" ry="18" fill="url(#hairGrad)" opacity=".9"/>
  <ellipse cx="100" cy="158" rx="12" ry="18" fill="url(#hairGrad)" opacity=".9"/>
`,
    soft_fringe: `
  <ellipse cx="80" cy="46" rx="34" ry="18" fill="url(#hairGrad)"/>
  <rect x="46" y="46" width="68" height="18" fill="url(#hairGrad)"/>

  <path
    d="M48 48
       Q56 58 64 54
       Q72 62 80 58
       Q88 62 96 54
       Q104 58 112 48
       Z"
    fill="url(#hairGrad)"
  />
`,
    bald: `
  <ellipse
    cx="80"
    cy="42"
    rx="20"
    ry="8"
    fill="#000"
    opacity=".05"
  />
`,
    faux: `<ellipse cx="80" cy="46" rx="34" ry="19" fill="url(#hairGrad)"/>
       <rect x="46" y="46" width="68" height="22" fill="url(#hairGrad)"/>
       <ellipse cx="47" cy="72" rx="10" ry="18" fill="url(#hairGrad)"/>
       <ellipse cx="113" cy="72" rx="10" ry="18" fill="url(#hairGrad)"/>`,
    short: `<ellipse cx="80" cy="47" rx="33" ry="18" fill="url(#hairGrad)"/>
       <rect x="47" y="47" width="66" height="22" fill="url(#hairGrad)"/>`,
    buzz: `<ellipse cx="80" cy="48" rx="31" ry="14" fill="url(#hairGrad)"/>
       <rect x="49" y="48" width="62" height="14" fill="url(#hairGrad)"/>`,
    quiff: `<ellipse cx="80" cy="48" rx="32" ry="15" fill="url(#hairGrad)"/>
       <rect x="48" y="48" width="64" height="18" fill="url(#hairGrad)"/>
       <path d="M62 34 Q80 18 98 34 Q86 28 80 30 Q74 28 62 34Z" fill="url(#hairGrad)"/>`,
    messy: `<ellipse cx="80" cy="47" rx="33" ry="17" fill="url(#hairGrad)"/>
       <rect x="47" y="47" width="66" height="20" fill="url(#hairGrad)"/>
       <path d="M50 38 L56 28 L60 40Z" fill="url(#hairGrad)"/>
       <path d="M72 32 L78 22 L82 33Z" fill="url(#hairGrad)"/>
       <path d="M96 38 L104 30 L100 42Z" fill="url(#hairGrad)"/>`,
  };
  const hairSVG = isCoach
    ? `<ellipse cx="80" cy="47" rx="34" ry="17" fill="url(#hairGrad)"/>
       <rect x="46" y="47" width="68" height="20" fill="url(#hairGrad)"/>
       <ellipse cx="80" cy="47" rx="34" ry="17" fill="url(#hairGrad)" opacity=".5"/>
       <ellipse cx="46" cy="68" rx="8" ry="14" fill="url(#hairGrad)"/>
       <ellipse cx="114" cy="68" rx="8" ry="14" fill="url(#hairGrad)"/>`
    : (hairStyles[hairStyle] || hairStyles.short);

  // ── Glasses ───────────────────────────────────────────────────────────
  const glassesColor = isCoach ? "url(#goldGrad)" : "#4A3828"; // gold for coach
  const glassesSVG = c.glasses
    ? `<ellipse cx="65" cy="86" rx="13" ry="10" fill="none" stroke="${glassesColor}" stroke-width="2.5"/>
       <ellipse cx="95" cy="86" rx="13" ry="10" fill="none" stroke="${glassesColor}" stroke-width="2.5"/>
       <line x1="78" y1="86" x2="82" y2="86" stroke="${glassesColor}" stroke-width="2"/>
       <line x1="52" y1="84" x2="44" y2="82" stroke="${glassesColor}" stroke-width="2"/>
       <line x1="108" y1="84" x2="116" y2="82" stroke="${glassesColor}" stroke-width="2"/>` : "";

  // ── Beard / wrinkles ─────────────────────────────────────────────────
  const beardSVG = c.beard
    ? `<ellipse cx="80" cy="116" rx="22" ry="10" fill="#D0CCC5"/>
       <path d="M58 110 Q80 124 102 110" fill="#D0CCC5"/>` : "";

  const wrinklesSVG = isCoach
    ? `<path d="M52 98 Q57 95 62 97" stroke="#B0907A" stroke-width="1" fill="none" opacity=".5"/>
       <path d="M98 97 Q103 95 108 98" stroke="#B0907A" stroke-width="1" fill="none" opacity=".5"/>
       <path d="M65 120 Q80 124 95 120" stroke="#B0907A" stroke-width="1" fill="none" opacity=".4"/>` : "";

  // ── Eyebrows ──────────────────────────────────────────────────────────
  const browsSVG = `<path d="${md.browL}" stroke="${hairDark}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
                    <path d="${md.browR}" stroke="${hairDark}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;

  // ── Eyes ──────────────────────────────────────────────────────────────
  const eyeSquint = mood === "amused" || mood === "warm";
  const [ex, ely, ery] = [6, md.eyeLy, md.eyeRy];
  const eyeLx = isCoach ? 65 : 62;
  const eyeRx = isCoach ? 95 : 98;
  const eyeL = eyeSquint
    ? `<path d="M${eyeLx-ex} 86 Q${eyeLx} ${86-ely} ${eyeLx+ex} 86 Q${eyeLx} ${86+ely*.55} ${eyeLx-ex} 86Z" fill="#1A1209"/>`
    : `<ellipse cx="${eyeLx}" cy="86" rx="${ex}" ry="${ely}" fill="#1A1209"/>`;
  const eyeR = eyeSquint
    ? `<path d="M${eyeRx-ex} 86 Q${eyeRx} ${86-ery} ${eyeRx+ex} 86 Q${eyeRx} ${86+ery*.55} ${eyeRx-ex} 86Z" fill="#1A1209"/>`
    : `<ellipse cx="${eyeRx}" cy="86" rx="${ex}" ry="${ery}" fill="#1A1209"/>`;

  // ── Nose ──────────────────────────────────────────────────────────────
  const noseSVG = `<path d="M77 97 Q80 102 83 97" stroke="#9A7860" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                   <circle cx="76" cy="100" r="1.5" fill="${darken(s,8)}" opacity=".45"/>
                   <circle cx="84" cy="100" r="1.5" fill="${darken(s,8)}" opacity=".45"/>`;

  // ── Mouth ─────────────────────────────────────────────────────────────
  let mouthSVG;
  const my = 110;
  if (isTalking) {
    mouthSVG = `<ellipse cx="80" cy="${my+3}" rx="11" ry="9" fill="#3A1A0A"/>
                <ellipse cx="80" cy="${my+3}" rx="8.5" ry="5.5" fill="#5A2A1A"/>
                <path d="M69 ${my+3} Q80 ${my-1} 91 ${my+3}" stroke="#7A4030" stroke-width="1" fill="none"/>`;
  } else {
    mouthSVG = {
      neutral:   `<path d="M68 ${my} Q80 ${my+5} 92 ${my}" stroke="#8A6050" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
      surprised: `<ellipse cx="80" cy="${my+4}" rx="9" ry="8.5" fill="#3A1A0A"/>`,
      amused:    `<path d="M66 ${my-2} Q80 ${my+13} 94 ${my-2}" stroke="#C87A60" stroke-width="3" fill="none" stroke-linecap="round"/>
                  <path d="M66 ${my-2} Q80 ${my+13} 94 ${my-2}" fill="#E89070" opacity=".28"/>`,
      thinking:  `<path d="M70 ${my+2} Q82 ${my} 92 ${my+4}" stroke="#8A6050" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
      warm:      `<path d="M66 ${my-1} Q80 ${my+11} 94 ${my-1}" stroke="#C87A60" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
      skeptical: `<path d="M68 ${my+2} Q79 ${my} 92 ${my+5}" stroke="#8A6050" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
      serious:   `<line x1="68" y1="${my+1}" x2="92" y2="${my+1}" stroke="#6A4030" stroke-width="3" stroke-linecap="round"/>`,
      uncomf:    `<path d="M68 ${my+4} Q80 ${my-2} 92 ${my+4}" stroke="#8A6050" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                  <path d="M92 ${my+4} Q95 ${my+7} 98 ${my+4}" stroke="#8A6050" stroke-width="2" fill="none"/>`,
    }[md.mouth] || "";
  }

  // ── Blush / Think / Sweat ─────────────────────────────────────────────
  const blushSVG = md.blush > 0
    ? `<ellipse cx="52" cy="97" rx="11" ry="6.5" fill="#E87060" opacity="${md.blush}"/>
       <ellipse cx="108" cy="97" rx="11" ry="6.5" fill="#E87060" opacity="${md.blush}"/>` : "";
  const thinkSVG = md.think
    ? `<circle cx="108" cy="68" r="4" fill="${s}" stroke="#C0A890" stroke-width="1.5"/>
       <circle cx="115" cy="59" r="3.5" fill="${s}" stroke="#C0A890" stroke-width="1.5"/>
       <circle cx="121" cy="51" r="6.5" fill="${s}" stroke="#C0A890" stroke-width="1.5"/>
       <text x="121" y="54.5" font-size="9" fill="#6A5040" text-anchor="middle" font-weight="bold">?</text>` : "";
  const sweatSVG = md.sweat
    ? `<path d="M108 62 Q111 69 107.5 71 Q103.5 69 108 62Z" fill="#A8C8E8" opacity=".88"/>` : "";

  // ── Scene props + body per role ───────────────────────────────────────
  // Arms — shoulder connector + upper arm + forearm (hand kept separate so
  // social/sofa roles can render hands in frontProps, on top of the sofa)
  const armLNoHand = `<ellipse cx="36" cy="136" rx="10" ry="8" fill="url(#outfitGrad)"/>
    <rect x="26" y="132" rx="8" width="20" height="36" fill="url(#outfitGrad)"/>
    <rect x="22" y="164" rx="6" width="18" height="28" fill="url(#outfitGrad)"/>`;
  const armRBaseNoHand = `<ellipse cx="124" cy="136" rx="10" ry="8" fill="url(#outfitGrad)"/>
    <rect x="114" y="132" rx="8" width="20" height="36" fill="url(#outfitGrad)"/>
    <rect x="120" y="164" rx="6" width="18" height="28" fill="url(#outfitGrad)"/>`;
  const handL = `<ellipse cx="30" cy="196" rx="11" ry="9" fill="url(#faceGrad)"/>`;
  const handR = `<ellipse cx="130" cy="196" rx="11" ry="9" fill="url(#faceGrad)"/>`;
  const armL = `${armLNoHand}${handL}`;
  // Gesture wraps right arm during talking for expressive roles
  const gestureRoles = ["interviewer","journalist","opponent","prosecutor","negotiator","ceo","executive","friend_female","best_friend","friend_male","acquirer"];
  const wrapGesture = (inner) => (isTalking && gestureRoles.includes(roleKey))
    ? `<g style="animation:gesturePoint 3s ease-in-out infinite;transform-origin:129px 132px">${inner}</g>`
    : inner;
  const armRBase = `${armRBaseNoHand}${handR}`;
  const armR = wrapGesture(armRBase);
  // Arms without hands — used by sofa/social roles whose hands render later in frontProps
  const armRNoHand = wrapGesture(armRBaseNoHand);

  // Legs + feet — pants rendered as a garment distinct from the shirt: own
  // gradient (highlight/midtone/shadow), a center-seam crease for 3D fold,
  // and shoes one shade darker again so the three layers (shirt/pants/shoes)
  // read clearly even at a glance.
  const legsFeetSVG = `<rect x="54" y="204" width="14" height="20" rx="4" fill="url(#pantsGrad)"/>
    <rect x="92" y="204" width="14" height="20" rx="4" fill="url(#pantsGrad)"/>
    <rect x="59.5" y="206" width="3" height="16" rx="1.5" fill="${darken(p,36)}" opacity=".5"/>
    <rect x="97.5" y="206" width="3" height="16" rx="1.5" fill="${darken(p,36)}" opacity=".5"/>
    <rect x="56" y="206" width="2.5" height="14" rx="1.2" fill="${lighten(p,24)}" opacity=".4"/>
    <rect x="94" y="206" width="2.5" height="14" rx="1.2" fill="${lighten(p,24)}" opacity=".4"/>
    <ellipse cx="62" cy="222" rx="18" ry="8" fill="${darken(p,30)}"/>
    <ellipse cx="98" cy="222" rx="18" ry="8" fill="${darken(p,30)}"/>
    <ellipse cx="62" cy="219" rx="17" ry="5" fill="${lighten(p,14)}" opacity=".55"/>
    <ellipse cx="98" cy="219" rx="17" ry="5" fill="${lighten(p,14)}" opacity=".55"/>`;

  // Outfit accent — small button/stripe/pocket variation layered onto the torso
  const outfitAccent = (cx, topY, h2) => {
    const style = c.outfitStyle || 0;
    if (style === 1) return `<rect x="${cx-2.5}" y="${topY}" width="5" height="${h2}" fill="${lighten(b,10)}" opacity=".4"/>`;
    if (style === 2) return [0,1,2].map(i => `<circle cx="${cx}" cy="${topY+10+i*14}" r="2" fill="${lighten(b,25)}"/>`).join("");
    return "";
  };

  let bodySVG = "";
  let backProps = "";
  let frontProps = "";
  let hideLegs = false;

  // "portrait" scene — used by the SVG design-review gallery, which shows
  // every role in isolation rather than inside its in-session set. The
  // per-role branches below bake in furniture (desks, sofas, café
  // tables) — keep them in portrait/gallery mode too, since the short
  // "seated" torso some branches use only reads correctly with that
  // furniture present. Only the specific armchair frame that boxes in the
  // torso (parent/grandparent/mentor/senior/pak_rt/calon_mertua/
  // dosen_pembimbing) is suppressed below, regardless of scene.
  if (isCoach) {
    // Tapered torso (broader shoulders, narrower waist) with a ribbed V-neck
    // collar and hem band, instead of a flat rectangle body.
    bodySVG = `
      <path d="M38 132 Q38 124 46 124 L114 124 Q122 124 122 132 L122 198 Q122 212 108 216 L52 216 Q38 212 38 198 Z" fill="url(#outfitGrad)"/>
      <path d="M38 198 Q38 212 52 216 L108 216 Q122 212 122 198 L122 206 Q122 220 108 224 L52 224 Q38 220 38 206 Z" fill="${darken(b,30)}"/>
      <path d="M64 124 L80 150 L96 124 L88 124 L80 142 L72 124Z" fill="${darken(b,18)}"/>
      <path d="M62 124 L64 124 L80 146 L96 124 L98 124 L80 152Z" fill="none" stroke="${darken(b,30)}" stroke-width="2"/>
      <ellipse cx="80" cy="146" rx="11" ry="5.5" fill="${darken(b,10)}" opacity=".4"/>
      <rect x="34" y="160" width="8" height="14" rx="3" fill="${darken(b,22)}" opacity=".8"/>
      <rect x="118" y="160" width="8" height="14" rx="3" fill="${darken(b,22)}" opacity=".8"/>
      ${armL}${armR}`;
    if (isCoach) {
      // Small book in hand — professor touch
      frontProps = `
        <rect x="118" y="162" rx="3" width="28" height="36" fill="#8A7060"/>
        <rect x="120" y="164" rx="2" width="24" height="32" fill="#9A8070"/>
        <line x1="124" y1="170" x2="142" y2="170" stroke="#C8B8A0" stroke-width="1"/>
        <line x1="124" y1="176" x2="142" y2="176" stroke="#C8B8A0" stroke-width="1"/>
        <line x1="124" y1="182" x2="136" y2="182" stroke="#C8B8A0" stroke-width="1"/>`;
    }
    // hideLegs stays false — the shared legsFeetSVG (pantsGrad) renders below.
  } else {
    switch(roleKey) {
      // ── Formal desk roles ──────────────────────────────────────────────
      case "interviewer": case "reviewer": case "auditor": case "manager":
      case "panelist": case "regulator": case "commissioner": case "customer_service":
      case "defense_lawyer": case "investigator": case "official":
      case "dean": case "professor_academic":
        backProps = `
          <rect x="25" y="95" width="110" height="10" rx="4" fill="#2A1E14" stroke="#3A2A1C" stroke-width="1"/>
          <rect x="25" y="105" width="6" height="80" fill="#2A1E14"/>
          <rect x="129" y="105" width="6" height="80" fill="#2A1E14"/>
          <rect x="22" y="182" width="116" height="12" rx="3" fill="#2A1E14"/>`;
        bodySVG = `<rect x="40" y="128" rx="8" width="80" height="92" fill="url(#outfitGrad)"/>
          <path d="M58 128 L80 150 L102 128 L94 128 L80 144 L66 128Z" fill="${darken(b,24)}"/>
          <rect x="68" y="128" width="24" height="26" fill="#EAE7E0"/>
          ${outfitAccent(80,154,50)}
          ${armL}${armR}`;
        frontProps = `
          <rect x="-10" y="190" width="180" height="14" rx="2" fill="#3A2810" stroke="#4A3818" stroke-width="1"/>
          <rect x="-10" y="204" width="180" height="36" fill="#2E2008"/>
          <rect x="5" y="204" width="8" height="34" fill="#241A08"/>
          <rect x="147" y="204" width="8" height="34" fill="#241A08"/>
          <rect x="20" y="183" rx="2" width="36" height="14" fill="#E8DCC0" opacity=".9"/>
          <rect x="24" y="180" rx="2" width="30" height="10" fill="#F0E8D0" opacity=".9"/>`;
        hideLegs = true; break;

      // ── Judge / legal bench ───────────────────────────────────────────
      case "judge": case "prosecutor": case "cross_examiner":
        backProps = `
          <rect x="20" y="88" width="120" height="14" rx="4" fill="#1A1208"/>`;
        bodySVG = `<rect x="40" y="128" rx="8" width="80" height="92" fill="url(#outfitGrad)"/>
          <path d="M58 128 L80 150 L102 128 L94 128 L80 144 L66 128Z" fill="${darken(b,24)}"/>
          ${outfitAccent(80,150,55)}
          ${armL}${armR}`;
        frontProps = `
          <rect x="-10" y="178" width="180" height="16" rx="2" fill="#3A2810" stroke="#5A3E18" stroke-width="2"/>
          <rect x="-10" y="194" width="180" height="46" fill="#2A1C08"/>
          <rect x="0" y="200" width="160" height="30" fill="none" stroke="#4A3818" stroke-width="1"/>
          <rect x="95" y="160" rx="3" width="8" height="18" fill="#6A5030"/>
          <ellipse cx="99" cy="159" rx="8" ry="5" fill="#7A6040" style="transform:rotate(-30deg);transform-origin:99px 169px"/>
          <rect x="30" y="184" width="50" height="6" fill="#C8A040" opacity=".4"/>`;
        hideLegs = true; break;

      // ── Executive / conference table ──────────────────────────────────
      case "ceo": case "executive": case "negotiator": case "diplomat":
      case "acquirer": case "board_member": case "investor":
      case "partner": case "shareholder":
        backProps = `
          <rect x="15" y="90" width="130" height="16" rx="6" fill="#1A1614"/>
          <rect x="15" y="106" width="7" height="82" fill="#1A1614"/>
          <rect x="138" y="106" width="7" height="82" fill="#1A1614"/>
          <rect x="40" y="82" width="80" height="14" rx="6" fill="#1E1A18"/>`;
        bodySVG = `<rect x="40" y="128" rx="8" width="80" height="92" fill="url(#outfitGrad)"/>
          <path d="M58 128 L80 148 L102 128 L94 128 L80 142 L66 128Z" fill="${darken(b,24)}"/>
          <path d="M77 128 L80 138 L83 128" fill="${c.tie||c.trim||"#D9A05C"}"/>
          ${outfitAccent(80,150,55)}
          ${armL}${armR}`;
        frontProps = `
          <rect x="-20" y="188" width="200" height="12" rx="2" fill="#2A2218"/>
          <rect x="-20" y="188" width="200" height="2" fill="#3E3428"/>
          <rect x="-20" y="200" width="200" height="40" fill="#221A12"/>
          <rect x="118" y="178" width="8" height="14" fill="none" stroke="#4A5060" stroke-width="1"/>
          <ellipse cx="122" cy="178" rx="6" ry="2" fill="none" stroke="#4A5060" stroke-width="1"/>`;
        hideLegs = true; break;

      // ── Social casual — sofa seating ───────────────────────────────────
      case "friend_female": case "friend_male": case "best_friend": case "crush":
      case "date": case "romantic_interest": case "ex_partner": case "classmate":
      case "teman_ospek": case "new_acquaintance": case "neighbor": case "sibling":
      case "blind_date": case "colleague": case "stranger":
        if (scene === "livingroom") {
        backProps = `
          <rect x="8" y="108" width="144" height="14" rx="6" fill="#241A14" stroke="#2E2018" stroke-width="1.5"/>
          <rect x="8" y="122" width="8" height="68" rx="3" fill="#1E1410"/>
          <rect x="144" y="122" width="8" height="68" rx="3" fill="#1E1410"/>`;
        bodySVG = `<rect x="42" y="130" rx="14" width="76" height="90" fill="url(#outfitGrad)"/>
          <path d="M58 130 Q80 141 102 130" fill="none" stroke="#C890A0" stroke-width="2.5"/>
          ${outfitAccent(80,150,50)}
          ${armLNoHand}${armRNoHand}`;
        frontProps = `
          <rect x="6" y="186" width="148" height="30" rx="8" fill="#2A1E18" stroke="#3A2820" stroke-width="1.5"/>
          <rect x="14" y="190" width="132" height="2" rx="1" fill="#362418" opacity="0.6"/>
          <rect x="6" y="168" width="20" height="52" rx="6" fill="#2A1E18" stroke="#3A2820" stroke-width="1"/>
          <rect x="134" y="168" width="20" height="52" rx="6" fill="#2A1E18" stroke="#3A2820" stroke-width="1"/>
          <rect x="9" y="172" width="14" height="18" rx="3" fill="#342818" opacity="0.7"/>
          <rect x="137" y="172" width="14" height="18" rx="3" fill="#342818" opacity="0.7"/>
          <rect x="54" y="186" width="14" height="44" rx="5" fill="${darken(b,18)}"/>
          <rect x="92" y="186" width="14" height="44" rx="5" fill="${darken(b,18)}"/>
          <ellipse cx="62" cy="222" rx="18" ry="8" fill="${darken(b,28)}"/>
          <ellipse cx="98" cy="222" rx="18" ry="8" fill="${darken(b,28)}"/>
         ${handL}${handR}`;
hideLegs = true;

        }else if (
  roleKey === "crush" ||
  roleKey === "date" ||
  roleKey === "romantic_interest"
) {

  backProps = `
    <!-- Hanging lamp wire -->
    <line
      x1="120"
      y1="0"
      x2="120"
      y2="32"
      stroke="#705020"
      stroke-width="2"
    />

    <!-- Warm lamp -->
    <circle
      cx="120"
      cy="40"
      r="8"
      fill="#D4A020"
    />

    <!-- Lamp glow -->
    <circle
      cx="120"
      cy="40"
      r="28"
      fill="#D4A020"
      opacity="0.12"
    />
  `;

  bodySVG = `
    <rect
      x="44"
      y="120"
      rx="14"
      width="72"
      height="58"
      fill="url(#outfitGrad)"
    />

    <path
      d="M58 120 Q80 131 102 120"
      fill="none"
      stroke="#C890A0"
      stroke-width="2.5"
    />

    ${outfitAccent(80,138,50)}

    ${armLNoHand}
    ${armRNoHand}
  `;

frontProps = `
  <!-- Large cafe table -->

  <ellipse
    cx="80"
    cy="194"
    rx="74"
    ry="16"
    fill="#4A3124"
  />

  <!-- Table thickness -->

  <ellipse
    cx="80"
    cy="200"
    rx="74"
    ry="16"
    fill="#3A2418"
  />

  <!-- Table leg -->

  <rect
    x="76"
    y="198"
    width="8"
    height="10"
    fill="#3A2418"
  />

  <!-- Coffee cup -->

  <rect
    x="118"
    y="176"
    width="8"
    height="6"
    rx="1"
    fill="#D8D5CE"
  />

  <!-- Hands render LAST so they stay above table -->

  ${handL}
  ${handR}
`;

  hideLegs = true;
} else {

  backProps = `
    <rect x="8" y="108" width="144" height="14" rx="6" fill="#241A14" stroke="#2E2018" stroke-width="1.5"/>
    <rect x="8" y="122" width="8" height="68" rx="3" fill="#1E1410"/>
    <rect x="144" y="122" width="8" height="68" rx="3" fill="#1E1410"/>
  `;

  bodySVG = `
    <rect x="42" y="130" rx="14" width="76" height="90" fill="url(#outfitGrad)"/>
    <path d="M58 130 Q80 141 102 130" fill="none" stroke="#C890A0" stroke-width="2.5"/>
    ${outfitAccent(80,150,50)}
    ${armLNoHand}
    ${armRNoHand}
  `;

  frontProps = `
    <rect x="6" y="186" width="148" height="30" rx="8" fill="#2A1E18" stroke="#3A2820" stroke-width="1.5"/>
    <rect x="14" y="190" width="132" height="2" rx="1" fill="#362418" opacity="0.6"/>

    <rect x="6" y="168" width="20" height="52" rx="6" fill="#2A1E18" stroke="#3A2820" stroke-width="1"/>
    <rect x="134" y="168" width="20" height="52" rx="6" fill="#2A1E18" stroke="#3A2820" stroke-width="1"/>

    <rect x="9" y="172" width="14" height="18" rx="3" fill="#342818" opacity="0.7"/>
    <rect x="137" y="172" width="14" height="18" rx="3" fill="#342818" opacity="0.7"/>

    <rect x="54" y="186" width="14" height="44" rx="5" fill="${darken(b,18)}"/>
    <rect x="92" y="186" width="14" height="44" rx="5" fill="${darken(b,18)}"/>

    <ellipse cx="62" cy="222" rx="18" ry="8" fill="${darken(b,28)}"/>
    <ellipse cx="98" cy="222" rx="18" ry="8" fill="${darken(b,28)}"/>

    ${handL}
    ${handR}
  `;

  hideLegs = true;
}
break;
        
      // ── Parent / grandparent / mentor — armchair ───────────────────────
      case "parent": case "grandparent": case "mentor": case "senior":
      case "pak_rt": case "calon_mertua": case "dosen_pembimbing":
        bodySVG = `<rect x="40" y="128" rx="10" width="80" height="92" fill="url(#outfitGrad)"/>
          <path d="M58 128 Q80 137 102 128" fill="none" stroke="#5A7050" stroke-width="2"/>
          ${armL}${armR}`;
        frontProps = `
          <rect x="5" y="186" width="150" height="20" rx="6" fill="#2A1C10"/>
          <rect x="140" y="176" width="30" height="5" fill="#5A4020"/>
          <rect x="152" y="181" width="4" height="14" fill="#3A2A14"/>
          <ellipse cx="148" cy="174" rx="7" ry="3" fill="#C8A040" opacity=".7"/>
          <rect x="143" y="172" width="10" height="4" rx="1" fill="#E8D0A0"/>`; break;

      // ── Standing with mic (journalist style) ──────────────────────────
      case "journalist": case "critic": case "media_audience":
        bodySVG = `<rect x="40" y="128" rx="8" width="80" height="92" fill="url(#outfitGrad)"/>
          <path d="M40 178 h80 v28 a8 8 0 0 1 -8 8 h-64 a8 8 0 0 1 -8 -8 Z" fill="${darken(b,30)}"/>
          <rect x="88" y="138" rx="3" width="24" height="16" fill="#EAE0D0"/>
          <rect x="90" y="140" rx="2" width="20" height="6" fill="#BC7A7A"/>
          ${outfitAccent(60,148,28)}
          ${armL}${armR}`;
        frontProps = `
          <rect x="118" y="148" rx="4" width="8" height="28" fill="#2A2A2A" style="transform:rotate(-15deg);transform-origin:122px 162px"/>
          <ellipse cx="120" cy="148" rx="9" ry="11" fill="#3A3A3A" style="transform:rotate(-15deg);transform-origin:120px 148px"/>
          <ellipse cx="120" cy="148" rx="6" ry="7" fill="#222" style="transform:rotate(-15deg);transform-origin:120px 148px"/>
          <rect x="110" y="120" width="30" height="22" fill="#1A1A1A"/>
          <rect x="122" y="142" width="6" height="8" fill="#1A1A1A"/>`; break;

      // ── Opponent — assertive pose ─────────────────────────────────────
      case "opponent":
        backProps = `<rect x="20" y="100" width="120" height="10" rx="4" fill="#1E1814"/>`;
        bodySVG = `<rect x="40" y="128" rx="8" width="80" height="92" fill="url(#outfitGrad)"/>
          <path d="M40 178 h80 v28 a8 8 0 0 1 -8 8 h-64 a8 8 0 0 1 -8 -8 Z" fill="${darken(b,30)}"/>
          <path d="M58 128 L80 150 L102 128 L94 128 L80 144 L66 128Z" fill="#1A120A"/>
          ${outfitAccent(80,150,55)}
          ${armL}${armR}`; break;

      // ── Default social/casual ─────────────────────────────────────────
      default:
        backProps = `<rect x="20" y="100" width="120" height="10" rx="4" fill="#1E1814"/>`;
        bodySVG = `<rect x="42" y="130" rx="12" width="76" height="90" fill="url(#outfitGrad)"/>
          <path d="M42 176 h76 v28 a12 12 0 0 1 -12 12 h-52 a12 12 0 0 1 -12 -12 Z" fill="${darken(b,30)}"/>
          <path d="M60 130 Q80 142 100 130" fill="none" stroke="${darken(b,10)}" stroke-width="1.5"/>
          ${outfitAccent(80,150,50)}
          ${armL}${armR}`;
    }
  }

  // Legs/feet render in frontProps above seat/desk fronts, unless hidden behind furniture or already drawn in bodySVG
  if (!hideLegs) { frontProps = `${frontProps}${legsFeetSVG}`; }

  const { gestureAnim, blinkAnim, eyeAnim, browAnim } = getAnimationState(roleKey, mood, isTalking);
  const _uid = ++_svgUidCounter;

  const svg = `<svg viewBox="0 0 160 240" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;overflow:visible">
    <defs>
      <linearGradient id="outfitGrad" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0%" stop-color="${tint(b,0.16)}"/>
        <stop offset="22%" stop-color="${tint(b,0.06)}"/>
        <stop offset="55%" stop-color="${b}"/>
        <stop offset="100%" stop-color="${darken(b,32)}"/>
      </linearGradient>
      <linearGradient id="pantsGrad" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stop-color="${tint(p,0.16)}"/>
        <stop offset="35%" stop-color="${p}"/>
        <stop offset="100%" stop-color="${darken(p,30)}"/>
      </linearGradient>
      <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${tint(h,0.22)}"/>
        <stop offset="50%" stop-color="${h}"/>
        <stop offset="100%" stop-color="${darken(h,26)}"/>
      </linearGradient>
      <radialGradient id="faceGrad" cx="34%" cy="28%" r="78%">
        <stop offset="0%" stop-color="${lighten(s,28)}"/>
        <stop offset="45%" stop-color="${s}"/>
        <stop offset="100%" stop-color="${darken(s,22)}"/>
      </radialGradient>
      <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#000000" stop-opacity=".42"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffec99"/>
        <stop offset="50%" stop-color="#daa520"/>
        <stop offset="100%" stop-color="#6b4c0a"/>
      </linearGradient>
      <filter id="figureDepth" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="linearRGB">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
        <feOffset in="blur" dx="0" dy="5" result="offset"/>
        <feFlood flood-color="#06040a" flood-opacity=".4" result="color"/>
        <feComposite in="color" in2="offset" operator="in" result="shadow"/>
        <feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <ellipse cx="80" cy="232" rx="50" ry="10" fill="url(#groundShadow)"/>
    <g filter="url(#figureDepth)">
    ${backProps}
    ${bodySVG}
    <!-- Fabric shading streaks — torso only. Previously ran all the way to
         y=210-214, bleeding onto the pants/legs below the shirt hem, which
         read as texture "on the pants" since pants are a separate flat
         pantsGrad fill with no matching streaks of their own. -->
    <g opacity=".4" style="mix-blend-mode:multiply">
      <path d="M50 140 Q53 158 52 176" fill="none" stroke="${darken(b,38)}" stroke-width="6" stroke-linecap="round"/>
      <path d="M70 134 Q72 155 71 176" fill="none" stroke="${darken(b,38)}" stroke-width="5" stroke-linecap="round"/>
    </g>
    <g opacity=".5" style="mix-blend-mode:screen">
      <path d="M92 134 Q94 155 93 176" fill="none" stroke="${tint(b,0.14)}" stroke-width="5" stroke-linecap="round"/>
      <path d="M110 140 Q112 158 109 176" fill="none" stroke="${tint(b,0.14)}" stroke-width="6" stroke-linecap="round"/>
    </g>
    <circle cx="80" cy="82" r="42" fill="url(#faceGrad)"/>
    <ellipse cx="64" cy="68" rx="14" ry="8" fill="#ffffff" opacity=".16"/>
    ${hairSVG}
    <ellipse cx="38" cy="86" rx="7" ry="9" fill="url(#faceGrad)"/>
    <ellipse cx="122" cy="86" rx="7" ry="9" fill="url(#faceGrad)"/>
    ${beardSVG}${glassesSVG}
    ${browsSVG && browAnim
      ? `<g style="animation:${browAnim}">${browsSVG}</g>`
      : browsSVG}
    <g style="animation:${eyeAnim||'none'}">
      <g style="animation:${blinkAnim};transform-origin:${eyeLx}px 86px">
        ${eyeL}
      </g>
      <g style="animation:${blinkAnim};transform-origin:${eyeRx}px 86px;animation-delay:.08s">
        ${eyeR}
      </g>
      <circle cx="${eyeLx+2}" cy="83" r="2" fill="white" opacity=".9"/>
      <circle cx="${eyeRx+2}" cy="83" r="2" fill="white" opacity=".9"/>
    </g>
    ${noseSVG}${mouthSVG}${blushSVG}${wrinklesSVG}
    ${thinkSVG}${sweatSVG}
    </g>
    ${frontProps}
  </svg>`;

  let out = svg;
  for (const id of ["outfitGrad", "pantsGrad", "hairGrad", "faceGrad", "groundShadow", "goldGrad", "figureDepth"]) {
    out = out.split(id).join(`${id}${_uid}`);
  }
  return out;
}

export { buildSVG };
