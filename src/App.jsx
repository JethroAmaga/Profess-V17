import { useState, useRef, useEffect, useCallback } from "react";

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
- You cannot move people you do not understand.
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

MODE SESI: FORMAL | BAHASA: INDONESIA
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

MODE SESI: SOSIAL | BAHASA: INDONESIA
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

// ─── Character pool — diverse gender, ethnicity, names ────────────────────
// Skin tones by ethnicity
const SKIN = {
  white:        ["#F5E6D8","#EDD5C0","#E8C9A8"],
  latin:        ["#D4956A","#C8845A","#BC7848"],
  black:        ["#8B5E3C","#7A4E2E","#5C3418"],
  european:     ["#F0DCC8","#E8CCB0","#DCC0A0"],
  south_asian:  ["#C8926A","#B87E58","#A86C48"],
  east_asian:   ["#F0D8B8","#E8C8A0","#DDB888"],
  sea:          ["#C89A6A","#BC8858","#A87848"],
};

// Hair colors by ethnicity — Asian ethnicities heavily weighted toward black/very dark
const HAIR = {
  white:        ["#3A2818","#8A6A50","#C8B898","#1A1008"],
  latin:        ["#1A0A04","#2A1008","#3A2010","#1A0A04"],
  black:        ["#0A0804","#1A1008","#2A1A0A","#0A0804"],
  european:     ["#C8A870","#8A6A40","#3A2818","#1A1008","#E8D090"],
  south_asian:  ["#0A0804","#0A0804","#1A1008","#2A1408"],
  east_asian:   ["#0A0804","#0A0804","#0A0804","#1A1008"],
  sea:          ["#0A0804","#0A0804","#0A0804","#1A0C04"],
};

// Name pools per role × gender × ethnicity

const ETHNICITIES = ["white","latin","black","european","south_asian","east_asian","sea"];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─── Role metadata ─────────────────────────────────────────────────────────
const ROLE_TITLES = {
  // Formal — Evaluator
  interviewer:"Interviewer", examiner:"Thesis Examiner", judge:"Adjudicator",
  journalist:"Journalist", auditor:"Auditor", board_member:"Board Member",
  investor:"Investor", acquirer:"Acquisition Lead", reviewer:"Peer Reviewer",
  panelist:"Panelist",
  // Formal — Adversarial
  opponent:"Opposition Speaker", prosecutor:"Prosecutor",
  defense_lawyer:"Defense Lawyer", cross_examiner:"Cross-Examiner",
  critic:"Critic", investigator:"Investigator",
  // Formal — Authoritative
  ceo:"CEO", executive:"Executive", regulator:"Regulator",
  official:"Government Official", diplomat:"Diplomat",
  commissioner:"Commissioner", dean:"Dean", professor_academic:"Professor",
  // Formal — Service/Transaction
  client:"Client", customer:"Customer", negotiator:"Negotiation Partner",
  vendor:"Vendor", partner:"Business Partner", contractor:"Contractor",
  // Formal — Audience
  voter:"Voter", shareholder:"Shareholder", consumer:"Consumer",
  media_audience:"Audience",
  // Social — Relasi Dekat
  friend_female:"Old Friend", friend_male:"Old Friend",
  best_friend:"Best Friend", ex_partner:"Ex", sibling:"Sibling",
  parent:"Parent", grandparent:"Grandparent",
  crush:"Someone You Like", romantic_interest:"Romantic Interest",
  // Social — Relasi Profesional
  colleague:"Coworker", manager:"Manager", subordinate:"Team Member",
  mentor:"Mentor", mentee:"Mentee", senior:"Senior", junior:"Junior",
  // Social — Stranger/Acquaintance
  stranger:"Stranger", new_acquaintance:"New Acquaintance",
  neighbor:"Neighbor", classmate:"Classmate", alumni:"Alumni",
  // Social — Situasional
  date:"Date", blind_date:"Blind Date", host:"Host",
  guest:"Guest", fellow_passenger:"Fellow Passenger",
  customer_service:"Customer Service",
  // Indonesia kontekstual
  pak_rt:"Pak RT", dosen_pembimbing:"Dosen Pembimbing",
  calon_mertua:"Calon Mertua", senior_organisasi:"Senior Organisasi",
  teman_ospek:"Teman Ospek", anggota_tim_debat:"Anggota Tim Debat",
};

// ─── Name pools ────────────────────────────────────────────────────────────
// Helper: generate name pool entry for all ethnicities
const N = (fw,fm,ew,em,lw,lm,bw,bm,sw,sm,asw,asm,seaw,seam) => ({
  f:{white:fw,european:ew,latin:lw,black:bw,south_asian:sw,east_asian:asw,sea:seaw},
  m:{white:fm,european:em,latin:lm,black:bm,south_asian:sm,east_asian:asm,sea:seam},
});

const NAME_POOL = {
  // Formal evaluators
  interviewer:      N("Sarah Mitchell","James Carter","Claire Dubois","Thomas Müller","Isabella Vargas","Carlos Mendoza","Amara Johnson","Marcus Williams","Priya Sharma","Arjun Patel","Mei Lin","Wei Zhang","Siti Rahayu","Budi Santoso"),
  examiner:         N("Prof. Harrison","Prof. Anderson","Prof. Beaumont","Prof. Fischer","Prof. Gutierrez","Prof. Ramirez","Prof. Adeyemi","Prof. Okafor","Prof. Krishnan","Prof. Nair","Prof. Tanaka","Prof. Park","Prof. Wijaya","Prof. Santoso"),
  judge:            N("Judge Collins","Judge Parker","Judge Leclerc","Judge Schneider","Judge Flores","Judge Torres","Judge Abara","Judge Mensah","Judge Iyer","Judge Rajan","Judge Yamamoto","Judge Chen","Judge Susanto","Judge Hidayat"),
  journalist:       N("Emma Reynolds","Jack Morrison","Sophie Laurent","Luca Rossi","Valentina Cruz","Diego Herrera","Zara Osei","Kwame Asante","Ananya Singh","Rohan Mehta","Yuki Nakamura","Jun Ho Kim","Dewi Rahmawati","Rizky Pratama"),
  auditor:          N("Patricia Webb","Michael Grant","Hélène Moreau","Stefan Weber","Lucia Morales","Andrés Vega","Ngozi Eze","Olumide Adewale","Kavya Reddy","Vikram Gupta","Xiao Ying","Hiroshi Tanaka","Kartika Sari","Andi Wijaya"),
  board_member:     N("Margaret Stone","Robert Hayes","Anna Kovács","Henrik Larsson","Camila Reyes","Alejandro Ruiz","Fatima Diallo","Emmanuel Eze","Meera Pillai","Sanjay Kapoor","Yuna Choi","Dong Hyun Lee","Rini Setiawan","Hendra Gunawan"),
  investor:         N("Victoria Lane","Charles Whitmore","Isabelle Renard","Klaus Hoffmann","Sofia Aguilar","Pablo Castillo","Adaeze Obi","Chukwu Obiora","Nandini Rao","Rajesh Kumar","Ji Young Park","Kenji Yamada","Andini Putri","Fajar Nugroho"),
  acquirer:         N("Laura Bennett","Daniel Webb","Ingrid Hansen","Marco Bianchi","Gabriela Soto","Mateo Jiménez","Chioma Eze","Seun Adeyemi","Divya Nair","Aditya Kumar","Ji Yeon Park","Takeshi Ito","Nadya Kusuma","Ahmad Fauzi"),
  reviewer:         N("Dr. Phillips","Dr. Morgan","Dr. Fontaine","Dr. Braun","Dr. Castillo","Dr. Vargas","Dr. Okonkwo","Dr. Abara","Dr. Iyer","Dr. Sharma","Dr. Nakamura","Dr. Kim","Dr. Puspita","Dr. Hidayat"),
  panelist:         N("Rachel Stone","Andrew Cole","Nina Petrov","Erik Johansen","Lucia Herrera","Felipe Mora","Amina Diallo","Kwesi Mensah","Sunita Pillai","Kiran Patel","Mia Chen","Jason Park","Dina Kusuma","Dimas Santoso"),
  // Formal adversarial
  opponent:         N("Kate Walsh","Daniel Webb","Nina Petrov","Marco Bianchi","Lucia Morales","Mateo Jiménez","Chioma Eze","Seun Adeyemi","Divya Nair","Aditya Kumar","Ji Yeon Park","Takeshi Ito","Nadya Kusuma","Fajar Nugroho"),
  prosecutor:       N("Christine Moore","Richard Reeves","Elise Bernard","Stefan Weber","Sofía Aguilar","Andrés Vega","Ngozi Eze","Olumide Adewale","Pooja Menon","Rahul Joshi","Lin Wei","Kenji Yamada","Ratna Puspita","Ahmad Fauzi"),
  defense_lawyer:   N("Christine Moore","Richard Reeves","Elise Bernard","Stefan Weber","Sofía Aguilar","Andrés Vega","Ngozi Eze","Olumide Adewale","Pooja Menon","Rahul Joshi","Lin Wei","Kenji Yamada","Ratna Puspita","Ahmad Fauzi"),
  cross_examiner:   N("Judge Collins","Judge Parker","Judge Leclerc","Judge Schneider","Judge Flores","Judge Torres","Judge Abara","Judge Mensah","Judge Iyer","Judge Rajan","Judge Yamamoto","Judge Chen","Judge Susanto","Judge Hidayat"),
  critic:           N("Emma Reynolds","Jack Morrison","Sophie Laurent","Luca Rossi","Valentina Cruz","Diego Herrera","Zara Osei","Kwame Asante","Ananya Singh","Rohan Mehta","Yuki Nakamura","Jun Ho Kim","Dewi Rahmawati","Rizky Pratama"),
  investigator:     N("Patricia Webb","Michael Grant","Hélène Moreau","Stefan Weber","Lucia Morales","Andrés Vega","Ngozi Eze","Olumide Adewale","Kavya Reddy","Vikram Gupta","Xiao Ying","Hiroshi Tanaka","Kartika Sari","Andi Wijaya"),
  // Formal authoritative
  ceo:              N("Victoria Lane","Charles Whitmore","Isabelle Renard","Klaus Hoffmann","Sofia Aguilar","Pablo Castillo","Adaeze Obi","Chukwu Obiora","Nandini Rao","Rajesh Kumar","Ji Young Park","Kenji Yamada","Andini Putri","Hendra Gunawan"),
  executive:        N("Margaret Stone","Robert Hayes","Anna Kovács","Henrik Larsson","Camila Reyes","Alejandro Ruiz","Fatima Diallo","Emmanuel Eze","Meera Pillai","Sanjay Kapoor","Yuna Choi","Dong Hyun Lee","Rini Setiawan","Fajar Nugroho"),
  regulator:        N("Patricia Webb","Michael Grant","Hélène Moreau","Stefan Weber","Lucia Morales","Andrés Vega","Ngozi Eze","Olumide Adewale","Kavya Reddy","Vikram Gupta","Xiao Ying","Hiroshi Tanaka","Kartika Sari","Andi Wijaya"),
  official:         N("Margaret Stone","Robert Hayes","Anna Kovács","Henrik Larsson","Camila Reyes","Alejandro Ruiz","Fatima Diallo","Emmanuel Eze","Meera Pillai","Sanjay Kapoor","Yuna Choi","Dong Hyun Lee","Rini Setiawan","Fajar Nugroho"),
  diplomat:         N("Victoria Lane","Charles Whitmore","Isabelle Renard","Klaus Hoffmann","Sofia Aguilar","Pablo Castillo","Adaeze Obi","Chukwu Obiora","Nandini Rao","Rajesh Kumar","Ji Young Park","Kenji Yamada","Andini Putri","Hendra Gunawan"),
  commissioner:     N("Patricia Webb","Michael Grant","Hélène Moreau","Stefan Weber","Lucia Morales","Andrés Vega","Ngozi Eze","Olumide Adewale","Kavya Reddy","Vikram Gupta","Xiao Ying","Hiroshi Tanaka","Kartika Sari","Andi Wijaya"),
  dean:             N("Prof. Harrison","Prof. Anderson","Prof. Beaumont","Prof. Fischer","Prof. Gutierrez","Prof. Ramirez","Prof. Adeyemi","Prof. Okafor","Prof. Krishnan","Prof. Nair","Prof. Tanaka","Prof. Park","Prof. Wijaya","Prof. Santoso"),
  professor_academic:N("Prof. Harrison","Prof. Anderson","Prof. Beaumont","Prof. Fischer","Prof. Gutierrez","Prof. Ramirez","Prof. Adeyemi","Prof. Okafor","Prof. Krishnan","Prof. Nair","Prof. Tanaka","Prof. Park","Prof. Wijaya","Prof. Santoso"),
  // Formal service
  client:           N("Rachel Stone","Andrew Cole","Anna Kovács","Henrik Larsson","Camila Reyes","Alejandro Ruiz","Fatima Diallo","Emmanuel Eze","Meera Pillai","Sanjay Kapoor","Yuna Choi","Dong Hyun Lee","Rini Setiawan","Hendra Gunawan"),
  customer:         N("Rachel Stone","Andrew Cole","Anna Kovács","Henrik Larsson","Camila Reyes","Alejandro Ruiz","Fatima Diallo","Emmanuel Eze","Meera Pillai","Sanjay Kapoor","Yuna Choi","Dong Hyun Lee","Rini Setiawan","Hendra Gunawan"),
  negotiator:       N("Laura Bennett","Daniel Webb","Ingrid Hansen","Marco Bianchi","Gabriela Soto","Mateo Jiménez","Chioma Eze","Seun Adeyemi","Divya Nair","Aditya Kumar","Ji Yeon Park","Takeshi Ito","Nadya Kusuma","Ahmad Fauzi"),
  vendor:           N("Sarah Mitchell","James Carter","Claire Dubois","Thomas Müller","Isabella Vargas","Carlos Mendoza","Amara Johnson","Marcus Williams","Priya Sharma","Arjun Patel","Mei Lin","Wei Zhang","Siti Rahayu","Budi Santoso"),
  partner:          N("Laura Bennett","Daniel Webb","Ingrid Hansen","Marco Bianchi","Gabriela Soto","Mateo Jiménez","Chioma Eze","Seun Adeyemi","Divya Nair","Aditya Kumar","Ji Yeon Park","Takeshi Ito","Nadya Kusuma","Ahmad Fauzi"),
  contractor:       N("Sarah Mitchell","James Carter","Claire Dubois","Thomas Müller","Isabella Vargas","Carlos Mendoza","Amara Johnson","Marcus Williams","Priya Sharma","Arjun Patel","Mei Lin","Wei Zhang","Siti Rahayu","Budi Santoso"),
  // Formal audience
  voter:            N("Rachel Stone","Andrew Cole","Anna Kovács","Henrik Larsson","Camila Reyes","Alejandro Ruiz","Fatima Diallo","Emmanuel Eze","Meera Pillai","Sanjay Kapoor","Yuna Choi","Dong Hyun Lee","Rini Setiawan","Hendra Gunawan"),
  shareholder:      N("Margaret Stone","Robert Hayes","Anna Kovács","Henrik Larsson","Camila Reyes","Alejandro Ruiz","Fatima Diallo","Emmanuel Eze","Meera Pillai","Sanjay Kapoor","Yuna Choi","Dong Hyun Lee","Rini Setiawan","Hendra Gunawan"),
  consumer:         N("Rachel Stone","Andrew Cole","Anna Kovács","Henrik Larsson","Camila Reyes","Alejandro Ruiz","Fatima Diallo","Emmanuel Eze","Meera Pillai","Sanjay Kapoor","Yuna Choi","Dong Hyun Lee","Rini Setiawan","Hendra Gunawan"),
  media_audience:   N("Rachel Stone","Andrew Cole","Anna Kovács","Henrik Larsson","Camila Reyes","Alejandro Ruiz","Fatima Diallo","Emmanuel Eze","Meera Pillai","Sanjay Kapoor","Yuna Choi","Dong Hyun Lee","Rini Setiawan","Hendra Gunawan"),
  // Social — relasi dekat
  friend_female:    N("Lily","Alex","Léa","Luka","Valentina","Mateo","Zuri","Kofi","Nisha","Rohan","Hana","Jae","Putri","Bagas"),
  friend_male:      N("Alex","Alex","Luka","Luka","Mateo","Mateo","Kofi","Kofi","Rohan","Rohan","Jae","Jae","Bagas","Bagas"),
  best_friend:      N("Lily","Alex","Léa","Luka","Valentina","Mateo","Zuri","Kofi","Nisha","Rohan","Hana","Jae","Putri","Bagas"),
  ex_partner:       N("Lily","Alex","Léa","Luka","Valentina","Mateo","Zuri","Kofi","Nisha","Rohan","Hana","Jae","Putri","Bagas"),
  sibling:          N("Emma","Liam","Chloé","Noah","Sofía","Mateo","Amara","Kofi","Priya","Arjun","Mia","Kai","Sari","Dimas"),
  parent:           N("Mom","Dad","Maman","Papa","Mamá","Papá","Mom","Dad","Amma","Appa","Mama","Baba","Ibu","Ayah"),
  grandparent:      N("Grandma","Grandpa","Grand-mère","Grand-père","Abuela","Abuelo","Grandma","Grandpa","Paati","Thatha","Obaachan","Ojichan","Nenek","Kakek"),
  crush:            N("Her","Him","Her","Him","Ella","Él","Her","Him","Her","Him","Her","Him","Dia","Dia"),
  romantic_interest:N("Her","Him","Her","Him","Ella","Él","Her","Him","Her","Him","Her","Him","Dia","Dia"),
  // Social — relasi profesional
  colleague:        N("Megan","Ryan","Eva","Jonas","Paula","Felipe","Amina","Kwesi","Sunita","Kiran","Mia","Jason","Dina","Dimas"),
  manager:          N("Sarah Mitchell","James Carter","Claire Dubois","Thomas Müller","Isabella Vargas","Carlos Mendoza","Amara Johnson","Marcus Williams","Priya Sharma","Arjun Patel","Mei Lin","Wei Zhang","Siti Rahayu","Budi Santoso"),
  subordinate:      N("Megan","Ryan","Eva","Jonas","Paula","Felipe","Amina","Kwesi","Sunita","Kiran","Mia","Jason","Dina","Dimas"),
  mentor:           N("Prof. Harrison","Prof. Anderson","Prof. Beaumont","Prof. Fischer","Prof. Gutierrez","Prof. Ramirez","Prof. Adeyemi","Prof. Okafor","Prof. Krishnan","Prof. Nair","Prof. Tanaka","Prof. Park","Prof. Wijaya","Prof. Santoso"),
  mentee:           N("Megan","Ryan","Eva","Jonas","Paula","Felipe","Amina","Kwesi","Sunita","Kiran","Mia","Jason","Dina","Dimas"),
  senior:           N("Margaret Stone","Robert Hayes","Anna Kovács","Henrik Larsson","Camila Reyes","Alejandro Ruiz","Fatima Diallo","Emmanuel Eze","Meera Pillai","Sanjay Kapoor","Yuna Choi","Dong Hyun Lee","Rini Setiawan","Hendra Gunawan"),
  junior:           N("Megan","Ryan","Eva","Jonas","Paula","Felipe","Amina","Kwesi","Sunita","Kiran","Mia","Jason","Dina","Dimas"),
  // Social — stranger/acquaintance
  stranger:         N("A woman","A man","A woman","A man","A woman","A man","A woman","A man","A woman","A man","A woman","A man","Seseorang","Seseorang"),
  new_acquaintance: N("Lily","Alex","Léa","Luka","Valentina","Mateo","Zuri","Kofi","Nisha","Rohan","Hana","Jae","Putri","Bagas"),
  neighbor:         N("Rachel","Tom","Eva","Jonas","Paula","Felipe","Amina","Kwesi","Sunita","Kiran","Mia","Jason","Dina","Dimas"),
  classmate:        N("Megan","Ryan","Eva","Jonas","Paula","Felipe","Amina","Kwesi","Sunita","Kiran","Mia","Jason","Dina","Dimas"),
  alumni:           N("Sarah","James","Claire","Thomas","Isabella","Carlos","Amara","Marcus","Priya","Arjun","Mei","Wei","Siti","Budi"),
  // Social — situasional
  date:             N("Her","Him","Her","Him","Ella","Él","Her","Him","Her","Him","Her","Him","Dia","Dia"),
  blind_date:       N("Her","Him","Her","Him","Ella","Él","Her","Him","Her","Him","Her","Him","Dia","Dia"),
  host:             N("Rachel","Tom","Eva","Jonas","Paula","Felipe","Amina","Kwesi","Sunita","Kiran","Mia","Jason","Dina","Dimas"),
  guest:            N("Rachel","Tom","Eva","Jonas","Paula","Felipe","Amina","Kwesi","Sunita","Kiran","Mia","Jason","Dina","Dimas"),
  fellow_passenger: N("A woman","A man","A woman","A man","A woman","A man","A woman","A man","A woman","A man","A woman","A man","Seseorang","Seseorang"),
  customer_service: N("Sarah","James","Claire","Thomas","Isabella","Carlos","Amara","Marcus","Priya","Arjun","Mei","Wei","Siti","Budi"),
  // Indonesia kontekstual
  pak_rt:           N("Bu RT","Pak RT","Bu RT","Pak RT","Bu RT","Pak RT","Bu RT","Pak RT","Bu RT","Pak RT","Bu RT","Pak RT","Bu RT","Pak RT"),
  dosen_pembimbing: N("Prof. Wijaya","Prof. Santoso","Prof. Wijaya","Prof. Santoso","Prof. Wijaya","Prof. Santoso","Prof. Wijaya","Prof. Santoso","Prof. Wijaya","Prof. Santoso","Prof. Wijaya","Prof. Santoso","Prof. Wijaya","Prof. Santoso"),
  calon_mertua:     N("Bu Mertua","Pak Mertua","Bu Mertua","Pak Mertua","Bu Mertua","Pak Mertua","Bu Mertua","Pak Mertua","Bu Mertua","Pak Mertua","Bu Mertua","Pak Mertua","Bu Mertua","Pak Mertua"),
  senior_organisasi:N("Kak Sari","Kak Dimas","Kak Sari","Kak Dimas","Kak Sari","Kak Dimas","Kak Sari","Kak Dimas","Kak Sari","Kak Dimas","Kak Sari","Kak Dimas","Kak Sari","Kak Dimas"),
  teman_ospek:      N("Putri","Bagas","Putri","Bagas","Putri","Bagas","Putri","Bagas","Putri","Bagas","Putri","Bagas","Putri","Bagas"),
  anggota_tim_debat:N("Nadya","Fajar","Nadya","Fajar","Nadya","Fajar","Nadya","Fajar","Nadya","Fajar","Nadya","Fajar","Nadya","Fajar"),
};

