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

- Échauffement de 4 minutes et chronomètre global, repos compris. Le compteur
  signale la fin du créneau sans enregistrer ni interrompre automatiquement.
- Mode **20 minutes** : les trois premiers exercices ; mode **30 minutes** :
  les quatre. Une séance partielle peut être enregistrée.
- Mode **Reprise** : deux séries par exercice pour les premières semaines.
- L'extension peut être remplacée par des fentes arrière si l'accessoire du banc
  ne convient pas. Le mouvement et son historique restent distincts.
- Les formats sont choisis avant de commencer ; ils restent fixes pendant la séance.
- La séance du jour est proposée automatiquement, ou une séance non terminée
  reprend à la réouverture. Chaque séance possède son propre brouillon.

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
`program.js`, `manifest.json`, `sw.js` et les trois icônes PNG.

1. Sur GitHub, **Settings → Pages**, sélectionner **main**, dossier **/ (root)**.
2. Ouvrir `https://clementjonckheere.github.io/T-train/` une fois avec une connexion.
3. iPhone/Safari : **Partager → Sur l'écran d'accueil**. Android/Chrome :
   **Installer l'application** depuis le menu.

Le cache `seance-v9` inclut les deux fichiers JavaScript. Après une mise à jour,
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
