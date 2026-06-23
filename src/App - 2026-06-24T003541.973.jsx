import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useMotionTemplate, useTransform, useReducedMotion } from "motion/react";
import { CHARS, MOOD_DATA, generateChar, ROLE_TITLES, buildSVG, pick, getIdleAnimation, getMoodAnimation, getPresenceMood } from "./character/index.js";

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
const ONBOARDING_LABELS = {
  en: { lang: "Language", mode: "Mode", disclaimer: "Context", intensity: "Intensity", scenario: "Scenario" },
  id: { lang: "Bahasa", mode: "Mode", disclaimer: "Konteks", intensity: "Intensitas", scenario: "Skenario" },
};

const INFO_CONTENT = {
  en: {
    about: {
      title: "About Profess",
      body: "Profess is a rehearsal space, not a chatbot. You pick a person and a moment — an interviewer, a parent, an ex — and it plays that role back at you, in character, before stepping out to tell you what actually landed. The point isn't a perfect script. It's walking into the real conversation having already felt the harder version of it once.",
    },
    guide: {
      title: "Guide",
      steps: [
        { label: "1. Mode", text: "Formal for interviews and panels, Social for the people already in your life." },
        { label: "2. Intensity", text: "How hard you want it pushed — supportive, demanding, or no mercy at all." },
        { label: "3. Scenario", text: "Pick the one closest to what you're actually walking into." },
        { label: "4. The conversation", text: "Talk or type; the other side answers in character, then steps out briefly after each exchange to tell you what worked and what didn't." },
      ],
    },
    terms: {
      title: "Terms",
      body: "Profess is a practice tool, not professional advice — legal, medical, or otherwise. Conversations are generated and may not reflect how a real counterpart would respond. Don't paste in anything you wouldn't want stored by a third-party AI provider. Be respectful with the tool; it's built to help you prepare, not to vent at.",
    },
  },
  id: {
    about: {
      title: "Tentang Profess",
      body: "Profess adalah tempat berlatih, bukan chatbot biasa. Anda memilih siapa dan situasi apa — pewawancara, orang tua, mantan — dan Profess memerankan sosok itu sesuai konteks, sebelum keluar dari peran untuk memberi tahu apa yang sebenarnya terasa. Tujuannya bukan naskah yang sempurna, melainkan masuk ke percakapan yang sesungguhnya setelah pernah merasakan versi yang lebih sulitnya.",
    },
    guide: {
      title: "Panduan",
      steps: [
        { label: "1. Mode", text: "Formal untuk wawancara dan panel, Sosial untuk orang-orang yang sudah ada dalam hidup Anda." },
        { label: "2. Intensitas", text: "Seberapa keras tekanannya — suportif, menuntut, atau tanpa ampun sama sekali." },
        { label: "3. Skenario", text: "Pilih yang paling mendekati situasi yang sesungguhnya Anda hadapi." },
        { label: "4. Percakapan", text: "Bicara atau ketik; lawan bicara menjawab sesuai perannya, lalu keluar dari peran sebentar setelah setiap pertukaran untuk memberi tahu apa yang berhasil dan apa yang belum." },
      ],
    },
    terms: {
      title: "Ketentuan",
      body: "Profess adalah alat latihan, bukan nasihat profesional — baik hukum, medis, maupun lainnya. Percakapan dihasilkan oleh AI dan mungkin tidak mencerminkan respons orang sungguhan. Jangan menempelkan informasi yang tidak ingin Anda simpan di penyedia AI pihak ketiga. Gunakan dengan hormat; alat ini dibuat untuk membantu Anda bersiap, bukan untuk melampiaskan emosi.",
    },
  },
};

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
    { key: "comfortable", bars: 1, color: "#7A9A70", label: "Comfortable", desc: "It'll name your strengths along with what still needs work." },
    { key: "challenging", bars: 2, color: ACCENT.formal, label: "Challenging", desc: "Demanding, and it won't soften the feedback for you." },
    { key: "no_mercy", bars: 3, color: "#BC5A5A", label: "No Mercy", desc: "Full pressure. It will find the weak point and press on it." },
  ],
  id: [
    { key: "comfortable", bars: 1, color: "#7A9A70", label: "Nyaman", desc: "Akan menyebut kelebihan Anda sambil tetap menunjukkan yang masih perlu diperbaiki." },
    { key: "challenging", bars: 2, color: ACCENT.formal, label: "Menantang", desc: "Menuntut, dan masukannya tidak akan dilunakkan untuk Anda." },
    { key: "no_mercy", bars: 3, color: "#BC5A5A", label: "Tanpa Ampun", desc: "Tekanan penuh. Titik lemah Anda akan ditemukan dan ditekan terus." },
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

// ─── Soundbite teasers — a one-line hint of the opening beat the in-role
// character might open with, revealed on hover/focus over a scenario. Not a
// transcript preview (nothing is scripted) — just a taste of the tone before
// committing. Indexed positionally with SCENARIOS[mode][lang][groupIndex].
const SCENARIO_TEASERS = {
  formal: {
    en: [
      ["\"Walk me through why this method, and not the obvious alternative.\"", "\"Tell me about a time you failed, and what it cost you.\"", "\"You have two minutes. Make me care.\""],
      ["\"Convince me you're not just the safest hire in the room.\"", "\"Give me a number, then justify it without flinching.\"", "\"Why should I bet on you over someone with a track record?\""],
      ["\"Isn't it true your client knew exactly what they were doing?\"", "\"Off the record — do you actually believe your own statement?\"", "\"This board has heard that excuse before. What's different now?\""],
    ],
    id: [
      ["\"Jelaskan kenapa metode ini, bukan alternatif yang lebih jelas.\"", "\"Ceritakan saat Anda gagal, dan apa konsekuensinya.\"", "\"Anda punya dua menit. Buat saya peduli.\""],
      ["\"Yakinkan saya Anda bukan sekadar pilihan paling aman.\"", "\"Sebutkan angkanya, lalu pertahankan tanpa ragu.\"", "\"Kenapa saya harus percaya pada Anda dibanding yang sudah berpengalaman?\""],
      ["\"Bukankah klien Anda tahu betul apa yang mereka lakukan?\"", "\"Di luar rekaman — apa Anda sendiri percaya pernyataan Anda?\"", "\"Dewan ini sudah dengar alasan itu. Apa yang berbeda sekarang?\""],
    ],
  },
  social: {
    en: [
      ["\"So what exactly are you trying to tell me right now?\"", "\"Wow. I wasn't expecting you to actually say that.\"", "\"It's been a while. Why now, of all times?\""],
      ["\"You knew I wouldn't be okay with this. Why tell me anyway?\"", "\"We don't usually talk like this. What's going on?\""],
      ["\"Oh — I didn't realize we were doing small talk today.\"", "\"So, do you actually disagree, or are you just being polite?\""],
      ["\"And who exactly are you, again?\"", "\"I'm listening. But this better be a real apology.\""],
    ],
    id: [
      ["\"Jadi sebenarnya apa yang ingin kamu sampaikan?\"", "\"Wah. Aku nggak nyangka kamu bakal bilang itu.\"", "\"Udah lama ya. Kenapa baru sekarang?\""],
      ["\"Kamu tahu aku nggak akan setuju. Kenapa tetap bilang?\"", "\"Kita biasanya nggak ngomong kayak gini. Ada apa?\""],
      ["\"Oh — aku kira kita cuma basa-basi hari ini.\"", "\"Jadi kamu beneran nggak setuju, atau cuma sungkan?\""],
      ["\"Dan kamu siapa lagi, ya?\"", "\"Aku dengar. Tapi ini harus jadi permintaan maaf yang tulus.\""],
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
// Each scene's `backdrop` lists its own dedicated photo(s), placed by hand in
// public/video/ (filenames carry no spaces or dashes). "situational" has no
// shoot of its own — it borrows whichever existing scene reads closest.
const SCENES = {
  formal: [
    { id: "academic", top: "#3A2E1C", bottom: "#0E0B08", floor: "#C8A05A", mote: "#D9B878", // library amber
      backdrop: ["academic.jpg", "academic2.jpg", "academic3.jpg"] },
    { id: "career",   top: "#2A2620", bottom: "#0E0D0A", floor: "#D9A05C", mote: "#C9A878", // office dusk
      backdrop: ["career.jpg", "career2.jpg", "career3.jpg"] },
    { id: "legal",    top: "#241C14", bottom: "#0A0806", floor: "#B88A4A", mote: "#C8A86A", // mahogany/gold
      backdrop: ["legal.jpg", "legal2.jpg", "legal3.jpg"] },
  ],
  social: [
    { id: "relationships", top: "#3A2226", bottom: "#100A0A", floor: "#E08572", mote: "#E0A088", // candlelight rose
      backdrop: ["relationship.jpg", "relationship2.jpg", "relationship3.jpg", "relationship4.jpg"] },
    { id: "family",        top: "#36281C", bottom: "#100C08", floor: "#D99860", mote: "#E0B080", // hearth orange
      backdrop: ["family.jpg", "family2.jpg", "family3.jpg", "family4.jpg"] },
    { id: "professional",  top: "#2C2622", bottom: "#0E0C0A", floor: "#C9986A", mote: "#D4AC88", // cafe amber
      backdrop: ["professionalcasual.jpg", "professionalcasual2.jpg"] },
    { id: "situational",   top: "#33222E", bottom: "#100A10", floor: "#C8789A", mote: "#D898AE", // dusk party
      backdrop: ["situational.jpg", "situational2.jpg", "situational3.jpg"] },
  ],
};
const DEFAULT_SCENE = { id: "default", top: "#2A2018", bottom: "#0E0B08", floor: "#C9985E", mote: "#D4AC80", backdrop: ["academic.jpg"] };

const getScene = (mode, groupIdx) => {
  const list = SCENES[mode || "formal"];
  if (groupIdx == null || !list || !list[groupIdx]) return DEFAULT_SCENE;
  return list[groupIdx];
};

// ─── Real photography, sourced by deterministic seed (LoremFlickr: real
// stock photographs, no API key, stable per "lock" id) — used as a soft
// "set" layer behind the character. Not literal scenario photography —
// atmosphere, not illustration. Seeded by scene.id (hashed to a numeric
// lock) so the same scene always shows the same backdrop across a session.
// Switched from Picsum after its host started timing out for users.
//
// ─── Cinematic intro loop (Coverr, free/no-attribution) — played once at the
// top of the page, scrubbed by scroll position rather than autoplaying on a
// timer. See the IntroVideo component below.
// Google Cloud public test video — known to work for cross-origin embed.
const VIDEO_SRC = "/video/mountain-loop.mp4";
const VIDEO_SRC_MOBILE = "/video/mountain-loop-mobile.mp4";
const VIDEO_FALLBACK = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital@1&family=Inter:wght@300;400;500&display=swap');
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
/* position:fixed + inset:0 instead of height:100% — on iOS Safari a
   height:100% body can still be scrolled by the OS when a text input
   focuses (it "scroll-into-views" the whole document even with
   overflow:hidden). Fixed positioning is exempt from that nudge, which is
   the actual cause of the whole page sliding down when the keyboard opens. */
html, body, #root { margin:0; padding:0; position:fixed; inset:0; width:100%; height:100%; overflow:hidden; overscroll-behavior:none; }
/* Mobile browser chrome (address/toolbar) can float over the page instead of
   reserving space for itself. 100dvh can momentarily report the larger,
   chrome-covered height; 100svh is the guaranteed-visible minimum, so it's
   the safest final value. Declared as three rules so unsupported engines
   fall back to the previous (still valid) line instead of breaking. */
.app-shell { height: 100vh; min-height: 100vh; }
.app-shell { height: 100dvh; min-height: 100dvh; }
.app-shell { height: 100svh; min-height: 100svh; }
::-webkit-scrollbar { width:6px; height:6px; }
::-webkit-scrollbar-thumb { background:#2A241C; border-radius:3px; }
::-webkit-scrollbar-track { background:transparent; }
button { cursor:pointer; }
button:focus-visible { outline:1px solid ${ACCENT.formal}; outline-offset:2px; }
textarea:focus { outline:none; }
.input-glow { transition: border-color .25s ease, box-shadow .25s ease; }
.input-glow:focus { border-color: var(--ac, ${ACCENT.formal})99 !important; box-shadow: 0 0 0 3px var(--ac, ${ACCENT.formal})22; }

.footer-link { position: relative; transition: color .25s ease; }
.footer-link::after { content: ""; position: absolute; left: 0; bottom: -3px; width: 100%; height: 1px;
  background: currentColor; transform: scaleX(0); transform-origin: left; transition: transform .25s cubic-bezier(.22,1,.36,1); }
.footer-link:hover::after, .footer-link:focus-visible::after { transform: scaleX(1); }

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
@media (prefers-reduced-motion: reduce) { .char-enter, .char-gallery-enter { animation:none !important; } }

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
const IconArrowRight = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const IconRefresh = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 12a9 9 0 11-2.64-6.36M21 4v6h-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const IconSpeaker = ({ muted }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M4 9v6h4l5 5V4L8 9H4z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    {muted
      ? <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      : <path d="M16.5 8.5a5 5 0 010 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>}
  </svg>
);

// ─── UI sound effect pool — short synthesized tones for discrete moments
// (send, receive, choice select, mic on/off, error). Same zero-external-
// asset policy as the ambient bed: everything is generated on a shared
// AudioContext so there's no audio file to host or license.
let _sfxCtx = null;
function getSfxCtx() {
  if (!_sfxCtx) _sfxCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_sfxCtx.state === "suspended") _sfxCtx.resume();
  return _sfxCtx;
}
function tone(ctx, { freq, start, dur, type = "sine", gain = 0.05, glideTo }) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + dur);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(start); osc.stop(start + dur + 0.02);
}
const SFX = {
  send:    (ctx, t) => tone(ctx, { freq: 520, glideTo: 760, start: t, dur: 0.12, type: "sine", gain: 0.04 }),
  receive: (ctx, t) => tone(ctx, { freq: 380, glideTo: 300, start: t, dur: 0.16, type: "sine", gain: 0.045 }),
  select:  (ctx, t) => tone(ctx, { freq: 660, start: t, dur: 0.11, type: "triangle", gain: 0.09 }),
  micOn:   (ctx, t) => tone(ctx, { freq: 440, glideTo: 620, start: t, dur: 0.1, type: "sine", gain: 0.04 }),
  micOff:  (ctx, t) => tone(ctx, { freq: 460, glideTo: 280, start: t, dur: 0.1, type: "sine", gain: 0.04 }),
  error:   (ctx, t) => { tone(ctx, { freq: 220, start: t, dur: 0.18, type: "sawtooth", gain: 0.03 }); tone(ctx, { freq: 180, start: t + 0.09, dur: 0.18, type: "sawtooth", gain: 0.03 }); },
};
function playSfx(name) {
  try { const ctx = getSfxCtx(); SFX[name]?.(ctx, ctx.currentTime); } catch { /* no audio context available */ }
}

// ─── Ambient room tone — a synthesized, near-silent bed of filtered noise
// that fades in per scene (no external audio asset, no autoplay violation:
// it only ever starts from a user gesture on the mute toggle). Color of the
// filter drifts with the session accent so it "matches" formal vs social
// scenes without sounding like two different tracks.
// iOS Safari only allows AudioContext creation/resume synchronously inside the
// gesture handler itself — deferring it to a React effect (as the previous
// version did) silently fails on mobile even though `enabled` flips fine, which
// is why ambient sound looked desktop-only. Sharing one context here lets the
// gesture-arm handler below resume() it directly, in-stack, before any state
// update is scheduled.
let _sharedAudioCtx = null;
function getSharedAudioCtx() {
  if (!_sharedAudioCtx) _sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _sharedAudioCtx;
}

// Four synthesized room-tone variants, all generated the same no-asset way as
// the original brown-noise bed. One is picked at random per page load/session
// (see ambientVariant below) and held fixed for the rest of that session — the
// "variety" is across visits, not a mid-session switch, since switching the
// texture under a user mid-conversation would read as a glitch, not variety.
const AMBIENT_VARIANTS = {
  // Original: warm, low rumble — gentle low-pass-filtered brown noise.
  brown: {
    filterType: "lowpass", baseFreq: 420,
    fill: (data, sampleRate) => {
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 4.5;
      }
    },
  },
  // Soft rain: band-passed white noise with a slow amplitude flutter so it
  // doesn't sit as a flat hiss.
  rain: {
    filterType: "bandpass", baseFreq: 1200,
    fill: (data, sampleRate) => {
      for (let i = 0; i < data.length; i++) {
        const flutter = 0.75 + 0.25 * Math.sin(i / sampleRate * 1.7);
        data[i] = (Math.random() * 2 - 1) * 0.6 * flutter;
      }
    },
  },
  // Breathy wind: low-pass noise with its own slow internal drift, distinct
  // from the brown rumble by sitting brighter and less steady.
  wind: {
    filterType: "lowpass", baseFreq: 680,
    fill: (data, sampleRate) => {
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.06 * white) / 1.06;
        const drift = 0.6 + 0.4 * Math.sin(i / sampleRate * 0.35);
        data[i] = last * 3.2 * drift;
      }
    },
  },
  // Room hum: a faint sustained low tone under a thin layer of noise, reads
  // as "quiet interior space" rather than weather.
  hum: {
    filterType: "lowpass", baseFreq: 300,
    fill: (data, sampleRate) => {
      for (let i = 0; i < data.length; i++) {
        const tone = Math.sin((i / sampleRate) * 2 * Math.PI * 64) * 0.5;
        data[i] = tone + (Math.random() * 2 - 1) * 0.15;
      }
    },
  },
};
const AMBIENT_VARIANT_KEYS = Object.keys(AMBIENT_VARIANTS);

