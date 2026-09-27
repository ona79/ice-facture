# 🧊 Ice Facture — Solution Full-Stack de Gestion de Boutique & Facturation

**Ice Facture** est une application web progressive (**PWA**) moderne, rapide et sécurisée conçue pour la gestion complète de boutique, d'inventaire, d'encaissement (POS), de suivi des charges et de facturation.

---

## 📌 Sommaire

- [Fonctionnalités Clés](#-fonctionnalités-clés)
- [Stack Technique](#-stack-technique)
- [Structure du Projet](#-structure-du-projet)
- [Configuration & Variables d'Environnement](#-configuration--variables-denvironnement)
- [Installation & Démarrage](#-installation--démarrage)
- [Documentation de l'API REST](#-documentation-de-lapi-rest)
- [Rôles & Matrice des Permissions](#-rôles--matrice-des-permissions)
- [Tests & Qualité](#-tests--qualité)
- [Manuel d'Utilisation](#-manuel-dutilisation)
- [Licence](#-licence)

---

## ✨ Fonctionnalités Clés

### 🛒 1. Point de Vente (Caisse / POS)
- **Catalogue dynamique** : Ajout rapide d'articles au panier en un clic.
- **Scanner de code-barres** : Intégration de la caméra (`html5-qrcode`) et support des lecteurs optiques USB avec prise en charge des variantes EAN/UPC.
- **Recherche & Autocomplétion Client** : Détection automatique des clients enregistrés par nom ou numéro de téléphone.
- **Gestion des Acomptes & Dettes** : Calcul automatique des avances et restes à payer avec statuts (`Payé`, `Dette`, `Partiel`).
- **Calculatrice Flottante** : Widget de calcul rapide accessible sur toute l'application.

### 📄 2. Impression & Documents Professionnels
- **Ticket de Caisse (Imprimante Thermique 80mm)** : Impression optimisée avec logo, coordonnées et message personnalisé de bas de page.
- **Factures PDF A4** : Génération directe au format A4 (`jsPDF`) avec mise en page économe en papier et placement intelligent du pied de page.
- **QR Code intégré** : Génération de QR Codes sur les factures et tickets.

### 📦 3. Gestion des Stocks & Inventaire
- **Ajout & Upsert Intelligent** : Augmentation automatique du stock si un produit ou code-barres existe déjà en base.
- **Recherche Multi-critères** : Filtrage par nom, code-barres, catégorie ou statut de stock.
- **Sécurisation des suppressions** : Validation par mot de passe administrateur avant toute modification critique.

### 💸 4. Suivi des Dépenses (Charges)
- Enregistrement et catégorisation des charges d'exploitation (loyer, électricité, salaires, logistique).
- Calcul du bénéfice net (Chiffre d'Affaires - Dépenses).

### 📊 5. Tableau de Bord & Analytics
- Visualisation interactive des ventes et performances via graphiques **Chart.js**.
- Métriques en temps réel : Chiffre d'affaires total, total des impayés, volume de ventes et bénéfice net.

### 👥 6. Gestion Multi-Utilisateurs & Équipe
- **Compte Administrateur (Gérant)** : Contrôle total sur la boutique, les stocks, la comptabilité, les paramètres et la création des comptes d'employés.
- **Comptes Employés** : Accès limité à l'encaissement et à la vente sans accès aux données financières sensibles ni aux fonctions de suppression.

### 📱 7. Progressive Web App (PWA) & Mode Hors-Ligne
- Installable sur Android, iOS et Desktop sans passer par les stores d'applications.
- **Mode Offline Sync** (`useOfflineSync`) : Continuez à enregistrer des ventes et gérer votre boutique sans connexion Internet ; la synchronisation s'effectue automatiquement lors du retour du réseau.

### 🔒 8. Sécurité Renforcée
- **Authentification JWT** avec hachage de mots de passe **BcryptJS** (salting à 8 tours).
- Validation stricte des entrées backend via **Zod**.
- Protection contre les injections NoSQL (`express-mongo-sanitize`) et sécurisation des en-têtes HTTP via **Helmet**.
- Vérification du mot de passe admin (`verify-password`) pour les actions sensibles.

---

## 🛠️ Stack Technique

### Frontend
- **Framework & Build** : React 19, Vite, React Router DOM v7
- **Style & Design** : TailwindCSS v3, Framer Motion, Lucide React, React Hot Toast
- **Impression & PDF** : `jsPDF`, `jspdf-autotable`, `react-to-print`, `qrcode.react`, `canvas-confetti`
- **Scanner & Graphiques** : `html5-qrcode`, `chart.js`, `react-chartjs-2`
- **PWA & Offline** : `vite-plugin-pwa`, Service Workers, Custom Hook `useOfflineSync`
- **Tests** : Vitest, React Testing Library

### Backend
- **Runtime & Framework** : Node.js (v18+), Express.js
- **Base de Données** : MongoDB, Mongoose 8.21
- **Authentification & Sécurité** : JWT (JSON Web Token), BcryptJS, Helmet, Express Mongo Sanitize, Zod
- **Tests** : Jest, Supertest

---

## 📁 Structure du Projet

```text
ice-facture/
├── MANUEL.md               # Manuel utilisateur complet en Français
├── README.md               # Documentation globale du projet
├── backend/                # API REST Node.js / Express
│   ├── middleware/         # Middleware Auth JWT & Validation Zod
│   │   ├── auth.js
│   │   └── validate.js
│   ├── models/             # Modèles Mongoose (User, Product, Invoice, Expense)
│   │   ├── Expense.js
│   │   ├── Invoice.js
│   │   ├── Product.js
│   │   └── User.js
│   ├── routes/             # Routes de l'API
│   │   ├── auth.js
│   │   ├── expenses.js
│   │   ├── invoices.js
│   │   └── products.js
│   ├── tests/              # Tests d'intégration Jest & Supertest
│   │   └── server.test.js
│   ├── .env                # Fichier de variables d'environnement
│   ├── package.json
│   └── server.js           # Point d'entrée du serveur backend
└── frontend/               # Application React PWA Vite
    ├── public/             # Assets publics & manifests PWA
    ├── src/
    │   ├── assets/         # Images, icônes et sons
    │   ├── components/     # Composants réutilisables (Navbar, Calculator, Receipt, etc.)
    │   ├── hooks/          # Hooks personnalisés (useOfflineSync)
    │   ├── pages/          # Pages de l'application (Dashboard, NewInvoice, Products, etc.)
    │   ├── utils/          # Génération PDF, API Axios, Audio, Country Codes
    │   ├── App.jsx         # Déclaration des routes & layout principal
    │   └── main.jsx        # Démarrage React & PWA
    ├── tailwind.config.js  # Configuration du thème Ice Glass
    ├── vite.config.js      # Configuration Vite & PWA
    └── package.json
```

---

## ⚙️ Configuration & Variables d'Environnement

Créez un fichier `.env` dans le dossier `backend/` :

```env
# Port d'écoute du serveur (par défaut 5000)
PORT=5000

# Chaîne de connexion MongoDB (Local ou MongoDB Atlas)
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority

# Clé secrète pour le chiffrement des Tokens JWT
JWT_SECRET=votre_cle_secrete_jwt_ultra_securisee
```

---

## 🚀 Installation & Démarrage

### Prérequis
- **Node.js** (v18.0.0 ou supérieur)
- **npm** (v9.0.0 ou supérieur)
- **MongoDB** (Instance locale ou cluster Cloud Atlas)

### 1. Cloner le dépôt
```bash
git clone https://github.com/votre-nom-utilisateur/ice-facture.git
cd ice-facture
```

### 2. Démarrage du Backend
```bash
cd backend
npm install
npm run dev
```
Le serveur démarrera sur `http://localhost:5000`.

### 3. Démarrage du Frontend
Dans un second terminal :
```bash
cd frontend
npm install
npm run dev
```
L'application web sera accessible sur `http://localhost:5173`.

---

## 🔌 Documentation de l'API REST

### Authentification & Utilisateurs (`/api/auth`)
| Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Inscription d'un nouveau gérant (Admin) | Public |
| `POST` | `/api/auth/login` | Connexion utilisateur & génération de token JWT | Public |
| `GET` | `/api/auth/profile` | Récupération des informations du profil | Authentifié |
| `PUT` | `/api/auth/profile` | Mise à jour des informations de la boutique | Authentifié |
| `PUT` | `/api/auth/update-password` | Modification du mot de passe | Authentifié |
| `POST` | `/api/auth/create-employee` | Création d'un compte employé rattaché | Admin |
| `GET` | `/api/auth/employees` | Liste des employés de la boutique | Admin |
| `DELETE`| `/api/auth/employees/:id` | Suppression d'un employé (mot de passe admin requis) | Admin |
| `POST` | `/api/auth/verify-password` | Vérification de mot de passe avant action sensible | Authentifié |
| `POST` | `/api/auth/forgot-password` | Demande de réinitialisation par mot de passe oublié | Public |
| `POST` | `/api/auth/reset-password/:token` | Réinitialisation via token | Public |
| `DELETE`| `/api/auth/profile` | Suppression du compte et données en cascade | Authentifié |

### Produits & Inventaire (`/api/products`)
| Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Récupère la liste des produits de la boutique | Authentifié |
| `POST` | `/api/products` | Ajoute un produit ou incrémente le stock si existant (Upsert) | Admin |
| `DELETE`| `/api/products/:id` | Supprime un produit (mot de passe requis) | Admin |

### Ventes & Factures (`/api/invoices`)
| Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/invoices` | Liste toutes les factures de la boutique | Authentifié |
| `GET` | `/api/invoices/customers` | Liste des clients uniques pour autocomplétion | Authentifié |
| `POST` | `/api/invoices` | Enregistre une vente & déduit automatiquement le stock | Authentifié |
| `PATCH` | `/api/invoices/:id/pay` | Enregistre un règlement partiel ou total de dette | Authentifié |
| `DELETE`| `/api/invoices/:id` | Annule une vente & restaure les stocks (mot de passe requis) | Admin |

### Dépenses (`/api/expenses`)
| Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/expenses` | Liste les charges et dépenses de la boutique | Authentifié |
| `POST` | `/api/expenses` | Enregistre une nouvelle dépense | Admin |
| `DELETE`| `/api/expenses/:id` | Supprime une dépense | Admin |

---

## 👥 Rôles & Matrice des Permissions

| Fonctionnalité | Administrateur (Gérant) | Employé (Vendeur) |
| :--- | :---: | :---: |
| Encaisser et effectuer des ventes | ✅ | ✅ |
| Consulter le catalogue et les stocks | ✅ | ✅ |
| Générer et imprimer des factures / tickets | ✅ | ✅ |
| Modifier les prix et l'inventaire | ✅ | ❌ |
| Enregistrer ou supprimer des dépenses | ✅ | ❌ |
| Accéder aux paramètres de la boutique | ✅ | ❌ |
| Annuler des ventes / Restaurer du stock | ✅ | ❌ |
| Créer / Supprimer des comptes employés | ✅ | ❌ |

---

## 🧪 Tests & Qualité

### Backend (Jest & Supertest)
Pour exécuter les tests automatisés de l'API backend :
```bash
cd backend
npm test
```

### Frontend (Vitest & React Testing Library)
Pour exécuter la suite de tests du composant frontend :
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
