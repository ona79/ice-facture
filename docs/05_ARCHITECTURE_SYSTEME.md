# Architecture Système et Composants (System Architecture)

## Présentation

Ce document détaille l'**Architecture Système Multi-Tiers** du projet **Ice Facture**. L'application est conçue selon un modèle découlant des principes de l'**Offline-First PWA**, du découplage strict entre Client React et Serveur REST Express, et d'un cloisonnement étanche des données (**Multi-tenant**).

---

## Diagramme d'Architecture globale

```mermaid
graph TB
    %% TIERS CLIENT (FRONTEND PWA)
    subgraph ClientTier [" TIERS CLIENT (React 19 & PWA Vite) "]
        direction TB
        subgraph UI_Layer [" Vues & UI (React Components) "]
            LoginUI["Login / Register / Auth"]
            POSUI["POS Caisse (NewInvoice.jsx)"]
            ProdUI["Gestion Stock (Products.jsx)"]
            ExpUI["Gestion Charges (Expenses.jsx)"]
            DashUI["Tableau de Bord (Dashboard.jsx)"]
            HistUI["Historique & Dettes (History.jsx)"]
        end

        subgraph ClientCore [" Logique Client & State "]
            Router["React Router DOM v7"]
            AudioEngine["Sound Engine (audio.js)"]
            PDFEngine["PDF Generator (jsPDF & autoTable)"]
            OfflineSync["Hook useOfflineSync & LocalStorage"]
        end

        subgraph PWAEngine [" Progressive Web App Engine "]
            SW["Service Worker (vite-plugin-pwa)"]
            CacheStorage["Cache Storage (HTML/CSS/JS/Assets)"]
        end
    end

    %% COUCHE RÉSEAU / PROTOCOLE
    Network(("HTTPS / REST API<br>(Axios Client)"))

    %% TIERS BACKEND (SERVEUR EXPRESS.JS)
    subgraph ServerTier [" TIERS SERVEUR (Node.js & Express.js) "]
        direction TB
        
        subgraph SecurityLayer [" Couche Sécurité & Defense-in-Depth "]
            CorsMW["CORS Policy Middleware"]
            HelmetMW["Helmet HTTP Headers Security"]
            SanitizeMW["Express Mongo Sanitize (Anti NoSQLi)"]
            RateLimitMW["Rate Limiter (Anti Bruteforce)"]
            AuthMW["JWT Authentication & Multi-tenant Resolver"]
            ZodVal["Validation de Schémas Zod"]
        end

        subgraph RouteLayer [" API Endpoints (Routes) "]
            AuthRoutes["/api/auth"]
            ProductRoutes["/api/products"]
            InvoiceRoutes["/api/invoices"]
            ExpenseRoutes["/api/expenses"]
        end

        subgraph BusinessLogic [" Logique Métier & Hooks Mongoose "]
            StockLogic["Upsert Produit & Décrémentation Stock"]
            DebtLogic["Calcul Reste à Payer & Statuts"]
            MarginLogic["Calcul Chiffre d'Affaires & Marge Nette"]
        end
    end

    %% TIERS DONNÉES ET SERVICES EXTERNES
    subgraph DataTier [" TIERS DONNÉES & SERVICES EXTERNES "]
        MongoDB[("Base de Données MongoDB<br>(Local / Cloud Atlas)")]
        SMTP["Serveur Mail SMTP<br>(Nodemailer Reset Password)"]
    end

    %% FLUX INTERMEDIATION
    UI_Layer --> ClientCore
    ClientCore --> PWAEngine
    ClientCore --> Network
    PWAEngine --> CacheStorage

    Network --> SecurityLayer
    SecurityLayer --> RouteLayer
    RouteLayer --> BusinessLogic

    BusinessLogic --> MongoDB
    AuthRoutes ..> SMTP : "Envoi email réinitialisation"
```

---

## Description des Couches de l'Architecture

### 1. Tiers Client (Frontend PWA React 19)
- **Framework & Single Page Application** : Utilisant **React 19** et **Vite**, le client est réactif et hautement performant.
- **Service Worker & Offline Support** : Déployé via `vite-plugin-pwa`, le Service Worker met en cache les bundles statiques pour permettre le chargement instantané de la caisse même en cas de coupure Internet.
- **Hook `useOfflineSync`** : Agit comme un tampon (*Buffer*) qui capture les ventes générées hors-ligne, les sérialise dans le `localStorage` et les synchronise automatiquement au retour du réseau.
- **Génération Client-Side (PDF & QR Code)** : Pour réduire la charge du serveur, la génération des factures A4 au format PDF (`jsPDF`) et des QR Codes d'authenticité s'effectue directement par le processeur de l'appareil client.

---

### 2. Tiers Serveur (Backend Node.js & Express.js)
- **Architecture REST Stateless** : Le serveur ne conserve aucun état de session en mémoire. Chaque requête est authentifiée individuellement via un jeton **JWT** envoyé dans l'en-tête `Authorization: Bearer <token>`.
- **Stratégie de Sécurité Multi-couches** :
  1. `cors` : Contrôle des origines et méthodes autorisées.
  2. `helmet` : Sécurisation des en-têtes HTTP (CSP, X-XSS-Protection, HSTS).
  3. `express-mongo-sanitize` : Neutralisation automatique des opérateurs d'injection NoSQL (`$gt`, `$where`, etc.).
  4. `Zod` : Validation stricte des types et formats d'entrée avant d'interroger la base de données.
- **Résolution Multi-tenant (`ownerId`)** : Le middleware `auth.js` identifie si l'utilisateur est un compte principal (`admin`) ou un compte secondaire (`employee`). En cas d'employé, toutes les requêtes sont isolées avec la valeur `parentId` pour garantir que chaque boutique ne voit que ses propres données.

---

### 3. Tiers Données & Services (MongoDB & SMTP)
- **MongoDB & Mongoose 8.21** : Base de données NoSQL garantissant de hautes performances en lecture/écriture pour la caisse au comptoir.
- **Crochet de Validation Mongoose (`preSaveHook`)** : Garantit l'intégrité des calculs d'acomptes et de dettes directement au niveau du schéma `Invoice` avant chaque persistance.
- **Service Nodemailer** : Permet l'envoi de jetons sécurisés à durée limitée pour la réinitialisation de mot de passe oublié.