function useAmbientSound(enabled, accentHex, variant = "brown") {
  const ctxRef = useRef(null);
  const nodesRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      if (nodesRef.current) {
        const { gain, ctx } = nodesRef.current;
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      }
      return;
    }
    const ctx = ctxRef.current || getSharedAudioCtx();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume();

    if (!nodesRef.current) {
      const def = AMBIENT_VARIANTS[variant] || AMBIENT_VARIANTS.brown;
      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      def.fill(data, ctx.sampleRate);
      // The four fill() functions above use unrelated raw amplitude scales
      // (rain and wind land much quieter than brown/hum pre-filter), so the
      // shared gain target downstream made them sound uneven. Normalize to a
      // common RMS here instead of hand-tuning each variant's constants.
      let sumSq = 0;
      for (let i = 0; i < data.length; i++) sumSq += data[i] * data[i];
      const rms = Math.sqrt(sumSq / data.length) || 1;
      const norm = 0.28 / rms;
      for (let i = 0; i < data.length; i++) data[i] *= norm;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = def.filterType;
      filter.frequency.value = def.baseFreq;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      src.start();
      nodesRef.current = { src, filter, gain, ctx, baseFreq: def.baseFreq };
    }
    const { gain } = nodesRef.current;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.4);
  }, [enabled, variant]);

  useEffect(() => {
    if (!nodesRef.current) return;
    // Drift the filter's tone slightly with the accent so it feels session-specific.
    const hash = (accentHex || "#000").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const { baseFreq } = nodesRef.current;
    nodesRef.current.filter.frequency.linearRampToValueAtTime(
      baseFreq + (hash % 220), nodesRef.current.ctx.currentTime + 1.2
    );
  }, [accentHex]);

  useEffect(() => () => { ctxRef.current?.close(); }, []);
}

