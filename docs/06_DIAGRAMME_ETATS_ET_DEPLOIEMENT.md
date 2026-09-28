# Diagrammes d'États et de Déploiement (State & Deployment Diagrams)

## Présentation

Ce document rassemble les **Diagrammes de Machine à États** (décrivant le cycle de vie des factures et des stocks) ainsi que le **Diagramme de Déploiement** de la solution **Ice Facture** sur son infrastructure d'exécution Cloud.

---

## 1. Diagramme d'États : Cycle de Vie d'une Facture / Transaction

Ce diagramme illustre les transitions d'état d'une vente, de sa préparation au panier jusqu'à son règlement intégral ou son annulation.

```mermaid
stateDiagram-v2
    [*] --> Panier_En_Cours : Sélection des articles sur le POS

    state Panier_En_Cours {
        [*] --> Ajout_Articles
        Ajout_Articles --> Ajustement_Quantites
        Ajustement_Quantites --> Saisie_Client_Et_Reglement
    }

    Panier_En_Cours --> Vente_Validee : Validation encaissement (POST /api/invoices)

    state Vente_Validee <<choice>>

    Vente_Validee --> Paye : Montant versé >= Total Facture (Remaining = 0)
    Vente_Validee --> Dette : Montant versé < Total Facture (Remaining > 0)

    state Dette {
        [*] --> Acompte_Enregistre
        Acompte_Enregistre --> Recouvrement_Partiel : Nouveau versement (PATCH /pay)
        Recouvrement_Partiel --> Solde_Atteint : Montant cumulé >= Total
    }

    Solde_Atteint --> Paye : Transition automatique du statut (Mongoose pre-save)

    state Paye {
        [*] --> Encaissement_Cloture
    }

    Paye --> Annulee : Annulation par Admin (DELETE /api/invoices/:id)
    Dette --> Annulee : Annulation par Admin (DELETE /api/invoices/:id)

    state Annulee {
        [*] --> Stock_Reintegre : Quantités restituées à l'inventaire
    }

    Annulee --> [*]
    Paye --> [*]
```

---

## 2. Diagramme d'États : Niveau de Stock d'un Produit

```mermaid
stateDiagram-v2
    [*] --> Stock_Normal : Stock > Seuil critique (> 5 unités)

    Stock_Normal --> Stock_Faible : Vente effectuée (Stock <= 5 unités)
    Stock_Faible --> Rupture_Stock : Vente effectuée (Stock = 0 unité)

    Rupture_Stock --> Stock_Normal : Reconstitution / Upsert produit (Quantité ajoutée)
    Stock_Faible --> Stock_Normal : Reconstitution / Upsert produit (Quantité ajoutée)

    Rupture_Stock --> Blocked_Sale : Tentative de vente au comptoir
    Blocked_Sale --> Rupture_Stock : Rejet par l'API backend ("Stock insuffisant")
```

---

## 3. Diagramme de Déploiement (Deployment Diagram)

Ce diagramme décrit la topologie physique et l'hébergement de l'application Ice Facture en environnement de production (Node.js Render Cloud & MongoDB Atlas).

```mermaid
graph TD
    %% NOEUD CLIENT (ÉQUIPEMENT COMPTOIR / MOBILE)
    subgraph ClientDevice [" Appareil Client (Comptoir / Mobile) "]
        subgraph Browser [" Navigateur Web (Chrome / Edge / Safari / PWA) "]
            ReactApp["React 19 Application (Bundle Statique)"]
            ServiceWorker["Service Worker Cache"]
            LocalStorageDB["LocalStorage (Ventes Hors-Ligne)"]
        end
        ThermalPrinter["Imprimante Thermique (USB / Bluetooth 80mm)"]
        BarcodeScanner["Scanner Code-barres / Caméra Mobile"]
    end

    %% INTERNET / CLOUD INFRASTRUCTURE
    Internet(("Réseau Internet / HTTPS"))

    %% NOEUD HÉBERGEMENT BACKEND (RENDER CLOUD)
    subgraph RenderCloud [" Render PaaS Cloud Platform "]
        subgraph NodeEnvironment [" Container Node.js Runtime (Linux Ubuntu x64) "]
            ExpressApp["Express.js REST API Server (Port 5000 / 0.0.0.0)"]
            SecurityStack["Helmet / Cors / RateLimiter"]
            MongooseORM["Mongoose ODM Driver"]
        end
    end

    %% NOEUD BASE DE DONNÉES (MONGODB ATLAS CLOUD)
    subgraph DatabaseCloud [" MongoDB Atlas Cloud Cluster "]
        PrimaryNode["Base MongoDB Principale (Replica Set)"]
        BackupNode["Sauvegardes / Automated Snapshots"]
    end

    %% NOEUD SERVICES EMAIL
    subgraph SMTPCloud [" Service Email SMTP "]
        SMTPServer["Serveur Mail Transactionnel (Reset Password)"]
    end

    %% LIAISONS INFRASTRUCTURE
    BarcodeScanner --> ReactApp
    ReactApp --> ThermalPrinter
    ReactApp <--> ServiceWorker
    ServiceWorker <--> LocalStorageDB

    ReactApp <== "HTTPS / REST API (Port 443)" ==> Internet
    Internet <== "TLS 1.3 / Reverse Proxy" ==> SecurityStack
    SecurityStack --> ExpressApp
    ExpressApp --> MongooseORM

    MongooseORM <== "MongoDB Wire Protocol (Port 27017)" ==> PrimaryNode
    PrimaryNode -.-> BackupNode
    ExpressApp -.-> SMTPServer
```
