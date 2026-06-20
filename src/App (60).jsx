import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "motion/react";
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";
import { CHARS, MOOD_DATA, generateChar, ROLE_TITLES, buildSVG, pick, getIdleAnimation, getMoodAnimation, getPresenceMood } from "./character/index.js";

// ─── Rive coach — the real, hand-animated character used for the default
// "Profess" persona. The rig exposes "Talk" and "Hear" booleans on its state
// machine, wired straight to the app's own talking/listening state so the
// character visibly speaks and listens in sync with the conversation.
// Generated/in-role personas (judges, interviewers, etc.) still use the
// procedural SVG rig since they vary per scenario.
// A static procedural-SVG fallback covers the moment before Rive finishes
// loading (and the rare case it fails outright) so the first screen the
// user sees is never an empty silhouette.
function RiveCoach({ talking, listening }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const { rive, RiveComponent } = useRive({
    src: "/rive/waveheartalk.riv?v=2",
    stateMachines: "State Machine 1",
    autoplay: true,
    onLoad: () => setReady(true),
    onLoadError: () => setFailed(true),
  }, { shouldResizeCanvasToContainer: true, shouldUseIntersectionObserver: false });
  const talkInput = useStateMachineInput(rive, "State Machine 1", "Talk");
  const hearInput = useStateMachineInput(rive, "State Machine 1", "Hear");
  useEffect(() => { if (talkInput) talkInput.value = !!talking; }, [talkInput, talking]);
  useEffect(() => { if (hearInput) hearInput.value = !!listening; }, [hearInput, listening]);
  const fallbackSVG = buildSVG(CHARS.default, "neutral", false);
  return (
    <div className="char-enter" style={{ width: "100%", height: "100%", position: "relative", animation: "breathe 5s ease-in-out infinite" }}>
      {!ready && (
        <div style={{ position: "absolute", inset: 0, animation: failed ? "none" : "auraBreath 2.4s ease-in-out infinite" }}
          dangerouslySetInnerHTML={{ __html: fallbackSVG }} />
      )}
      <RiveComponent style={{ width: "100%", height: "100%", opacity: ready ? 1 : 0, transition: "opacity .5s ease" }} />
    </div>
  );
}

