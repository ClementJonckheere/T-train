# Séance — programme haltères, 20 à 30 minutes

Application web installable (PWA), sans compte ni serveur applicatif. Les séances,
charges, répétitions, pesées et brouillons sont conservés sur l'appareil.

## Programme personnalisé

| Jour | Séance | Exercices |
| --- | --- | --- |
| Lundi | Pectoraux A | Couché 4 × 8–12 ; épaules 2 × 8–12 ; élévations 2 × 12–20 ; triceps 2 × 10–15 |
| Mardi | Dos A | Rowing unilatéral 3 × 8–12/côté ; pull-over 2 × 10–15 ; oiseau 2 × 12–20 ; curl 2 × 8–15 |
| Mercredi | Jambes A | Goblet squat 3 × 10–15 ; roumain 3 × 8–12 ; extension 2 × 12–20 ; mollets 2 × 12–25 |
| Jeudi | Pectoraux B | Incliné à environ 30° 4 × 8–12 ; épaules, élévations et triceps comme lundi |
| Vendredi | Dos B | Même séance que mardi |
| Samedi | Jambes B | Même séance que mercredi |
| Dimanche | Repos | Récupération |

- Échauffement guidé de 5 minutes, sans haltères, et chronomètre global, repos compris. Le compteur
  signale la fin du créneau sans enregistrer ni interrompre automatiquement.
- Mode **20 minutes** : les trois premiers exercices ; mode **30 minutes** :
  les quatre. Une séance partielle peut être enregistrée.
- Mode **Reprise** : deux séries par exercice pour les premières semaines.
- Bouton **Aujourd'hui, j'ai la flemme** : environ 12 à 15 minutes, échauffement
  compris, avec les deux premiers exercices et deux séries chacun. Ce choix
  ponctuel conserve la préférence habituelle de 20/30 minutes pour la suite.
  **Continuer en format 30 min** ajoute les séries/exercices restants sans
  effacer le travail déjà réalisé ni redémarrer le chronomètre.
- L'extension peut être remplacée par des fentes arrière si l'accessoire du banc
  ne convient pas. Le mouvement et son historique restent distincts.
- Les formats sont choisis avant de commencer ; ils restent fixes pendant la séance.
- La séance du jour est proposée automatiquement, ou une séance non terminée
  reprend à la réouverture. Chaque séance possède son propre brouillon.

À chaque lancement de l'échauffement, le minuteur affiche le mouvement en cours,
ses consignes et répétitions, le temps restant pour ce mouvement et les quatre
étapes. Il passe automatiquement à l'étape suivante, en tenant compte du temps
écoulé même si l'écran a été verrouillé. Le bouton de fin permet de quitter le
guide à tout moment ; le relancer recommence les cinq minutes.

| Séances | 2 premières minutes | Puis une minute par mouvement |
| --- | --- | --- |
| Lundi / jeudi | Marche active sur place | Cercles de bras ; pompes contre un mur ; développé épaules sans poids |
| Mardi / vendredi | Marche active sur place | Roulements d'épaules ; rowing sans poids ; oiseau sans poids |
| Mercredi / samedi | Marche active sur place | Squats sans charge ; bascule des hanches ; montées sur la pointe des pieds |

Le temps d'échauffement est inclus dans le créneau choisi. Les réglages ±15 s
restent réservés aux temps de repos pour conserver les durées du guide.

## Objectifs facultatifs et records

- **Petit défi +1 répétition** : un seul objectif à la fois, proposé à partir
  de la dernière séance complète comparable. À exercice, charge et nombre de
  séries identiques, il vise une répétition de plus au total, dans la fourchette
  prévue. Il est conservé avec le brouillon. Changer la charge le met de côté.
- **Défi du mois** dans Progression : choisir une proposition issue de
  l'historique, avec deux répétitions de plus au total (plafonnées à la limite
  de la fourchette). Le défi choisi garde sa charge, ses séries et son objectif
  jusqu'à la fin du mois ; sa validation est affichée et sauvegardée.
- **Régularité** : démarrer un défi de trois séances complètes sur trois dates
  distinctes du lundi au samedi. Les versions courtes comptent, les repos ne
  remettent rien à zéro et il n'y a pas de date limite.
- **Meilleures performances** : comparaison séparée pour chaque exercice,
  charge et nombre de séries. Une première performance établit un repère ; une
  amélioration réelle déclenche un message de record lors de l'enregistrement.

