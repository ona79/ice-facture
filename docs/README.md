# Documentation Technique et Diagrammes UML - Ice Facture

Bienvenue dans la documentation d'architecture et de conception du projet **Ice Facture**. Ce dossier contient l'ensemble des diagrammes UML, schémas conceptuels, modèles de données et architectures du projet.

---

## Sommaire des Diagrammes

| Fichier | Nom du Document | Description | Types de Diagrammes |
| :--- | :--- | :--- | :--- |
| [`01_DIAGRAMME_CAS_UTILISATION.md`](./01_DIAGRAMME_CAS_UTILISATION.md) | **Diagramme des Cas d'Utilisation** | Spécification fonctionnelle des rôles (Admin, Employé), cas d'utilisation POS, stock, dettes et administration. | Use Case Diagram |
| [`02_DIAGRAMME_CLASSES.md`](./02_DIAGRAMME_CLASSES.md) | **Diagramme de Classes & Modèle de Domaine** | Représentation objet du Backend (Modèles Mongoose, Middlewares) et du Frontend (Hooks, Services, Composants). | Class Diagram |
| [`03_DIAGRAMME_ENTITE_RELATION.md`](./03_DIAGRAMME_ENTITE_RELATION.md) | **Diagramme Entité-Association (ERD)** | Modélisation logique des collections MongoDB (`User`, `Product`, `Invoice`, `Expense`), clés et contraintes multi-tenants. | ER Diagram |
| [`04_DIAGRAMMES_SEQUENCE.md`](./04_DIAGRAMMES_SEQUENCE.md) | **Diagrammes de Séquence** | Dynamique des flux clés : Authentification JWT, Vente POS & Scan, Gestion des Dettes, Synchronisation Hors-ligne PWA et Calcul de Marge. | Sequence Diagrams |
| [`05_ARCHITECTURE_SYSTEME.md`](./05_ARCHITECTURE_SYSTEME.md) | **Architecture Système & Composants** | Vue d'ensemble multi-tiers (Frontend React 19 PWA, Express.js Backend, Couche Sécurité, MongoDB & Nodemailer). | Component & Architecture Diagram |
| [`06_DIAGRAMME_ETATS_ET_DEPLOIEMENT.md`](./06_DIAGRAMME_ETATS_ET_DEPLOIEMENT.md) | **États de Factures & Déploiement** | Cycle de vie des transactions (`Payé`, `Dette`, `Partiel`) et topologie d'hébergement cloud (Client PWA, Render, MongoDB Atlas). | State & Deployment Diagrams |

---

## Outils et Standards Visuels

Tous les diagrammes sont rédigés au format standard **Mermaid.js**, pris en charge nativement par GitHub, GitLab, VS Code et les prévisualiseurs Markdown.

### Rendu et Visualisation
- **Sur GitHub / GitLab** : Les diagrammes s'affichent automatiquement.
- **Dans VS Code** : Extension *Markdown Preview Mermaid Support*.
- **Export (PNG/SVG/PDF)** : Via l'outil [Mermaid Live Editor](https://mermaid.live).