// ─── Generate character ────────────────────────────────────────────────────
const generateChar = (roleKey, forcedGender = null) => {
  // Only friend_female/friend_male are explicitly gendered by role name
  // Everything else: use forcedGender from GENDER tag, or random
  const roleImpliedGender = roleKey === "friend_female" ? "f"
    : roleKey === "friend_male" ? "m"
    : null;
  const gender = forcedGender || roleImpliedGender || (Math.random() > 0.5 ? "f" : "m");
  const eth = pick(ETHNICITIES);
  const skin = pick(SKIN[eth] || SKIN.white);
  const hair = pick(HAIR[eth] || HAIR.white);
  // Female characters: ALWAYS long hair
  // Male characters: never long hair
  const hairLong = gender === "f";
  // Glasses: less common for young social roles, more common for formal/academic
  const formalRoles = ["examiner","dean","professor_academic","auditor","regulator","board_member","investor","ceo","executive","dosen_pembimbing","mentor","senior","grandparent","parent","calon_mertua"];
  const glasses = formalRoles.includes(roleKey) ? Math.random() > 0.45 : Math.random() > 0.82;
  const beard = gender === "m" && Math.random() > 0.6;
  const namePool = NAME_POOL[roleKey];
  const name = namePool ? (namePool[gender][eth] || namePool[gender]["white"]) : roleKey;

  const ACCENTS = { white:"#C8B8A0", latin:"#BC9A70", black:"#A87850", european:"#B0A888", south_asian:"#BC9060", east_asian:"#A8B8C0", sea:"#C8A870" };
  const BGS = { white:"#181410", latin:"#1A1208", black:"#141010", european:"#161614", south_asian:"#1A1410", east_asian:"#141618", sea:"#181410" };

  // Body color groups
  const formalDark = ["interviewer","examiner","judge","journalist","auditor","board_member","investor","acquirer","reviewer","panelist","opponent","prosecutor","defense_lawyer","cross_examiner","critic","investigator","ceo","executive","regulator","official","diplomat","commissioner","dean","professor_academic","negotiator","vendor","partner","contractor","voter","shareholder","consumer","media_audience"];
  const formalWarm = ["client","customer"];
  const socialWarm = ["friend_female","best_friend","ex_partner","crush","romantic_interest","date","blind_date","parent","grandparent"];
  const socialNeutral = ["friend_male","colleague","manager","subordinate","mentor","mentee","senior","junior","stranger","new_acquaintance","neighbor","classmate","alumni","host","guest","fellow_passenger","customer_service","sibling"];
  const idRoles = ["pak_rt","dosen_pembimbing","calon_mertua","senior_organisasi","teman_ospek","anggota_tim_debat"];

  let bodyColor = "#2A2520";
  if (formalDark.includes(roleKey)) bodyColor = gender === "m" ? "#1A1A2A" : "#1E2030";
  else if (formalWarm.includes(roleKey)) bodyColor = "#22182A";
  else if (socialWarm.includes(roleKey)) bodyColor = "#2A1E28";
  else if (socialNeutral.includes(roleKey)) bodyColor = "#1E2228";
  else if (idRoles.includes(roleKey)) bodyColor = "#1E2418";

  const tieRoles = ["interviewer","defense_lawyer","prosecutor","negotiator","ceo","executive","diplomat","board_member","acquirer","investor"];
  const tie = tieRoles.includes(roleKey) && gender === "m" ? "#8A7A6A" : null;

  return { name, gender, ethnicity: eth, roleKey, accent: ACCENTS[eth]||"#C8B89A", bg: BGS[eth]||"#161410", skin, hair, hairLong, glasses, beard, bodyColor, tie };
};

// Static CHARS for default/coach only; others generated dynamically
const CHARS = {
  default: {
    name:"Profess", title:"Your Coach", accent:"#C8B89A", bg:"#16130F",
    skin:"#D4A87A", hair:"#E8E4DC", hairLong:false, glasses:true, beard:false,
    bodyColor:"#5A6068", tie:null, isCoach:true,
  },
};

const MOOD_DATA = {
  neutral:       { browL:"M54 88 Q62 84 70 87", browR:"M90 87 Q98 84 106 88", eyeRy:5.5, eyeLy:5.5, mouth:"neutral",  blush:0,   think:false, sweat:false },
  surprised:     { browL:"M53 83 Q62 77 71 82", browR:"M90 82 Q98 77 107 83", eyeRy:8.5, eyeLy:8.5, mouth:"surprised",blush:.28, think:false, sweat:false },
  amused:        { browL:"M54 89 Q62 85 70 88", browR:"M90 88 Q98 85 106 89", eyeRy:3.5, eyeLy:3.5, mouth:"amused",   blush:.42, think:false, sweat:false },
  thinking:      { browL:"M54 87 Q62 82 70 86", browR:"M90 85 Q98 82 106 87", eyeRy:4.5, eyeLy:4.5, mouth:"thinking", blush:0,   think:true,  sweat:false },
  warm:          { browL:"M54 90 Q62 86 70 89", browR:"M90 89 Q98 86 106 90", eyeRy:4,   eyeLy:4,   mouth:"warm",     blush:.5,  think:false, sweat:false },
  skeptical:     { browL:"M53 86 Q62 81 71 85", browR:"M90 88 Q98 85 106 89", eyeRy:4,   eyeLy:5.5, mouth:"skeptical",blush:0,   think:false, sweat:false },
  serious:       { browL:"M53 87 L71 89",        browR:"M90 89 L108 87",       eyeRy:5.5, eyeLy:5.5, mouth:"serious",  blush:0,   think:false, sweat:false },
  uncomfortable: { browL:"M54 89 Q62 93 70 89", browR:"M90 89 Q98 93 106 89", eyeRy:5.5, eyeLy:5.5, mouth:"uncomf",   blush:.35, think:false, sweat:true  },
};

