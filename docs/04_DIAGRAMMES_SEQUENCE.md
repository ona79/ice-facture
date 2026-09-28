# Diagrammes de Séquence (Sequence Diagrams)

## Présentation

Ce document rassemble les **Diagrammes de Séquence** détaillant la dynamique des échanges d'information entre le Client (React 19 PWA), le Middleware de Sécurité, les Contrôleurs Express.js et la Base de Données MongoDB.

---

## Sommaire des Flux Traités

1. [Flux 1 : Authentification & Résolution Multi-Tenant (Login)](#flux-1--authentification--résolution-multi-tenant-login)
2. [Flux 2 : Vente au Comptoir (POS) & Décrémentation de Stock](#flux-2--vente-au-comptoir-pos--décrémentation-de-stock)
3. [Flux 3 : Recouvrement d'une Dette Client (Acompte)](#flux-3--recouvrement-dune-dette-client-acompte)
4. [Flux 4 : Vente Hors-Ligne & Synchronisation PWA (Offline First)](#flux-4--vente-hors-ligne--synchronisation-pwa-offline-first)

---

## Flux 1 : Authentification & Résolution Multi-Tenant (Login)

Ce flux décrit la connexion d'un utilisateur (Admin ou Employé), la génération du token JWT et la résolution de l'identifiant propriétaire (`ownerId`).

```mermaid
sequenceDiagram
    autonumber
    actor User as Utilisateur
    participant UI as Interface React (Login.jsx)
    participant API as Express API (/api/auth/login)
    participant AuthMW as Auth Middleware
    participant DB as MongoDB (User Model)

    User->>UI: Saisit email/phone et password
    UI->>API: POST /api/auth/login { email, password }
    API->>DB: findOne({ email/phone })
    DB-->>API: Renvoie le document User (avec password hash & role)
    
    alt Utilisateur non trouvé ou mot de passe incorrect
        API-->>UI: 400 Bad Request ("Identifiants invalides")
        UI-->>User: Notification d'erreur
    else Authentification réussie
        API->>API: Bcrypt.compare(password, user.password)
        API->>API: jwt.sign({ user: { id, role, parentId } }, JWT_SECRET)
        API-->>UI: 200 OK { token, user }
        UI->>UI: Stocke token dans localStorage
        UI-->>User: Redirection vers /dashboard ou /new-invoice
    end

    note over UI, AuthMW: Requêtes Ultérieures Authentifiées
    UI->>API: GET /api/products (Header: Authorization Bearer <token>)
    API->>AuthMW: Exécute auth Middleware
    AuthMW->>AuthMW: jwt.verify(token, JWT_SECRET)
    AuthMW->>AuthMW: req.user.ownerId = (role === 'employee' ? parentId : id)
    AuthMW->>API: next()
    API->>DB: find({ userId: req.user.ownerId })
    DB-->>API: Liste des produits de la boutique
    API-->>UI: 200 OK [ products ]
```

---

## Flux 2 : Vente au Comptoir (POS) & Décrémentation de Stock

Ce flux montre l'ajout d'articles par scan ou sélection, la validation de la vente, la mise à jour transactionnelle du stock et l'émission du document PDF / Ticket.

```mermaid
sequenceDiagram
    autonumber
    actor Vendeur as Vendeur / Admin
    participant POS as Interface POS (NewInvoice.jsx)
    participant Audio as Sound Engine (audio.js)
    participant API as Express API (/api/invoices)
    participant DB as MongoDB (Invoice & Product)
    participant PDF as PDF Generator (jsPDF)

    Vendeur->>POS: Scanne un code-barres / Sélectionne produit
    POS->>Audio: Joue le son Beep (playBeep)
    POS->>POS: Met à jour le panier d'achat & le montant total

    Vendeur->>POS: Saisit le montant versé & valide l'encaissement
    POS->>API: POST /api/invoices { customerName, items, totalAmount, amountPaid }

    API->>DB: Vérifie le stock suffisant pour chaque article dans items

    alt Stock insuffisant
        DB-->>API: Rupture de stock constatée
        API-->>POS: 400 Bad Request ("Stock insuffisant pour [Produit]")
        POS-->>Vendeur: Alerte d'échec
    else Stock disponible
        API->>DB: Crée le document Invoice
        note over DB: Mongoose pre('save') :<br>remainingAmount = totalAmount - amountPaid<br>status = (remainingAmount > 0 ? 'Dette' : 'Payé')
        
        loop Pour chaque article dans items
            API->>DB: Product.findByIdAndUpdate(productId, { $inc: { stock: -quantity } })
        end

        DB-->>API: Confirmation de l'enregistrement
        API-->>POS: 201 Created { invoice }
        POS->>Audio: Joue le son Cash Register (playSuccess)
        
        alt Choix Impression Ticket 80mm
            POS->>POS: Affiche la modal Receipt & lance window.print()
        else Choix Facture PDF A4
            POS->>PDF: generateInvoicePDF(invoice, shopInfo)
            PDF-->>Vendeur: Téléchargement automatique du fichier PDF avec QR Code
        end
    end
```

---

## Flux 3 : Recouvrement d'une Dette Client (Acompte)

Ce flux décrit le suivi et le règlement ultérieur d'un reliquat client sur une facture enregistrée avec le statut `Dette`.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrateur / Employé
    participant UI as Historique (History.jsx)
    participant API as Express API (/api/invoices/:id/pay)
    participant DB as MongoDB (Invoice Model)

    Admin->>UI: Sélectionne une facture ayant le statut "Dette"
    Admin->>UI: Saisit le montant de l'acompte (additionalAmount)
    UI->>API: PATCH /api/invoices/:id/pay { additionalAmount }

    API->>DB: Invoice.findById(invoiceId)
    DB-->>API: Renvoie le document Invoice

    API->>API: invoice.amountPaid += additionalAmount
    API->>DB: invoice.save()

    note over DB: Hook pre('save') :<br>remainingAmount = totalAmount - amountPaid<br>si remainingAmount <= 0 => status = 'Payé'

    DB-->>API: Invoice mis à jour
    API-->>UI: 200 OK { msg: "Paiement enregistré", invoice }
    UI-->>Admin: Met à jour le statut visuel dans l'historique (Badge Vert "Payé" ou Orange "Dette")
```

---

## Flux 4 : Vente Hors-Ligne & Synchronisation PWA (Offline First)

Ce flux illustre le comportement du système lors d'une perte soudaine de la connexion Internet et sa réconciliation automatique.

```mermaid
sequenceDiagram
    autonumber
    actor Vendeur as Vendeur
    participant POS as React PWA (NewInvoice.jsx)
    participant Hook as Hook (useOfflineSync.js)
    participant Storage as LocalStorage
    participant SW as Service Worker
    participant API as Express API Remote

    note over POS, SW: Perte de Connexion Réseau (Offline)
    SW-->>Hook: Événement window 'offline' déclenché
    Hook-->>POS: État isOnline = false (Badge Hors-ligne affiché)

    Vendeur->>POS: Valide une vente au comptoir
    POS->>Hook: saveInvoiceOffline(invoiceData)
    Hook->>Storage: Enregistre la transaction dans PENDING_INVOICES_KEY
    Storage-->>Hook: Transaction sauvegardée en local
    POS-->>Vendeur: Notification ("Vente enregistrée en mode Hors-Ligne")

    note over POS, SW: Rétablissement de la Connexion Réseau (Online)
    SW-->>Hook: Événement window 'online' déclenché
    Hook-->>Hook: État isOnline = true (Déclenche syncPendingInvoices)
    
    Hook->>Storage: Récupère la liste PENDING_INVOICES
    Storage-->>Hook: Liste des ventes en attente

    loop Pour chaque vente stockée en local
        Hook->>API: POST /api/invoices (Header: Authorization Bearer)
        API->>API: Enregistre la vente & met à jour les stocks
        API-->>Hook: 201 Created
    end

    Hook->>Storage: Efface PENDING_INVOICES_KEY
    Hook-->>POS: Notification ("Synchronisation réussie des ventes hors-ligne !")
```