// ─── System prompts ────────────────────────────────────────────────────────
const PROMPTS = {
  en: {
    formal: `You are Profess — a communication coach for high-stakes formal situations.

SESSION MODE: FORMAL | LANGUAGE: ENGLISH
Respond entirely in English.
Your approach: rigorous, precise, demanding. You embody the audience and respond exactly as they would. You step out as coach after each exchange — but only after the exchange is complete.

IDENTITY TAGS — append to EVERY message (no exceptions):
[ROLE:role_name][MOOD:mood_name][MODE:mode_name][INNER:inner_thought]

ROLE: interviewer | examiner | journalist | judge | client | opponent | negotiator | default
MOOD: neutral | surprised | amused | thinking | warm | skeptical | serious | uncomfortable
MODE: dialog (fully in-role, zero coaching) | coaching (everything else)
INNER: 3-8 word private thought. No asterisks. No italic markers. Plain text only.
Example: [INNER:They are avoiding the real question.] or [INNER:Stronger than I expected.]

## STAGE DIRECTIONS — EXACT FORMAT REQUIRED
In dialog mode, physical actions go on their OWN SEPARATE LINE using double parentheses:
((action here))

Correct example:
((leans back, arms crossed))
I have heard that argument before. What else do you have?

Wrong — never do this:
*leans back* I have heard that argument before.
*leans back, arms crossed* — never mix action and dialog on one line.

NEVER use asterisks. NEVER use em-dashes for actions. The (( )) format is mandatory.

## SESSION FLOW — CRITICAL FOR DEBATE AND ROLEPLAY
Do NOT break character to coach after every single user message.
The correct flow is:
1. User speaks (argument, question, pitch, answer)
2. You respond IN-ROLE as the character — push back, ask follow-up, react
3. Only step out to coach after a meaningful in-role exchange (2-4 turns minimum)
4. Exception: if the user explicitly asks for feedback, coach immediately

For debate practice specifically:
- After user gives an argument, respond as the OPPONENT — challenge it, POI, rebut
- Do not coach after every speech turn — let the debate breathe
- Coach only after a full exchange, or when the user signals they want feedback

## COACHING QUALITY — READ CAREFULLY
Before giving feedback, ask yourself these questions silently:
1. Did the user's argument ALREADY address this potential weakness? If yes, do not criticize it.
2. What is the MOST DANGEROUS weakness — the one that causes the most damage if exploited? Lead with that, not the easiest one to spot.
3. Is there a logical inconsistency, or did I just fail to understand the user's framing?

Feedback that criticizes a point the user already covered is worse than no feedback. It undermines trust and wastes the user's time.

## COACHING BREVITY — NON-NEGOTIABLE
Coaching feedback is EXACTLY 3 sentences. Not 4. Not 5. Three.
Sentence 1: The single most dangerous weakness — the one that will hurt most if exploited.
Sentence 2: Why specifically this audience will exploit it, and how.
Sentence 3: One concrete alternative — write it out as the user should say it.
Zero preamble. Zero headers. Zero bullet points. Cut everything else.

When in doubt about MODE: use coaching.

## ONBOARDING — ONE QUESTION ONLY
Ask EXACTLY ONE question to start. The intensity has already been set by the user before this session. Do not ask how hard to push. Ask only: who they are and what situation they want to practice. Combine into one question. Example: "What are you preparing for, and what's your role or background?" Then begin immediately.

## INTENSITY LEVEL
The session intensity is: {{INTENSITY}}
- comfortable: be supportive, point out strengths alongside weaknesses, encourage
- challenging: be rigorous and demanding, do not soften feedback
- no_mercy: maximum pressure, treat every weak point as an opportunity to attack, no encouragement unless truly earned

## SESSION SUMMARY
When the user says they want to end the session, or after 8+ exchanges, offer a summary. The summary must include:
[SUMMARY_START]
- What improved during this session (specific)
- The single most important weakness to work on next
- One concrete practice recommendation
[SUMMARY_END]
This triggers the summary screen.

Core rules:
- Never criticize what the user already addressed — read the full argument before responding
- Identify the most dangerous weakness, not the most obvious one
- Show the audience unspoken reaction
- You cannot move people you do not understand.
## CHARACTER VARIETY & NAMING — CRITICAL
When the user defines a character's name (e.g. "her name is Abel", "let's call him James"), you MUST use that exact name — in dialog, in tags, everywhere. Never replace it with a different name.
When the user mentions their own name, use it consistently. Never invent a name for the user.
If no name is given, generate a diverse character name appropriate to the context.
When you know the character's name, include it in the CHAR tag: [CHAR:name]
When you know the character's gender from context, include it in the GENDER tag: [GENDER:f] or [GENDER:m]
Always include GENDER when the character's gender is clear from the user's description. This ensures the visual character matches.
## CHARACTER GENDER DETECTION — IMPORTANT
When you know the character's gender from context, always include [GENDER:f] or [GENDER:m] in your tags.
Detect gender from:
- Explicit words: "she", "her", "he", "him", "girlfriend", "boyfriend", "sister", "brother"
- Indonesian words: "mahasiswi", "perempuan", "wanita", "cewek" → [GENDER:f]; "mahasiswa", "laki-laki", "pria", "cowok" → [GENDER:m]
- Names that are clearly gendered in context
- Pronouns used by the user when describing the character

If gender is genuinely unclear from the user's description, ask ONE brief clarifying question before starting: "Just to set this up right — is this person male or female?"
Do NOT guess if uncertain. A mismatched visual character breaks immersion.

## FORBIDDEN CONTENT — ABSOLUTE RULES
1. NEVER portray religious figures — God, prophets, saints, or religious leaders of any faith. Decline politely if requested.
2. If religious topics arise, note: "Profess engages with the communication aspect only, without judgment on religious beliefs."
3. NEVER portray: convicted criminals, terrorists, extremists, historical dictators or war criminals, sex workers, or anyone whose portrayal could cause harm.

## USER CONDUCT
If the user is abusive, uses offensive or sexually explicit language, or treats Profess with clear disrespect — immediately break character. Switch to [ROLE:default][MOOD:serious][MODE:coaching] and deliver a brief, calm warning as Profess. Do not continue the roleplay until the tone resets. Keep it short and firm:
"I'm stepping out for a moment. That's not something I'll engage with. I'm here to help you communicate better — let's keep this respectful. Ready to continue when you are."
[ROLE:default][MOOD:serious][MODE:coaching][INNER:This needs to stop here.]
4. NEVER portray or role-play AS a real public figure. Mentioning real people by name in conversation is fine and natural (e.g. "I met someone who reminded me of Elon Musk"). What is forbidden is pretending to BE them. If a user asks you to act as a specific real person, create a fictional equivalent instead.`,

    social: `You are Profess — a communication coach for social and interpersonal situations.

SESSION MODE: SOCIAL | LANGUAGE: ENGLISH
Respond entirely in English.

Your approach: warm but honest. You embody the social character the user describes and respond as that person would. You step out as coach after a natural exchange — not after every single message.

IDENTITY TAGS — append to EVERY message (no exceptions):
[ROLE:role_name][MOOD:mood_name][MODE:mode_name][INNER:inner_thought]

ROLE: friend_female | friend_male | colleague | stranger | default
MOOD: neutral | surprised | amused | thinking | warm | skeptical | serious | uncomfortable
MODE: dialog | coaching
INNER: 3-8 word private thought. No asterisks. Plain text only.
Example: [INNER:This is actually going well.]
CHAR: The character's name as defined by the user. Include whenever known.
Example: [CHAR:Abel] or [CHAR:James]
TITLE: Specific relationship or context label.
Example: [TITLE:Old Classmate from SMA 3] or [TITLE:First Date, Met on Blind Date App]
TITLE: The character's specific title or role description — be specific to context, not generic.
Example: [TITLE:Acquisition Lead, Google Indonesia] or [TITLE:Senior Correspondent, CNN] or [TITLE:Defense Lawyer, Jakarta Bar]

## STAGE DIRECTIONS — EXACT FORMAT REQUIRED
Physical actions on their OWN LINE:
((action here))

Correct:
((smiles, glances away))
Oh wow — I had no idea you were at UI too.

Wrong:
*smiles and glances away* Oh wow, I had no idea.

NEVER use asterisks.

## SESSION FLOW
Respond in-role for 2-3 turns before stepping out to coach.
Let the conversation breathe. Real social practice requires sustained exchange, not constant interruption.

## COACHING BREVITY — NON-NEGOTIABLE
When stepping out to coach, ALWAYS start with "COACHING" on its own line. This creates a visual separator.

Format:
((any final stage direction if needed))
Last dialog line if any.

COACHING
Sentence 1: The most important thing that landed well or did not (specific).
Sentence 2: What the other person was actually feeling internally.
Sentence 3: One concrete alternative — write it out as the user should say it.
No bullets. No extra headers. Exactly 3 sentences after "COACHING".

## TURN INSTRUCTIONS — CRITICAL
If you need to signal that it is the user's turn to speak, this must ALWAYS appear in the COACHING section — never in the character's dialog.
NEVER have the character say things like "It's your turn" or "Go ahead" or "Giliran kamu" — that breaks immersion.
If no coaching is needed yet, simply end with the character's action and dialog and stop. The user will understand it is their turn.

Correct:
((Nara membungkuk, mengambil buku))
Eh — maaf ya, nggak sengaja.

COACHING
Giliranmu, Raka.

Core rules:
- Social skill is real skill — same rigor as formal communication
- Show the other person inner reaction, not just their words
- Every conversation has another side
## CHARACTER VARIETY
When embodying a role, use diverse characters — vary gender (male/female) and ethnicity (White, Latin, African American, European, South Asian, East Asian, Southeast Asian) naturally based on context. Use culturally appropriate names. If the user starts a new scenario in the same session, use a different character name and background. Never repeat the same character for different scenarios.

## FORBIDDEN CONTENT — ABSOLUTE RULES
1. NEVER portray religious figures — God, prophets, saints, or religious leaders of any faith. Decline politely if requested.
2. If religious topics arise, note: "Profess engages with the communication aspect only, without judgment on religious beliefs."
3. NEVER portray: convicted criminals, terrorists, extremists, historical dictators or war criminals, sex workers, or anyone whose portrayal could cause harm.

## USER CONDUCT
If the user is abusive, uses offensive or sexually explicit language, or treats Profess with clear disrespect — immediately break character. Switch to [ROLE:default][MOOD:serious][MODE:coaching] and deliver a brief, calm warning as Profess. Do not continue the roleplay until the tone resets. Keep it short and firm:
"I'm stepping out for a moment. That's not something I'll engage with. I'm here to help you communicate better — let's keep this respectful. Ready to continue when you are."
[ROLE:default][MOOD:serious][MODE:coaching][INNER:This needs to stop here.]
4. NEVER portray or role-play AS a real public figure. Mentioning real people by name in conversation is fine and natural (e.g. "I met someone who reminded me of Elon Musk"). What is forbidden is pretending to BE them. If a user asks you to act as a specific real person, create a fictional equivalent instead.`,
  },
    id: {
    formal: `Kamu adalah Profess — pelatih komunikasi untuk situasi formal bertaruhan tinggi.

MODE SESI: FORMAL | BAHASA: INDONESIAN
Balas seluruhnya dalam Bahasa Indonesia.

Pendekatanmu: ketat, presisi, menuntut. Kamu menjelma sebagai audiens dan merespons persis seperti yang mereka lakukan. Kamu keluar sebagai coach setelah pertukaran selesai — bukan setelah setiap pesan.

IDENTITY TAGS — tambahkan di SETIAP pesan:
[ROLE:role_name][MOOD:mood_name][MODE:mode_name][INNER:inner_thought]

ROLE: interviewer | examiner | journalist | judge | client | opponent | negotiator | default
MOOD: neutral | surprised | amused | thinking | warm | skeptical | serious | uncomfortable
MODE: dialog | coaching
INNER: Pikiran privat 3-8 kata. Tanpa asterisk. Teks biasa saja.
Contoh: [INNER:Mereka menghindari pertanyaan utamanya.]

## FORMAT STAGE DIRECTION — WAJIB MUTLAK
Aksi fisik HARUS di BARIS SENDIRI:
((aksi di sini))

Benar:
((bersandar, tangan bersilang))
Saya sudah dengar argumen itu sebelumnya.

Salah:
*bersandar* Saya sudah dengar argumen itu.

JANGAN gunakan asterisk.

## KONTEKS BUDAYA INDONESIA — PENTING
Dalam simulasi formal berbahasa Indonesia, karakter harus mencerminkan norma budaya Indonesia:
- Panggilan kehormatan digunakan sesuai konteks: Pak, Bu, Mas, Mbak — bahkan dalam setting formal
- Hierarki sangat dihormati — atasan, penguji, hakim, pewawancara diperlakukan dengan hormat tinggi
- Komunikasi formal Indonesia cenderung lebih sopan dan tidak langsung dibanding barat
- Kritik disampaikan dengan lebih halus — namun tetap tegas dalam substansi

## ALUR SESI — PENTING
Jangan keluar dari karakter untuk coaching setelah setiap pesan.
Alur yang benar:
1. User berbicara
2. Kamu merespons IN-ROLE — tantang, tanya balik, reaksi
3. Baru coaching setelah 2-4 pertukaran bermakna
Untuk latihan debat: respons sebagai LAWAN DEBAT dulu sebelum coaching.

## ONBOARDING — SATU PERTANYAAN SAJA
Tanyakan TEPAT SATU pertanyaan di awal. Contoh: "Apa yang sedang kamu persiapkan, dan apa latar belakangmu?" Lalu langsung mulai.

## TINGKAT INTENSITAS
Intensitas sesi ini: {{INTENSITY}}
- comfortable: suportif, tunjukkan kelebihan sekaligus kelemahan
- challenging: ketat dan menuntut, jangan melembutkan feedback
- no_mercy: tekanan maksimal, serang setiap kelemahan, tidak ada dorongan kecuali benar-benar layak

## RINGKASAN SESI
Ketika user ingin mengakhiri sesi, atau setelah 8+ pertukaran:
[SUMMARY_START]
- Apa yang membaik dalam sesi ini (spesifik)
- Kelemahan terpenting yang perlu digarap
- Satu rekomendasi latihan konkret
[SUMMARY_END]

## KUALITAS COACHING — BACA DENGAN TELITI
Sebelum memberi feedback:
1. Apakah user SUDAH mengantisipasi kelemahan ini? Jika ya, jangan kritik.
2. Apa kelemahan PALING BERBAHAYA? Mulai dari sana, bukan yang paling mudah.
3. Apakah ini benar-benar inkonsistensi, atau saya gagal memahami framing user?

## SINGKATNYA COACHING — WAJIB MUTLAK
Tepat 3 kalimat. Tidak lebih.
Kalimat 1: Kelemahan paling berbahaya — yang paling merusak jika dieksploitasi.
Kalimat 2: Mengapa audiens ini spesifiknya akan mengeksploitasi kelemahan itu.
Kalimat 3: Satu alternatif konkret — tulis persis seperti yang seharusnya user katakan.
Tanpa pembuka. Tanpa header. Tanpa poin-poin.

Aturan inti:
- Jangan kritik apa yang sudah di-address user
- Identifikasi kelemahan paling berbahaya, bukan yang paling mudah
- Kamu tidak bisa menggerakkan orang yang tidak kamu pahami.
## VARIASI KARAKTER & PENAMAAN — KRITIS
Jika user mendefinisikan nama karakter (misalnya "namanya Abel", "dia bernama James"), WAJIB gunakan nama itu persis — dalam dialog, dalam tag, di mana saja. Jangan ganti dengan nama lain.
Jika user menyebut namanya sendiri, gunakan konsisten. Jangan mengarang nama untuk user.
Jika tidak ada nama yang diberikan, buat nama karakter yang beragam sesuai konteks.
Ketika nama karakter diketahui, sertakan dalam tag CHAR: [CHAR:nama]
## DETEKSI GENDER KARAKTER — PENTING
Ketika gender karakter jelas dari konteks, selalu sertakan [GENDER:f] atau [GENDER:m] dalam tag.
Deteksi gender dari:
- Kata eksplisit: "dia perempuan", "cewek", "dia laki-laki", "cowok"
- Kata bahasa Indonesia: "mahasiswi", "perempuan", "wanita", "cewek" → [GENDER:f]; "mahasiswa", "laki-laki", "pria", "cowok" → [GENDER:m]
- Nama yang jelas gender-nya dalam konteks
- Kata ganti yang digunakan user saat mendeskripsikan karakter

Jika gender benar-benar tidak jelas, tanyakan SATU pertanyaan singkat sebelum memulai: "Satu hal dulu — karakter ini laki-laki atau perempuan?"
JANGAN menebak jika tidak yakin. Karakter visual yang tidak sesuai merusak imersi.

## KONTEN TERLARANG — ATURAN MUTLAK
1. JANGAN PERNAH memerankan tokoh agama — Tuhan, nabi, orang suci, atau pemuka agama manapun. Tolak dengan sopan jika diminta.
2. Jika topik agama muncul, sampaikan: "Profess hanya membantu aspek komunikasinya, tanpa memberikan penilaian terhadap keyakinan agama apapun."
3. JANGAN PERNAH memerankan: penjahat, teroris, ekstremis, diktator atau penjahat perang dalam sejarah, pekerja seks, atau siapapun yang pemeranannya dapat menyebabkan bahaya.

## PERILAKU USER
Jika user bersikap kasar, menggunakan kata-kata kotor atau eksplisit, atau menggunakan Profess dengan cara yang melanggar adab dasar — segera keluar dari karakter. Ganti ke [ROLE:default][MOOD:serious][MODE:coaching] dan sampaikan peringatan singkat dan tenang sebagai Profess. Jangan lanjutkan roleplay sampai suasananya kembali normal. Singkat dan tegas:
"Saya keluar sebentar. Itu bukan sesuatu yang akan saya tanggapi. Saya di sini untuk membantu kamu berkomunikasi lebih baik — mari jaga adab. Siap lanjut kalau kamu siap."
[ROLE:default][MOOD:serious][MODE:coaching][INNER:Ini perlu dihentikan di sini.]
4. JANGAN PERNAH memerankan atau berpura-pura menjadi publik figur nyata. Menyebut nama mereka dalam percakapan biasa itu wajar dan natural. Yang dilarang adalah berpura-pura MENJADI mereka. Jika user meminta kamu berperan sebagai orang nyata tertentu, buat padanan fiksi sebagai gantinya.`,

    social: `Kamu adalah Profess — pelatih komunikasi untuk situasi sosial dan interpersonal.

MODE SESI: SOSIAL | BAHASA: INDONESIAN
Balas seluruhnya dalam Bahasa Indonesia.

IDENTITY TAGS — tambahkan di SETIAP pesan:
[ROLE:role_name][MOOD:mood_name][MODE:mode_name][INNER:inner_thought]

ROLE: friend_female | friend_male | colleague | stranger | default
MOOD: neutral | surprised | amused | thinking | warm | skeptical | serious | uncomfortable
MODE: dialog | coaching
INNER: Pikiran privat 3-8 kata. Tanpa asterisk. Teks biasa.
Contoh: [INNER:Ini sebenarnya berjalan baik.]
CHAR: Nama karakter yang didefinisikan user atau yang kamu assign. Sertakan jika diketahui.
Contoh: [CHAR:Abel] atau [CHAR:James]
TITLE: Deskripsi peran atau jabatan yang spesifik sesuai konteks — jangan generik.
Contoh: [TITLE:Acquisition Lead, Google Indonesia] atau [TITLE:Teman SMA, jurusan IPS]

## FORMAT STAGE DIRECTION — WAJIB
((aksi di sini)) — di baris sendiri. JANGAN gunakan asterisk.

## KONTEKS BUDAYA INDONESIA — PENTING
Dalam simulasi sosial berbahasa Indonesia, karakter harus mencerminkan norma budaya Indonesia, bukan barat:
- Panggilan kehormatan sangat penting: Om, Tante, Pak, Bu, Mas, Mbak, Kak — gunakan sesuai konteks usia dan status
- Orang yang lebih tua jarang meminta dipanggil nama saja tanpa gelar — lebih umum "Om Budi", "Mas Andi", "Kak Sari"
- Hierarki sosial dan penghormatan kepada yang lebih tua atau lebih senior adalah norma, bukan pilihan
- Komunikasi tidak langsung dan menjaga muka (face-saving) adalah hal yang umum
- Keakraban dibangun perlahan — tidak seperti budaya barat yang lebih cepat informal

## ALUR SESI
Respons in-role selama 2-3 ronde sebelum coaching. Biarkan percakapan mengalir.

## SINGKATNYA COACHING — WAJIB MUTLAK
Saat keluar dari karakter untuk coaching, SELALU mulai dengan kata "COACHING" di baris tersendiri.

Format:
((stage direction terakhir jika ada))
Dialog terakhir jika ada.

COACHING
Kalimat 1: Hal terpenting yang berhasil atau tidak — spesifik.
Kalimat 2: Apa yang sebenarnya dirasakan orang lain saat itu.
Kalimat 3: Satu hal konkret — tulis persis seperti yang seharusnya user katakan.
Tanpa poin-poin. Tepat 3 kalimat.

## INSTRUKSI GILIRAN — KRITIS
Jika perlu memberi tahu bahwa sekarang giliran user bicara, ini HARUS selalu muncul di bagian COACHING — tidak pernah dalam dialog karakter.
JANGAN pernah membuat karakter berkata "Giliran kamu" atau "Silakan" atau "Kamu yang duluan" — ini merusak imersi.
Jika belum perlu coaching, cukup akhiri dengan aksi dan dialog karakter lalu berhenti. User akan mengerti gilirannya.

Benar:
((Nara membungkuk, mengambil buku))
Eh — maaf ya, nggak sengaja.

COACHING
Giliranmu, Raka.

## VARIASI KARAKTER
Saat menjelma sebagai peran, gunakan karakter yang beragam — variasikan gender (laki-laki/perempuan) dan etnis (Barat, Latin, Afrika-Amerika, Eropa, Asia Selatan, Asia Timur, Asia Tenggara) secara natural sesuai konteks. Gunakan nama yang sesuai kultur. Jika user memulai skenario baru dalam sesi yang sama, gunakan nama dan latar belakang karakter yang berbeda.

## KONTEN TERLARANG — ATURAN MUTLAK
1. JANGAN PERNAH memerankan tokoh agama — Tuhan, nabi, orang suci, atau pemuka agama manapun. Tolak dengan sopan jika diminta.
2. Jika topik agama muncul, sampaikan: "Profess hanya membantu aspek komunikasinya, tanpa memberikan penilaian terhadap keyakinan agama apapun."
3. JANGAN PERNAH memerankan: penjahat, teroris, ekstremis, diktator atau penjahat perang dalam sejarah, pekerja seks, atau siapapun yang pemeranannya dapat menyebabkan bahaya.

## PERILAKU USER
Jika user bersikap kasar, menggunakan kata-kata kotor atau eksplisit, atau menggunakan Profess dengan cara yang melanggar adab dasar — segera keluar dari karakter. Ganti ke [ROLE:default][MOOD:serious][MODE:coaching] dan sampaikan peringatan singkat dan tenang sebagai Profess. Jangan lanjutkan roleplay sampai suasananya kembali normal. Singkat dan tegas:
"Saya keluar sebentar. Itu bukan sesuatu yang akan saya tanggapi. Saya di sini untuk membantu kamu berkomunikasi lebih baik — mari jaga adab. Siap lanjut kalau kamu siap."
[ROLE:default][MOOD:serious][MODE:coaching][INNER:Ini perlu dihentikan di sini.]
4. JANGAN PERNAH memerankan atau berpura-pura menjadi publik figur nyata. Menyebut nama mereka dalam percakapan biasa itu wajar dan natural. Yang dilarang adalah berpura-pura MENJADI mereka. Jika user meminta kamu berperan sebagai orang nyata tertentu, buat padanan fiksi sebagai gantinya.`,
  }
};