// ─── Cinematic intro: the cinematic clip plays once, scrubbed by the user's
// scroll/swipe rather than on its own timer — scroll down advances the
// footage frame-by-frame, scroll up rewinds it, exactly like the
// scroll-driven video sites referenced when this was scoped. The shell this
// app runs in is non-scrolling (overflow: hidden), so wheel/touch deltas are
// captured directly here instead of reading real scrollY. Once the clip
// reaches its end, onDone() hands off to the existing landing screen — the
// clip is shown exactly once, never as a backdrop loop.
const INTRO_SCRUB_DISTANCE = 2400; // px of accumulated scroll/swipe to traverse the full clip

function IntroVideoScreen({ onDone, lang, reduceMotion, isMobile }) {
  const videoRef = useRef(null);
  const progressRef = useRef(0);
  const durationRef = useRef(0);
  const doneRef = useRef(false);
  const [hint, setHint] = useState(true);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  useEffect(() => {
    if (reduceMotion) { finish(); return; }
  }, [reduceMotion, finish]);

  // If the video hasn't loaded metadata within 8s, skip the intro gracefully
  // instead of leaving a black screen forever.
  useEffect(() => {
    if (reduceMotion) return;
    const t = setTimeout(() => {
      if (durationRef.current === 0) finish();
    }, 8000);
    return () => clearTimeout(t);
  }, [reduceMotion, finish]);

  useEffect(() => {
    if (reduceMotion) return;
    const v = videoRef.current;
    if (!v) return;

    const onLoaded = () => { durationRef.current = v.duration || 0; };
    v.addEventListener("loadedmetadata", onLoaded);

    let rafId = null;
    let hintCleared = false;
    // Eased follow instead of snapping currentTime straight to the input
    // delta — `displayed` chases `progressRef.current` at a fixed rate each
    // frame, so a fast flick reads as a smooth glide through the footage
    // rather than a stepped jump. Loop keeps running (independent of new
    // input) until it actually catches up, then goes idle again.
    let displayed = 0;
    const flush = () => {
      const target = progressRef.current;
      displayed += (target - displayed) * 0.16;
      if (Math.abs(target - displayed) < 0.4) displayed = target;
      if (durationRef.current > 0) {
        const frac = displayed / INTRO_SCRUB_DISTANCE;
        v.currentTime = frac * durationRef.current;
      }
      if (displayed >= INTRO_SCRUB_DISTANCE) { rafId = null; finish(); return; }
      rafId = (displayed !== target) ? requestAnimationFrame(flush) : null;
    };

    const applyProgress = (delta) => {
      if (!hintCleared) { hintCleared = true; setHint(false); }
      progressRef.current = Math.min(INTRO_SCRUB_DISTANCE, Math.max(0, progressRef.current + delta));
      if (rafId == null) rafId = requestAnimationFrame(flush);
    };

    const onWheel = (e) => { e.preventDefault(); applyProgress(e.deltaY); };
    let touchY = null;
    const onTouchStart = (e) => { touchY = e.touches[0].clientY; };
    const onTouchMove = (e) => {
      if (touchY == null) return;
      e.preventDefault();
      const y = e.touches[0].clientY;
      applyProgress((touchY - y) * 2.2);
      touchY = y;
    };
    const onKey = (e) => {
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") applyProgress(240);
      if (e.key === "ArrowUp" || e.key === "PageUp") applyProgress(-240);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    // passive: false + preventDefault — without this, the page behind keeps
    // trying to scroll/bounce at the same time as the video scrub, fighting
    // the main thread on mobile and reading as lag.
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      v.removeEventListener("loadedmetadata", onLoaded);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [reduceMotion, finish]);

  if (reduceMotion) return null;

  return (
    <motion.div
      initial={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, filter: "blur(6px)" }}
      transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "#070605", overflow: "hidden" }}>
      <video
        ref={videoRef}
        src={isMobile ? VIDEO_SRC_MOBILE : VIDEO_SRC}
        muted playsInline preload="auto"
        onError={(e) => {
          const v = e.target;
          if (!v.dataset.triedFallback) {
            v.dataset.triedFallback = "1";
            v.src = VIDEO_FALLBACK;
            v.load();
          } else {
            finish();
          }
        }}
        onEnded={finish}
        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {/* Bottom scrim only — kept clear of any color wash so the footage itself
          reads sharp, unlike the duotone treatment used for the scene photos. */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(to bottom, transparent 70%, #07060599 100%)" }} />
      <motion.button onClick={finish}
        style={{ position: "absolute", top: "28px", right: "32px", background: "none", border: "none",
          color: "#E8E2D6", fontSize: "11px", letterSpacing: ".08em", textTransform: "uppercase",
          cursor: "pointer", opacity: 0.7 }}>
        {lang === "id" ? "Lewati" : "Skip"}
      </motion.button>
      <motion.div
        animate={hint ? { opacity: [0.5, 1, 0.5], y: [0, 6, 0] } : { opacity: 0 }}
        transition={hint ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0.4 }}
        style={{ position: "absolute", left: "50%", bottom: "36px", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", color: "#E8E2D6" }}>
        <span style={{ fontSize: "10.5px", letterSpacing: ".14em", textTransform: "uppercase" }}>
          {lang === "id" ? "Gulir untuk mulai" : "Scroll to begin"}
        </span>
        <span style={{ fontSize: "16px" }}>↓</span>
      </motion.div>
    </motion.div>
  );
}

export default function Profess() {
  // ── Encounter-model state ───────────────────────────────────────────────
  // Mobile skips the scroll-scrubbed video intro entirely (it relies on
  // wheel/touch hijacking that fights the OS scroll on phones) and goes
  // straight to the static landing screen.
  const [stage, setStage] = useState(() =>
    (typeof window !== "undefined" && window.innerWidth < 640) ? "intro" : "video-intro"
  ); // video-intro|intro|lang|mode|disclaimer|intensity|scenario|conversation|summary
  // Mobile skips the video entirely, so the landing copy has nothing to wait
  // on; desktop flips this once the video's own exit fade completes.
  const [videoIntroDone, setVideoIntroDone] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 640
  );
  // Sequencing for the landing page: the mountain backdrop fades from
  // desaturated to its warm duotone first; only once that color wash
  // finishes does the title/copy fade in on top of it.
  const [landingReady, setLandingReady] = useState(false);
  const [lang, setLang] = useState(null);
  const [sessionMode, setSessionMode] = useState(null);
  const [pendingMode, setPendingMode] = useState(null);
  const [intensity, setIntensity] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [sceneGroupIdx, setSceneGroupIdx] = useState(null);
  const [summary, setSummary] = useState(null);
  const [lastExchange, setLastExchange] = useState(null);
  const [transcriptOpen, setTranscriptOpen] = useState(true);
  const [infoPanel, setInfoPanel] = useState(null); // null | "about" | "guide" | "terms"
  const [svgGallery, setSvgGallery] = useState(false); // design-review only: every character SVG at a glance
  // Every mood the rig actually supports (excludes "listening", which is an
  // attention state rather than an emotion) so the review can catch
  // expression bugs per-role instead of only ever checking "neutral".
  const GALLERY_MOODS = useMemo(() => Object.keys(MOOD_DATA).filter((m) => m !== "listening"), []);
  const galleryChars = useMemo(() => {
    if (!svgGallery) return [];
    const buildRow = (ch, key, title) => ({
      key, title,
      // Wire the same idle+mood loop used live in conversation, so the review
      // shows the actual refined motion per role/mood instead of a frozen frame.
      moods: GALLERY_MOODS.map((mood) => ({
        mood, svg: buildSVG(ch, mood, false, "portrait"),
        anim: [getIdleAnimation(key), getMoodAnimation(mood, false)].filter(Boolean).join(", "),
      })),
    });
    const roleEntries = Object.keys(ROLE_TITLES).map((key) => buildRow(generateChar(key), key, ROLE_TITLES[key]));
    return [buildRow(CHARS.default, "coach", CHARS.default.title), ...roleEntries];
  }, [svgGallery, GALLERY_MOODS]);
  const [ambientOn, setAmbientOn] = useState(false);
  const [ambientPrimed, setAmbientPrimed] = useState(false);
  // Picked once per page load/session and held fixed for its whole duration —
  // a fresh reload or new session can land on a different texture, but it never
  // swaps mid-conversation (see AMBIENT_VARIANTS above for why that'd be jarring).
  const [ambientVariant] = useState(() => AMBIENT_VARIANT_KEYS[Math.floor(Math.random() * AMBIENT_VARIANT_KEYS.length)]);
  const spotlightX = useMotionValue(-400);
  const spotlightY = useMotionValue(-400);
  const spotlightXS = useSpring(spotlightX, { stiffness: 60, damping: 22 });
  const spotlightYS = useSpring(spotlightY, { stiffness: 60, damping: 22 });
  const spotlightBg = useMotionTemplate`radial-gradient(420px circle at ${spotlightXS}px ${spotlightYS}px, rgba(255,255,255,0.16), transparent 70%)`;

  // Browsers block real autoplay until a user gesture happens — no exception
  // exists for this on iOS/Android, so "on from the literal first paint" isn't
  // achievable. What we do instead: (1) try a muted/best-effort resume on
  // mount in case the browser's media-engagement heuristics already allow it
  // (some Android Chrome sessions do, if the user has visited before), and
  // (2) arm on the broadest possible set of first-touch gestures — including
  // scroll and touchmove, not just a tap — so on mobile it starts at the very
  // first finger movement instead of waiting for a deliberate button press.
  useEffect(() => {
    if (ambientPrimed) return;
    const ctx = getSharedAudioCtx();
    if (ctx.state === "running") { setAmbientOn(true); setAmbientPrimed(true); return; }
    // Resume the AudioContext synchronously inside the gesture handler — on
    // iOS Safari, doing this later (e.g. in useAmbientSound's effect) doesn't
    // count as "during a user gesture" and the context stays silently
    // suspended forever.
    const arm = () => {
      getSharedAudioCtx().resume();
      setAmbientOn(true);
      setAmbientPrimed(true);
    };
    const events = ["pointermove", "pointerdown", "touchstart", "touchmove", "scroll", "wheel", "keydown"];
    events.forEach((ev) => window.addEventListener(ev, arm, { once: true, passive: true }));
    return () => events.forEach((ev) => window.removeEventListener(ev, arm));
  }, [ambientPrimed]);

  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);

  // Scenes with more than one backdrop photo (relationships, family) get a
  // random pick made once per session the first time that scene is entered,
  // then held steady for the rest of the session — varies visit to visit
  // without flickering between variants on every re-render.
  const backdropPicksRef = useRef({});
  const backdropFor = (scene) => {
    const pool = scene?.backdrop?.length ? scene.backdrop : ["academic.jpg"];
    if (pool.length === 1) return `/video/${pool[0]}`;
    const id = scene?.id || "default";
    if (backdropPicksRef.current[id] == null) {
      backdropPicksRef.current[id] = Math.floor(Math.random() * pool.length);
    }
    return `/video/${pool[backdropPicksRef.current[id]]}`;
  };

  // Mobile has no cursor, so the spotlight follows device tilt instead —
  // gamma (left/right) and beta (front/back) mapped onto screen coordinates.
  // iOS gates this sensor behind a permission prompt that must be requested
  // from a real tap, so we ask for it on the same first-gesture arm used for
  // ambient sound rather than adding a second prompt the user has to notice.
  useEffect(() => {
    if (!isMobile) return;
    const w = window.innerWidth, h = window.innerHeight;
    spotlightX.set(w / 2);
    spotlightY.set(h * 0.4);
    const onTilt = (e) => {
      const gamma = Math.max(-45, Math.min(45, e.gamma || 0)); // left/right
      const beta = Math.max(-20, Math.min(60, (e.beta || 0) - 20)); // front/back, centered
      spotlightX.set(w / 2 + (gamma / 45) * (w / 2));
      spotlightY.set(h * 0.4 + (beta / 60) * (h * 0.3));
    };
    const armOrientation = () => {
      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        DeviceOrientationEvent.requestPermission().then((res) => {
          if (res === "granted") window.addEventListener("deviceorientation", onTilt);
        }).catch(() => {});
      } else {
        window.addEventListener("deviceorientation", onTilt);
      }
    };
    window.addEventListener("pointerdown", armOrientation, { once: true });
    return () => {
      window.removeEventListener("deviceorientation", onTilt);
      window.removeEventListener("pointerdown", armOrientation);
    };
  }, [isMobile]);
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
  const leanSpring = useSpring(leanRaw, { stiffness: 120, damping: 18 });
  const lean = useTransform(leanSpring, [0, 1], [1, 1.06]);
  const [isLeaning, setIsLeaning] = useState(false);
  const startLean = () => { setIsLeaning(true); leanRaw.set(1); };
  const endLean = () => { setIsLeaning(false); leanRaw.set(0); };

  // ── Backdrop photo parallax — drifts opposite the cursor, very subtly ───
  const reduceMotion = useReducedMotion();
  const photoMX = useMotionValue(0);
  const photoMY = useMotionValue(0);
  const photoX = useSpring(photoMX, { stiffness: 40, damping: 20 });
  const photoY = useSpring(photoMY, { stiffness: 40, damping: 20 });
  const handlePointerMoveParallax = (e) => {
    spotlightX.set(e.clientX);
    spotlightY.set(e.clientY);
    if (isMobile || reduceMotion) return;
    const w = window.innerWidth, h = window.innerHeight;
    photoMX.set(((e.clientX / w) - 0.5) * -18);
    photoMY.set(((e.clientY / h) - 0.5) * -14);
  };

  // block/inline "nearest" — default scrollIntoView aligns to the *start* of
  // every scrollable ancestor in the chain, including the window itself,
  // which is what was sliding the whole page down on first message.
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" }); }, [messages, loading]);
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
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); playSfx("micOff"); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setMicError("Speech recognition requires Chrome or Edge."); return; }
    stopSpeech();
    const r = new SR(); r.continuous = true; r.interimResults = true; r.lang = lang === "id" ? "id-ID" : "en-US";
    let final = "";
    r.onstart = () => { setIsListening(true); playSfx("micOn"); };
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
        const generated = generateChar(newRole, charGender || null, sessionMode || pendingMode || "formal");
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
      playSfx("receive");
    } catch(e) { setError("Connection failed. Please try again."); playSfx("error"); }
    finally { setLoading(false); }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    playSfx("send");
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
          playSfx("receive");
          setTimeout(() => setStage("summary"), 1500);
          return;
        }
      }
      setMessages([...newMsgs, { role:"assistant", content:clean, inRole, inner }]);
      speak(clean, role, mood, inRole, inner);
      playSfx("receive");
    } catch(e) { setError("Something went wrong. Please try again."); playSfx("error"); }
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
    ? { ...CHARS.default, title: lang === "id" ? "Coach Kamu" : "Your Coach",
        bodyColor: (sessionMode || pendingMode) === "social" ? CHARS.default.bodyColorSocial : CHARS.default.bodyColor }
    : (charCache[displayRole] || generateChar(displayRole, null, sessionMode || pendingMode || "formal"));
  if (displayRole !== "default" && !charMeta.title) charMeta.title = ROLE_TITLES[displayRole] || displayRole;
  const presenceMood = getPresenceMood(currentMood, { loading, isListening });
  const charSVG = buildSVG(charMeta, presenceMood, isTalking && isSpeaking);
  const sessionAccent = sessionMode === "social" ? ACCENT.social : ACCENT.formal;
  const glowColor = MOOD_GLOW[presenceMood] || sessionAccent;
  const scene = getScene(sessionMode || pendingMode, sceneGroupIdx);
  // Reset the fallback flag whenever the scene changes so a new scene always
  // retries the real photo first, rather than staying stuck on art forever
  // after one failed load.
  // Art backdrop is always the local SVG — instant, no network, always
  // consistent. LoremFlickr was removed after proving unreliable (timeouts,
  // wrong photos, slow loads).
  useAmbientSound(ambientOn, sessionAccent, ambientVariant);

  // ── The character render — single shared anatomy used at every stage ────
  function CharacterFigure({ size = "min(62vh, 560px)" }) {
    const idleAnim = getIdleAnimation(displayRole);
    const moodAnim = getMoodAnimation(presenceMood, isTalking && isSpeaking);
    const talkAnim = (isTalking && isSpeaking) ? "talkBody .4s ease-in-out infinite" : null;
    return (
      <motion.div style={{ width: size, height: size, position: "relative" }}
        animate={{ scale: 1 }}>
        {glowColor && (
          <div style={{ position: "absolute", inset: "-20%", borderRadius: "50%",
            background: `radial-gradient(circle, ${glowColor}33 0%, transparent 70%)`,
            animation: "auraBreath 4s ease-in-out infinite", pointerEvents: "none" }} />
        )}
        <div className="char-enter" style={{ width: "100%", height: "100%", animation: `${idleAnim}${moodAnim ? ", "+moodAnim : ""}${talkAnim ? ", "+talkAnim : ""}` }}
          dangerouslySetInnerHTML={{ __html: charSVG }} />
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
          initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ width, maxHeight: "82vh", overflowY: "auto", textAlign: align, paddingTop: "10px", pointerEvents: "auto",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0, black 24px, black 100%)",
            maskImage: "linear-gradient(to bottom, transparent 0, black 24px, black 100%)" }}>
          {children}
          {footer && (
            <div style={{ position: "sticky", bottom: 0, paddingTop: "20px", paddingBottom: "16px" }}>
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
    const labels = ONBOARDING_LABELS[lang || "en"];
    return (
      <div style={{ marginBottom: "22px" }}>
        <div style={{ display: "flex", gap: "5px", marginBottom: "6px" }}>
          {ONBOARDING_ORDER.map((s, idx) => (
            <motion.div key={s} layout
              animate={{ width: idx === i ? 20 : 8, background: idx === i ? sessionAccent : "#222428",
                boxShadow: idx === i ? `0 0 8px -1px ${sessionAccent}aa` : "0 0 0 0 transparent" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: "3px", borderRadius: "2px" }} />
          ))}
        </div>
        <span style={{ fontSize: "10px", letterSpacing: ".08em", textTransform: "uppercase", color: "#9C8E7C" }}>
          {labels[stage]} · {i + 1}/{ONBOARDING_ORDER.length}
        </span>
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
  const ChoiceRow = ({ onClick, accent, children, sub, bars, preview }) => (
    <motion.button onClick={() => { playSfx("select"); onClick?.(); }} variants={listItemV}
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
      {preview && (
        <span style={{ display: "block", fontFamily: "'Playfair Display',serif", fontStyle: "italic",
          fontSize: "12.5px", color: accent || sessionAccent, opacity: "var(--c, 0)", overflow: "hidden",
          maxHeight: "calc(var(--c, 0) * 22px)", marginTop: "calc(var(--c, 0) * 4px)",
          transition: "opacity .35s ease .05s, max-height .35s ease, margin-top .35s ease" }}>
          {preview}
        </span>
      )}
    </motion.button>
  );

  // ── Stage overlay content ────────────────────────────────────────────────
  function StageOverlay() {
    // On desktop the landing copy waits for the video-intro's own fade-out
    // to finish before it starts fading in, instead of both happening at
    // once — a held beat instead of a hard cut. Mobile never shows the
    // video, so it's already "done" and the copy appears immediately.
    if (stage === "intro" && !landingReady) return null;
    if (stage === "intro") return (
      <Overlay footer={
        <motion.button onClick={() => setStage("lang")}
          whileHover="hover" whileTap={{ scale: 0.96, borderColor: sessionAccent }}
          transition={{ scale: { type: "spring", stiffness: 500, damping: 22 } }}
          initial="rest" animate="rest"
          style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "none",
            border: `1px solid ${sessionAccent}66`, borderRadius: "999px", color: "#F0EDE6", fontSize: "13.5px",
            letterSpacing: ".01em", padding: "11px 20px 11px 22px", cursor: "pointer", position: "relative", overflow: "hidden" }}>
          <motion.span variants={{ rest: { opacity: 0, scale: 0 }, hover: { opacity: 1, scale: 1 } }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 18% 50%, ${sessionAccent}33 0%, transparent 70%)` }} />
          <span style={{ position: "relative" }}>{lang === "id" ? "Mulai" : "Begin"}</span>
          <motion.span variants={{ rest: { x: 0 }, hover: { x: 3 } }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "relative", display: "inline-flex", color: sessionAccent }}>
            <IconArrowRight />
          </motion.span>
        </motion.button>
      }>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.15 }}
          style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <span style={{ width: "22px", height: "1px", background: sessionAccent }} />
          <span style={{ fontSize: "10.5px", letterSpacing: ".14em", textTransform: "uppercase", color: "#8C7E6C" }}>
            {lang === "id" ? "Latihan percakapan" : "A rehearsal for hard conversations"}
          </span>
        </motion.div>
        <motion.h1
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.045 } } }}
          style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(44px,9vw,84px)", color: "#F0EDE6", marginBottom: "4px", letterSpacing: "-0.025em", lineHeight: 1.05 }}>
          {"Profess".split("").map((ch, i) => (
            <motion.span key={i} style={{ display: "inline-block" }}
              variants={reduceMotion
                ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4 } } }
                : { hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
                    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}>
              {ch}
            </motion.span>
          ))}
        </motion.h1>
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: "120px", height: "1px", background: `linear-gradient(90deg, ${sessionAccent}, transparent)`, transformOrigin: "left", marginBottom: "18px" }} />
        <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ color: INK, fontSize: "14px", lineHeight: 1.8, maxWidth: "38ch" }}>
          Practice the conversation before it happens. A presence that reacts to you, presses back, and tells you what it really felt.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }}
          style={{ display: "flex", gap: "16px", marginTop: "26px" }}>
          {[
            { key: "about", label: lang === "id" ? "Tentang Profess" : "About Profess" },
            { key: "guide", label: lang === "id" ? "Panduan" : "Guide" },
            { key: "terms", label: lang === "id" ? "Ketentuan" : "Terms" },
          ].map(({ key, label }) => (
            <button key={key} className="footer-link" onClick={() => setInfoPanel(key)}
              style={{ background: "none", border: "none", color: "#9C8E7C", fontSize: "11px", letterSpacing: ".05em",
                textTransform: "uppercase", padding: 0, cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.color = sessionAccent}
              onMouseLeave={(e) => e.currentTarget.style.color = "#9C8E7C"}>
              {label}
            </button>
          ))}
          {/* Design-review only: not user-facing copy, so left untranslated and
              visually de-emphasized to mark it as a tool. */}
          <button className="footer-link" onClick={() => setSvgGallery(true)}
            style={{ background: "none", border: "none", color: "#5A5044", fontSize: "11px", letterSpacing: ".05em",
              textTransform: "uppercase", padding: 0, cursor: "pointer" }}
            onMouseEnter={(e) => e.currentTarget.style.color = sessionAccent}
            onMouseLeave={(e) => e.currentTarget.style.color = "#5A5044"}>
            SVG Review
          </button>
        </motion.div>
      </Overlay>
    );

    if (stage === "lang") return (
      <Overlay>
        {backBtn("intro")}
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
          {[{ key: "formal", label: "Formal", accent: ACCENT.formal,
              sub: lang === "id" ? "Untuk situasi yang taruhannya tinggi, seperti wawancara atau negosiasi." : "For the moments with real stakes attached — an interview, a panel, a negotiation." },
            { key: "social", label: lang === "id" ? "Sosial" : "Social", accent: ACCENT.social,
              sub: lang === "id" ? "Untuk percakapan dengan orang-orang dekat Anda — keluarga, teman, kenalan baru." : "For the people already in your life — family, friends, someone you just met." }].map(opt => (
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
                  <ChoiceRow key={ii} preview={SCENARIO_TEASERS[pendingMode || "formal"]?.[lang || "en"]?.[gi]?.[ii]}
                    onClick={() => { setScenario(item); setSceneGroupIdx(gi); startSession(pendingMode, item); }}>{item}</ChoiceRow>
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
    <div onPointerMove={handlePointerMoveParallax} className="app-shell"
      style={{ overflow: "hidden", background: BG, color: "#F0EDE6", fontFamily: "'Inter',sans-serif", fontWeight: 300, position: "relative" }}>
      <style>{css}</style>
      <div className="grain-layer" />

      <AnimatePresence onExitComplete={() => setVideoIntroDone(true)}>
        {stage === "video-intro" && (
          <IntroVideoScreen key="video-intro" lang={lang} reduceMotion={reduceMotion} isMobile={isMobile}
            onDone={() => setStage("intro")} />
        )}
      </AnimatePresence>

      {/* Scene wash — the "set": a slow top-to-bottom gradient unique to the
          current scenario group, transitioning smoothly when the scene changes
          (new session, new scenario) without ever breaking the single canvas. */}
      <motion.div key={scene.id} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(165deg, ${scene.top} 0%, ${scene.bottom} 60%, #0A0807 100%)` }} />
        {/* Floor glow — a warm pool of light beneath where the character stands.
            A slow breathing pulse (not a flat glow) so the room reads as lit,
            not lit-and-frozen — a quiet hint of the warmth Warm Mode later makes explicit. */}
        <motion.div
          animate={reduceMotion ? { opacity: 1 } : { opacity: [0.85, 1, 0.85] }}
          transition={reduceMotion ? undefined : { duration: 7, ease: "easeInOut", repeat: Infinity }}
          style={{ position: "absolute", left: "50%", bottom: "-6%", width: "min(70vw, 760px)", height: "32vh", transform: "translateX(-50%)",
          background: `radial-gradient(ellipse at center, ${scene.floor}26 0%, transparent 72%)`, filter: "blur(2px)" }} />
        {/* Drifting motes — tiny warm particles for atmosphere, purely decorative.
            On the intro, fewer and slower: the room should feel still while reading
            the title, not busy with movement competing for attention. */}
        {[...Array(stage === "intro" ? 4 : 7)].map((_, mi) => (
          <span key={mi} className="mote" style={{
            left: `${10 + mi * (stage === "intro" ? 22 : 12.5)}%`,
            animationDelay: `${mi * 1.3}s`,
            animationDuration: `${(stage === "intro" ? 14 : 9) + (mi % 4) * 2}s`,
            background: scene.mote, opacity: (stage === "intro" ? 0.12 : 0.18) + (mi % 3) * 0.06 }} />
        ))}
      </motion.div>

      {/* Scene photography — full-bleed editorial duotone, the dominant visual
          "set" rather than a faint hint. Crossfades + Ken-Burns-zooms between
          scenes, drifts opposite the cursor for depth, and is cut by a single
          deliberate diagonal seam (not a fade-because-we-couldn't-commit edge). */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <AnimatePresence mode="sync">
          {/* Mounts as soon as the video hands off to "intro" — not after its
              exit fade fully completes — so the mountain is already visible
              underneath the video as it dissolves, instead of leaving a beat
              of empty background between the video and the photo. */}
          <motion.div key={stage === "intro" ? "intro" : scene.id}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "absolute", inset: 0,
              WebkitMaskImage: isMobile
                ? "linear-gradient(to bottom, transparent 0%, black 28%, black 100%)"
                : "linear-gradient(100deg, transparent 0%, transparent 18%, black 36%, black 100%)",
              maskImage: isMobile
                ? "linear-gradient(to bottom, transparent 0%, black 28%, black 100%)"
                : "linear-gradient(100deg, transparent 0%, transparent 18%, black 36%, black 100%)" }}>
            <motion.div
              style={{ position: "absolute", inset: "-8%", x: photoX, y: photoY }}
              initial={stage === "intro" ? { clipPath: "inset(0 0 0 100%)" } : false}
              animate={stage === "intro" ? { clipPath: "inset(0 0 0 0%)" } : false}
              transition={stage === "intro" ? { duration: 1.3, ease: [0.16, 1, 0.3, 1] } : undefined}>
              <motion.img
                src={stage === "intro" ? "/video/backdrop-last-frame.jpg" : backdropFor(scene)}
                alt="" loading="eager" decoding="async"
                initial={stage === "intro" ? { opacity: 0, scale: 1.22, filter: "blur(14px)" } : { opacity: 0, scale: 1.05 }}
                animate={reduceMotion
                  ? { opacity: isMobile ? 0.4 : 1, scale: 1.1, filter: "blur(0px)" }
                  : { opacity: isMobile ? 0.4 : 1, scale: [1.05, 1.16, 1.1, 1.16], filter: "blur(0px)" }}
                transition={stage === "intro"
                  ? { opacity: { duration: 1.3, ease: [0.16, 1, 0.3, 1] },
                      filter: { duration: 1.3, ease: [0.16, 1, 0.3, 1] },
                      scale: reduceMotion
                        ? { type: "spring", stiffness: 60, damping: 18, mass: 1 }
                        : { duration: 46, ease: "easeInOut", times: [0, 0.4, 0.7, 1], repeat: Infinity, repeatType: "loop" } }
                  : reduceMotion
                    ? { opacity: { duration: 0.9, ease: [0.22, 1, 0.36, 1] }, scale: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }
                    : { opacity: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
                        scale: { duration: 46, ease: "easeInOut", times: [0, 0.4, 0.7, 1], repeat: Infinity, repeatType: "loop" } }}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 28%",
                  filter: "grayscale(1) contrast(1.15) brightness(.78)", willChange: "transform, opacity, filter" }} />
            </motion.div>
            {/* One-shot light sweep — a single diagonal highlight crossing the
                photo as it settles in, the kind of polish that reads as a
                deliberate reveal rather than a plain fade-up. Intro only. */}
            {stage === "intro" && !reduceMotion && (
              <motion.div
                initial={{ x: "-130%" }}
                animate={{ x: "130%" }}
                transition={{ duration: 1.4, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: "absolute", inset: "-20% -40%", mixBlendMode: "overlay", pointerEvents: "none",
                  background: "linear-gradient(78deg, transparent 42%, rgba(255,255,255,.35) 50%, transparent 58%)" }} />
            )}
            {/* Duotone wash — accent color in the lights, scene ink in the shadows.
                On the landing page this fades in after the photo itself has
                appeared, so the sequence reads as: photo arrives desaturated,
                then warms into color, then (via landingReady) the title follows. */}
            <motion.div
              key={stage === "intro" ? "wash-intro" : `wash-${scene.id}`}
              initial={{ opacity: stage === "intro" ? 0 : 1 }}
              animate={{ opacity: 1 }}
              transition={stage === "intro"
                ? { duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }
                : { duration: 0 }}
              onAnimationComplete={() => { if (stage === "intro") setLandingReady(true); }}
              style={{ position: "absolute", inset: 0, mixBlendMode: "color", background: sessionAccent }} />
            <div style={{ position: "absolute", inset: 0, mixBlendMode: "multiply",
              background: `linear-gradient(200deg, ${scene.top}00 0%, ${scene.bottom}99 78%, #07050470 100%)` }} />
            {/* The seam itself — a single thin warm rule marking where photography meets type */}
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(100deg, transparent 43.5%, ${sessionAccent}99 44.5%, transparent 45.5%)` }} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Spotlight — a soft pool of light over the photograph. Follows the
          pointer on desktop, device tilt on mobile; present from the very
          first screen (intro, before "Begin") so the backdrop feels
          touchable immediately on either input style. */}
      <motion.div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
        mixBlendMode: "soft-light", background: spotlightBg }} />

      {/* Ambient sound toggle — visible from intro, before Begin. Sound itself
          arms on the user's first gesture (see effect above); this label only
          explains what just happened (or is about to) so it never feels like
          a mystery hiss starting in the background. */}
      <div style={{ position: "absolute", top: "max(20px, env(safe-area-inset-top))", right: "20px", zIndex: 40, display: "flex", alignItems: "center",
        gap: "8px", maxWidth: isMobile ? "60vw" : "none" }}>
        {!ambientPrimed && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }}
            style={{ fontSize: isMobile ? "10px" : "11px", color: "#9C8E7C", letterSpacing: ".02em", textAlign: "right", lineHeight: 1.3 }}>
            {lang === "id" ? "Suara akan menyala" : "Sound will start"}
          </motion.span>
        )}
        <motion.button onClick={() => setAmbientOn((v) => !v)}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
          aria-label={ambientOn ? "Mute ambient sound" : "Enable ambient sound"}
          style={{ width: "32px", height: "32px", position: "relative",
            borderRadius: "50%", border: `1px solid ${sessionAccent}55`, background: "rgba(10,8,7,.45)",
            backdropFilter: "blur(6px)", color: ambientOn ? sessionAccent : "#9C8E7C",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          {/* A switch should feel like it did something to the room, not just to itself —
              one outward ring per toggle, like sound itself rippling out from the source. */}
          {!reduceMotion && (
            <motion.span key={ambientOn ? "on" : "off"}
              initial={{ opacity: 0.55, scale: 0.6 }} animate={{ opacity: 0, scale: 1.9 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${sessionAccent}`, pointerEvents: "none" }} />
          )}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={ambientOn ? "on" : "off"}
              initial={{ opacity: 0, rotate: -8, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 8, scale: 0.8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: "flex" }}>
              <IconSpeaker muted={!ambientOn} />
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Persistent ambient light field — encodes warmth/lean/mood, layered above the scene wash */}
      <motion.div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(circle at 78% 62%, ${glowColor || sessionAccent}22 0%, transparent 55%)` }}
        animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />

      {/* Character — mounted only during an active conversation. Outside a
          session the figure has nothing to react to yet, so it stays out of
          the frame entirely rather than looming over the intro/onboarding copy. */}
      <AnimatePresence>
        {inConversation && (
          <motion.div
            // Desktop used to center the figure with top:50%/y:-50%, but that
            // transform's -50% only accounts for the figure's own box height —
            // the name/title block below it is positioned absolutely (out of
            // flow), so it was never part of the centering math and kept
            // drifting into the input bar on shorter viewports no matter how
            // much "reserve" was padded into the top calc. Anchoring from the
            // bottom instead reserves space for the figure AND the title block
            // directly, so it can't overlap the input bar by construction.
            initial={{ left: "50%", top: "50%", x: "-50%", y: "-50%", opacity: 0, scale: 0.92 }}
            animate={{ left: isMobile ? "50%" : "94%", top: isMobile ? "4%" : "auto", bottom: isMobile ? "auto" : "180px",
              x: isMobile ? "-50%" : "-100%", y: isMobile ? "0%" : "0%", opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "absolute", zIndex: 2 }}
            onPointerDown={startLean}
            onPointerUp={endLean}
            onPointerLeave={endLean}>
            <motion.div style={{ scale: lean }}>
              <CharacterFigure size={isMobile ? "min(28dvh, 200px)" : "min(58dvh, 520px)"} />
            </motion.div>
            <div style={{ position: "absolute", top: "100%", marginTop: isMobile ? "6px" : "14px", left: "50%", transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
              <p style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: "18px", color: "#F0EDE6" }}>{charMeta.name || charMeta.title}</p>
              <p style={{ fontSize: "11px", color: "#9C8E7C", marginTop: isMobile ? "2px" : "-2px" }}>{charMeta.title}</p>
              {isLeaning && <p style={{ fontSize: "10px", letterSpacing: ".08em", color: sessionAccent, marginTop: "6px", textTransform: "uppercase" }}>{lang === "id" ? "mendekat..." : "leaning in..."}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation margin — transcript demoted to a thin recallable strip */}
      {inConversation && (
        <>
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "max(20px, env(safe-area-inset-top)) 28px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
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
                style={{ position: "absolute", left: 0, top: isMobile ? "calc(4% + 28dvh + 80px)" : "72px", bottom: isMobile ? "20px" : "150px",
                  width: isMobile ? "92vw" : "min(42%, 520px)", maxWidth: isMobile ? "92vw" : "60%", right: isMobile ? "auto" : "34%",
                  padding: "0 28px", overflowY: "auto", zIndex: 8,
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

      {/* About / Guide / Terms — reachable from the very first screen, dismissible */}
      <AnimatePresence>
        {infoPanel && (
          <motion.div key="info-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }} onClick={() => setInfoPanel(null)}
            style={{ position: "absolute", inset: 0, zIndex: 60, background: "rgba(7,5,4,.7)", backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <motion.div onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: "min(440px, 100%)", maxHeight: "76vh", overflowY: "auto", padding: "28px",
                border: `1px solid ${sessionAccent}33`, background: "#0F0D0B" }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: "22px", color: "#F0EDE6", marginBottom: "14px" }}>
                {INFO_CONTENT[lang || "en"][infoPanel].title}
              </h2>
              {INFO_CONTENT[lang || "en"][infoPanel].steps ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {INFO_CONTENT[lang || "en"][infoPanel].steps.map((step) => (
                    <div key={step.label}>
                      <p style={{ color: sessionAccent, fontSize: "11px", letterSpacing: ".05em", textTransform: "uppercase", marginBottom: "4px" }}>
                        {step.label}
                      </p>
                      <p style={{ color: INK, fontSize: "13.5px", lineHeight: 1.7 }}>{step.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: INK, fontSize: "13.5px", lineHeight: 1.8 }}>
                  {INFO_CONTENT[lang || "en"][infoPanel].body}
                </p>
              )}
              <button onClick={() => setInfoPanel(null)}
                style={{ marginTop: "20px", background: "none", border: "none", color: sessionAccent, fontSize: "12px",
                  letterSpacing: ".05em", textTransform: "uppercase", padding: 0, cursor: "pointer", borderBottom: `1px solid ${sessionAccent}55` }}>
                {lang === "id" ? "Tutup" : "Close"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SVG Review — internal design-QA tool only, not part of the product
          flow. Renders every role's character once (random per open) so all
          gradients/shading/outfit variants can be eyeballed side by side. */}
      <AnimatePresence>
        {svgGallery && (
          <motion.div key="svg-gallery-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }} onClick={() => setSvgGallery(false)}
            style={{ position: "absolute", inset: 0, zIndex: 70, background: "rgba(7,5,4,.85)", backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <motion.div onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: "min(1100px, 100%)", maxHeight: "86vh", overflowY: "auto", padding: "24px",
                border: `1px solid ${sessionAccent}33`, background: "#0F0D0B" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: "20px", color: "#F0EDE6" }}>
                  SVG Review — {galleryChars.length} characters
                </h2>
                <button onClick={() => setSvgGallery(false)}
                  style={{ background: "none", border: "none", color: sessionAccent, fontSize: "12px",
                    letterSpacing: ".05em", textTransform: "uppercase", padding: 0, cursor: "pointer", borderBottom: `1px solid ${sessionAccent}55` }}>
                  Close
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {galleryChars.map((g) => (
                  <div key={g.key}>
                    <p style={{ fontSize: "11px", color: "#F0EDE6", marginBottom: "8px", letterSpacing: ".03em" }}>{g.title}</p>
                    <div style={{ display: "flex", gap: "14px", overflowX: "auto", paddingBottom: "4px" }}>
                      {g.moods.map(({ mood, svg, anim }) => (
                        <div key={mood} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                          <div className="char-gallery-enter" style={{ width: "84px", height: "84px", animation: anim }} dangerouslySetInnerHTML={{ __html: svg }} />
                          <p style={{ fontSize: "9px", color: "#AFA290", textAlign: "center" }}>{mood}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
