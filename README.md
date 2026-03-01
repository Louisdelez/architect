# Architect

Workspace tout-en-un pour structurer, documenter et piloter vos projets. Créez un projet et retrouvez instantanément 23 documents pré-configurés, un journal de bord, une bibliothèque de prompts IA, un tableau Kanban et un calendrier — le tout dans une interface Apple-like avec authentification Firebase.

## Fonctionnalités

### Documents projet

- **23 templates** générés automatiquement à la création d'un projet :

  | # | Document | # | Document |
  |---|---|---|---|
  | 01 | Vision Document | 13 | Security Review Document |
  | 02 | Problem Statement | 14 | Performance Plan |
  | 03 | Business Case | 15 | Go-To-Market Plan |
  | 04 | Objectifs Initiaux | 16 | Risk Management Document |
  | 05 | Project Charter | 17 | Compliance Documentation |
  | 06 | PRD | 18 | Legal Review Document |
  | 07 | Roadmap | 19 | Architecture Review Board Document |
  | 08 | Technical Specification | 20 | Incident Report |
  | 09 | Decision Log | 21 | Post-Mortem Document |
  | 10 | OKRs / Metrics Document | 22 | SLA Document |
  | 11 | UX Research Document | 23 | Governance Documentation |
  | 12 | API Specification | | |

- **Éditeur Markdown** avec CodeMirror 6 (coloration syntaxique, numéros de ligne, historique undo/redo)
- **Preview** du rendu Markdown en temps réel
- **Export** : copie presse-papier, téléchargement `.md`, téléchargement `.pdf`, export `.zip` du projet complet
- **Indicateur de progression** : anneau circulaire dans la sidebar montrant le nombre de documents remplis

### Journal de bord

- Entrées horodatées automatiquement (date de création + dernière modification)
- Éditeur Markdown (CodeMirror) par entrée
- Preview du rendu Markdown par entrée
- Copie du contenu dans le presse-papier en un clic
- Téléchargement individuel (`.md` avec frontmatter YAML) ou groupé
- Auto-save au blur, tri chronologique inversé

### Prompts IA

- Bibliothèque de prompts réutilisables par projet
- Copie en un clic pour utilisation avec ChatGPT, Claude, etc.
- Carte repliable avec horodatage, titre et aperçu
- Édition inline du titre et du contenu

### Kanban

- 3 colonnes : **À faire**, **En cours**, **Terminé**
- **Drag & drop** entre colonnes et au sein d'une colonne (via @dnd-kit)
- Cartes avec : titre, description, priorité (haute/moyenne/basse avec code couleur), date d'échéance, tags personnalisés (6 couleurs)
- Les cartes avec date d'échéance apparaissent automatiquement dans le calendrier
- Modal d'édition complète par carte

### Calendrier

- 4 modes de vue : **Année**, **Mois**, **Semaine**, **Jour**
- Navigation avec bouton "Aujourd'hui" et flèches
- Événements avec : titre, description, date, heure début/fin, couleur (8 options)
- **Récurrence avancée** : quotidienne, hebdomadaire (jours spécifiques), mensuelle (par jour ou Nième jour de la semaine), annuelle — avec intervalle personnalisé et conditions de fin (jamais, après N occurrences, jusqu'à une date)
- **Exceptions par occurrence** : modification ou suppression individuelle sans affecter la série
- Intégration Kanban : les cartes avec date d'échéance apparaissent en lecture seule
- Drag & drop des événements (semaine/jour pour changer l'heure, mois pour changer la date)

### Authentification

- **Firebase Auth** : inscription et connexion par email/mot de passe
- **Google Sign-In** (OAuth popup)
- Données isolées par utilisateur (clé localStorage par userId)

### Interface

- Design **Apple-like** minimaliste (vibrancy blur, glassmorphism, animations iOS)
- Thème **clair / sombre / système** (détection automatique)
- **5 langues** : Français, English, Deutsch, Italiano, Español
- Barre de recherche projets
- **Responsive** : sidebar en drawer sur mobile/tablette, icônes seules sur petit écran
- Persistance localStorage (offline-first, pas de base de données serveur)

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| CSS | Tailwind CSS v4 |
| Éditeur | CodeMirror 6 |
| Markdown | react-markdown + remark-gfm |
| Auth | Firebase Auth |
| Drag & Drop | @dnd-kit |
| Icônes | Lucide React |
| Export | file-saver, jsPDF, JSZip, html2canvas |
| Déploiement | Docker (nginx Alpine) |

## Installation

### Développement

```bash
git clone https://github.com/Louisdelez/architect.git
cd architect
cp .env.example .env  # configurer les variables Firebase
npm install
npm run dev
```

L'application est accessible sur `http://localhost:5173`.

### Docker

```bash
git clone https://github.com/Louisdelez/architect.git
cd architect
# Le .env avec les variables Firebase doit être présent
docker compose up -d
```

L'application est accessible sur `http://localhost:8080`.

Le port est configurable : `PORT=3000 docker compose up -d`

Pour rebuild après un changement : `docker compose up -d --build`

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production (TypeScript + Vite) |
| `npm run preview` | Preview du build de production |
| `npm run lint` | Lint ESLint |

## Licence

[MIT](LICENSE)