function darken(hex, amt) {
  try { let r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `#${Math.max(0,r-amt).toString(16).padStart(2,"0")}${Math.max(0,g-amt).toString(16).padStart(2,"0")}${Math.max(0,b-amt).toString(16).padStart(2,"0")}`; } catch { return hex; }
}
function lighten(hex, amt) {
  try { let r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `#${Math.min(255,r+amt).toString(16).padStart(2,"0")}${Math.min(255,g+amt).toString(16).padStart(2,"0")}${Math.min(255,b+amt).toString(16).padStart(2,"0")}`; } catch { return hex; }
}

function buildSVG(charOrKey, mood, isTalking) {
  const c = (typeof charOrKey === "object" && charOrKey !== null)
    ? charOrKey
    : (CHARS[charOrKey] || CHARS.default);
  const roleKey = c.roleKey || (typeof charOrKey === "string" ? charOrKey : "default");
  const isCoach = !!c.isCoach;
  const s = c.skin, h = c.hair, b = c.bodyColor;
  const md = MOOD_DATA[mood] || MOOD_DATA.neutral;
  const hairDark = isCoach ? "#B0AAA0" : darken(h, 25);

  // ── Hair ──────────────────────────────────────────────────────────────
  const hairSVG = isCoach
    ? `<ellipse cx="80" cy="47" rx="34" ry="17" fill="${h}"/>
       <rect x="46" y="47" width="68" height="20" fill="${h}"/>
       <ellipse cx="80" cy="47" rx="34" ry="17" fill="${h}" opacity=".5"/>
       <ellipse cx="46" cy="68" rx="8" ry="14" fill="${h}"/>
       <ellipse cx="114" cy="68" rx="8" ry="14" fill="${h}"/>`
    : c.hairLong
    ? `<ellipse cx="80" cy="46" rx="34" ry="20" fill="${h}"/>
       <rect x="46" y="46" width="68" height="22" fill="${h}"/>
       <ellipse cx="47" cy="88" rx="11" ry="34" fill="${h}"/>
       <ellipse cx="113" cy="88" rx="11" ry="34" fill="${h}"/>
       <ellipse cx="80" cy="130" rx="34" ry="14" fill="${h}" opacity=".7"/>`
    : `<ellipse cx="80" cy="47" rx="33" ry="18" fill="${h}"/>
       <rect x="47" y="47" width="66" height="22" fill="${h}"/>`;

  // ── Glasses ───────────────────────────────────────────────────────────
  const glassesColor = isCoach ? "#C8A840" : "#4A3828"; // gold for coach
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
  const armL = `<rect x="20" y="132" rx="10" width="22" height="54" fill="${b}"/>`;
  const armRBase = `<rect x="118" y="132" rx="10" width="22" height="54" fill="${b}"/>`;
  // Gesture wraps right arm during talking for expressive roles
  const gestureRoles = ["interviewer","journalist","opponent","prosecutor","negotiator","ceo","executive","friend_female","best_friend","friend_male","acquirer"];
  const armR = (isTalking && gestureRoles.includes(roleKey))
    ? `<g style="animation:gesturePoint 3s ease-in-out infinite;transform-origin:129px 132px">${armRBase}</g>`
    : armRBase;

  // Desk — shared by seated roles
  const desk = (deskColor = "#6A5030") =>
    `<rect x="-10" y="188" width="180" height="14" rx="4" fill="${deskColor}"/>
     <rect x="0" y="200" width="12" height="36" rx="3" fill="${darken(deskColor,15)}"/>
     <rect x="148" y="200" width="12" height="36" rx="3" fill="${darken(deskColor,15)}"/>`;

  let bodySVG = "";
  let sceneSVG = "";

  if (isCoach) {
    // Grey sweater — V-neck with texture suggestion
    bodySVG = `
      <rect x="38" y="128" rx="14" width="84" height="92" fill="${b}"/>
      <path d="M62 128 L80 148 L98 128 L90 128 L80 142 L70 128Z" fill="${darken(b,15)}"/>
      <ellipse cx="80" cy="145" rx="12" ry="6" fill="${darken(b,10)}" opacity=".4"/>
      ${armL}${armR}`;
    // Small book in hand — professor touch
    sceneSVG = `
      <rect x="118" y="162" rx="3" width="28" height="36" fill="#8A7060"/>
      <rect x="120" y="164" rx="2" width="24" height="32" fill="#9A8070"/>
      <line x1="124" y1="170" x2="142" y2="170" stroke="#C8B8A0" stroke-width="1"/>
      <line x1="124" y1="176" x2="142" y2="176" stroke="#C8B8A0" stroke-width="1"/>
      <line x1="124" y1="182" x2="136" y2="182" stroke="#C8B8A0" stroke-width="1"/>`;
  } else {
    switch(roleKey) {
      // ── Desk + clipboard (interviewer style) ──────────────────────────
      case "interviewer": case "reviewer": case "auditor": case "investigator":
      case "regulator": case "commissioner": case "official": case "customer_service":
      case "manager":
        sceneSVG = desk("#7A6848");
        bodySVG = `<rect x="40" y="128" rx="8" width="80" height="92" fill="${b}"/>
          <path d="M58 128 L80 150 L102 128 L94 128 L80 144 L66 128Z" fill="#243A52"/>
          <rect x="68" y="128" width="24" height="26" fill="#EAE7E0"/>
          ${armL}
          <rect x="14" y="162" rx="3" width="26" height="34" fill="#EAE0D0"/>
          <rect x="20" y="156" rx="2" width="12" height="10" fill="#9A8A7A"/>
          <line x1="18" y1="174" x2="36" y2="174" stroke="#ADA090" stroke-width="1.5"/>
          <line x1="18" y1="181" x2="36" y2="181" stroke="#ADA090" stroke-width="1.5"/>
          ${armR}`; break;

      // ── Desk + papers (lawyer/formal) ────────────────────────────────
      case "defense_lawyer": case "prosecutor": case "cross_examiner":
        sceneSVG = desk("#5A4828") +
          `<rect x="30" y="168" rx="2" width="36" height="20" fill="#E8DCC0" opacity=".9"/>
           <line x1="33" y1="174" x2="63" y2="174" stroke="#8A7A60" stroke-width="1"/>
           <line x1="33" y1="179" x2="63" y2="179" stroke="#8A7A60" stroke-width="1"/>`;
        bodySVG = `<rect x="40" y="128" rx="8" width="80" height="92" fill="${b}"/>
          <path d="M58 128 L80 150 L102 128 L94 128 L80 144 L66 128Z" fill="#111"/>
          <rect x="68" y="128" width="24" height="26" fill="#EAE7E0"/>
          <path d="M74 128 L80 141 L86 128" fill="${c.tie||"#8A7A6A"}"/>
          ${armL}${armR}`; break;

      // ── Desk + pen (examiner style) ───────────────────────────────────
      case "examiner": case "dean": case "professor_academic": case "panelist":
      case "dosen_pembimbing":
        sceneSVG = desk("#6A5838") +
          `<rect x="25" y="162" rx="2" width="42" height="26" fill="#E8E0D0"/>
           <line x1="28" y1="168" x2="64" y2="168" stroke="#9A8A70" stroke-width="1"/>
           <line x1="28" y1="174" x2="64" y2="174" stroke="#9A8A70" stroke-width="1"/>
           <line x1="28" y1="180" x2="48" y2="180" stroke="#9A8A70" stroke-width="1"/>`;
        bodySVG = `<rect x="36" y="128" rx="8" width="88" height="92" fill="${b}"/>
          <path d="M54 128 L80 150 L106 128" fill="#7A5A20" opacity=".9"/>
          ${armL}
          <rect x="118" y="116" rx="10" width="20" height="54" fill="${b}" style="transform:rotate(-20deg);transform-origin:128px 143px"/>
          <rect x="121" y="93" rx="2" width="5" height="30" fill="#C8A840" style="transform:rotate(20deg);transform-origin:123px 108px"/>
          <circle cx="124" cy="91" r="5" fill="#E8C850"/>`; break;

      // ── Standing with mic (journalist style) ──────────────────────────
      case "journalist": case "critic": case "media_audience":
        bodySVG = `<rect x="40" y="128" rx="8" width="80" height="92" fill="${b}"/>
          <rect x="88" y="138" rx="3" width="24" height="16" fill="#EAE0D0"/>
          <rect x="90" y="140" rx="2" width="20" height="6" fill="#BC7A7A"/>
          ${armL}
          <rect x="118" y="134" rx="10" width="22" height="52" fill="${b}" style="transform:rotate(-15deg);transform-origin:129px 160px"/>`;
        sceneSVG = `
          <rect x="118" y="148" rx="4" width="8" height="28" fill="#2A2A2A" style="transform:rotate(-15deg);transform-origin:122px 162px"/>
          <ellipse cx="120" cy="148" rx="9" ry="11" fill="#3A3A3A" style="transform:rotate(-15deg);transform-origin:120px 148px"/>
          <ellipse cx="120" cy="148" rx="6" ry="7" fill="#222" style="transform:rotate(-15deg);transform-origin:120px 148px"/>`; break;

      // ── Desk + gavel (judge style) ────────────────────────────────────
      case "judge":
        sceneSVG = desk("#4A3820") +
          `<rect x="55" y="162" rx="2" width="50" height="26" fill="#E8E0CC"/>
           <rect x="95" y="154" rx="3" width="8" height="18" fill="#6A5030"/>
           <ellipse cx="99" cy="153" rx="8" ry="5" fill="#7A6040"/>`;
        bodySVG = `<rect x="40" y="128" rx="8" width="80" height="92" fill="${b}"/>
          <path d="M58 128 L80 150 L102 128 L94 128 L80 144 L66 128Z" fill="#243224"/>
          ${armL}${armR}`; break;

      // ── Conference desk (negotiator/executive/board) ──────────────────
      case "negotiator": case "partner": case "board_member": case "shareholder":
      case "ceo": case "executive": case "diplomat": case "acquirer":
        sceneSVG = desk("#606858") +
          `<rect x="20" y="168" rx="2" width="120" height="4" fill="#8A9080" opacity=".4"/>`;
        bodySVG = `<rect x="40" y="128" rx="8" width="80" height="92" fill="${b}"/>
          <path d="M58 128 L80 148 L102 128 L94 128 L80 142 L66 128Z" fill="#243A22"/>
          <path d="M77 128 L80 138 L83 128" fill="${c.tie||"#8AB87A"}"/>
          <rect x="20" y="134" rx="10" width="22" height="48" fill="${b}" style="transform:rotate(14deg);transform-origin:31px 158px"/>
          <rect x="118" y="134" rx="10" width="22" height="48" fill="${b}" style="transform:rotate(-14deg);transform-origin:129px 158px"/>`; break;

      // ── Investor/client — relaxed desk ────────────────────────────────
      case "investor": case "client": case "customer": case "consumer":
      case "voter": case "vendor": case "contractor":
        sceneSVG = desk("#5A5048");
        bodySVG = `<rect x="40" y="128" rx="8" width="80" height="92" fill="${b}"/>
          <rect x="68" y="128" width="24" height="26" fill="#E8E5DE"/>
          ${armL}${armR}`; break;

      // ── Social warm (friend female / romantic) ────────────────────────
      case "friend_female": case "best_friend": case "crush": case "romantic_interest":
      case "date": case "blind_date": case "ex_partner":
        bodySVG = `<rect x="42" y="130" rx="14" width="76" height="90" fill="${b}"/>
          <path d="M58 130 Q80 141 102 130" fill="none" stroke="#C890A0" stroke-width="2.5"/>
          <rect x="20" y="136" rx="10" width="22" height="50" fill="${b}"/>
          <rect x="118" y="136" rx="10" width="22" height="50" fill="${b}"/>`; break;

      // ── Parent/grandparent/mentor ─────────────────────────────────────
      case "parent": case "grandparent": case "mentor": case "pak_rt":
      case "calon_mertua": case "dosen_pembimbing":
        bodySVG = `<rect x="40" y="128" rx="10" width="80" height="92" fill="${b}"/>
          <path d="M58 128 Q80 137 102 128" fill="none" stroke="#5A7050" stroke-width="2"/>
          ${armL}${armR}`; break;

      // ── Opponent — assertive pose ─────────────────────────────────────
      case "opponent":
        bodySVG = `<rect x="40" y="128" rx="8" width="80" height="92" fill="${b}"/>
          <path d="M58 128 L80 150 L102 128 L94 128 L80 144 L66 128Z" fill="#1A120A"/>
          ${armL}
          <rect x="118" y="140" rx="10" width="22" height="54" fill="${b}" style="transform:rotate(-26deg);transform-origin:129px 167px"/>`; break;

      // ── Default social/casual ─────────────────────────────────────────
      default:
        bodySVG = `<rect x="42" y="130" rx="12" width="76" height="90" fill="${b}"/>
          <path d="M60 130 Q80 142 100 130" fill="none" stroke="${darken(b,10)}" stroke-width="1.5"/>
          ${armL}${armR}`;
    }
  }

  // ── Gesture arm selection per role ────────────────────────────────────
  const gestureAnim = isTalking ? {
    interviewer: "gesturePoint 3.5s ease-in-out infinite",
    journalist:  "gesturePoint 2.8s ease-in-out infinite",
    opponent:    "gesturePoint 2.5s ease-in-out infinite",
    prosecutor:  "gesturePoint 3s ease-in-out infinite",
    negotiator:  "gestureNegotiate 4s ease-in-out infinite",
    ceo:         "gestureNegotiate 4.5s ease-in-out infinite",
    executive:   "gestureNegotiate 4.5s ease-in-out infinite",
    friend_female:"gestureOpen 3s ease-in-out infinite",
    best_friend: "gestureOpen 2.8s ease-in-out infinite",
    friend_male: "gestureOpen 3.5s ease-in-out infinite",
  }[roleKey] || null : null;

  // Blink timing — slightly different per character so they don't all blink at once
  const blinkDuration = 3.8 + (roleKey?.length || 0) % 3 * 0.6;
  const blinkAnim = `blink ${blinkDuration}s ease-in-out infinite`;
  const eyeAnim = isTalking ? null : `eyeDrift ${5 + (roleKey?.length || 0) % 4}s ease-in-out infinite`;

  // Brow micro-flash on surprised/amused
  const browAnim = (mood === "surprised" || mood === "amused")
    ? "browFlash 2.5s ease-in-out infinite"
    : null;

  return `<svg viewBox="0 0 160 240" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;overflow:visible">
    ${sceneSVG}
    ${bodySVG}
    <circle cx="80" cy="82" r="42" fill="${s}"/>
    ${hairSVG}
    <ellipse cx="38" cy="86" rx="7" ry="9" fill="${s}"/>
    <ellipse cx="122" cy="86" rx="7" ry="9" fill="${s}"/>
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
  </svg>`;
}