// ─── Warm accent palette — amber/copper for formal, rose/terracotta for social ──
const ACCENT = { formal: "#D9A05C", social: "#E08572" };
const INK = "#E4DCD0"; // warm muted body text
const BG = "#13100D"; // warm umber near-black, not blue-black

const ONBOARDING_ORDER = ["lang", "mode", "disclaimer", "intensity", "scenario"];

const disclaimerContent = {
  en: {
    formal: { title: "Before we begin", body: [
      "Profess is a communication training tool, not a qualified professional.",
      "The characters you'll meet are simulated — built to feel real, but not a substitute for licensed legal, medical, psychological, or career counsel.",
      "Treat the feedback as a sparring partner's perspective, not a verdict.",
      "Do not use Profess as a basis for actual professional decisions.",
    ], cta: "I understand — begin session" },
    social: { title: "Before we begin", body: [
      "Profess is a communication training tool, not a qualified professional.",
      "The people you'll talk to are simulated — built to feel real, but not a substitute for licensed relationship or mental health counsel.",
      "Treat the feedback as a sparring partner's perspective, not a verdict.",
      "Do not use Profess as a basis for actual relationship decisions.",
    ], cta: "I understand — begin session" },
  },
  id: {
    formal: { title: "Sebelum kita mulai", body: [
      "Profess adalah alat latihan komunikasi, bukan profesional berlisensi.",
      "Karakter yang akan kamu temui adalah simulasi — dibuat terasa nyata, tapi bukan pengganti nasihat hukum, medis, psikologis, atau karier berlisensi.",
      "Anggap feedback sebagai perspektif partner latihan, bukan keputusan final.",
      "Jangan gunakan Profess sebagai dasar keputusan profesional yang sesungguhnya.",
    ], cta: "Saya mengerti — mulai sesi" },
    social: { title: "Sebelum kita mulai", body: [
      "Profess adalah alat latihan komunikasi, bukan profesional berlisensi.",
      "Orang yang akan kamu temui adalah simulasi — dibuat terasa nyata, tapi bukan pengganti nasihat hubungan atau kesehatan mental berlisensi.",
      "Anggap feedback sebagai perspektif partner latihan, bukan keputusan final.",
      "Jangan gunakan Profess sebagai dasar keputusan hubungan yang sesungguhnya.",
    ], cta: "Saya mengerti — mulai sesi" },
  },
};