Les séances partielles, les anciennes unités, les charges mélangées dans un
exercice et les répétitions hors fourchette sont exclues des comparaisons de
performance. La première séance sert à établir les repères. Aucun objectif ne
force une hausse de charge, un passage à l'échec ou un dépassement du créneau.
Le mode Reprise garde ses objectifs de régularité et les repères de performance,
sans proposer le défi +1. Les défis sont inclus dans l'export JSON.

## Charges et progression

Les poids sont affichés **par haltère** pour les mouvements à deux haltères,
avec le total indiqué sous le réglage. Les valeurs de départ reprennent
l'interprétation retenue dans la conversation :

| Mouvement | Total annoncé | Saisie par haltère |
| --- | --- | --- |
| Développé couché | 20 kg | 10 kg |
| Développé épaules | 10 kg | 5 kg |
| Élévations latérales | 14 kg | 7 kg |

Ces valeurs sont modifiables. Les autres charges sont volontairement vides,
y compris le développé incliné et les triceps : les 6 kg annoncés pour ces
derniers ne précisaient pas la charge d'un seul haltère tenu à deux mains.

Règle les répétitions réellement effectuées avant chaque validation. Chaque
série garde sa propre charge et ses répétitions (par exemple 12 / 11 / 10 / 9).
Les boutons de charge avancent de 0,5 kg ; la saisie directe reste possible.
La dernière séance et une suggestion conditionnelle de progression s'affichent
sur la carte : atteindre le haut de la fourchette avec une technique propre
et environ deux répétitions encore possibles avant d'augmenter la charge.

Le volume externe des nouvelles séances tient compte des deux haltères et des
deux côtés sur les exercices unilatéraux. Les répétitions de ces derniers sont
saisies **par côté**, puis la série est validée après les deux côtés. Le volume
des anciennes séances n'est ni recalculé ni converti : il n'est pas directement
comparable avec le nouveau calcul.

## Poids et données existantes

L'objectif est **85 kg**, depuis un point de départ de **75 kg**. Aucune pesée
n'est créée automatiquement. La moyenne utilise les pesées des sept derniers
jours calendaires, et non les sept dernières entrées.

Les clés `fitlog:*`, les anciennes charges et les anciens historiques sont
conservés. Les nouveaux mouvements utilisent des identifiants `mass_*` pour
éviter de réinterpréter les anciennes unités. Une ancienne séance non terminée
reste accessible jusqu'à son enregistrement.

Dans **Progression → Exporter mes données JSON**, sauvegarde l'historique,
les pesées, les réglages et les brouillons. L'app n'a pas de synchronisation
entre appareils ni d'import JSON à ce stade. Le stockage navigateur peut être
supprimé par l'utilisateur, la navigation privée ou le système : garde une copie.

## Installation et mise à jour

Tous les fichiers de production restent à la racine : `index.html`, `app.js`,
`program.js`, `motivation.js`, `manifest.json`, `sw.js` et les trois icônes PNG.

1. Sur GitHub, **Settings → Pages**, sélectionner **main**, dossier **/ (root)**.
2. Ouvrir `https://clementjonckheere.github.io/T-train/` une fois avec une connexion.
3. iPhone/Safari : **Partager → Sur l'écran d'accueil**. Android/Chrome :
   **Installer l'application** depuis le menu.

Le cache `seance-v11` inclut les trois fichiers JavaScript. Après une mise à jour,
ouvrir l'app avec une connexion puis la fermer et la rouvrir si l'ancien écran
reste affiché. Ne pas effacer les données du site pour mettre l'app à jour.
Pour les prochaines versions, incrémenter le nom du cache dans `sw.js`.

## Développement et vérifications

Aucune compilation ni dépendance n'est nécessaire en production.
Pour tester localement, servir le dossier par HTTP, par exemple :

```sh
python -m http.server 8000
```

Tests de parcours navigateur (Node.js 20 ou supérieur) :

```sh
npm ci
npx playwright install chromium
npm run check
npm test
```

Un Chromium déjà installé peut être utilisé via
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/chemin/vers/chromium npm test`.
Les tests couvrent les séries, unités, brouillons, anciens historiques,
calendrier local, moyenne sur sept jours, minuteurs, affichage mobile et hors-ligne.
