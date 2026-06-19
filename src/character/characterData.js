// Character data: ethnicity/skin/hair palettes, name pools, role titles, mood metadata.
// Extracted from App.jsx so the character system can be developed/replaced (incl. future Rive
// rigs) without touching screen/prompt/session logic.

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
  // Hairstyle pool, kept gender-appropriate
  const hairStyle = gender === "f"
    ? pick(["long","romantic_long","long_flowing","bun"])
    : pick(["short","buzz","quiff","messy","soft fringe","faux","bald"]);
  const hairLong = gender === "f";
  // Outfit variant — drives small collar/pattern accents in buildSVG
  const outfitStyle = Math.floor(Math.random() * 3);
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

  return { name, gender, ethnicity: eth, roleKey, accent: ACCENTS[eth]||"#C8B89A", bg: BGS[eth]||"#161410", skin, hair, hairLong, hairStyle, glasses, beard, bodyColor, tie, outfitStyle };
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
  // Not an emotion — an attention state. Used while the user is speaking/typing so the
  // character visibly registers them instead of sitting in whatever mood it last held.
  listening:     { browL:"M54 87 Q62 83 70 86", browR:"M90 86 Q98 83 106 87", eyeRy:6,   eyeLy:6,   mouth:"neutral",  blush:0,   think:false, sweat:false },
};

function darken(hex, amt) {
  try { let r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `#${Math.max(0,r-amt).toString(16).padStart(2,"0")}${Math.max(0,g-amt).toString(16).padStart(2,"0")}${Math.max(0,b-amt).toString(16).padStart(2,"0")}`; } catch { return hex; }
}
function lighten(hex, amt) {
  try { let r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `#${Math.min(255,r+amt).toString(16).padStart(2,"0")}${Math.min(255,g+amt).toString(16).padStart(2,"0")}${Math.min(255,b+amt).toString(16).padStart(2,"0")}`; } catch { return hex; }
}

export { SKIN, HAIR, ETHNICITIES, pick, ROLE_TITLES, NAME_POOL, generateChar, CHARS, MOOD_DATA, darken, lighten };
