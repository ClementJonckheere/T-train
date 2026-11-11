
/* ---------- Données du programme ---------- */
const LEGACY_PROGRAM = [
  {key:"pushA", name:"Push A", tag:"Force", ex:[
    {id:"dc_hlt_f", n:"Développé couché haltères", sets:4, rep:[6,8], kg:20, rest:120},
    {id:"dinc_hlt", n:"Développé incliné haltères", sets:4, rep:[8,10], kg:16, rest:120},
    {id:"dep_assis", n:"Développé épaules assis (dossier vertical)", sets:3, rep:[8,10], kg:12, rest:90},
    {id:"skull", n:"Skull crusher haltères", sets:3, rep:[8,10], kg:8, rest:75},
    {id:"elev_lat", n:"Élévations latérales", sets:3, rep:[12,15], kg:8, rest:60},
  ]},
  {key:"pull", name:"Pull", tag:"Dos", ex:[
    {id:"row_hlt_2", n:"Rowing haltères penché (2 bras)", sets:4, rep:[8,10], kg:20, rest:120},
    {id:"row_hlt", n:"Rowing unilatéral sur banc", sets:3, rep:[8,12], kg:20, rest:90},
    {id:"pullover", n:"Pull-over haltère", sets:3, rep:[12,15], kg:16, rest:75},
    {id:"curl_hlt", n:"Curl haltères", sets:3, rep:[8,12], kg:12, rest:75},
    {id:"curl_mart", n:"Curl marteau haltères", sets:3, rep:[10,12], kg:12, rest:60},
    {id:"shrug", n:"Shrugs haltères", sets:3, rep:[12,15], kg:24, rest:60},
  ]},
  {key:"legsA", name:"Legs A", tag:"Force", ex:[
    {id:"goblet", n:"Goblet squat", sets:4, rep:[8,10], kg:24, rest:120},
    {id:"fentes_bg", n:"Fentes bulgares (pied sur banc)", sets:3, rep:[8,12], kg:16, rest:90},
    {id:"sdt_roum", n:"Soulevé de terre roumain haltères", sets:3, rep:[8,12], kg:20, rest:120},
    {id:"mollet_deb", n:"Mollets debout haltères", sets:4, rep:[15,20], kg:20, rest:60},
  ]},
  {key:"pushB", name:"Push B", tag:"Volume", ex:[
    {id:"dc_hlt", n:"Développé couché haltères", sets:4, rep:[10,12], kg:16, rest:90},
    {id:"dinc_hlt2", n:"Développé incliné haltères", sets:4, rep:[10,12], kg:14, rest:90},
    {id:"ecarte", n:"Écarté haltères (plat ou incliné)", sets:3, rep:[12,15], kg:10, rest:75},
    {id:"elev_lat2", n:"Élévations latérales", sets:3, rep:[12,15], kg:8, rest:60},
    {id:"ext_tri_1b", n:"Extension triceps 1 bras assis (dossier relevé)", sets:3, rep:[10,12], kg:8, rest:60},
  ]},
  {key:"legsB", name:"Legs B", tag:"Volume", ex:[
    {id:"fentes_m", n:"Fentes marchées haltères", sets:3, rep:[10,12], kg:14, rest:90},
    {id:"hipthrust", n:"Hip thrust haltère (dos sur banc)", sets:4, rep:[12,15], kg:24, rest:90},
    {id:"leg_curl", n:"Leg curl (ischios, sur le ventre)", sets:4, rep:[10,12], kg:20, rest:75},
    {id:"leg_ext", n:"Leg extension (quadriceps)", sets:4, rep:[12,15], kg:30, rest:75},
  ]},
];

/* Charges en kg PAR HALTÈRE pour les mouvements avec deux haltères.
   Les 20 / 10 / 14 kg annoncés sont interprétés comme le total des deux.
   Une charge inconnue reste null : aucune performance n'est inventée.
   Identifiants distincts de l'ancien programme pour préserver ses unités. */
