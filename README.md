# Project Docs

Application web de gestion de documents projet. Créez un projet et retrouvez instantanément 23 documents pré-configurés (PRD, Roadmap, Technical Spec, etc.) avec un éditeur Markdown intégré. Chaque projet dispose aussi d'un journal de bord pour suivre l'avancement au fil du temps.

## Fonctionnalités

### Documents projet
- **23 templates** générés automatiquement à la création d'un projet (Vision Document, PRD, Roadmap, Technical Specification, Decision Log, etc.)
- **Editeur Markdown** avec CodeMirror (coloration syntaxique, numéros de ligne, historique undo/redo)
- **Preview** du rendu Markdown en temps réel
- **Export** : copie presse-papier, téléchargement .md, téléchargement .pdf, export .zip du projet complet

### Journal de bord
- Entrées horodatées automatiquement (date de création + dernière modification)
- Editeur Markdown (CodeMirror) par entrée
- Preview du rendu Markdown par entrée
- Copie du contenu dans le presse-papier par entrée
- Téléchargement individuel (.md avec frontmatter) ou groupé
- Auto-save au blur, tri chronologique inversé

### Interface
- Design Apple-like minimaliste
- Thème clair / sombre / système
- Barre de recherche projets
- Indicateur de progression par projet (documents remplis)
- Persistance localStorage

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| CSS | Tailwind CSS v4 |
| Editeur | CodeMirror 6 |
| Markdown | react-markdown + remark-gfm |
| Icônes | Lucide React |
| Export | file-saver, jsPDF, JSZip |

## Installation

```bash
git clone https://github.com/Louisdelez/project-docs.git
cd project-docs
npm install
npm run dev
```

L'application est accessible sur `http://localhost:5173`.

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production (TypeScript + Vite) |
| `npm run preview` | Preview du build de production |
| `npm run lint` | Lint ESLint |

## Licence

[MIT](LICENSE)