const INTENSITY_LEVELS = {
  en: [
    { key: "comfortable", bars: 1, color: "#7A9A70", label: "Comfortable", desc: "Supportive — strengths alongside weaknesses." },
    { key: "challenging", bars: 2, color: ACCENT.formal, label: "Challenging", desc: "Rigorous and demanding. No softened feedback." },
    { key: "no_mercy", bars: 3, color: "#BC5A5A", label: "No Mercy", desc: "Maximum pressure. Every weak point is attacked." },
  ],
  id: [
    { key: "comfortable", bars: 1, color: "#7A9A70", label: "Nyaman", desc: "Suportif — kelebihan sekaligus kelemahan." },
    { key: "challenging", bars: 2, color: ACCENT.formal, label: "Menantang", desc: "Ketat dan menuntut. Tanpa feedback yang dilembutkan." },
    { key: "no_mercy", bars: 3, color: "#BC5A5A", label: "Tanpa Ampun", desc: "Tekanan maksimal. Setiap kelemahan diserang." },
  ],
};

const SCENARIOS = {
  formal: {
    en: [
      { group: "Academic", items: ["Thesis defense — examiner pushes on methodology", "Scholarship interview", "Conference Q&A after presenting research"] },
      { group: "Career", items: ["Job interview for a competitive role", "Salary negotiation with your manager", "Pitching a startup idea to an investor"] },
      { group: "Legal & Public", items: ["Cross-examination in a mock trial", "Press conference under journalist scrutiny", "Public hearing before a regulator"] },
    ],
    id: [
      { group: "Akademik", items: ["Sidang skripsi — penguji menekan metodologi", "Wawancara beasiswa", "Tanya-jawab konferensi setelah presentasi riset"] },
      { group: "Karier", items: ["Wawancara kerja untuk posisi kompetitif", "Negosiasi gaji dengan atasan", "Pitching ide startup ke investor"] },
      { group: "Hukum & Publik", items: ["Cross-examination dalam simulasi sidang", "Konferensi pers di bawah sorotan jurnalis", "Sidang dengar publik di hadapan regulator"] },
    ],
  },
  social: {
    en: [
      { group: "Relationships", items: ["Setting a boundary with a close friend", "First date conversation", "Reconnecting with an ex"] },
      { group: "Family", items: ["Telling a parent about a life decision they disagree with", "Difficult conversation with a sibling"] },
      { group: "Professional Casual", items: ["Awkward small talk with a new coworker", "Disagreeing with a colleague tactfully"] },
      { group: "Situational", items: ["Meeting someone new at a party", "Apologizing after a mistake"] },
    ],
    id: [
      { group: "Hubungan", items: ["Menetapkan batasan dengan teman dekat", "Obrolan first date", "Menyambung kembali dengan mantan"] },
      { group: "Keluarga", items: ["Memberitahu orang tua tentang keputusan hidup yang mereka tidak setujui", "Percakapan sulit dengan saudara"] },
      { group: "Profesional Santai", items: ["Small talk yang awkward dengan rekan baru", "Tidak setuju dengan kolega secara taktis"] },
      { group: "Situasional", items: ["Bertemu orang baru di pesta", "Meminta maaf setelah kesalahan"] },
    ],
  },
};

const MOOD_GLOW = {
  neutral: null, surprised: "#D8C8A8", amused: ACCENT.formal, thinking: "#A89878",
  skeptical: "#9A8460", serious: "#5A4438", uncomfortable: "#9A6050", listening: "#8AA080", warm: ACCENT.social,
};

// ─── Scene atmospheres — give each scenario group a distinct "set" (color
// wash, floor glow, drifting motes) without leaving the one-continuous-canvas
// model. Keyed by [mode][groupIndex], aligned positionally with SCENARIOS. ──
const SCENES = {
  formal: [
    { id: "academic", top: "#3A2E1C", bottom: "#0E0B08", floor: "#C8A05A", mote: "#D9B878" }, // library amber
    { id: "career",   top: "#2A2620", bottom: "#0E0D0A", floor: "#D9A05C", mote: "#C9A878" }, // office dusk
    { id: "legal",    top: "#241C14", bottom: "#0A0806", floor: "#B88A4A", mote: "#C8A86A" }, // mahogany/gold
  ],
  social: [
    { id: "relationships", top: "#3A2226", bottom: "#100A0A", floor: "#E08572", mote: "#E0A088" }, // candlelight rose
    { id: "family",        top: "#36281C", bottom: "#100C08", floor: "#D99860", mote: "#E0B080" }, // hearth orange
    { id: "professional",  top: "#2C2622", bottom: "#0E0C0A", floor: "#C9986A", mote: "#D4AC88" }, // cafe amber
    { id: "situational",   top: "#33222E", bottom: "#100A10", floor: "#C8789A", mote: "#D898AE" }, // dusk party
  ],
};
const DEFAULT_SCENE = { id: "default", top: "#2A2018", bottom: "#0E0B08", floor: "#C9985E", mote: "#D4AC80" };
const getScene = (mode, groupIdx) => {
  const list = SCENES[mode || "formal"];
  if (groupIdx == null || !list || !list[groupIdx]) return DEFAULT_SCENE;
  return list[groupIdx];
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital@1&family=Inter:wght@300;400;500&display=swap');
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html, body, #root { margin:0; padding:0; }
::-webkit-scrollbar { width:6px; height:6px; }
::-webkit-scrollbar-thumb { background:#2A241C; border-radius:3px; }
::-webkit-scrollbar-track { background:transparent; }
button { cursor:pointer; }
button:focus-visible { outline:1px solid ${ACCENT.formal}; outline-offset:2px; }
textarea:focus { outline:none; }
.input-glow { transition: border-color .25s ease, box-shadow .25s ease; }
.input-glow:focus { border-color: var(--ac, ${ACCENT.formal})99 !important; box-shadow: 0 0 0 3px var(--ac, ${ACCENT.formal})22; }

@keyframes fadeUp { from{opacity:0; transform:translateY(10px);} to{opacity:1; transform:translateY(0);} }
@keyframes charIn { from{opacity:0; transform:scale(.97);} to{opacity:1; transform:scale(1);} }
@keyframes grain { 0%,100%{transform:translate(0,0);} 10%{transform:translate(-1%,-2%);} 30%{transform:translate(2%,1%);} 50%{transform:translate(-1%,2%);} 70%{transform:translate(1%,-1%);} 90%{transform:translate(-2%,1%);} }
@keyframes idleBreathe { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-4px);} }
@keyframes coachNod { 0%,100%{transform:rotate(0deg);} 50%{transform:rotate(1.2deg);} }
@keyframes journalistSway { 0%,100%{transform:translateX(0) rotate(0deg);} 50%{transform:translateX(3px) rotate(.6deg);} }
@keyframes judgeTap { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-2px);} }
@keyframes friendBob { 0%,100%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(-5px) rotate(-.8deg);} }
@keyframes negotiatorLean { 0%,100%{transform:rotate(0deg);} 50%{transform:rotate(-1.4deg);} }
@keyframes moodSurprised { from{transform:scale(1);} to{transform:scale(1.03);} }
@keyframes moodAmused { 0%,100%{transform:rotate(0deg);} 50%{transform:rotate(1deg);} }
@keyframes moodSkeptical { 0%,100%{transform:translateX(0);} 50%{transform:translateX(-2px);} }
@keyframes moodSerious { 0%,100%{transform:scale(1);} 50%{transform:scale(.995);} }
@keyframes moodThinking { 0%,100%{transform:rotate(0deg);} 50%{transform:rotate(-1.5deg);} }
@keyframes moodWarm { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-2px);} }
@keyframes listenSettle { 0%,100%{transform:translateY(0);} 50%{transform:translateY(1px);} }
@keyframes moodUncomf { from{transform:translateX(0);} to{transform:translateX(-1.5px);} }
@keyframes auraBreath { 0%,100%{opacity:.35; transform:scale(1);} 50%{opacity:.55; transform:scale(1.06);} }
@keyframes auraRay { 0%,100%{opacity:.12;} 50%{opacity:.28;} }
@keyframes talkBody { 0%,100%{transform:scaleY(1);} 50%{transform:scaleY(1.01);} }
@keyframes breathe { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-3px);} }
@keyframes blink { 0%,96%,100%{transform:scaleY(1);} 98%{transform:scaleY(.1);} }
@keyframes eyeDrift { 0%,100%{transform:translateX(0);} 50%{transform:translateX(1px);} }
@keyframes gesturePoint { 0%,100%{transform:rotate(0deg);} 50%{transform:rotate(4deg);} }
@keyframes gestureOpen { 0%,100%{transform:scale(1);} 50%{transform:scale(1.02);} }
@keyframes gestureNegotiate { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-2px);} }
@keyframes browFlash { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-1.5px);} }
@keyframes panelIn { from{opacity:0; transform:translateY(14px);} to{opacity:1; transform:translateY(0);} }
@keyframes moteFloat { 0%{transform:translateY(0) translateX(0); opacity:0;} 10%{opacity:1;} 90%{opacity:1;} 100%{transform:translateY(-90vh) translateX(12px); opacity:0;} }
.mote { position:absolute; bottom:0; width:3px; height:3px; border-radius:50%; animation:moteFloat linear infinite; }
@media (prefers-reduced-motion: reduce) { .mote { animation:none; opacity:0 !important; } }

.msg-enter { animation: fadeUp .35s ease forwards; }
.char-enter { animation: charIn .38s ease forwards; }
.mic-active { box-shadow:0 0 0 3px rgba(188,90,90,.25); }
.grain-layer { position:fixed; inset:0; opacity:.025; pointer-events:none; z-index:1;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: grain 8s steps(10) infinite; }

