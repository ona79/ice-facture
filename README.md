# Ice Facture

Solution full-stack de gestion de boutique, point de vente (POS), suivi d'inventaire et facturation.

---

## Sommaire

- [Présentation Générale](#présentation-générale)
- [Fonctionnalités Principales](#fonctionnalités-principales)
- [Architecture Technique](#architecture-technique)
- [Structure du Dépôt](#structure-du-dépôt)
- [Matrice des Rôles et Permissions](#matrice-des-rôles-et-permissions)
- [Configuration et Variables d'Environnement](#configuration-et-variables-denvironnement)
- [Guide d'Installation et de Démarrage](#guide-dinstallation-et-de-démarrage)
- [Documentation de l'API REST](#documentation-de-lapi-rest)
- [Sécurité et Conformité](#sécurité-et-conformité)
- [Fonctionnement Hors-Ligne et PWA](#fonctionnement-hors-ligne-et-pwa)
- [Tests et Assurance Qualité](#tests-et-assurance-qualité)
- [Documentation Utilisateur](#documentation-utilisateur)
- [Licence](#licence)

---

## Présentation Générale

**Ice Facture** est une application web progressive (PWA) de niveau entreprise destinée aux commerçants, gérants de boutiques et petites entreprises. Elle centralise la gestion des opérations de vente au comptoir, le contrôle d'inventaire en temps réel, l'émission de documents financiers (tickets de caisse et factures A4), le suivi des dépenses d'exploitation et l'analyse de la rentabilité.

L'application est conçue pour fonctionner avec ou sans connexion Internet continue grâce à un système de synchronisation adaptatif, garantissant la continuité de service même en cas de coupure réseau.

---

## Fonctionnalités Principales

### Point de Vente (POS) et Encaissement
- **Interface Caisse Optimisée** : Ajout rapide d'articles au panier par recherche textuelle, sélection visuelle ou scanner.
- **Support des Lecteurs de Codes-Barres** : Prise en charge des scanners optiques USB et intégration de la caméra d'appareil mobile via `html5-qrcode` (formats EAN, UPC, Code 128).
- **Gestion Avancée des Clients** : Autocomplétion lors de la saisie et enregistrement automatique des coordonnées des nouveaux clients.
- **Gestion des Dettes et Acomptes** : Suivi des paiements partiels, calcul automatique des reliquats et affectation de statuts de règlement (`Payé`, `Dette`, `Partiel`).
- **Calculatrice Intégrée** : Outil de calcul flottant accessible depuis l'ensemble des modules.

### Émission et Impression de Documents Financials
- **Tickets de Caisse Thermiques (80mm)** : Format compact optimisé pour l'impression thermique directe, incluant numéro de vente, détail des articles, taxes et message de bas de page paramétrable.
- **Factures PDF Format A4** : Génération côté client (`jsPDF` et `jspdf-autotable`) avec disposition structurée, calcul de la TVA, coordonnées d'entreprise et pied de page dynamique.
- **Intégration de QR Codes** : Insertion de QR Codes d'authentification sur chaque document généré.

### Gestion d'Inventaire et des Stocks
- **Incrémentation Automatique (Upsert)** : Mise à jour intelligente des quantités si le produit ou le code-barres existe déjà en base de données.
- **Recherche Multi-Critères** : Filtrage par désignation, référence code-barres, catégorie ou état de stock (rupture, stock faible).
- **Protection des Opérations Critiques** : Confirmation par mot de passe administrateur requis pour la suppression ou la modification de stocks.

### Suivi des Charges et Comptabilité Simplifiée
- **Enregistrement des Dépenses d'Exploitation** : Saisie et catégorisation des frais fixes et variables (loyer, électricité, salaires, logistique).
- **Calcul de la Marge Nette** : Déduction automatique des charges globales du chiffre d'affaires brut pour obtenir le bénéfice net de la boutique.

### Analyse de Performance et Reporting
- **Tableau de Bord Graphique** : Visualisation de l'évolution des ventes et du chiffre d'affaires avec `Chart.js`.
- **Indicateurs Clés (KPIs)** : Affichage en temps réel du chiffre d'affaires, du volume des encaissements, du total des créances clients (dettes) et de la marge nette calculée.

### Gestion Multi-Utilisateurs et Contrôle d'Accès (RBAC)
- **Rôle Administrateur (Gérant)** : Accès complet à la configuration de l'établissement, à la gestion financière, aux modifications de prix/stock et à la création d'accès employés.
- **Rôle Employé (Vendeur)** : Accès restreint au module d'encaissement et à l'impression de factures/tickets, sans visibilité sur la comptabilité globale ni droit de suppression.

---

## Architecture Technique

### Technologies Frontend
- **Framework & Bundler** : React 19, Vite (Rolldown), React Router DOM v7
- **Style et Composants** : Tailwind CSS v3, Framer Motion, Lucide React, React Hot Toast
- **Impression et PDF** : `jsPDF`, `jspdf-autotable`, `react-to-print`, `qrcode.react`
- **Lecture Optique et Graphiques** : `html5-qrcode`, `chart.js`, `react-chartjs-2`
- **PWA et Synchronisation** : `vite-plugin-pwa`, Service Workers, Hook personnalisé `useOfflineSync`
- **Suite de Tests** : Vitest, React Testing Library, JSDOM

### Technologies Backend
- **Environnement d'Exécution** : Node.js (v18+), Express.js
- **Base de Données et ODM** : MongoDB, Mongoose 8.21
- **Authentification et Sécurité** : JWT (JSON Web Tokens), BcryptJS (salting à 8 tours), Helmet, Express Mongo Sanitize, Rate Limiter, Zod
- **Services Complémentaires** : Nodemailer (reinitialisation de mot de passe)
- **Suite de Tests** : Jest, Supertest

---

## Structure du Dépôt

```text
ice-facture/
├── MANUEL.md               # Manuel d'utilisation détaillé à destination des utilisateurs
├── README.md               # Documentation technique du projet
├── docs/                   # Diagrammes UML et documentation d'architecture
│   ├── README.md           # Sommaire et guide des diagrammes
│   ├── 01_DIAGRAMME_CAS_UTILISATION.md
│   ├── 02_DIAGRAMME_CLASSES.md
│   ├── 03_DIAGRAMME_ENTITE_RELATION.md
│   ├── 04_DIAGRAMMES_SEQUENCE.md
│   ├── 05_ARCHITECTURE_SYSTEME.md
│   └── 06_DIAGRAMME_ETATS_ET_DEPLOIEMENT.md
├── backend/                # API REST Express.js & MongoDB
│   ├── middleware/         # Middlewares d'authentification JWT et de validation Zod
│   │   ├── auth.js
│   │   └── validate.js
│   ├── models/             # Schémas et modèles Mongoose (User, Product, Invoice, Expense)
│   │   ├── Expense.js
│   │   ├── Invoice.js
│   │   ├── Product.js
│   │   └── User.js
│   ├── routes/             # Endpoints d'API (auth, products, invoices, expenses)
│   │   ├── auth.js
│   │   ├── expenses.js
│   │   ├── invoices.js
│   │   └── products.js
│   ├── tests/              # Tests d'intégration d'API (Jest & Supertest)
│   │   └── server.test.js
│   ├── .env                # Variables d'environnement du serveur
│   ├── package.json
│   └── server.js           # Point d'entrée de l'application backend
└── frontend/               # Application client React 19 & PWA Vite
    ├── public/             # Fichiers statiques et manifestes PWA
    ├── src/
    │   ├── assets/         # Ressources multimédias (images, sons, icônes)
    │   ├── components/     # Composants React réutilisables (Navbar, Calculator, Receipt, etc.)
    │   ├── hooks/          # Hooks personnalisés (useOfflineSync)
    │   ├── pages/          # Vues et pages principales de l'application
    │   ├── utils/          # Modules utilitaires (générateur PDF, client HTTP Axios, formatters)
    │   ├── App.jsx         # Configuration des routes et routage principal
    │   └── main.jsx        # Initialisation de React et enregistrement PWA
    ├── tailwind.config.js  # Configuration Tailwind CSS
    ├── vite.config.js      # Configuration du bundler Vite et du plugin PWA
    └── package.json
```

---

## Matrice des Rôles et Permissions

| Fonctionnalité / Action | Administrateur (Gérant) | Employé (Vendeur) |
| :--- | :---: | :---: |
| Effectuer une vente et encaisser | Autorisé | Autorisé |
| Consulter le catalogue de produits | Autorisé | Autorisé |
| Générer et imprimer tickets / factures | Autorisé | Autorisé |
| Ajouter ou modifier un produit en stock | Autorisé | Non autorisé |
| Supprimer un produit ou ajuster un prix | Autorisé | Non autorisé |
| Saisir ou supprimer des dépenses | Autorisé | Non autorisé |
| Consulter le tableau de bord financier | Autorisé | Non autorisé |
| Annuler une vente et restaurer le stock | Autorisé | Non autorisé |
| Gérer les comptes de l'équipe (création/suppression) | Autorisé | Non autorisé |
| Modifier la configuration de la boutique | Autorisé | Non autorisé |

---

## Configuration et Variables d'Environnement

Un fichier `.env` doit être présent à la racine du dossier `backend/`.

```env
# Port d'écoute du serveur HTTP (par défaut: 5000)
PORT=5000

# URI de connexion à la base de données MongoDB (Local ou Cloud Atlas)
MONGO_URI=mongodb://localhost:27017/ice-facture

# Clé secrète pour la signature des tokens JWT
JWT_SECRET=votre_cle_secrete_jwt_robuste_et_securisee

# Configuration optionnelle pour l'envoi de courriels (Nodemailer)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=utilisateur@example.com
SMTP_PASS=mot_de_passe_smtp
```

Pour le dossier `frontend/`, un fichier `.env` peut optionnellement être créé pour pointer vers l'API distante :

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Guide d'Installation et de Démarrage

### Prérequis Système
- **Node.js** : Version 18.0.0 ou supérieure
- **Gestionnaire de paquets** : `npm` (v9+) ou `yarn` / `pnpm`
- **Base de données** : Service MongoDB local actif ou compte MongoDB Atlas

### 1. Cloner le Projet
```bash
git clone https://github.com/votre-compte/ice-facture.git
cd ice-facture
```

### 2. Configuration et Lancement du Backend
```bash
cd backend
npm install
npm run dev
```
Le serveur API s'exécute sur `http://localhost:5000` (ou sur le port spécifié dans `.env`).

### 3. Configuration et Lancement du Frontend
Ouvrez un second terminal :
```bash
cd frontend
npm install
npm run dev
```
L'interface web est accessible à l'adresse `http://localhost:5173`.

---

## Documentation de l'API REST

### Authentification et Gestion des Comptes (`/api/auth`)

| Méthode | Endpoint | Description | Niveau d'Accès |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Inscription initiale d'un compte Administrateur | Public |
| `POST` | `/api/auth/login` | Connexion utilisateur et émission du Token JWT | Public |
| `GET` | `/api/auth/profile` | Récupération du profil de l'utilisateur connecté | Authentifié |
| `PUT` | `/api/auth/profile` | Mise à jour des informations de l'établissement | Authentifié |
| `PUT` | `/api/auth/update-password` | Modification du mot de passe de l'utilisateur | Authentifié |
| `POST` | `/api/auth/create-employee` | Création d'un compte employé rattaché à la boutique | Administrateur |
| `GET` | `/api/auth/employees` | Liste des comptes employés de l'établissement | Administrateur |
| `DELETE` | `/api/auth/employees/:id` | Suppression d'un compte employé | Administrateur |
| `POST` | `/api/auth/verify-password` | Validation du mot de passe admin avant action critique | Authentifié |
| `POST` | `/api/auth/forgot-password` | Génération d'une demande de réinitialisation de mot de passe | Public |
| `POST` | `/api/auth/reset-password/:token` | Application du nouveau mot de passe via jeton de réinitialisation | Public |
| `DELETE` | `/api/auth/profile` | Suppression intégrale du compte et des données associées | Administrateur |

### Gestion des Produits et Stocks (`/api/products`)

| Méthode | Endpoint | Description | Niveau d'Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Récupération de l'inventaire des produits | Authentifié |
| `POST` | `/api/products` | Création ou mise à jour de quantité de produit (Upsert) | Administrateur |
| `DELETE` | `/api/products/:id` | Suppression définitive d'un article en stock | Administrateur |

### Ventes et Facturation (`/api/invoices`)

| Méthode | Endpoint | Description | Niveau d'Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/invoices` | Consultation de l'historique des ventes et factures | Authentifié |
| `GET` | `/api/invoices/customers` | Récupération de la liste des clients enregistrés | Authentifié |
| `POST` | `/api/invoices` | Enregistrement d'une vente et mise à jour du stock | Authentifié |
| `PATCH` | `/api/invoices/:id/pay` | Enregistrement du règlement d'un solde client (dette) | Authentifié |
| `DELETE` | `/api/invoices/:id` | Annulation d'une vente avec réintégration du stock | Administrateur |

### Suivi des Charges d'Exploitation (`/api/expenses`)

| Méthode | Endpoint | Description | Niveau d'Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/expenses` | Consultation des dépenses enregistrées | Administrateur |
| `POST` | `/api/expenses` | Enregistrement d'une nouvelle dépense | Administrateur |
| `DELETE` | `/api/expenses/:id` | Suppression d'un enregistrement de dépense | Administrateur |

---

## Sécurité et Conformité

L'application intègre des pratiques de sécurité rigoureuses pour protéger l'intégrité des données financières et commerciales :

1. **Authentification Stateless par JWT** : Validation de chaque requête HTTP via des en-têtes `Authorization: Bearer <token>`.
2. **Hachage Fort des Mots de Passe** : Utilisation de `BcryptJS` avec un facteur de salage (salt rounds) fixé à 8.
3. **Protection contre les Injections NoSQL** : Filtrage automatique des caractères réservés MongoDB via `express-mongo-sanitize`.
4. **Sécurisation des En-têtes HTTP** : Application du middleware `Helmet` pour restreindre les risques de failles XSS et d'usurpation.
5. **Validation Stricte des Formats de Données** : Contrôle de la conformité des schémas d'entrée au niveau du backend avec `Zod`.
6. **Double Validation sur Opérations Sensibles** : Exigence d'une vérification de mot de passe administrateur pour l'effacement de données ou la réinitialisation de stock.

---

## Fonctionnement Hors-Ligne et PWA

Ice Facture est configurée comme une application web progressive autonome :

- **Mise en Cache des Ressources** : Le Service Worker pré-charge les éléments de l'interface utilisateur pour garantir un affichage instantané.
- **Support Multi-Plateforme** : Installation possible sur Android, iOS, Windows, macOS et Linux sans intermédiaire d'application tierce.
- **Gestionnaire de Synchronisation Hors-Ligne (`useOfflineSync`)** : Lors d'une perte de réseau, les transactions réalisées sont conservées localement. Dès que le réseau est rétabli, les données sont automatiquement transmises au serveur pour réconciliation des stocks.

---

## Tests et Assurance Qualité

Le projet intègre des suites de tests automatisées sur le backend et le frontend pour garantir la stabilité du système.

### Tests Backend (Jest & Supertest)
```bash
cd backend
npm test
```
Les tests valident les endpoints de l'API REST, la logique d'authentification et l'intégrité des transactions MongoDB.

### Tests Frontend (Vitest & React Testing Library)
```bash
cd frontend
npm test
```
Les tests d'interface vérifient le bon fonctionnement des composants React, la gestion du panier et l'exécution des hooks personnalisés.

---

## Documentation Utilisateur

Pour obtenir un guide étape par étape sur la prise en main opérationnelle de la caisse, la configuration des imprimantes thermiques 80mm et l'utilisation quotidienne de l'application, veuillez vous référer au fichier [`MANUEL.md`](./MANUEL.md).

---

## Licence

Ce projet est distribué sous licence **MIT**. Vous êtes libre de l'utiliser, de le modifier et de le déployer dans votre environnement de production.

Copyright (c) 2026 Ice Facture. Tous droits réservés.
 frontend :
```bash
cd frontend
npm test
```

---

## 📘 Manuel d'Utilisation

Un manuel d'utilisation complet rédigé en français est disponible dans le fichier [`MANUEL.md`](./MANUEL.md). Il explique pas à pas comment installer la PWA sur mobile et tablette, utiliser le mode hors-ligne, configurer le message de pied de page et gérer la caisse au quotidien.

---

## 📄 Licence

Ce projet est distribué sous la licence **MIT**. Vous êtes libre de l'utiliser, de le modifier et de le distribuer selon vos besoins.

*© 2026 Ice Facture.*