// ─── Main component ────────────────────────────────────────────────────────
export default function Profess() {
  const [screen, setScreen] = useState("lang"); // lang | mode | disclaimer | intensity | scenario | session | summary
  const [lang, setLang] = useState(null);
  const [sessionMode, setSessionMode] = useState(null);
  const [pendingMode, setPendingMode] = useState(null);
  const [intensity, setIntensity] = useState(null);
  const [scenario, setScenario] = useState(null); // selected scenario or null for free
  const [summary, setSummary] = useState(null);
  const [lastExchange, setLastExchange] = useState(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentRole, setCurrentRole] = useState("default");
  const [currentMood, setCurrentMood] = useState("neutral");
  const [isInRole, setIsInRole] = useState(false);
  const [charCache, setCharCache] = useState({}); // cache generated chars per role per session
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTalking, setIsTalking] = useState(false); // mouth animation
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState(null);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const speechRef = useRef(null);
  const recognitionRef = useRef(null);
  const talkTimerRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      if (COACHING_RE.test(trimmed)) {
        inCoaching = true;
        segments.push({ type: 'section_break' });
        continue;
      }
      const stageMatch = trimmed.match(/^\(\((.*?)\)\)$/);
      if (stageMatch) {
        inCoaching = false;
        segments.push({ type: 'stage', text: stageMatch[1].trim() });
      } else {
        const segType = inCoaching ? 'coaching' : 'dialog';
        const last = segments.length > 0 ? segments[segments.length-1] : null;
        if (last && last.type === segType) {
          last.text += ' ' + trimmed;
        } else {
          segments.push({ type: segType, text: trimmed });
        }
      }
    }
    return segments;
  };

  const scrubForSpeech = (text) => text
    .replace(/\[.*?\]/g, '')
    .replace(/\(\(.*?\)\)/g, '')
    .replace(/^---+$/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_{1,2}(.*?)_{1,2}/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    // Strip punctuation that TTS reads literally
    .replace(/—/g, ', ')
    .replace(/–/g, ', ')
    .replace(/ - /g, ', ')
    .replace(/\.\.\./g, '. ')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Strip remaining symbols
    .replace(/[*_~`#|>]/g, '')
    .replace(/\[|\]/g, '')
    .replace(/\(|\)/g, '')
    // Clean whitespace
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .substring(0, 700);

  const cleanForSpeech = scrubForSpeech;

  const getVoiceProfile = useCallback((role, mood, inRole, isInnerThought = false) => {
    const voices = window.speechSynthesis?.getVoices() || [];
    const byName = (name) => voices.find(v => v.name === name);
    const isID = lang === "id";

    // For Indonesian sessions: use Google Bahasa Indonesia for all roles
    // Rate tuned slower because Indonesian TTS needs more time to sound natural
    if (isID) {
      const idVoice = byName("Google Bahasa Indonesia") ||
        voices.find(v => v.lang === "id-ID") ||
        byName("Google UK English Male") || // last resort fallback
        voices.find(v => v.lang?.startsWith("en"));

      let rate = 1.05, pitch = 1.0, volume = 0.92;

      // Indonesian voice sounds clearer at slightly slower rate than English
      if (!inRole) { rate = 1.0; pitch = 1.0; }
      else {
        switch(role) {
          case "interviewer":   rate = 0.98; pitch = 1.02; break;
          case "journalist":    rate = 1.06; pitch = 1.04; break;
          case "judge":         rate = 0.92; pitch = 0.96; break;
          case "examiner":      rate = 0.94; pitch = 0.97; break;
          case "lawyer":        rate = 0.96; pitch = 0.98; break;
          case "opponent":      rate = 1.08; pitch = 1.0;  break;
          case "parent":        rate = 0.94; pitch = 0.97; break;
          case "friend_female": rate = 1.10; pitch = 1.06; break;
          case "friend_male":   rate = 1.08; pitch = 1.0;  break;
          case "colleague":     rate = 1.04; pitch = 1.0;  break;
          case "stranger":      rate = 1.02; pitch = 0.99; break;
          default:              rate = 1.0;  pitch = 1.0;
        }
      }

      if (isInnerThought) { rate = Math.max(0.80, rate - 0.12); volume = Math.max(0.38, volume - 0.34); pitch = Math.min(1.50, pitch + 0.15); }

      const moodMod = { surprised:{rate:.06,pitch:.10}, amused:{rate:.04,pitch:.08}, thinking:{rate:-.05,pitch:-.03}, warm:{rate:-.02,pitch:.03}, skeptical:{rate:-.03,pitch:-.05}, serious:{rate:-.04,pitch:-.08}, uncomfortable:{rate:-.02,pitch:.02}, neutral:{rate:0,pitch:0} }[mood] || {rate:0,pitch:0};

      return {
        voice: idVoice,
        rate:   Math.max(0.78, Math.min(1.3, rate  + moodMod.rate)),
        pitch:  Math.max(0.7,  Math.min(1.3, pitch + moodMod.pitch)),
        volume: Math.max(0.4,  Math.min(1.0, volume)),
      };
    }

    // ── English voice assignment ───────────────────────────────────────────
    let voice = null;
    if (!inRole) {
      // Coach: Microsoft David at low pitch sounds older and more authoritative
      voice = byName("Microsoft David - English (United States)") || byName("Google UK English Male");
    } else {
      switch(role) {
        case "interviewer":
        case "journalist":
          voice = byName("Google UK English Female"); break;
        case "judge":
        case "examiner":
        case "lawyer":
        case "opponent":
        // Formal authoritative/adversarial — deep, deliberate
        case "judge": case "examiner": case "prosecutor": case "cross_examiner":
        case "dean": case "regulator": case "official": case "commissioner":
        case "board_member": case "auditor": case "parent": case "grandparent":
        case "professor_academic": case "mentor": case "senior": case "calon_mertua":
        case "dosen_pembimbing": case "pak_rt":
          voice = byName("Microsoft David - English (United States)"); break;
        // Formal female — professional UK
        case "interviewer": case "journalist": case "critic": case "investigator":
        case "reviewer": case "panelist": case "manager": case "defense_lawyer":
          voice = byName("Google UK English Female"); break;
        // Casual female — warm US
        case "friend_female": case "best_friend": case "crush": case "romantic_interest":
        case "date": case "blind_date": case "sibling": case "ex_partner":
          voice = byName("Google US English"); break;
        // Casual male — relaxed Mark
        case "friend_male": case "colleague": case "stranger": case "new_acquaintance":
        case "neighbor": case "classmate": case "alumni": case "subordinate":
        case "mentee": case "junior": case "teman_ospek": case "anggota_tim_debat":
        case "senior_organisasi": case "host": case "guest": case "fellow_passenger":
        case "customer_service":
          voice = byName("Microsoft Mark - English (United States)"); break;
        // Formal composed — UK Male
        case "negotiator": case "client": case "customer": case "ceo": case "executive":
        case "diplomat": case "investor": case "acquirer": case "partner": case "vendor":
        case "contractor": case "shareholder": case "voter": case "consumer":
        case "media_audience": case "opponent":
          voice = byName("Google UK English Male"); break;
        default:
          voice = byName("Google UK English Male");
      }
    }
    if (!voice) voice = byName("Google UK English Male") || byName("Google US English") || voices.find(v=>v.lang?.startsWith("en"));

    let rate = 1.0, pitch = 1.0, volume = 0.92;

    if (!inRole) {
      rate = 1.05; pitch = 0.82; volume = 0.92; // Coach: lower pitch = older, wiser
    } else {
      switch(role) {
        // Evaluators
        case "interviewer": case "reviewer": case "panelist":
          rate = 1.02; pitch = 0.98; volume = 0.90; break;
        case "journalist": case "critic":
          rate = 1.12; pitch = 1.05; volume = 0.93; break;
        case "judge": case "cross_examiner":
          rate = 0.96; pitch = 0.80; volume = 0.95; break; // very deep
        case "examiner": case "dean": case "professor_academic": case "dosen_pembimbing":
          rate = 0.98; pitch = 0.84; volume = 0.93; break;
        case "auditor": case "regulator": case "commissioner": case "investigator":
          rate = 0.96; pitch = 0.86; volume = 0.94; break;
        case "board_member": case "shareholder":
          rate = 0.98; pitch = 0.88; volume = 0.95; break;
        // Adversarial
        case "opponent": case "prosecutor":
          rate = 1.15; pitch = 0.92; volume = 0.95; break;
        case "defense_lawyer":
          rate = 1.00; pitch = 0.88; volume = 0.94; break;
        // Authoritative
        case "ceo": case "executive": case "diplomat": case "official":
          rate = 0.98; pitch = 0.88; volume = 0.95; break;
        case "investor": case "acquirer":
          rate = 1.00; pitch = 0.90; volume = 0.93; break;
        // Negotiation/service
        case "negotiator": case "partner":
          rate = 1.02; pitch = 0.90; volume = 0.93; break;
        case "client": case "customer": case "consumer":
          rate = 1.06; pitch = 0.94; volume = 0.91; break;
        case "vendor": case "contractor":
          rate = 1.05; pitch = 0.96; volume = 0.90; break;
        case "customer_service":
          rate = 1.08; pitch = 1.04; volume = 0.90; break;
        // Audience
        case "voter": case "media_audience":
          rate = 1.05; pitch = 0.96; volume = 0.90; break;
        // Relasi dekat — older
        case "parent": case "grandparent": case "calon_mertua":
          rate = 0.98; pitch = 0.84; volume = 0.92; break;
        case "mentor": case "senior": case "pak_rt":
          rate = 0.98; pitch = 0.88; volume = 0.92; break;
        // Relasi dekat — young/casual
        case "sibling": case "friend_male": case "best_friend":
          rate = 1.14; pitch = 0.98; volume = 0.90; break;
        case "friend_female": case "crush": case "romantic_interest":
        case "date": case "blind_date": case "ex_partner":
          rate = 1.18; pitch = 1.10; volume = 0.90; break;
        // Profesional casual
        case "colleague": case "manager":
          rate = 1.10; pitch = 0.96; volume = 0.90; break;
        case "subordinate": case "mentee": case "junior":
          rate = 1.10; pitch = 1.02; volume = 0.88; break;
        // Stranger/acquaintance
        case "stranger": case "fellow_passenger":
          rate = 1.08; pitch = 0.94; volume = 0.88; break;
        case "new_acquaintance": case "neighbor": case "classmate": case "alumni":
        case "host": case "guest":
          rate = 1.10; pitch = 0.98; volume = 0.90; break;
        // Indonesia kontekstual
        case "senior_organisasi":
          rate = 1.0; pitch = 0.92; volume = 0.92; break;
        case "teman_ospek": case "anggota_tim_debat":
          rate = 1.12; pitch = 1.02; volume = 0.90; break;
        default:
          rate = 1.05; pitch = 0.96; volume = 0.92;
      }
    }

    // Inner thought — Opsi C: pitch naik, volume turun, rate melambat
    // Terasa seperti "suara dalam kepala" — masih suara karakter tapi ethereal
    if (isInnerThought) {
      rate   = Math.max(0.80, rate   - 0.12);
      volume = Math.max(0.38, volume - 0.34);
      pitch  = Math.min(1.50, pitch  + 0.15);
    }

    // Mood modulation
    const moodMod = {
      neutral:       { rate: 0,     pitch: 0,     vol: 0     },
      surprised:     { rate: +0.07, pitch: +0.14, vol: +0.03 },
      amused:        { rate: +0.05, pitch: +0.10, vol: +0.02 },
      thinking:      { rate: -0.06, pitch: -0.04, vol: -0.02 },
      warm:          { rate: -0.03, pitch: +0.04, vol: -0.01 },
      skeptical:     { rate: -0.04, pitch: -0.06, vol: 0     },
      serious:       { rate: -0.05, pitch: -0.10, vol: +0.02 },
      uncomfortable: { rate: -0.03, pitch: +0.03, vol: -0.02 },
    }[mood] || { rate: 0, pitch: 0, vol: 0 };

    return {
      voice,
      rate:   Math.max(0.78, Math.min(1.4,  rate  + moodMod.rate)),
      pitch:  Math.max(0.7,  Math.min(1.4,  pitch + moodMod.pitch)),
      volume: Math.max(0.4,  Math.min(1.0,  volume + moodMod.vol)),
    };
  }, []);

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
      // Stage: coach narrator voice
      // Inner: same voice as character but with isInnerThought modulation
      // Dialog: normal character voice
      const profile = isStage
        ? (() => {
            const coachVoice = voices.find(v => v.name === 'Google UK English Male') ||
              voices.find(v => v.lang?.startsWith('en'));
            return { voice: coachVoice, rate: 0.92, pitch: 0.96, volume: 0.62 };
          })()
        : getVoiceProfile(role, mood, inRole, isInner);

      if (profile.voice) utterance.voice = profile.voice;
      utterance.rate = profile.rate;
      utterance.pitch = profile.pitch;
      utterance.volume = profile.volume;

      utterance.onstart = () => {
        setIsSpeaking(true);
        if (!isStage && !isInner) startTalking(); else stopTalking();
      };
      utterance.onend = () => { playNext(); };
      utterance.onerror = () => { playNext(); };
      utterance.onboundary = () => {
        if (!isStage && !isInner) { setIsTalking(true); setTimeout(() => setIsTalking(false), 160); }
      };

      window.speechSynthesis.speak(utterance);
    };

    const startQueue = () => { setIsSpeaking(true); playNext(); };
    if (voices.length > 0) startQueue();
    else window.speechSynthesis.onvoiceschanged = startQueue;
  }, [speechEnabled, getVoiceProfile]);

  const speak = useCallback((text, role, mood, inRole, innerThought = null) => {
    if (!speechEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const segments = parseSegments(text);
    if (!segments.length && !innerThought) return;
    // Add inner thought as final segment with special marker
    const allSegments = innerThought
      ? [...segments, { type: 'inner', text: innerThought }]
      : segments;
    speakSegments(allSegments, role, mood, inRole);
  }, [speechEnabled, speakSegments]);

  // Render markdown in text: bold, italic — returns array of spans
  const renderMarkdown = (text) => {
    if (!text) return null;
    const parts = [];
    let remaining = text;
    let key = 0;
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/^(.*?)\*\*(.*?)\*\*/s);
      const italicMatch = remaining.match(/^(.*?)\*(.*?)\*/s);
      if (boldMatch && (!italicMatch || boldMatch[0].length <= italicMatch[0].length)) {
        if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
        parts.push(<strong key={key++} style={{ fontWeight:500, color:"inherit" }}>{boldMatch[2]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
      } else if (italicMatch) {
        if (italicMatch[1]) parts.push(<span key={key++}>{italicMatch[1]}</span>);
        parts.push(<em key={key++} style={{ fontStyle:"italic", color:"inherit" }}>{italicMatch[2]}</em>);
        remaining = remaining.slice(italicMatch[0].length);
      } else {
        parts.push(<span key={key++}>{remaining}</span>);
        break;
      }
    }
    return parts;
  };

  const startTalking = () => {
    setIsTalking(true);
    if (talkTimerRef.current) clearTimeout(talkTimerRef.current);
  };
  const stopTalking = () => {
    talkTimerRef.current = setTimeout(() => setIsTalking(false), 200);
  };

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
    r.onresult = (e) => { let interim=""; final=""; for(let i=0;i<e.results.length;i++){if(e.results[i].isFinal)final+=e.results[i][0].transcript;else interim+=e.results[i][0].transcript;} setInput((final+interim).trim()); };
    r.onerror = (e) => { setIsListening(false); if(e.error==="not-allowed")setMicError("Mic access denied."); else if(e.error!=="aborted")setMicError("Mic error: "+e.error); };
    r.onend = () => { setIsListening(false); if(final.trim()) setTimeout(()=>document.getElementById("psend")?.click(),300); };
    recognitionRef.current = r; r.start();
  }, [isListening, stopSpeech]);

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
        setCharCache(prev => ({ ...prev, [newRole]: {
          ...prev[newRole],
          ...(charName ? { name: charName } : {}),
          ...(charTitle ? { title: charTitle } : {}),
          ...(charGender ? { gender: charGender, hairLong: charGender === "f" } : {}),
        }}));
      }
      setIsTransitioning(true);
      setTimeout(() => { setCurrentRole(newRole||currentRole); setCurrentMood(newMood||"neutral"); setIsInRole(newInRole); setIsTransitioning(false); }, 380);
    } else {
      if (newMood) setCurrentMood(newMood);
      setIsInRole(newInRole);
      if ((charName || charTitle || charGender) && currentRole !== "default") {
        setCharCache(prev => ({ ...prev, [currentRole]: {
          ...(prev[currentRole]||{}),
          ...(charName ? { name: charName } : {}),
          ...(charTitle ? { title: charTitle } : {}),
          ...(charGender ? { gender: charGender, hairLong: charGender === "f" } : {}),
        }}));
      }
    }
  };

  const callAPI = async (msgs, mode, language, intensityLevel) => {
    const rawPrompt = PROMPTS[language||"en"][mode] || PROMPTS.en.formal;
    const systemPrompt = rawPrompt.replace(/\{\{INTENSITY\}\}/g, intensityLevel || "challenging");
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: systemPrompt,
        messages: msgs.map(m => ({ role: m.role==="assistant"?"assistant":"user", content: m.content }))
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "API error");
    return data.content?.find(b=>b.type==="text")?.text || "";
  };

  const startSession = async (mode, selectedScenario = null) => {
    setSessionMode(mode); setScreen("session"); setLoading(true); setError(null);
    try {
      const baseMsg = lang === "id" ? "Halo, saya ingin memulai sesi." : "Hello, I'd like to start a session.";
      const initMsg = selectedScenario
        ? (lang === "id" ? `${baseMsg} Skenario yang saya pilih: ${selectedScenario}` : `${baseMsg} My chosen scenario: ${selectedScenario}`)
        : baseMsg;
      const init = [{ role:"user", content:initMsg }];
      const text = await callAPI(init, mode, lang, intensity);
      const role = extractRole(text)||"default", mood = extractMood(text)||"neutral", modeTag = extractMode(text)||"coaching";
      const inner = extractInner(text);
      const charName = extractChar(text);
      const charTitle = extractTitle(text);
      const charGender = extractGender(text);
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
    // Store last user message for Try Again
    setLastExchange({ userMsg: msg, msgIndex: newMsgs.length - 1 });
    try {
      const text = await callAPI(newMsgs, sessionMode, lang, intensity);
      const role = extractRole(text)||currentRole, mood = extractMood(text)||"neutral", modeTag = extractMode(text)||"coaching";
      const inner = extractInner(text);
      const charName = extractChar(text);
      const charTitle = extractTitle(text);
      const charGender = extractGender(text);
      // Only switch to default if explicitly role:default — preserve current role during coaching
      const resolvedRole = (role === "default" && modeTag === "coaching" && currentRole !== "default")
        ? currentRole : role;
      changeRoleAndMood(resolvedRole, mood, modeTag, charName, charTitle, charGender);
      const clean = cleanText(text);
      const inRole = modeTag==="dialog";
      // Detect summary
      if (clean.includes("[SUMMARY_START]")) {
        const summaryMatch = clean.match(/\[SUMMARY_START\]([\s\S]*?)\[SUMMARY_END\]/);
        if (summaryMatch) {
          setSummary(summaryMatch[1].trim());
          const withoutSummary = clean.replace(/\[SUMMARY_START\][\s\S]*?\[SUMMARY_END\]/, "").trim();
          setMessages([...newMsgs, { role:"assistant", content:withoutSummary, inRole, inner }]);
          speak(withoutSummary, role, mood, inRole);
          setTimeout(() => setScreen("summary"), 1500);
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
    // Remove messages from lastExchange onwards and re-set input
    const trimmed = messages.slice(0, lastExchange.msgIndex);
    setMessages(trimmed);
    setInput(lastExchange.userMsg);
    if (textareaRef.current) {
      textareaRef.current.value = lastExchange.userMsg;
      textareaRef.current.style.height = "48px";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  };

  const endSession = () => {
    // Trigger summary by sending end signal
    const endMsg = lang === "id" ? "Saya ingin mengakhiri sesi ini." : "I'd like to end this session.";
    setInput(endMsg);
    setTimeout(() => document.getElementById("psend")?.click(), 100);
  };

  const resetSession = () => { stopSpeech(); recognitionRef.current?.stop(); setScreen("lang"); setLang(null); setSessionMode(null); setPendingMode(null); setIntensity(null); setScenario(null); setSummary(null); setLastExchange(null); setMessages([]); setInput(""); setError(null); setCurrentRole("default"); setCurrentMood("neutral"); setIsInRole(false); setIsTransitioning(false); setIsListening(false); setMicError(null); setCharCache({}); };

  const displayRole = (isInRole || currentRole !== "default") ? currentRole : "default";
  const charMeta = displayRole === "default"
    ? { ...CHARS.default, title: lang === "id" ? "Coach Kamu" : "Your Coach" }
    : (charCache[displayRole] || generateChar(displayRole));
  if (displayRole !== "default" && !charMeta.title) charMeta.title = ROLE_TITLES[displayRole] || displayRole;
  const charSVG = buildSVG(charMeta, currentMood, isTalking && isSpeaking);

  // ─── Inline SVG Icons ─────────────────────────────────────────────────────
  const IconVolume = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  );
  const IconMute = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  );
  const IconMic = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3"/>
      <path d="M5 10a7 7 0 0 0 14 0"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="8" y1="22" x2="16" y2="22"/>
    </svg>
  );
  const IconStop = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <rect x="5" y="5" width="14" height="14" rx="1.5"/>
    </svg>
  );
  const IconSend = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
  const IconLayout = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="1.5"/>
      <line x1="9" y1="3" x2="9" y2="21"/>
      <line x1="3" y1="9" x2="9" y2="9"/>
    </svg>
  );
  const IconArrowLeft = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  );
  const IconRefresh = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-3.61"/>
    </svg>
  );
  const IconMobile = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <line x1="12" y1="18" x2="12" y2="18"/>
    </svg>
  );
  const IconDesktop = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );

  // ─── Onboarding step indicator ────────────────────────────────────────────
  const STEPS = ["lang","mode","disclaimer","intensity","scenario"];
  const stepIndex = STEPS.indexOf(screen);

  const StepDots = () => stepIndex >= 0 ? (
    <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
      {STEPS.map((s,i) => (
        <div key={s} style={{ width: i === stepIndex ? "18px" : "5px", height:"5px", borderRadius:"3px", background: i < stepIndex ? "#4A4540" : i === stepIndex ? "#C8B89A" : "#222", transition:"all .3s ease" }}/>
      ))}
    </div>
  ) : null;

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:2px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:#242424;border-radius:2px;}
    ::-webkit-scrollbar-thumb:hover{background:#3A3A3A;}

    @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes charIn{from{opacity:0;transform:scale(.95) translateY(4px)}to{opacity:1;transform:scale(1) translateY(0)}}
    @keyframes pulse{0%,100%{opacity:.15;transform:scale(.75)}50%{opacity:1;transform:scale(1)}}
    @keyframes waveBar{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}
    @keyframes micPulse{0%,100%{box-shadow:0 0 0 0 rgba(180,100,100,.35)}70%{box-shadow:0 0 0 7px rgba(180,100,100,0)}}

    @keyframes idleBreathe{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-2px) scaleY(1.008)}}
    @keyframes coachNod{0%,80%,100%{transform:rotate(0deg)}85%{transform:rotate(3deg)}92%{transform:rotate(-1.5deg)}}
    @keyframes journalistSway{0%,100%{transform:rotate(0deg)}33%{transform:rotate(1.5deg)}66%{transform:rotate(-1deg)}}
    @keyframes judgeTap{0%,90%,100%{transform:translateY(0)}92%{transform:translateY(2px)}95%{transform:translateY(0)}}
    @keyframes friendBob{0%,100%{transform:translateY(0) rotate(0deg)}40%{transform:translateY(-3px) rotate(1deg)}70%{transform:translateY(-1px) rotate(-0.5deg)}}
    @keyframes negotiatorLean{0%,100%{transform:rotate(0deg) translateX(0)}50%{transform:rotate(-1deg) translateX(-1px)}}

    @keyframes moodSurprised{0%{transform:scale(1) translateY(0)}20%{transform:scale(1.04) translateY(-4px)}60%{transform:scale(1.02) translateY(-2px)}100%{transform:scale(1) translateY(0)}}
    @keyframes moodAmused{0%,100%{transform:rotate(0deg)}25%{transform:rotate(2deg)}75%{transform:rotate(-1.5deg)}}
    @keyframes moodSkeptical{0%,100%{transform:rotate(0deg) translateX(0)}50%{transform:rotate(-2deg) translateX(-2px)}}
    @keyframes moodSerious{0%,100%{transform:scaleY(1) translateY(0)}50%{transform:scaleY(1.01) translateY(-1px)}}
    @keyframes moodThinking{0%,100%{transform:rotate(0deg) translateX(0)}30%{transform:rotate(3deg) translateX(1px)}70%{transform:rotate(-1deg) translateX(0)}}
    @keyframes moodWarm{0%,100%{transform:scale(1)}50%{transform:scale(1.02)}}
    @keyframes moodUncomf{0%,100%{transform:translateX(0)}20%{transform:translateX(-2px)}40%{transform:translateX(2px)}60%{transform:translateX(-1px)}80%{transform:translateX(1px)}}

    @keyframes talkBody{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}
    @keyframes talkHead{0%,100%{transform:rotate(0deg)}30%{transform:rotate(1deg)}70%{transform:rotate(-0.8deg)}}
    @keyframes blink{0%,94%,100%{transform:scaleY(1)}96%,98%{transform:scaleY(0.08)}}
    @keyframes eyeDrift{0%,100%{transform:translateX(0)}30%{transform:translateX(1.5px)}60%{transform:translateX(-1px)}80%{transform:translateX(0.5px)}}
    @keyframes gesturePoint{0%,70%,100%{transform:translateY(0) rotate(0deg)}75%{transform:translateY(-8px) rotate(-12deg)}85%{transform:translateY(-6px) rotate(-8deg)}92%{transform:translateY(-2px) rotate(-3deg)}}
    @keyframes gestureOpen{0%,60%,100%{transform:rotate(0deg) translateX(0)}65%{transform:rotate(-18deg) translateX(-4px)}80%{transform:rotate(-10deg) translateX(-2px)}92%{transform:rotate(-4deg) translateX(-1px)}}
    @keyframes gestureNegotiate{0%,50%,100%{transform:rotate(0deg)}55%{transform:rotate(14deg) translateY(-3px)}70%{transform:rotate(8deg) translateY(-2px)}85%{transform:rotate(2deg)}}
    @keyframes browFlash{0%,85%,100%{transform:translateY(0)}88%{transform:translateY(-2px)}93%{transform:translateY(-1px)}}
    @keyframes screenFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideRight{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}

    .msg-enter{animation:fadeUp .28s ease forwards}
    .char-enter{animation:charIn .38s ease forwards}
    .mic-active{animation:micPulse 1.2s ease infinite}
    .screen-enter{animation:screenFade .32s ease forwards}

    button:focus-visible{outline:1px solid #C8B89A;outline-offset:2px;}
    textarea:focus{outline:none;}
  `;

  // ── Shared header ─────────────────────────────────────────────────────────
  const Header = ({ onBack, backLabel, right }) => (
    <div style={{ padding:"0 32px", height:"56px", borderBottom:"1px solid #181818", display:"flex", alignItems:"center", gap:"16px", flexShrink:0 }}>
      <span style={{ fontFamily:"'Playfair Display',serif", fontSize:"17px", fontWeight:500, letterSpacing:".06em", color:"#F0EDE6" }}>Profess</span>
      <span style={{ width:"1px", height:"14px", background:"#222", flexShrink:0 }}/>
      <span style={{ fontSize:"10px", color:"#2E2E2E", fontStyle:"italic", letterSpacing:".06em" }}>You cannot move people you do not understand.</span>
      {right && <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:"10px" }}>{right}</div>}
      {onBack && !right && (
        <button onClick={onBack} style={{ marginLeft:"auto", background:"none", border:"none", color:"#3A3530", fontSize:"10px", cursor:"pointer", letterSpacing:".07em", textTransform:"uppercase", display:"flex", alignItems:"center", gap:"5px", padding:"4px 0" }}
          onMouseEnter={e=>e.currentTarget.style.color="#6A6560"}
          onMouseLeave={e=>e.currentTarget.style.color="#3A3530"}>
          <IconArrowLeft/> {backLabel || "Back"}
        </button>
      )}
    </div>
  );

  // ── Shared wrapper ────────────────────────────────────────────────────────
  const PageWrap = ({ children, style={} }) => (
    <div className="screen-enter" style={{ minHeight:"100vh", background:"#0C0C0C", color:"#F0EDE6", fontFamily:"'Inter',sans-serif", fontWeight:300, display:"flex", flexDirection:"column", ...style }}>
      <style>{css}</style>
      {children}
    </div>
  );

  // ── LANGUAGE SELECTION ─────────────────────────────────────────────────────
  if (screen === "lang") return (
    <PageWrap>
      <Header right={<StepDots/>}/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"56px", padding:"40px 24px" }}>
        <div style={{ textAlign:"center" }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:"15px", color:"#4A4540", marginBottom:"6px", letterSpacing:".02em" }}>Choose your language</p>
          <p style={{ fontSize:"11px", color:"#2E2820", letterSpacing:".08em" }}>Pilih bahasa sesi kamu</p>
        </div>
        <div style={{ display:"flex", gap:"20px", flexWrap:"wrap", justifyContent:"center" }}>
          {[
            { code:"en", lang_label:"English", sub:"Session in English", accent:"#C8B89A", hoverBg:"#141210" },
            { code:"id", lang_label:"Indonesia", sub:"Sesi dalam Bahasa Indonesia", accent:"#C890B0", hoverBg:"#130F18" },
          ].map(opt => (
            <button key={opt.code}
              onClick={() => { setLang(opt.code); if(opt.code==="id") setSpeechEnabled(false); setScreen("mode"); }}
              style={{ background:"none", border:"1px solid #1E1E1E", color:"#F0EDE6", fontFamily:"inherit", padding:"36px 40px", cursor:"pointer", width:"210px", textAlign:"left", transition:"border-color .2s, background .2s", borderRadius:"1px" }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=opt.accent; e.currentTarget.style.background=opt.hoverBg; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor="#1E1E1E"; e.currentTarget.style.background="none"; }}>
              <div style={{ fontSize:"10px", letterSpacing:".14em", textTransform:"uppercase", color:"#3A3530", marginBottom:"14px" }}>{opt.code.toUpperCase()}</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"20px", marginBottom:"8px", color:opt.accent }}>{opt.lang_label}</div>
              <div style={{ fontSize:"11px", color:"#5A5550", lineHeight:1.6 }}>{opt.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </PageWrap>
  );

  // ── MODE SELECTION ─────────────────────────────────────────────────────────
  if (screen === "mode") return (
    <PageWrap>
      <Header onBack={() => setScreen("lang")} backLabel={lang==="id"?"Bahasa":"Language"} right={<StepDots/>}/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"52px", padding:"40px 24px" }}>
        <div style={{ textAlign:"center" }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:"15px", color:"#4A4540", marginBottom:"6px" }}>
            {lang==="id" ? "Pilih tipe sesi" : "Choose your session type"}
          </p>
          <p style={{ fontSize:"11px", color:"#2E2820", letterSpacing:".07em" }}>
            {lang==="id" ? "Ini menentukan bagaimana Profess melatihmu" : "This determines how Profess will coach you"}
          </p>
        </div>
        <div style={{ display:"flex", gap:"20px", flexWrap:"wrap", justifyContent:"center" }}>
          {[
            {
              key:"formal", accent:"#C8B89A", hoverBg:"#141210",
              label: lang==="id" ? "Formal" : "Formal",
              desc: lang==="id"
                ? "Wawancara kerja, sidang skripsi, debat, pitching, konferensi pers, negosiasi"
                : "Job interviews, thesis defense, debate, sales pitch, press conference, negotiation",
              marker: "F",
            },
            {
              key:"social", accent:"#C890B0", hoverBg:"#130F18",
              label: lang==="id" ? "Sosial" : "Social",
              desc: lang==="id"
                ? "Reuni, kesan pertama, small talk, situasi canggung, membaca suasana"
                : "Reconnecting, first impressions, small talk, awkward situations, reading a room",
              marker: "S",
            },
          ].map(opt => (
            <button key={opt.key}
              onClick={() => { setPendingMode(opt.key); setScreen("disclaimer"); }}
              style={{ background:"none", border:"1px solid #1E1E1E", color:"#F0EDE6", fontFamily:"inherit", padding:"32px 36px", cursor:"pointer", width:"260px", textAlign:"left", transition:"border-color .2s, background .2s", borderRadius:"1px" }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=opt.accent; e.currentTarget.style.background=opt.hoverBg; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor="#1E1E1E"; e.currentTarget.style.background="none"; }}>
              <div style={{ width:"28px", height:"28px", border:`1px solid ${opt.accent}40`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"18px" }}>
                <span style={{ fontFamily:"'Playfair Display',serif", fontSize:"13px", color:opt.accent, fontStyle:"italic" }}>{opt.marker}</span>
              </div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"18px", marginBottom:"10px", color:opt.accent }}>{opt.label}</div>
              <div style={{ fontSize:"11px", color:"#5A5550", lineHeight:1.8 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </PageWrap>
  );

  // ── DISCLAIMER ─────────────────────────────────────────────────────────────
  if (screen === "disclaimer") {
    const isFormal = pendingMode === "formal";
    const isID = lang === "id";
    const accent = isFormal ? "#C8B89A" : "#C890B0";

    const disclaimerContent = {
      en: {
        formal: {
          title: "Before we begin",
          body: [
            "Profess is a communication training tool, not a qualified professional.",
            "The characters in this session — interviewers, examiners, judges, journalists — are simulations. Their responses do not represent the actual standards, procedures, or judgments of any real institution, profession, or individual.",
            "Feedback provided by Profess is for practice purposes only. It cannot replace the assessment of a real interviewer, academic examiner, legal authority, or any other professional. Profess may make errors in reasoning, miss important nuances, or reflect biases in its training.",
            "Do not use Profess as a basis for actual professional decisions."
          ],
          cta: "I understand — begin session"
        },
        social: {
          title: "Before we begin",
          body: [
            "Profess is a communication training tool, not a social scientist or therapist.",
            "The characters and scenarios in this session are simplified simulations for training purposes. They do not accurately represent any real person, cultural group, or social dynamic.",
            "Profess may make errors, oversimplify complex interpersonal situations, or reflect cultural biases. Real human interactions are far more nuanced than any simulation can capture.",
            "Use this session as a starting point for reflection — not as a definitive guide to how people think or behave."
          ],
          cta: "I understand — begin session"
        }
      },
      id: {
        formal: {
          title: "Sebelum kita mulai",
          body: [
            "Profess adalah alat latihan komunikasi, bukan profesional yang berkualifikasi.",
            "Karakter dalam sesi ini — pewawancara, penguji, hakim, jurnalis — adalah simulasi. Respons mereka tidak mencerminkan standar, prosedur, atau penilaian aktual dari institusi, profesi, atau individu nyata manapun.",
            "Feedback dari Profess hanya untuk tujuan latihan. Profess tidak dapat menggantikan penilaian pewawancara sungguhan, penguji akademik, otoritas hukum, atau profesional lainnya. Profess dapat melakukan kesalahan dalam penalaran, melewatkan nuansa penting, atau mencerminkan bias dalam pelatihannya.",
            "Jangan gunakan Profess sebagai dasar keputusan profesional yang sesungguhnya."
          ],
          cta: "Saya mengerti — mulai sesi"
        },
        social: {
          title: "Sebelum kita mulai",
          body: [
            "Profess adalah alat latihan komunikasi, bukan ilmuwan sosial atau terapis.",
            "Karakter dan skenario dalam sesi ini adalah simulasi yang disederhanakan untuk tujuan latihan. Mereka tidak secara akurat mencerminkan individu nyata, kelompok budaya, atau dinamika sosial manapun.",
            "Profess dapat melakukan kesalahan, menyederhanakan situasi interpersonal yang kompleks, atau mencerminkan bias budaya. Interaksi manusia yang sesungguhnya jauh lebih bernuansa dari yang dapat ditangkap simulasi manapun.",
            "Gunakan sesi ini sebagai titik awal refleksi — bukan sebagai panduan definitif tentang cara orang berpikir atau berperilaku."
          ],
          cta: "Saya mengerti — mulai sesi"
        }
      }
    };

    const dc = disclaimerContent[isID?"id":"en"][isFormal?"formal":"social"];

    return (
      <PageWrap>
        <Header onBack={() => setScreen("mode")} backLabel={isID?"Kembali":"Back"} right={<StepDots/>}/>
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px 24px" }}>
          <div style={{ maxWidth:"500px", width:"100%" }}>
            <div style={{ marginBottom:"36px" }}>
              <p style={{ fontSize:"9px", letterSpacing:".14em", textTransform:"uppercase", color:"#3A3530", marginBottom:"10px" }}>
                {isFormal ? (isID?"Formal":"Formal") : (isID?"Sosial":"Social")}
              </p>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"22px", fontWeight:400, color:"#D8D5CE", lineHeight:1.3 }}>{dc.title}</h2>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"16px", marginBottom:"40px" }}>
              {dc.body.map((para, i) => (
                <p key={i} style={{ fontSize:"12px", lineHeight:1.9, color: i===0 ? "#9A9590" : "#4A4540", paddingLeft: i===0 ? "0" : "0" }}>
                  {para}
                </p>
              ))}
            </div>
            <div style={{ borderTop:"1px solid #181818", paddingTop:"28px" }}>
              <button
                onClick={() => setScreen("intensity")}
                style={{ background:"none", border:`1px solid ${accent}`, color:accent, fontFamily:"inherit", fontSize:"11px", fontWeight:400, letterSpacing:".1em", padding:"13px 32px", cursor:"pointer", textTransform:"uppercase", transition:"background .2s, color .2s", width:"100%" }}
                onMouseEnter={e=>{ e.currentTarget.style.background=accent; e.currentTarget.style.color="#0C0C0C"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="none"; e.currentTarget.style.color=accent; }}>
                {dc.cta}
              </button>
            </div>
          </div>
        </div>
      </PageWrap>
    );
  }

  // ── INTENSITY SELECTION ────────────────────────────────────────────────────
  if (screen === "intensity") {
    const isID = lang === "id";
    const isFormal = pendingMode === "formal";
    const accent = isFormal ? "#C8B89A" : "#C890B0";
    const levels = isID ? [
      { key:"comfortable", bars:1, barColor:"#7A9A70", label:"Nyaman",      desc:"Supportif dan membangun — cocok untuk pemula atau mencoba skenario baru" },
      { key:"challenging", bars:2, barColor:"#C8A870", label:"Menantang",   desc:"Ketat dan jujur — standar tinggi, feedback langsung tanpa basa-basi" },
      { key:"no_mercy",   bars:3, barColor:"#BC5A5A", label:"Tanpa Ampun", desc:"Tekanan maksimal — untuk yang ingin diuji habis-habisan" },
    ] : [
      { key:"comfortable", bars:1, barColor:"#7A9A70", label:"Comfortable", desc:"Supportive and constructive — good for trying new scenarios or warming up" },
      { key:"challenging", bars:2, barColor:"#C8A870", label:"Challenging",  desc:"Rigorous and honest — high standards, direct feedback, no softening" },
      { key:"no_mercy",   bars:3, barColor:"#BC5A5A", label:"No Mercy",     desc:"Maximum pressure — for when you want to be pushed to your absolute limit" },
    ];

    const IntensityBars = ({ count, color }) => (
      <div style={{ display:"flex", gap:"3px", alignItems:"flex-end" }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ width:"3px", height:`${6 + i*4}px`, background: i <= count ? color : "#222", borderRadius:"1px", transition:"background .2s" }}/>
        ))}
      </div>
    );

    return (
      <PageWrap>
        <Header onBack={() => setScreen("disclaimer")} backLabel={isID?"Kembali":"Back"} right={<StepDots/>}/>
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"44px", padding:"40px 24px" }}>
          <div style={{ textAlign:"center" }}>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:"15px", color:"#4A4540", marginBottom:"6px" }}>{isID?"Pilih intensitas sesi":"Choose your intensity"}</p>
            <p style={{ fontSize:"11px", color:"#2E2820", letterSpacing:".07em" }}>{isID?"Seberapa keras Profess mendorongmu":"How hard Profess will push you"}</p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"10px", width:"100%", maxWidth:"400px" }}>
            {levels.map(lvl => (
              <button key={lvl.key}
                onClick={() => { setIntensity(lvl.key); setScreen("scenario"); }}
                style={{ background:"none", border:"1px solid #1E1E1E", color:"#F0EDE6", fontFamily:"inherit", padding:"20px 22px", cursor:"pointer", textAlign:"left", transition:"border-color .2s, background .2s", borderRadius:"1px", display:"flex", gap:"18px", alignItems:"center" }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=lvl.barColor; e.currentTarget.style.background="#111"; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor="#1E1E1E"; e.currentTarget.style.background="none"; }}>
                <IntensityBars count={lvl.bars} color={lvl.barColor}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"15px", color:lvl.barColor, marginBottom:"4px" }}>{lvl.label}</div>
                  <div style={{ fontSize:"11px", color:"#4A4540", lineHeight:1.65 }}>{lvl.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </PageWrap>
    );
  }

  // ── SCENARIO PICKER ────────────────────────────────────────────────────────
  if (screen === "scenario") {
    const isID = lang === "id";
    const isFormal = pendingMode === "formal";
    const accent = isFormal ? "#C8B89A" : "#C890B0";

    const SCENARIOS = {
      formal: {
        id: [
          { group:"Akademik", items:["Sidang Skripsi — Penguji yang Skeptis","Presentasi Seminar — Dosen yang Tidak Yakin","Debat Parlemen Asia — Mosi Kontroversial","Ospek Organisasi — Senior yang Menguji Mental"]},
          { group:"Karir", items:["Interview Kerja Pertama — HRD yang Kritis","Pitching Startup ke Investor — 5 Menit untuk Meyakinkan","Negosiasi Gaji — Atasan yang Tidak Mudah","Press Conference — Jurnalis yang Agresif","Rapat dengan Klien — Keputusan di Tangan Mereka"]},
          { group:"Hukum & Publik", items:["Persidangan Mock Trial — Jaksa yang Tidak Memberi Celah","Debat Publik — Lawan yang Lebih Berpengalaman","Audiensi dengan Pejabat — Birokrasi yang Tidak Berpihak"]},
        ],
        en: [
          { group:"Academic", items:["Thesis Defense — The Skeptical Examiner","Seminar Presentation — The Unconvinced Professor","Asian Parliamentary Debate — A Controversial Motion","Org Initiation — Senior Testing Your Limits"]},
          { group:"Career", items:["First Job Interview — The Critical HRD","Startup Pitch — 5 Minutes to Convince an Investor","Salary Negotiation — A Manager Who Won't Budge","Press Conference — An Aggressive Journalist","Client Meeting — The Decision Is Theirs"]},
          { group:"Legal & Public", items:["Mock Trial — A Prosecutor With No Mercy","Public Debate — An Opponent More Experienced Than You","Government Audience — Bureaucracy That Isn't On Your Side"]},
        ],
      },
      social: {
        id: [
          { group:"Relasi", items:["Reuni Teman Lama — Ada yang Belum Selesai","Ketemu Crush — Kesempatan yang Tidak Bisa Diulang","Kenalan Baru di Acara — Tidak Ada yang Dikenal","Minta Maaf ke Teman — Sudah Terlalu Lama Didiamkan","Konfrontasi Teman — Sebelum Hubungan Ini Berakhir"]},
          { group:"Keluarga", items:["Bicara Jujur ke Orang Tua — Tentang Masa Depan","Ketemu Calon Mertua — Pertama Kali","Adik yang Tidak Mau Diatur — Tapi Kamu Peduli"]},
          { group:"Profesional Casual", items:["Ngobrol dengan Senior di Kantor — Yang Kamu Kagumi","Mengkritik Atasan dengan Sopan — Tanpa Kehilangan Posisi","Networking di Acara — Mulai dari Nol"]},
          { group:"Situasional", items:["Kenalan di Bookstore — Buku yang Sama","Perjalanan Panjang — Teman Duduk yang Menarik","Golf dengan Pengusaha Senior — Empat Jam untuk Berkesan"]},
        ],
        en: [
          { group:"Relationships", items:["Reconnecting with an Old Friend — Something Was Left Unsaid","Meeting Your Crush — A Chance You Can't Repeat","New People at an Event — You Don't Know Anyone","Apologizing to a Friend — You've Waited Too Long","Confronting a Friend — Before This Ends"]},
          { group:"Family", items:["Honest Talk with Parents — About Your Future","Meeting the Parents — First Time","A Sibling Who Won't Listen — But You Care"]},
          { group:"Professional Casual", items:["Talking to a Senior You Admire — At the Office","Giving Feedback to Your Boss — Without Losing Ground","Networking at an Event — Starting From Zero"]},
          { group:"Situational", items:["Bookstore Encounter — The Same Book","Long Journey — An Interesting Seatmate","Golf with a Senior Executive — Four Hours to Make an Impression"]},
        ],
      },
    };

    const groups = SCENARIOS[pendingMode]?.[isID?"id":"en"] || [];

    return (
      <PageWrap>
        <Header onBack={() => setScreen("intensity")} backLabel={isID?"Kembali":"Back"} right={<StepDots/>}/>
        <div style={{ flex:1, overflowY:"auto", padding:"36px 28px" }}>
          <div style={{ maxWidth:"580px", margin:"0 auto", display:"flex", flexDirection:"column", gap:"36px" }}>
            <div>
              <p style={{ fontFamily:"'Playfair Display',serif", fontSize:"17px", color:"#4A4540", marginBottom:"6px" }}>
                {isID ? "Pilih skenario" : "Choose a scenario"}
              </p>
              <p style={{ fontSize:"11px", color:"#2E2820", letterSpacing:".06em" }}>
                {isID ? "Profess akan bertanya nama dan detail sebelum dimulai" : "Profess will ask your name and details before we begin"}
              </p>
            </div>

            <button
              onClick={() => { setScenario(null); startSession(pendingMode, null); }}
              style={{ background:"none", border:`1px solid ${accent}30`, color:accent, fontFamily:"inherit", fontSize:"11px", padding:"14px 20px", cursor:"pointer", textAlign:"left", letterSpacing:".08em", textTransform:"uppercase", transition:"border-color .2s, background .2s", borderRadius:"1px" }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=accent; e.currentTarget.style.background=`${accent}08`; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor=`${accent}30`; e.currentTarget.style.background="none"; }}>
              + {isID ? "Mulai bebas — saya punya skenario sendiri" : "Start free — I have my own scenario"}
            </button>

            {groups.map((group, gi) => (
              <div key={gi}>
                <p style={{ fontSize:"9px", color:"#2E2820", letterSpacing:".14em", textTransform:"uppercase", marginBottom:"10px", paddingBottom:"8px", borderBottom:"1px solid #141414" }}>
                  {group.group}
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:"1px" }}>
                  {group.items.map((item, ii) => (
                    <button key={ii}
                      onClick={() => { setScenario(item); startSession(pendingMode, item); }}
                      style={{ background:"none", border:"none", borderBottom:"1px solid #141414", color:"#7A7570", fontFamily:"inherit", fontSize:"13px", padding:"13px 0", cursor:"pointer", textAlign:"left", transition:"color .15s, padding-left .15s", lineHeight:1.5 }}
                      onMouseEnter={e=>{ e.currentTarget.style.color="#F0EDE6"; e.currentTarget.style.paddingLeft="6px"; }}
                      onMouseLeave={e=>{ e.currentTarget.style.color="#7A7570"; e.currentTarget.style.paddingLeft="0"; }}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ height:"32px" }}/>
          </div>
        </div>
      </PageWrap>
    );
  }

  // ── SUMMARY ────────────────────────────────────────────────────────────────
  if (screen === "summary") {
    const isID = lang === "id";
    const isFormal = sessionMode === "formal";
    const accent = isFormal ? "#C8B89A" : "#C890B0";
    const summaryLines = summary ? summary.split('\n').filter(l => l.trim()) : [];
    return (
      <PageWrap>
        <div style={{ padding:"0 32px", height:"56px", borderBottom:"1px solid #181818", display:"flex", alignItems:"center" }}>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:"17px", fontWeight:500, letterSpacing:".06em" }}>Profess</span>
        </div>
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px 24px" }}>
          <div style={{ maxWidth:"500px", width:"100%" }}>
            <div style={{ marginBottom:"36px" }}>
              <p style={{ fontSize:"9px", letterSpacing:".14em", textTransform:"uppercase", color:"#3A3530", marginBottom:"10px" }}>
                {isID?"Ringkasan Sesi":"Session Complete"}
              </p>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"24px", fontWeight:400, color:accent, lineHeight:1.3 }}>
                {isID ? "Kamu sudah selesai." : "You showed up."}
              </h2>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"0", marginBottom:"40px", borderTop:"1px solid #181818" }}>
              {summaryLines.map((line, i) => {
                const clean = line.replace(/^[-•]\s*/, "").trim();
                if (!clean) return null;
                return (
                  <div key={i} style={{ display:"flex", gap:"16px", alignItems:"flex-start", padding:"16px 0", borderBottom:"1px solid #141414" }}>
                    <div style={{ width:"1px", height:"100%", alignSelf:"stretch", background:accent, opacity:.3, flexShrink:0, minHeight:"16px" }}/>
                    <p style={{ fontSize:"13px", lineHeight:1.8, color:"#9A9590" }}>{clean}</p>
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
              <button onClick={() => { setSummary(null); setScreen("session"); }}
                style={{ background:"none", border:`1px solid ${accent}`, color:accent, fontFamily:"inherit", fontSize:"10px", padding:"10px 24px", cursor:"pointer", letterSpacing:".1em", textTransform:"uppercase", transition:"background .2s, color .2s" }}
                onMouseEnter={e=>{e.currentTarget.style.background=accent;e.currentTarget.style.color="#0C0C0C";}}
                onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color=accent;}}>
                {isID?"Lanjut sesi":"Continue session"}
              </button>
              <button onClick={resetSession}
                style={{ background:"none", border:"1px solid #222", color:"#5A5550", fontFamily:"inherit", fontSize:"10px", padding:"10px 24px", cursor:"pointer", letterSpacing:".1em", textTransform:"uppercase", transition:"border-color .2s, color .2s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#3A3530";e.currentTarget.style.color="#8A8580";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="#222";e.currentTarget.style.color="#5A5550";}}>
                {isID?"Sesi baru":"New session"}
              </button>
            </div>
          </div>
        </div>
      </PageWrap>
    );
  }

  // ── SESSION SCREEN ─────────────────────────────────────────────────────────
  const charAnimBlock = (size) => {
    const isLarge = size === "170px";
    const idleAnim = { default:"coachNod 4s ease-in-out infinite", journalist:"journalistSway 3s ease-in-out infinite", critic:"journalistSway 3s ease-in-out infinite", judge:"judgeTap 5s ease-in-out infinite", cross_examiner:"judgeTap 4.5s ease-in-out infinite", prosecutor:"judgeTap 4.5s ease-in-out infinite", friend_female:"friendBob 2.8s ease-in-out infinite", best_friend:"friendBob 2.6s ease-in-out infinite", crush:"friendBob 3s ease-in-out infinite", romantic_interest:"friendBob 3s ease-in-out infinite", date:"friendBob 2.8s ease-in-out infinite", blind_date:"friendBob 3.2s ease-in-out infinite", friend_male:"friendBob 3.2s ease-in-out infinite", negotiator:"negotiatorLean 4s ease-in-out infinite", ceo:"negotiatorLean 4.5s ease-in-out infinite", executive:"negotiatorLean 4.5s ease-in-out infinite", diplomat:"negotiatorLean 5s ease-in-out infinite", acquirer:"negotiatorLean 4s ease-in-out infinite", board_member:"negotiatorLean 5s ease-in-out infinite" }[displayRole] || "idleBreathe 3.5s ease-in-out infinite";
    const moodAnim = isTalking ? null : { surprised:"moodSurprised .6s ease forwards", amused:"moodAmused 1.5s ease-in-out infinite", skeptical:"moodSkeptical 2s ease-in-out infinite", serious:"moodSerious 3s ease-in-out infinite", thinking:"moodThinking 2.5s ease-in-out infinite", warm:"moodWarm 2s ease-in-out infinite", uncomfortable:"moodUncomf .5s ease forwards" }[currentMood];
    const talkAnim = isTalking && isSpeaking ? "talkBody .4s ease-in-out infinite" : null;
    return <div key={displayRole+currentMood} className="char-enter" style={{ width:size, height:isLarge?"215px":"72px", opacity:isTransitioning?0:1, transition:"opacity .38s", animation:talkAnim||moodAnim||idleAnim, filter:isSpeaking?`drop-shadow(0 0 ${isLarge?"16px":"8px"} ${charMeta.accent}45)`:"none" }} dangerouslySetInnerHTML={{ __html:charSVG }}/>;
  };

  const msgList = (fontSize="14px") => messages.map((msg,i) => {
    const isA = msg.role==="assistant";
    const mInRole = isA && msg.inRole;
    const mc = isA
      ? (mInRole ? (charCache[currentRole]||CHARS.default) : (currentRole !== "default" ? (charCache[currentRole]||CHARS.default) : CHARS.default))
      : CHARS.default;
    const segments = isA ? parseSegments(msg.content) : null;
    const innerText = msg.inner ? msg.inner.replace(/\*/g,"").replace(/_/g,"").trim() : null;
    return (
      <div key={i} className="msg-enter" style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
        <span style={{ fontSize:"8px", letterSpacing:".14em", textTransform:"uppercase", fontWeight:500, color:isA ? (mInRole ? mc.accent : "#3A3530") : "#2A2A2A" }}>
          {isA ? (mInRole ? mc.name : "Profess") : "You"}
        </span>
        {isA && segments ? (
          <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
            {segments.map((seg,si) => {
              if (seg.type==="stage") return (
                <p key={si} style={{ fontSize:"11px", fontStyle:"italic", color:"#3A3835", lineHeight:1.7, margin:"3px 0" }}>
                  {seg.text}
                </p>
              );
              if (seg.type==="section_break") return (
                <div key={si} style={{ display:"flex", alignItems:"center", gap:"12px", margin:"10px 0 6px" }}>
                  <div style={{ flex:1, height:"1px", background:"#181818" }}/>
                  <span style={{ fontSize:"8px", letterSpacing:".12em", textTransform:"uppercase", color:"#2A2A2A" }}>Coach</span>
                  <div style={{ flex:1, height:"1px", background:"#181818" }}/>
                </div>
              );
              if (seg.type==="coaching") return (
                <p key={si} style={{ fontSize:"12px", lineHeight:1.95, color:"#6A6560", whiteSpace:"pre-wrap", fontStyle:"italic" }}>
                  {renderMarkdown(seg.text)}
                </p>
              );
              return (
                <p key={si} style={{ fontSize, lineHeight:1.9, color:mInRole?"#E8E5DE":"#B0ADA8", whiteSpace:"pre-wrap", borderLeft:mInRole?`2px solid ${mc.accent}30`:"none", paddingLeft:mInRole?"14px":"0" }}>
                  {renderMarkdown(seg.text)}
                </p>
              );
            })}
          </div>
        ) : <p style={{ fontSize, lineHeight:1.9, color:"#6A6760", whiteSpace:"pre-wrap" }}>{renderMarkdown(msg.content)}</p>}
        {isA && innerText && (
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginTop:"4px" }}>
            <div style={{ width:"16px", height:"1px", background:mc.accent, opacity:.2, flexShrink:0 }}/>
            <p style={{ fontSize:"10px", fontStyle:"italic", color:mc.accent, opacity:.4, letterSpacing:".02em" }}>{innerText}</p>
          </div>
        )}
      </div>
    );
  });

  // ── Session header ─────────────────────────────────────────────────────────
  const intensityLabel = () => {
    if (!intensity) return null;
    const map = {
      comfortable: { color:"#7A9A70", label: lang==="id" ? "Nyaman" : "Comfortable", bars:1 },
      challenging:  { color:"#C8A870", label: lang==="id" ? "Menantang" : "Challenging", bars:2 },
      no_mercy:     { color:"#BC5A5A", label: lang==="id" ? "Tanpa Ampun" : "No Mercy", bars:3 },
    }[intensity];
    return (
      <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
        {[1,2,3].map(i => <div key={i} style={{ width:"2px", height:`${4+i*3}px`, background: i<=map.bars ? map.color : "#222", borderRadius:"1px" }}/>)}
        <span style={{ fontSize:"9px", letterSpacing:".08em", color:map.color, textTransform:"uppercase", marginLeft:"3px" }}>{map.label}</span>
      </div>
    );
  };

  const sessionHeaderRight = (
    <>
      {!isMobile && <span style={{ fontSize:"9px", color:"#3A3530", letterSpacing:".1em", textTransform:"uppercase", borderLeft:"1px solid #1E1E1E", paddingLeft:"12px" }}>{sessionMode}</span>}
      {!isMobile && intensityLabel()}
      <button onClick={()=>setIsMobile(p=>!p)} title="Switch layout" style={{ background:"none", border:"1px solid #1E1E1E", color:"#3A3530", padding:"5px 7px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"border-color .2s, color .2s" }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor="#3A3530";e.currentTarget.style.color="#7A7570";}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="#1E1E1E";e.currentTarget.style.color="#3A3530";}}>
        {isMobile ? <IconDesktop/> : <IconMobile/>}
      </button>
      <button onClick={()=>{stopSpeech();setSpeechEnabled(p=>!p);}} title="Toggle audio" style={{ background:"none", border:"1px solid #1E1E1E", color:speechEnabled?"#C8B89A":"#2A2A2A", padding:"5px 7px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"border-color .2s, color .2s" }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor="#3A3530";}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="#1E1E1E";}}>
        {speechEnabled ? <IconVolume/> : <IconMute/>}
      </button>
      <button onClick={resetSession} style={{ background:"none", border:"1px solid #1E1E1E", color:"#3A3530", fontFamily:"inherit", fontSize:"9px", padding:"5px 12px", cursor:"pointer", letterSpacing:".1em", textTransform:"uppercase", transition:"border-color .2s, color .2s" }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor="#3A3530";e.currentTarget.style.color="#7A7570";}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="#1E1E1E";e.currentTarget.style.color="#3A3530";}}>
        {lang==="id" ? "Baru" : "New"}
      </button>
    </>
  );

  // ── Input area ─────────────────────────────────────────────────────────────
  const inputArea = (inputFontSize="14px", inputPadding="10px 14px", btnSize="44px") => (
    <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
      {micError && <p style={{ fontSize:"10px", color:"#8B4040", textAlign:"center", letterSpacing:".04em" }}>{micError}</p>}
      <div style={{ display:"flex", gap:"7px", alignItems:"flex-end" }}>
        <textarea ref={textareaRef}
          style={{ flex:1, background:"#0E0E0E", border:`1px solid ${isListening?"#8A5050":"#1E1E1E"}`, color:"#F0EDE6", fontFamily:"inherit", fontSize:inputFontSize, fontWeight:300, lineHeight:1.65, padding:inputPadding, resize:"none", outline:"none", minHeight:btnSize, maxHeight:"150px", overflowY:"auto", transition:"border-color .2s", borderRadius:"1px" }}
          placeholder={isListening ? (lang==="id"?"Mendengarkan...":"Listening...") : (lang==="id"?"Ketik sesuatu...":"Say something...")}
          value={input} onChange={handleTA} onKeyDown={handleKeyDown} rows={1}
          onFocus={e=>{ if(!isListening) e.target.style.borderColor="#2A2A2A"; }}
          onBlur={e=>{ if(!isListening) e.target.style.borderColor="#1E1E1E"; }}/>
        {isSpeaking && (
          <button onClick={stopSpeech} title="Stop" style={{ background:"#140808", border:"1px solid #5A3030", color:"#8A5050", width:btnSize, height:btnSize, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, transition:"border-color .2s, color .2s" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#8A5050";e.currentTarget.style.color="#BC7A7A";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#5A3030";e.currentTarget.style.color="#8A5050";}}>
            <IconStop/>
          </button>
        )}
        <button onClick={toggleMic} className={isListening?"mic-active":""}
          title={isListening?"Stop recording":"Start recording"}
          style={{ background:isListening?"#1A1010":"none", border:`1px solid ${isListening?"#8A5050":"#1E1E1E"}`, color:isListening?"#BC7A7A":"#4A4540", width:btnSize, height:btnSize, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, transition:"background .2s, border-color .2s, color .2s" }}
          onMouseEnter={e=>{ if(!isListening){e.currentTarget.style.borderColor="#3A3530";e.currentTarget.style.color="#7A7570";} }}
          onMouseLeave={e=>{ if(!isListening){e.currentTarget.style.borderColor="#1E1E1E";e.currentTarget.style.color="#4A4540";} }}>
          {isListening ? <IconStop/> : <IconMic/>}
        </button>
        <button id="psend" onClick={sendMessage} disabled={loading||!input.trim()}
          style={{ background:"none", border:`1px solid ${input.trim()&&!loading?charMeta.accent:"#1E1E1E"}`, color:input.trim()&&!loading?charMeta.accent:"#2A2A2A", width:btnSize, height:btnSize, display:"flex", alignItems:"center", justifyContent:"center", cursor:loading||!input.trim()?"not-allowed":"pointer", flexShrink:0, transition:"background .2s, border-color .2s, color .2s", opacity:loading||!input.trim()?0.35:1 }}
          onMouseEnter={e=>{ if(input.trim()&&!loading){e.currentTarget.style.background=charMeta.accent;e.currentTarget.style.color="#0C0C0C";} }}
          onMouseLeave={e=>{ e.currentTarget.style.background="none";e.currentTarget.style.color=input.trim()&&!loading?charMeta.accent:"#2A2A2A"; }}>
          <IconSend/>
        </button>
      </div>
      {isListening && (
        <div style={{ display:"flex", alignItems:"center", gap:"8px", paddingLeft:"2px" }}>
          <div style={{ display:"flex", gap:"2px", alignItems:"flex-end" }}>
            {[0,.08,.16,.24,.32].map((d,i)=><div key={i} style={{ width:"2px", height:`${4+i*3}px`, background:"#8A5050", borderRadius:"1px", animation:`waveBar .5s ease-in-out ${d}s infinite` }}/>)}
          </div>
          <span style={{ fontSize:"9px", color:"#6A4040", letterSpacing:".1em", textTransform:"uppercase" }}>
            {lang==="id" ? "Merekam — jeda untuk kirim" : "Recording — pause to send"}
          </span>
        </div>
      )}
    </div>
  );

  const actionRow = (compact=false) => (
    <div style={{ display:"flex", gap:"8px", marginBottom:compact?"6px":"8px" }}>
      {lastExchange && (
        <button onClick={tryAgain}
          style={{ background:"none", border:`1px solid ${charMeta.accent}25`, color:`${charMeta.accent}80`, fontFamily:"inherit", fontSize:"9px", padding:`${compact?"4px":"5px"} 12px`, cursor:"pointer", letterSpacing:".09em", textTransform:"uppercase", display:"flex", alignItems:"center", gap:"5px", transition:"border-color .2s, color .2s" }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=charMeta.accent;e.currentTarget.style.color=charMeta.accent;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=`${charMeta.accent}25`;e.currentTarget.style.color=`${charMeta.accent}80`;}}>
          <IconRefresh/>{lang==="id"?"Coba lagi":"Try again"}
        </button>
      )}
      <button onClick={endSession}
        style={{ background:"none", border:"1px solid #1A1A1A", color:"#3A3530", fontFamily:"inherit", fontSize:"9px", padding:`${compact?"4px":"5px"} 12px`, cursor:"pointer", marginLeft:"auto", letterSpacing:".09em", textTransform:"uppercase", transition:"border-color .2s, color .2s" }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor="#3A3530";e.currentTarget.style.color="#6A6560";}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="#1A1A1A";e.currentTarget.style.color="#3A3530";}}>
        {lang==="id"?"Akhiri sesi":"End session"}
      </button>
    </div>
  );

  const loadingIndicator = () => {
    const coachSVG = buildSVG(CHARS.default, "thinking", false);
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
        <span style={{ fontSize:"8px", letterSpacing:".14em", textTransform:"uppercase", fontWeight:500, color:charMeta.accent }}>
          {isInRole ? charMeta.name : "Profess"}
        </span>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ width:"30px", height:"38px", animation:"moodThinking 2.5s ease-in-out infinite", flexShrink:0 }} dangerouslySetInnerHTML={{ __html:coachSVG }}/>
          <div style={{ display:"flex", gap:"5px" }}>
            {[0,.18,.36].map((d,i)=><div key={i} style={{ width:"4px", height:"4px", background:charMeta.accent, borderRadius:"50%", opacity:.3, animation:`pulse 1.1s ease-in-out ${d}s infinite` }}/>)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0C0C0C", color:"#F0EDE6", fontFamily:"'Inter',sans-serif", fontWeight:300, display:"flex", flexDirection:"column" }}>
      <style>{css}</style>
      {/* Header */}
      <div style={{ padding:"0 28px", height:isMobile?"48px":"56px", borderBottom:"1px solid #181818", display:"flex", alignItems:"center", gap:"12px", flexShrink:0 }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?"15px":"17px", fontWeight:500, letterSpacing:".06em" }}>Profess</span>
        {!isMobile && <>
          <span style={{ width:"1px", height:"12px", background:"#1E1E1E", flexShrink:0 }}/>
          <span style={{ fontSize:"10px", color:"#2A2520", fontStyle:"italic", letterSpacing:".05em" }}>You cannot move people you do not understand.</span>
        </>}
        <div style={{ marginLeft:"auto", display:"flex", gap:"7px", alignItems:"center" }}>
          {sessionHeaderRight}
        </div>
      </div>

      {isMobile ? (
        /* ── MOBILE LAYOUT ────────────────────────────────────────────────── */
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Character strip */}
          <div style={{ background:isTransitioning?"#0C0C0C":charMeta.bg, transition:"background .4s ease", borderBottom:"1px solid #141414", padding:"10px 16px", display:"flex", alignItems:"center", gap:"14px", flexShrink:0 }}>
            {charAnimBlock("62px")}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"13px", color:charMeta.accent, marginBottom:"2px" }}>{charMeta.name}</div>
              <div style={{ fontSize:"8px", color:"#3A3530", letterSpacing:".1em", textTransform:"uppercase" }}>{charMeta.title}</div>
              {currentMood !== "neutral" && (
                <div style={{ marginTop:"5px", display:"inline-flex", alignItems:"center", gap:"5px" }}>
                  <div style={{ width:"4px", height:"4px", borderRadius:"50%", background:charMeta.accent, opacity:.7 }}/>
                  <span style={{ fontSize:"8px", color:charMeta.accent, letterSpacing:".1em", textTransform:"uppercase", opacity:.8 }}>{currentMood}</span>
                </div>
              )}
            </div>
            {isSpeaking && (
              <div style={{ display:"flex", gap:"2px", alignItems:"flex-end", flexShrink:0 }}>
                {[0,.1,.2,.1,0].map((d,i)=><div key={i} style={{ width:"2px", height:`${4+i*2.5}px`, background:charMeta.accent, borderRadius:"1px", animation:`waveBar .6s ease-in-out ${d}s infinite`, opacity:.7 }}/>)}
              </div>
            )}
          </div>

          {/* Chat */}
          <div style={{ flex:1, overflowY:"auto", padding:"18px 16px 10px", display:"flex", flexDirection:"column", gap:"24px" }}>
            {msgList("15px")}
            {loading && loadingIndicator()}
            {error && <p style={{ fontSize:"11px", color:"#7A4040", textAlign:"center", letterSpacing:".03em" }}>{error}</p>}
            <div ref={chatEndRef}/>
          </div>

          {/* Input */}
          <div style={{ padding:"8px 14px 16px", borderTop:"1px solid #141414", background:"#0C0C0C" }}>
            {actionRow(true)}
            {inputArea("15px","11px 13px","48px")}
          </div>
        </div>
      ) : (
        /* ── DESKTOP LAYOUT ───────────────────────────────────────────────── */
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
          {/* Character sidebar */}
          <div style={{ width:"196px", flexShrink:0, borderRight:"1px solid #141414", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", background:isTransitioning?"#0C0C0C":charMeta.bg, transition:"background .4s ease", position:"fixed", top:"56px", left:0, height:"calc(100vh - 56px)", overflow:"hidden", zIndex:10 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"14px", padding:"28px 14px 20px", width:"100%" }}>
              {charAnimBlock("170px")}
              <div style={{ textAlign:"center", opacity:isTransitioning?0:1, transition:"opacity .38s", width:"100%" }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"14px", color:charMeta.accent, marginBottom:"4px" }}>{charMeta.name}</div>
                <div style={{ fontSize:"8px", color:"#2E2820", letterSpacing:".1em", textTransform:"uppercase", lineHeight:1.5 }}>{charMeta.title}</div>
                {currentMood !== "neutral" && (
                  <div style={{ marginTop:"10px", display:"inline-flex", alignItems:"center", gap:"6px" }}>
                    <div style={{ width:"4px", height:"4px", borderRadius:"50%", background:charMeta.accent, opacity:.7 }}/>
                    <span style={{ fontSize:"8px", color:charMeta.accent, letterSpacing:".12em", textTransform:"uppercase", opacity:.75 }}>{currentMood}</span>
                  </div>
                )}
              </div>
              {isSpeaking && (
                <div style={{ display:"flex", gap:"3px", alignItems:"flex-end" }}>
                  {[0,.1,.2,.1,0].map((d,i)=><div key={i} style={{ width:"2px", height:`${5+i*3}px`, background:charMeta.accent, borderRadius:"1px", animation:`waveBar .6s ease-in-out ${d}s infinite`, opacity:.65 }}/>)}
                </div>
              )}
            </div>
          </div>

          {/* Chat area */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", marginLeft:"196px" }}>
            <div style={{ flex:1, overflowY:"auto", padding:"28px 28px 14px", display:"flex", flexDirection:"column", gap:"26px" }}>
              {msgList("14px")}
              {loading && loadingIndicator()}
              {error && <p style={{ fontSize:"11px", color:"#7A4040", textAlign:"center", letterSpacing:".03em" }}>{error}</p>}
              <div ref={chatEndRef}/>
            </div>
            <div style={{ padding:"10px 28px 22px", borderTop:"1px solid #141414", display:"flex", flexDirection:"column", gap:"8px" }}>
              {actionRow()}
              {inputArea("14px","10px 13px","44px")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