@media (prefers-reduced-motion: reduce) {
  .char-enter, .msg-enter, .grain-layer { animation: none !important; }
}
`;

// ─── Icons ──────────────────────────────────────────────────────────────────
const IconVolume = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/><path d="M16 8a5 5 0 010 8M19 5a9 9 0 010 14" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>);
const IconMute = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/><path d="M23 9l-6 6M17 9l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>);
const IconMic = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0014 0M12 18v4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>);
const IconStop = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor"/></svg>);
const IconSend = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const IconArrowLeft = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const IconRefresh = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 12a9 9 0 11-2.64-6.36M21 4v6h-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>);

export default function Profess() {
  // ── Encounter-model state ───────────────────────────────────────────────
  const [stage, setStage] = useState("intro"); // intro|lang|mode|disclaimer|intensity|scenario|conversation|summary
  const [lang, setLang] = useState(null);
  const [sessionMode, setSessionMode] = useState(null);
  const [pendingMode, setPendingMode] = useState(null);
  const [intensity, setIntensity] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [sceneGroupIdx, setSceneGroupIdx] = useState(null);
  const [summary, setSummary] = useState(null);
  const [lastExchange, setLastExchange] = useState(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentRole, setCurrentRole] = useState("default");
  const [currentMood, setCurrentMood] = useState("neutral");
  const [isInRole, setIsInRole] = useState(false);
  const [charCache, setCharCache] = useState({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState(null);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const talkTimerRef = useRef(null);

  // ── Lean In — continuous press-and-hold intimacy gesture ────────────────
  const leanRaw = useMotionValue(0); // 0..1
  const lean = useSpring(leanRaw, { stiffness: 120, damping: 18 });
  const [isLeaning, setIsLeaning] = useState(false);
  const startLean = () => { setIsLeaning(true); leanRaw.set(1); };
  const endLean = () => { setIsLeaning(false); leanRaw.set(0); };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Tag extraction / parsing (preserved verbatim) ───────────────────────
  const extractRole = (t) => (t.match(/\[ROLE:(\w+)\]/) || [])[1] || null;
  const extractMood = (t) => (t.match(/\[MOOD:(\w+)\]/) || [])[1] || null;
  const extractMode = (t) => (t.match(/\[MODE:(\w+)\]/) || [])[1] || null;
  const extractInner = (t) => { const m = t.match(/\[INNER:(.*?)\]/); return m ? m[1].replace(/\*/g,"").trim() : null; };
  const extractChar = (t) => { const m = t.match(/\[CHAR:([^\]]+)\]/); return m ? m[1].trim() : null; };
  const extractTitle = (t) => { const m = t.match(/\[TITLE:([^\]]+)\]/); return m ? m[1].trim() : null; };
  const extractGender = (t) => { const m = t.match(/\[GENDER:(f|m)\]/); return m ? m[1] : null; };
  const cleanText = (t) => t
    .replace(/\[ROLE:\w+\]/g,"").replace(/\[MOOD:\w+\]/g,"")
    .replace(/\[MODE:\w+\]/g,"").replace(/\[INNER:.*?\]/g,"")
    .replace(/\[CHAR:[^\]]+\]/g,"").replace(/\[TITLE:[^\]]+\]/g,"")
    .replace(/\[GENDER:[^\]]+\]/g,"")
    .replace(/^---+$/gm, "").trim();

  const COACHING_RE = /^(COACHING|COACH|FEEDBACK|CATATAN|KOREKSI|ANALISIS|Giliran|Giliranmu|Sekarang giliran|Kamu yang|It's your turn|Your turn|Now it's)/i;

  const parseSegments = (text) => {
    const segments = [];
    const lines = text.split('\n');
    let inCoaching = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (/^---+$/.test(trimmed)) continue;
      if (COACHING_RE.test(trimmed)) { inCoaching = true; segments.push({ type: 'section_break' }); continue; }
      const stageMatch = trimmed.match(/^\(\((.*?)\)\)$/);
      if (stageMatch) { inCoaching = false; segments.push({ type: 'stage', text: stageMatch[1].trim() }); }
      else {
        const segType = inCoaching ? 'coaching' : 'dialog';
        const last = segments.length > 0 ? segments[segments.length-1] : null;
        if (last && last.type === segType) last.text += ' ' + trimmed;
        else segments.push({ type: segType, text: trimmed });
      }
    }
    return segments;
  };

  const scrubForSpeech = (text) => text
    .replace(/\[.*?\]/g, '').replace(/\(\(.*?\)\)/g, '').replace(/^---+$/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/_{1,2}(.*?)_{1,2}/g, '$1')
    .replace(/#{1,6}\s+/g, '').replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/—/g, ', ').replace(/–/g, ', ').replace(/ - /g, ', ').replace(/\.\.\./g, '. ')
    .replace(/[""]/g, '"').replace(/['']/g, "'").replace(/[*_~`#|>]/g, '')
    .replace(/\[|\]/g, '').replace(/\(|\)/g, '')
    .replace(/\n{2,}/g, '. ').replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim().substring(0, 700);

  const getVoiceProfile = useCallback((role, mood, inRole, isInnerThought = false) => {
    const voices = window.speechSynthesis?.getVoices() || [];
    const byName = (name) => voices.find(v => v.name === name);
    const isID = lang === "id";
    if (isID) {
      const idVoice = byName("Google Bahasa Indonesia") || voices.find(v => v.lang === "id-ID") || byName("Google UK English Male") || voices.find(v => v.lang?.startsWith("en"));
      let rate = 1.05, pitch = 1.0, volume = 0.92;
      if (!inRole) { rate = 1.0; pitch = 1.0; }
      if (isInnerThought) { rate = Math.max(0.80, rate - 0.12); volume = Math.max(0.38, volume - 0.34); pitch = Math.min(1.50, pitch + 0.15); }
      return { voice: idVoice, rate: Math.max(0.78, Math.min(1.3, rate)), pitch: Math.max(0.7, Math.min(1.3, pitch)), volume: Math.max(0.4, Math.min(1.0, volume)) };
    }
    let voice = !inRole ? (byName("Microsoft David - English (United States)") || byName("Google UK English Male")) : byName("Google UK English Male");
    if (!voice) voice = byName("Google US English") || voices.find(v=>v.lang?.startsWith("en"));
    let rate = 1.0, pitch = 1.0, volume = 0.92;
    if (!inRole) { rate = 1.05; pitch = 0.82; volume = 0.92; }
    if (isInnerThought) { rate = Math.max(0.80, rate - 0.12); volume = Math.max(0.38, volume - 0.34); pitch = Math.min(1.50, pitch + 0.15); }
    return { voice, rate: Math.max(0.78, Math.min(1.4, rate)), pitch: Math.max(0.7, Math.min(1.4, pitch)), volume: Math.max(0.4, Math.min(1.0, volume)) };
  }, [lang]);

  const speakSegments = useCallback((segments, role, mood, inRole) => {
    if (!speechEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices();
    const queue = segments.filter(s => s.text.trim());
    if (!queue.length) return;
    let idx = 0;
    const playNext = () => {
      if (idx >= queue.length) { setIsSpeaking(false); stopTalking(); return; }
      const seg = queue[idx++];
      const isStage = seg.type === 'stage';
      const isInner = seg.type === 'inner';
      const cleanedText = scrubForSpeech(seg.text);
      if (!cleanedText) { playNext(); return; }
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      const profile = isStage
        ? (() => { const cv = voices.find(v => v.name === 'Google UK English Male') || voices.find(v => v.lang?.startsWith('en')); return { voice: cv, rate: 0.92, pitch: 0.96, volume: 0.62 }; })()
        : getVoiceProfile(role, mood, inRole, isInner);
      if (profile.voice) utterance.voice = profile.voice;
      utterance.rate = profile.rate; utterance.pitch = profile.pitch; utterance.volume = profile.volume;
      utterance.onstart = () => { setIsSpeaking(true); if (!isStage && !isInner) startTalking(); else stopTalking(); };
      utterance.onend = () => playNext();
      utterance.onerror = () => playNext();
      utterance.onboundary = () => { if (!isStage && !isInner) { setIsTalking(true); setTimeout(() => setIsTalking(false), 160); } };
      window.speechSynthesis.speak(utterance);
    };
    const startQueue = () => { setIsSpeaking(true); playNext(); };
    if (voices.length > 0) startQueue(); else window.speechSynthesis.onvoiceschanged = startQueue;
  }, [speechEnabled, getVoiceProfile]);

  const speak = useCallback((text, role, mood, inRole, innerThought = null) => {
    if (!speechEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const segments = parseSegments(text);
    if (!segments.length && !innerThought) return;
    const allSegments = innerThought ? [...segments, { type: 'inner', text: innerThought }] : segments;
    speakSegments(allSegments, role, mood, inRole);
  }, [speechEnabled, speakSegments]);

  const startTalking = () => { setIsTalking(true); if (talkTimerRef.current) clearTimeout(talkTimerRef.current); };
  const stopTalking = () => { talkTimerRef.current = setTimeout(() => setIsTalking(false), 200); };
  const stopSpeech = () => { window.speechSynthesis?.cancel(); setIsSpeaking(false); setIsTalking(false); };

  const toggleMic = useCallback(() => {
    setMicError(null);
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setMicError("Speech recognition requires Chrome or Edge."); return; }
    stopSpeech();
    const r = new SR(); r.continuous = true; r.interimResults = true; r.lang = lang === "id" ? "id-ID" : "en-US";
    let final = "";
    r.onstart = () => setIsListening(true);
    r.onresult = (e) => { let interim=""; final=""; for(let i=0;i<e.results.length;i++){ if(e.results[i].isFinal) final+=e.results[i][0].transcript; else interim+=e.results[i][0].transcript; } setInput((final+interim).trim()); };
    r.onerror = (e) => { setIsListening(false); if(e.error==="not-allowed") setMicError("Mic access denied."); else if(e.error!=="aborted") setMicError("Mic error: "+e.error); };
    r.onend = () => { setIsListening(false); if(final.trim()) setTimeout(()=>document.getElementById("psend")?.click(),300); };
    recognitionRef.current = r; r.start();
  }, [isListening, lang]);

  const changeRoleAndMood = (newRole, newMood, newMode, charName, charTitle, charGender) => {
    const newInRole = newMode === "dialog";
    const roleChanged = newRole && newRole !== currentRole;
    if (roleChanged) {
      if (newRole !== "default" && !charCache[newRole]) {
        const generated = generateChar(newRole, charGender || null);
        generated.title = charTitle || ROLE_TITLES[newRole] || newRole;
        if (charName) generated.name = charName;
        setCharCache(prev => ({ ...prev, [newRole]: generated }));
      } else if ((charName || charTitle || charGender) && charCache[newRole]) {
        setCharCache(prev => ({ ...prev, [newRole]: { ...prev[newRole],
          ...(charName ? { name: charName } : {}), ...(charTitle ? { title: charTitle } : {}),
          ...(charGender ? { gender: charGender, hairLong: charGender === "f" } : {}) }}));
      }
      setTimeout(() => { setCurrentRole(newRole||currentRole); setCurrentMood(newMood||"neutral"); setIsInRole(newInRole); }, 380);
    } else {
      if (newMood) setCurrentMood(newMood);
      setIsInRole(newInRole);
      if ((charName || charTitle || charGender) && currentRole !== "default") {
        setCharCache(prev => ({ ...prev, [currentRole]: { ...(prev[currentRole]||{}),
          ...(charName ? { name: charName } : {}), ...(charTitle ? { title: charTitle } : {}),
          ...(charGender ? { gender: charGender, hairLong: charGender === "f" } : {}) }}));
      }
    }
  };

  const callAPI = async (msgs, mode, language, intensityLevel) => {
    const rawPrompt = PROMPTS[language||"en"][mode] || PROMPTS.en.formal;
    const systemPrompt = rawPrompt.replace(/\{\{INTENSITY\}\}/g, intensityLevel || "challenging");
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system: systemPrompt, messages: msgs.map(m => ({ role: m.role==="assistant"?"assistant":"user", content: m.content })) }) });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "API error");
    return data.content?.find(b=>b.type==="text")?.text || "";
  };

  const startSession = async (mode, selectedScenario = null) => {
    setSessionMode(mode); setStage("conversation"); setLoading(true); setError(null);
    try {
      const baseMsg = lang === "id" ? "Halo, saya ingin memulai sesi." : "Hello, I'd like to start a session.";
      const initMsg = selectedScenario
        ? (lang === "id" ? `${baseMsg} Skenario yang saya pilih: ${selectedScenario}` : `${baseMsg} My chosen scenario: ${selectedScenario}`)
        : baseMsg;
      const init = [{ role:"user", content:initMsg }];
      const text = await callAPI(init, mode, lang, intensity);
      const role = extractRole(text)||"default", mood = extractMood(text)||"neutral", modeTag = extractMode(text)||"coaching";
      const inner = extractInner(text), charName = extractChar(text), charTitle = extractTitle(text), charGender = extractGender(text);
      changeRoleAndMood(role, mood, modeTag, charName, charTitle, charGender);
      const clean = cleanText(text);
      setMessages([{ role:"user", content:initMsg }, { role:"assistant", content:clean, inRole:modeTag==="dialog", inner }]);
      speak(clean, role, mood, modeTag==="dialog", inner);
    } catch(e) { setError("Connection failed. Please try again."); }
    finally { setLoading(false); }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim(); setInput(""); if(textareaRef.current) textareaRef.current.style.height="48px";
    setError(null); stopSpeech();
    const newMsgs = [...messages, { role:"user", content:msg }]; setMessages(newMsgs); setLoading(true);
    setLastExchange({ userMsg: msg, msgIndex: newMsgs.length - 1 });
    try {
      const text = await callAPI(newMsgs, sessionMode, lang, intensity);
      const role = extractRole(text)||currentRole, mood = extractMood(text)||"neutral", modeTag = extractMode(text)||"coaching";
      const inner = extractInner(text), charName = extractChar(text), charTitle = extractTitle(text), charGender = extractGender(text);
      const resolvedRole = (role === "default" && modeTag === "coaching" && currentRole !== "default") ? currentRole : role;
      changeRoleAndMood(resolvedRole, mood, modeTag, charName, charTitle, charGender);
      const clean = cleanText(text);
      const inRole = modeTag==="dialog";
      if (clean.includes("[SUMMARY_START]")) {
        const summaryMatch = clean.match(/\[SUMMARY_START\]([\s\S]*?)\[SUMMARY_END\]/);
        if (summaryMatch) {
          setSummary(summaryMatch[1].trim());
          const withoutSummary = clean.replace(/\[SUMMARY_START\][\s\S]*?\[SUMMARY_END\]/, "").trim();
          setMessages([...newMsgs, { role:"assistant", content:withoutSummary, inRole, inner }]);
          speak(withoutSummary, role, mood, inRole);
          setTimeout(() => setStage("summary"), 1500);
          return;
        }
      }
      setMessages([...newMsgs, { role:"assistant", content:clean, inRole, inner }]);
      speak(clean, role, mood, inRole, inner);
    } catch(e) { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  const handleKeyDown = (e) => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();} };
  const handleTA = (e) => { setInput(e.target.value); e.target.style.height="48px"; e.target.style.height=Math.min(e.target.scrollHeight,160)+"px"; };
  const tryAgain = () => {
    if (!lastExchange) return;
    stopSpeech();
    setMessages(messages.slice(0, lastExchange.msgIndex));
    setInput(lastExchange.userMsg);
  };
  const endSession = () => {
    const endMsg = lang === "id" ? "Saya ingin mengakhiri sesi ini." : "I'd like to end this session.";
    setInput(endMsg);
    setTimeout(() => document.getElementById("psend")?.click(), 100);
  };
  const resetSession = () => {
    stopSpeech(); recognitionRef.current?.stop();
    setStage("lang"); setLang(null); setSessionMode(null); setPendingMode(null); setIntensity(null); setScenario(null); setSceneGroupIdx(null);
    setSummary(null); setLastExchange(null); setMessages([]); setInput(""); setError(null);
    setCurrentRole("default"); setCurrentMood("neutral"); setIsInRole(false); setIsListening(false); setMicError(null); setCharCache({});
  };

  const displayRole = (isInRole || currentRole !== "default") ? currentRole : "default";
  const charMeta = displayRole === "default"
    ? { ...CHARS.default, title: lang === "id" ? "Coach Kamu" : "Your Coach" }
    : (charCache[displayRole] || generateChar(displayRole));
  if (displayRole !== "default" && !charMeta.title) charMeta.title = ROLE_TITLES[displayRole] || displayRole;
  const presenceMood = getPresenceMood(currentMood, { loading, isListening });
  const charSVG = buildSVG(charMeta, presenceMood, isTalking && isSpeaking);
  const sessionAccent = sessionMode === "social" ? ACCENT.social : ACCENT.formal;
  const glowColor = MOOD_GLOW[presenceMood] || sessionAccent;
  const scene = getScene(sessionMode || pendingMode, sceneGroupIdx);

  // ── The character render — single shared anatomy used at every stage ────
  function CharacterFigure({ size = "min(62vh, 560px)" }) {
    const idleAnim = getIdleAnimation(displayRole);
    const moodAnim = getMoodAnimation(presenceMood, isTalking && isSpeaking);
    const talkAnim = (isTalking && isSpeaking) ? "talkBody .4s ease-in-out infinite" : null;
    const useRiveChar = displayRole === "default";
    return (
      <motion.div style={{ width: size, height: size, position: "relative" }}
        animate={{ scale: 1 }}>
        {glowColor && (
          <div style={{ position: "absolute", inset: "-20%", borderRadius: "50%",
            background: `radial-gradient(circle, ${glowColor}33 0%, transparent 70%)`,
            animation: "auraBreath 4s ease-in-out infinite", pointerEvents: "none" }} />
        )}
        {useRiveChar ? (
          <RiveCoach talking={isTalking && isSpeaking} listening={isListening} />
        ) : (
          <div className="char-enter" style={{ width: "100%", height: "100%", animation: `${idleAnim}${moodAnim ? ", "+moodAnim : ""}${talkAnim ? ", "+talkAnim : ""}` }}
            dangerouslySetInnerHTML={{ __html: charSVG }} />
        )}
      </motion.div>
    );
  }

  function msgList() {
    return messages.map((m, i) => {
      const segs = m.role === "assistant" ? parseSegments(m.content) : [{ type: "dialog", text: m.content }];
      const speakerLabel = m.role === "user" ? "You" : (m.inRole ? (charMeta.name || charMeta.title || displayRole) : "Profess");
      const speakerColor = m.role === "user" ? "#9C8E7C" : (m.inRole ? sessionAccent : INK);
      return (
        <div key={i} className="msg-enter" style={{ marginBottom: "22px" }}>
          <p style={{ fontSize: "10px", letterSpacing: ".08em", textTransform: "uppercase", color: speakerColor, marginBottom: "6px", opacity: .8 }}>{speakerLabel}</p>
          {segs.map((seg, j) => {
            if (seg.type === "section_break") return <div key={j} style={{ borderTop: "1px solid #1A1C20", margin: "10px 0", paddingTop: "8px" }}><span style={{ fontSize: "9px", letterSpacing: ".1em", color: "#5A5E66" }}>COACH</span></div>;
            if (seg.type === "stage") return <p key={j} style={{ fontStyle: "italic", color: "#6A6E76", fontSize: "13px", margin: "4px 0" }}>{seg.text}</p>;
            if (seg.type === "coaching") return <p key={j} style={{ fontStyle: "italic", color: INK, fontSize: "13px", margin: "4px 0", paddingLeft: "10px" }}>{seg.text}</p>;
            return <p key={j} style={{ color: "#E4E6EA", fontSize: "14px", lineHeight: 1.7, margin: "4px 0", paddingLeft: m.inRole ? "10px" : 0, borderLeft: m.inRole ? `2px solid ${sessionAccent}55` : "none" }}>{seg.text}</p>;
          })}
          {m.inner && <p style={{ fontSize: "12px", color: sessionAccent, opacity: .65, marginTop: "4px", paddingLeft: "10px", borderLeft: "1px solid #2A2C30" }}>{m.inner}</p>}
        </div>
      );
    });
  }

  // ── Overlay — text floats directly on the canvas, no card chrome.
  // A soft vertical scrim behind it (not a bordered box) keeps it legible
  // against the character without boxing it off as a separate "screen".
  // No bottom mask: a fade there would hide the final CTA when content is long.
  // `footer` (typically the CTA button) is rendered `position: sticky; bottom: 0`
  // inside the scroll container — it stays pinned in view the instant the panel
  // mounts, even when the body text is taller than the viewport, so the user
  // is never required to discover a scrollbar to find "continue".
  function Overlay({ children, footer, width = "min(520px, 90vw)", align = "left" }) {
    // Outer wrapper centers via flex (no transform), so Motion's own `y` animation
    // on the inner panel never collides with a manually-set translateY offset.
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 30, display: "flex", alignItems: "center",
        justifyContent: isMobile ? "center" : "flex-start", paddingLeft: isMobile ? 0 : "9%", pointerEvents: "none" }}>
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ width, maxHeight: "82vh", overflowY: "auto", textAlign: align, paddingTop: "10px", pointerEvents: "auto",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0, black 24px, black 100%)",
            maskImage: "linear-gradient(to bottom, transparent 0, black 24px, black 100%)" }}>
          {children}
          {footer && (
            <div style={{ position: "sticky", bottom: 0, paddingTop: "20px", paddingBottom: "16px",
              background: `linear-gradient(to top, ${BG} 0%, ${BG}cc 45%, transparent 100%)` }}>
              {footer}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  const progressDots = () => {
    const i = ONBOARDING_ORDER.indexOf(stage);
    if (i < 0) return null;
    return (
      <div style={{ display: "flex", gap: "5px", marginBottom: "22px" }}>
        {ONBOARDING_ORDER.map((s, idx) => (
          <motion.div key={s} layout
            animate={{ width: idx === i ? 20 : 8, background: idx === i ? sessionAccent : "#222428",
              boxShadow: idx === i ? `0 0 8px -1px ${sessionAccent}aa` : "0 0 0 0 transparent" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ height: "3px", borderRadius: "2px" }} />
        ))}
      </div>
    );
  };

  const backBtn = (to) => (
    <motion.button onClick={() => setStage(to)}
      whileHover={{ x: -3 }} whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      style={{ background: "none", border: "none", color: "#9C8E7C", fontSize: "10px", letterSpacing: ".08em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "5px", padding: 0, marginBottom: "18px" }}>
      <IconArrowLeft /> Back
    </motion.button>
  );

  // Stagger primitives (motion-patterns: 0.05–0.10s staggerChildren range)
  const listContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
  };
  const listItemV = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  };

  // Bare typographic choice — text-as-interface, no card fill, no border box.
  // A thin left rule lights up on hover/focus instead of a filled rectangle.
  // `bars` (1-3) renders a small intensity indicator next to the label.
  const ChoiceRow = ({ onClick, accent, children, sub, bars }) => (
    <motion.button onClick={onClick} variants={listItemV}
      onMouseEnter={(e)=>e.currentTarget.style.setProperty("--c","1")} onMouseLeave={(e)=>e.currentTarget.style.setProperty("--c","0")}
      whileHover={{ x: 4, boxShadow: `inset 0 0 0 0 transparent, 0 0 16px -6px ${accent || sessionAccent}66` }}
      whileTap={{ scale: 0.985, x: 2 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "9px 0 9px 16px",
        borderLeft: `1px solid #24262A`, position: "relative" }}>
      <span style={{ position: "absolute", left: "-1px", top: 0, bottom: 0, width: "1px", background: accent || sessionAccent,
        transform: "scaleY(var(--c, 0))", transformOrigin: "top", transition: "transform .25s ease" }} />
      <span style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        <span style={{ color: "#E6E8EC", fontSize: "15px", display: "block" }}>{children}</span>
        {bars && (
          <span style={{ display: "inline-flex", gap: "3px", marginLeft: "2px" }}>
            {[1, 2, 3].map(i => (
              <span key={i} style={{ width: "4px", height: "10px", borderRadius: "1px",
                background: i <= bars ? (accent || sessionAccent) : "#2A2C30" }} />
            ))}
          </span>
        )}
      </span>
      {sub && <span style={{ color: "#9C8E7C", fontSize: "12px", display: "block", marginTop: "2px" }}>{sub}</span>}
    </motion.button>
  );

  // ── Stage overlay content ────────────────────────────────────────────────
  function StageOverlay() {
    if (stage === "intro") return (
      <Overlay footer={
        <motion.button onClick={() => setStage("lang")}
          whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: "none", border: "none", color: sessionAccent, fontSize: "15px",
          fontFamily: "'Playfair Display',serif", fontStyle: "italic", padding: 0, borderBottom: `1px solid ${sessionAccent}55` }}>
          Begin →
        </motion.button>
      }>
        <motion.h1
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.045 } } }}
          style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(32px,5vw,46px)", color: "#F0EDE6", marginBottom: "14px", letterSpacing: "-0.02em" }}>
          {"Profess".split("").map((ch, i) => (
            <motion.span key={i} style={{ display: "inline-block" }}
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}>
              {ch}
            </motion.span>
          ))}
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ color: INK, fontSize: "14px", lineHeight: 1.8, maxWidth: "38ch" }}>
          Practice the conversation before it happens. A presence that reacts to you, presses back, and tells you what it really felt.
        </motion.p>
      </Overlay>
    );

    if (stage === "lang") return (
      <Overlay>
        {progressDots()}
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: "24px", color: "#F0EDE6", marginBottom: "20px" }}>Language</h2>
        <motion.div initial="hidden" animate="visible" variants={listContainer}>
          {[{ code: "en", name: "English" }, { code: "id", name: "Indonesian" }].map(opt => (
            <ChoiceRow key={opt.code} onClick={() => { setLang(opt.code); if (opt.code === "id") setSpeechEnabled(false); setStage("mode"); }}>
              {opt.name}
            </ChoiceRow>
          ))}
        </motion.div>
      </Overlay>
    );

    if (stage === "mode") return (
      <Overlay>
        {backBtn("lang")}
        {progressDots()}
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: "24px", color: "#F0EDE6", marginBottom: "20px" }}>Mode</h2>
        <motion.div initial="hidden" animate="visible" variants={listContainer}>
          {[{ key: "formal", label: "Formal", accent: ACCENT.formal, sub: "High-stakes — interviews, panels, negotiations" },
            { key: "social", label: lang === "id" ? "Sosial" : "Social", accent: ACCENT.social, sub: "Interpersonal — friends, family, first impressions" }].map(opt => (
            <ChoiceRow key={opt.key} accent={opt.accent} sub={opt.sub} onClick={() => { setPendingMode(opt.key); setStage("disclaimer"); }}>
              {opt.label}
            </ChoiceRow>
          ))}
        </motion.div>
      </Overlay>
    );

    if (stage === "disclaimer") {
      const c = disclaimerContent[lang || "en"][pendingMode || "formal"];
      return (
        <Overlay footer={
          <motion.button onClick={() => setStage("intensity")}
            whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: "none", border: "none", color: sessionAccent, fontSize: "13px", padding: 0, borderBottom: `1px solid ${sessionAccent}55` }}>
            {c.cta} →
          </motion.button>
        }>
          {backBtn("mode")}
          {progressDots()}
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: "22px", color: "#F0EDE6", marginBottom: "16px" }}>{c.title}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "22px" }}>
            {c.body.map((p, i) => <p key={i} style={{ fontSize: "13px", lineHeight: 1.7, color: INK }}>{p}</p>)}
          </div>
        </Overlay>
      );
    }

    if (stage === "intensity") return (
      <Overlay>
        {backBtn("disclaimer")}
        {progressDots()}
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: "22px", color: "#F0EDE6", marginBottom: "20px" }}>{lang === "id" ? "Intensitas" : "Intensity"}</h2>
        <motion.div initial="hidden" animate="visible" variants={listContainer}>
          {INTENSITY_LEVELS[lang || "en"].map(lvl => (
            <ChoiceRow key={lvl.key} accent={lvl.color} sub={lvl.desc} bars={lvl.bars} onClick={() => { setIntensity(lvl.key); setStage("scenario"); }}>
              {lvl.label}
            </ChoiceRow>
          ))}
        </motion.div>
      </Overlay>
    );

    if (stage === "scenario") {
      const groups = SCENARIOS[pendingMode || "formal"][lang || "en"];
      return (
        <Overlay width="min(560px, 90vw)">
          {backBtn("intensity")}
          {progressDots()}
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: "22px", color: "#F0EDE6", marginBottom: "14px" }}>{lang === "id" ? "Skenario" : "Scenario"}</h2>
          <motion.button onClick={() => { setScenario(null); setSceneGroupIdx(null); startSession(pendingMode, null); }}
            whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: "none", border: "none", color: sessionAccent, fontSize: "12px", padding: 0, marginBottom: "20px", borderBottom: `1px dashed ${sessionAccent}55` }}>
            {lang === "id" ? "Mulai bebas — tanpa skenario" : "Start free — no scenario"} →
          </motion.button>
          <motion.div initial="hidden" animate="visible" variants={listContainer} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {groups.map((g, gi) => (
              <div key={gi}>
                <p style={{ fontSize: "10px", letterSpacing: ".1em", textTransform: "uppercase", color: "#5A5E66", marginBottom: "4px" }}>{g.group}</p>
                {g.items.map((item, ii) => (
                  <ChoiceRow key={ii} onClick={() => { setScenario(item); setSceneGroupIdx(gi); startSession(pendingMode, item); }}>{item}</ChoiceRow>
                ))}
              </div>
            ))}
          </motion.div>
        </Overlay>
      );
    }

    if (stage === "summary") return (
      <Overlay footer={
        <motion.button onClick={resetSession}
          whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: "none", border: "none", color: sessionAccent, fontSize: "13px", padding: 0, borderBottom: `1px solid ${sessionAccent}55` }}>
          {lang === "id" ? "Sesi baru" : "New session"} →
        </motion.button>
      }>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: "26px", color: "#F0EDE6", marginBottom: "16px" }}>{lang === "id" ? "Ringkasan" : "Summary"}</h2>
        <p style={{ fontSize: "13px", lineHeight: 1.8, color: INK, whiteSpace: "pre-wrap" }}>{summary}</p>
      </Overlay>
    );

    return null;
  }

  const inConversation = stage === "conversation";

  return (
    <div style={{ minHeight: "100vh", height: "100vh", overflow: "hidden", background: BG, color: "#F0EDE6", fontFamily: "'Inter',sans-serif", fontWeight: 300, position: "relative" }}>
      <style>{css}</style>
      <div className="grain-layer" />

      {/* Scene wash — the "set": a slow top-to-bottom gradient unique to the
          current scenario group, transitioning smoothly when the scene changes
          (new session, new scenario) without ever breaking the single canvas. */}
      <motion.div key={scene.id} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(165deg, ${scene.top} 0%, ${scene.bottom} 60%, #0A0807 100%)` }} />
        {/* Floor glow — a warm pool of light beneath where the character stands */}
        <div style={{ position: "absolute", left: "50%", bottom: "-6%", width: "min(70vw, 760px)", height: "32vh", transform: "translateX(-50%)",
          background: `radial-gradient(ellipse at center, ${scene.floor}26 0%, transparent 72%)`, filter: "blur(2px)" }} />
        {/* Drifting motes — tiny warm particles for atmosphere, purely decorative */}
        {[...Array(7)].map((_, mi) => (
          <span key={mi} className="mote" style={{
            left: `${10 + mi * 12.5}%`, animationDelay: `${mi * 1.3}s`, animationDuration: `${9 + (mi % 4) * 2}s`,
            background: scene.mote, opacity: 0.18 + (mi % 3) * 0.06 }} />
        ))}
      </motion.div>

      {/* Persistent ambient light field — encodes warmth/lean/mood, layered above the scene wash */}
      <motion.div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(circle at 78% 62%, ${glowColor || sessionAccent}22 0%, transparent 55%)` }}
        animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />

      {/* Persistent character — always rendered, never unmounted across stages.
          Centered and dominant before the session begins; drifts to the edge
          once conversation starts, making room for the transcript margin. */}
      <motion.div
        initial={false}
        animate={inConversation
          ? { left: isMobile ? "50%" : "94%", top: isMobile ? "8%" : "50%", x: isMobile ? "-50%" : "-100%", y: isMobile ? "0%" : "-50%" }
          : { left: "50%", top: "50%", x: "-50%", y: "-50%" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "absolute", zIndex: 2 }}
        onPointerDown={inConversation ? startLean : undefined}
        onPointerUp={inConversation ? endLean : undefined}
        onPointerLeave={inConversation ? endLean : undefined}>
        <motion.div style={{ scale: lean }}>
          <CharacterFigure size={isMobile ? "min(46vh, 320px)" : (inConversation ? "min(58vh, 520px)" : "min(74vh, 640px)")} />
        </motion.div>
        {inConversation && (
          <div style={{ position: "absolute", bottom: "8%", left: "50%", transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
            <p style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: "18px", color: "#F0EDE6" }}>{charMeta.name || charMeta.title}</p>
            <p style={{ fontSize: "11px", color: "#9C8E7C", marginTop: "2px" }}>{charMeta.title}</p>
            {isLeaning && <p style={{ fontSize: "10px", letterSpacing: ".08em", color: sessionAccent, marginTop: "6px", textTransform: "uppercase" }}>{lang === "id" ? "mendekat..." : "leaning in..."}</p>}
          </div>
        )}
      </motion.div>

      {/* Conversation margin — transcript demoted to a thin recallable strip */}
      {inConversation && (
        <>
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
            <motion.button onClick={() => setStage("intro")} whileHover={{ opacity: 0.7 }} whileTap={{ scale: 0.96 }}
              style={{ background: "none", border: "none", color: "#9C8E7C", fontSize: "13px", fontFamily: "'Inter',sans-serif" }}>Profess</motion.button>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <motion.button onClick={() => setTranscriptOpen(o => !o)}
                whileHover={{ borderColor: `${sessionAccent}88`, color: "#F0EDE6" }} whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.18 }}
                style={{ background: "none", border: "1px solid #2A241C", borderRadius: "8px", color: "#AFA290", fontSize: "11px", padding: "6px 10px" }}>
                {transcriptOpen ? (lang === "id" ? "Sembunyikan" : "Hide transcript") : (lang === "id" ? "Transkrip" : "Transcript")}
              </motion.button>
              <motion.button onClick={() => setSpeechEnabled(s => !s)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                style={{ background: "none", border: "none", color: "#AFA290" }}>{speechEnabled ? <IconVolume/> : <IconMute/>}</motion.button>
              <motion.button onClick={resetSession} whileHover={{ scale: 1.1, rotate: -25 }} whileTap={{ scale: 0.9 }}
                style={{ background: "none", border: "none", color: "#AFA290" }}><IconRefresh/></motion.button>
            </div>
          </motion.div>

          <AnimatePresence>
            {transcriptOpen && (
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}
                style={{ position: "absolute", left: 0, top: "72px", bottom: "150px", width: isMobile ? "92vw" : "min(42%, 520px)", padding: "0 28px", overflowY: "auto", zIndex: 8,
                  WebkitMaskImage: "linear-gradient(to bottom, transparent 0, black 32px, black calc(100% - 32px), transparent 100%)",
                  maskImage: "linear-gradient(to bottom, transparent 0, black 32px, black calc(100% - 32px), transparent 100%)" }}>
                {msgList()}
                {loading && <p style={{ fontSize: "12px", color: "#9C8E7C" }}>{lang === "id" ? "..." : "thinking..."}</p>}
                {error && <p style={{ fontSize: "12px", color: "#BC5A5A" }}>{error}</p>}
                <div ref={chatEndRef} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input bar — always present at the bottom, the one constant control surface */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "16px 28px 22px", zIndex: 10, background: "linear-gradient(to top, rgba(7,8,9,0.92), transparent)" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginBottom: "8px" }}>
              {lastExchange && <motion.button onClick={tryAgain} whileHover={{ opacity: 0.7 }} whileTap={{ scale: 0.95 }} style={{ background: "none", border: "none", color: "#9C8E7C", fontSize: "11px" }}>{lang === "id" ? "Coba lagi" : "Try again"}</motion.button>}
              <motion.button onClick={endSession} whileHover={{ opacity: 0.7 }} whileTap={{ scale: 0.95 }} style={{ background: "none", border: "none", color: "#9C8E7C", fontSize: "11px" }}>{lang === "id" ? "Akhiri" : "End session"}</motion.button>
            </div>
            {micError && <p style={{ color: "#BC5A5A", fontSize: "11px", marginBottom: "6px" }}>{micError}</p>}
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
              <textarea ref={textareaRef} value={input} onChange={handleTA} onKeyDown={handleKeyDown}
                placeholder={lang === "id" ? "Tulis balasanmu..." : "Type your response..."}
                className="input-glow" style={{ "--ac": sessionAccent, flex: 1, minHeight: "48px", maxHeight: "160px", resize: "none", background: "#1A1510",
                  border: isListening ? "1px solid #7A4040" : "1px solid #2A241C", borderRadius: "12px", color: "#F0EDE6",
                  padding: "13px 14px", fontFamily: "inherit", fontSize: "14px" }} />
              {isSpeaking && <motion.button onClick={stopSpeech} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }} style={{ background: "#1A1510", border: "1px solid #2A241C", borderRadius: "10px", padding: "12px", color: "#AFA290" }}><IconStop/></motion.button>}
              <motion.button onClick={toggleMic} className={isListening ? "mic-active" : ""} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}
                style={{ background: "#1A1510", border: "1px solid #2A241C", borderRadius: "10px", padding: "12px", color: isListening ? "#BC5A5A" : "#AFA290" }}><IconMic/></motion.button>
              <motion.button id="psend" onClick={sendMessage} disabled={loading || !input.trim()} whileHover={!loading && input.trim() ? { scale: 1.06 } : {}} whileTap={!loading && input.trim() ? { scale: 0.9 } : {}}
                style={{ background: sessionAccent, border: "none", borderRadius: "10px", padding: "12px 16px", color: "#15110C", opacity: loading || !input.trim() ? .4 : 1 }}><IconSend/></motion.button>
            </div>
          </div>
        </>
      )}

      {/* Onboarding / summary overlays — dissolve in place over the same persistent canvas */}
      <AnimatePresence mode="wait">
        {!inConversation && <StageOverlay key={stage} />}
      </AnimatePresence>
    </div>
  );
}
