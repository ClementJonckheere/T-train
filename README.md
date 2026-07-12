# Séance — installer l'app via GitHub Pages

Ces 6 fichiers forment une application web installable (PWA) : `index.html`,
`manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`.
**Garde-les tous dans le même dossier.**

## 1. Mettre en ligne (une seule fois)

1. Crée un compte sur github.com si besoin, puis un nouveau dépôt (**New repository**),
   par exemple nommé `seance`. Coche « Public ».
2. Sur la page du dépôt : **Add file → Upload files**, glisse les 6 fichiers,
   puis **Commit changes**.
3. Onglet **Settings → Pages**. Sous « Build and deployment », source =
   **Deploy from a branch**, branche = **main**, dossier = **/ (root)**. Enregistre.
4. Patiente ~1 minute. GitHub affiche l'adresse de ton app, du type :
   `https://TON-PSEUDO.github.io/seance/`

## 2. Installer sur le téléphone

Ouvre cette adresse `https://...` sur ton téléphone, **une fois avec connexion**
(le service worker met l'app en cache pour le hors-ligne).

- **iPhone (Safari)** : bouton Partager → **Ajouter à l'écran d'accueil**.
- **Android (Brave/Chrome)** : menu **⋮** → **Installer l'application** / **Ajouter à l'écran d'accueil**.

L'icône « Séance » se lance en plein écran. Grâce à l'adresse `https://`, tes données
(charges, séances, pesées) sont conservées de façon fiable, et l'app fonctionne
ensuite sans réseau.

## 3. Mettre à jour l'app plus tard

Réuploade le fichier modifié dans le dépôt. Pour forcer la mise à jour côté
téléphone, incrémente la version du cache dans `sw.js` (`seance-v1` → `seance-v2`)
avant de le réuploader.

## Sauvegarde des données

Les données vivent dans le navigateur du téléphone (localStorage). Pense à les
exporter de temps en temps si tu veux les analyser ailleurs (je peux ajouter un
bouton d'export CSV à l'app si tu le souhaites).