const EXERCISES = {
  flat: {id:'mass_flat', n:'Développé couché haltères', sets:4, rep:[8,12], kg:10, reps:12, rest:90, load:'pair', cue:'Banc plat, pieds stables, omoplates rapprochées. Descends les haltères de chaque côté du torse dans une amplitude confortable, puis pousse sans élan.'},
  incline: {id:'mass_incline', n:'Développé incliné haltères', sets:4, rep:[8,12], kg:null, rest:90, load:'pair', cue:'Banc incliné à environ 30°. Garde les pieds au sol et les fesses sur le banc. Choisis une charge adaptée à cet angle, indépendamment du développé couché.'},
  press: {id:'mass_press', n:'Développé épaules assis', sets:2, rep:[8,12], kg:5, reps:12, rest:90, load:'pair', cue:'Dossier relevé et dos soutenu. Pousse les haltères au-dessus de la tête sans creuser excessivement le dos.'},
  lateral: {id:'mass_lateral', n:'Élévations latérales', sets:2, rep:[12,20], kg:7, reps:12, rest:60, load:'pair', cue:'Coudes légèrement fléchis, monte les bras sur les côtés jusqu’à hauteur d’épaules. Buste stable et descente contrôlée. Réduis la charge si tu dois prendre de l’élan.'},
  triceps: {id:'mass_triceps', n:'Extension triceps à deux mains', sets:2, rep:[10,15], kg:null, rest:60, load:'single', note:'Tes 6 kg annoncés restent à confirmer pour ce mouvement avec un seul haltère.', cue:'Un seul haltère tenu à deux mains au-dessus de la tête. Plie puis tends les coudes en gardant le tronc stable. Choisis la charge pour 10 à 15 répétitions contrôlées.'},
  row: {id:'mass_row', n:'Rowing unilatéral sur banc', sets:3, rep:[8,12], kg:null, rest:90, load:'single', sides:2, cue:'Une main en appui sur le banc, dos stable. Tire le coude vers la hanche sans tourner le buste. Fais les deux bras avant de valider une série et de prendre le repos.'},
  pullover: {id:'mass_pullover', n:'Pull-over avec un haltère', sets:2, rep:[10,15], kg:null, rest:75, load:'single', cue:'Allongé dans la longueur du banc, tête soutenue. Tiens un haltère à deux mains ; descends-le derrière la tête dans une amplitude confortable, sans creuser le dos.'},
  rear: {id:'mass_rear', n:'Oiseau avec haltères', sets:2, rep:[12,20], kg:null, rest:60, load:'pair', cue:'Buste penché et dos stable, ou poitrine appuyée sur le banc incliné. Écarte les bras avec des charges légères, sans élan.'},
  curl: {id:'mass_curl', n:'Curl biceps avec haltères', sets:2, rep:[8,15], kg:null, rest:60, load:'pair', cue:'Coudes près du corps. Monte les deux haltères puis redescends en contrôlant, sans balancer le torse.'},
  squat: {id:'mass_squat', n:'Goblet squat', sets:3, rep:[10,15], kg:null, rest:90, load:'single', cue:'Tiens un haltère devant la poitrine. Descends entre tes jambes en gardant les pieds au sol et les genoux dans l’axe des pointes de pieds.'},
  hinge: {id:'mass_hinge', n:'Soulevé de terre roumain', sets:3, rep:[8,12], kg:null, rest:90, load:'pair', cue:'Fais d’abord une série légère. Genoux légèrement fléchis, pousse les hanches vers l’arrière avec les haltères près des jambes. Arrête avant d’arrondir le dos.'},
  extension: {id:'mass_extension', n:'Extension des jambes sur banc', sets:2, rep:[12,20], kg:null, rest:60, load:'machine', cue:'Utilise uniquement l’accessoire prévu par le fabricant. Assis, tends les jambes en contrôlant la montée et la descente. Si le banc ne le permet pas, choisis la variante fentes arrière.'},
  lunge: {id:'mass_lunge', n:'Fentes arrière avec haltères', sets:2, rep:[8,12], kg:null, rest:90, load:'pair', sides:2, allowZero:true, cue:'Recule un pied, fléchis les deux jambes puis remonte avec contrôle. Les répétitions sont par jambe ; fais les deux côtés avant de valider une série. Tu peux commencer sans charge (0 kg).'},
  calf: {id:'mass_calf', n:'Mollets debout avec haltères', sets:2, rep:[12,25], kg:null, rest:60, load:'pair', cue:'Monte sur la pointe des pieds, marque une courte pause puis redescends complètement. Reste sur un sol stable et garde l’équilibre.'}
};
/* Échauffements sans haltères : 2 minutes de marche, puis 3 mouvements d'une minute. */
const WARMUP_MARCH = {name:'Marche active sur place', seconds:120, cue:'Marche sur place en balançant les bras. Commence doucement puis accélère progressivement, sans courir ni sauter.'};
const WARMUPS = {
  push: {name:'Pectoraux · épaules · triceps', steps:[
    WARMUP_MARCH,
    {name:'Cercles de bras', seconds:60, cue:'Bras légèrement écartés, commence par de petits cercles puis agrandis-les. Change de sens après 30 secondes.'},
    {name:'Pompes contre un mur', seconds:60, cue:'Mains à hauteur des épaules, pieds légèrement reculés. Approche la poitrine du mur puis repousse. Fais 8 à 12 répétitions faciles.'},
    {name:'Développé épaules sans poids', seconds:60, cue:'Mains près des épaules, pousse les bras au-dessus de la tête puis redescends. Fais 10 à 15 répétitions lentes, sans cambrer le dos.'}
  ]},
  pull: {name:'Dos · arrière des épaules · biceps', steps:[
    WARMUP_MARCH,
    {name:'Roulements d’épaules', seconds:60, cue:'Bras relâchés, fais tranquillement 10 cercles d’épaules vers l’avant puis 10 vers l’arrière.'},
    {name:'Rowing sans poids', seconds:60, cue:'Penche légèrement le buste en poussant les fesses vers l’arrière. Ramène les coudes vers les hanches puis tends les bras. Fais 10 à 15 répétitions.'},
    {name:'Oiseau sans poids', seconds:60, cue:'Buste légèrement penché, ouvre les bras sur les côtés puis ramène-les devant toi. Fais 10 à 15 répétitions, sans élan.'}
  ]},
  legs: {name:'Jambes · fessiers', steps:[
    WARMUP_MARCH,
    {name:'Squats sans charge', seconds:60, cue:'Fais 8 à 12 répétitions lentes, pieds au sol. Descends jusqu’à une profondeur confortable.'},
    {name:'Bascule des hanches', seconds:60, cue:'Mains sur les hanches, genoux légèrement fléchis. Pousse les fesses vers l’arrière en gardant le dos stable, puis redresse-toi. Fais 10 à 12 répétitions.'},
    {name:'Montées sur la pointe des pieds', seconds:60, cue:'Tiens légèrement un mur pour l’équilibre. Monte puis redescends doucement. Fais 15 à 20 répétitions.'}
  ]}
};
function warmupForSession(session) {
  // Les anciennes séances encore en cours ont également le guide adapté.
  const type = session.key.includes('push') ? 'push' : session.key.includes('pull') ? 'pull' : 'legs';
  return WARMUPS[type];
}
const PROGRAM = [
  {key:'mass_push_a', name:'Pectoraux A', tag:'Lundi', day:1, focus:'Pectoraux · épaules · triceps', ex:[EXERCISES.flat, EXERCISES.press, EXERCISES.lateral, EXERCISES.triceps]},
  {key:'mass_pull_a', name:'Dos A', tag:'Mardi', day:2, focus:'Dos · arrière des épaules · biceps', ex:[EXERCISES.row, EXERCISES.pullover, EXERCISES.rear, EXERCISES.curl]},
  {key:'mass_legs_a', name:'Jambes A', tag:'Mercredi', day:3, focus:'Cuisses · fessiers · mollets', ex:[EXERCISES.squat, EXERCISES.hinge, EXERCISES.extension, EXERCISES.calf]},
  {key:'mass_push_b', name:'Pectoraux B', tag:'Jeudi', day:4, focus:'Pectoraux inclinés · épaules · triceps', ex:[EXERCISES.incline, EXERCISES.press, EXERCISES.lateral, EXERCISES.triceps]},
  {key:'mass_pull_b', name:'Dos B', tag:'Vendredi', day:5, focus:'Dos · arrière des épaules · biceps', ex:[EXERCISES.row, EXERCISES.pullover, EXERCISES.rear, EXERCISES.curl]},
  {key:'mass_legs_b', name:'Jambes B', tag:'Samedi', day:6, focus:'Cuisses · fessiers · mollets', ex:[EXERCISES.squat, EXERCISES.hinge, EXERCISES.extension, EXERCISES.calf]}
];
const BODY_GOAL = {start:75, target:85};

