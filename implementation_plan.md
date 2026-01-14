# Plan de Correction et d'Amélioration

## Objectifs
Le but est de résoudre trois problèmes majeurs :
1. **Erreur de Connexion** : Les utilisateurs ne peuvent pas se connecter (erreur CORS/Network) à cause d'un problème de configuration serveur.
2. **Longueur du Mot de Passe** : Impossible de saisir des mots de passe de plus de 8 caractères à certains endroits.
3. **Sécurité et Rôles** : S'assurer que les employés ont des privilèges limités (peuvent vendre mais PAS modifier le stock).

## Changements Proposés

### Backend (Serveur)
#### [PRODUITS] [routes/products.js](file:///home/diallo/ice-facture/backend/routes/products.js)
- **Restriction des produits** : Ajouter une vérification `if (req.user.role !== 'admin')` sur la création de produit.
- **Pourquoi ?** : Empêcher les employés de créer des produits ou de modifier le stock manuellement. Seul le gérant doit pouvoir gérer l'inventaire.

#### [SERVEUR] [server.js](file:///home/diallo/ice-facture/backend/server.js)
- **Correction CORS** : Déplacer la configuration `cors` tout en haut du fichier.
- **Pourquoi ?** : Actuellement, le "limiteur de vitesse" (anti-spam) bloque la connexion AVANT d'autoriser l'accès, ce qui crée une fausse erreur technique au lieu de dire "Trop de tentatives". Cette correction permettra la connexion normale.

### Frontend (Application)
#### [PARAMÈTRES] [Settings.jsx](file:///home/diallo/ice-facture/frontend/src/pages/Settings.jsx)
- **Correction Mot de Passe** : Supprimer la limite `maxLength={8}` sur le champ mot de passe de déverrouillage. Vous pourrez saisir votre mot de passe long entier.

#### [INVENTAIRE] [Products.jsx](file:///home/diallo/ice-facture/frontend/src/pages/Products.jsx)
- **Correction Mot de Passe** : Supprimer la limite `maxLength={8}` sur les modales de déverrouillage et de suppression.
- **Interface Employé** : Cacher le formulaire "Ajouter un produit" si l'utilisateur est un employé. Ils ne verront que la liste des produits (lecture seule).

#### [NAVIGATION] [Navbar.jsx](file:///home/diallo/ice-facture/frontend/src/components/Navbar.jsx)
- **Menu Responsive** : Remplacer la barre fixe par un **bouton Menu** sur mobile.
- **Comportement** : Sur petit écran, le menu est caché. Un clic sur le bouton affiche le menu.
- **Pourquoi ?** : Pour éviter que le menu ne prenne trop de place ou ne soit illisible sur téléphone.

#### [EMPLOYES] [Settings.jsx](file:///home/diallo/ice-facture/frontend/src/pages/Settings.jsx)
- **Modal de Suppression** : Remplacer `window.confirm()` par une vraie modale stylisée pour la suppression des vendeurs.
- **Saisie Téléphone** : Remplacer le champ texte simple du formulaire "Nouveau Vendeur" par le composant `<PhoneInput />` (avec drapeaux et validation).
- **Pourquoi ?** : Pour avoir le même comportement qu'à l'inscription (validation format et indicatif).

#### [STABILITÉ] [index.html](file:///home/diallo/ice-facture/frontend/index.html)
- **Viewport Mobile** : Ajouter `user-scalable=no` et `maximum-scale=1.0`.
- **Pourquoi ?** : Empêcher le zoom accidentel et stabiliser l'application comme une application native ("ne doit pas aller partout").

## Plan de Vérification
### Tests Automatiques
- Je vérifierai le code pour m'assurer que les restrictions sont en place.
### Vérification Manuelle
- Vous pourrez tester la connexion (devrait fonctionner immédiatement).
- Vous pourrez tester la saisie d'un mot de passe long (> 8 caractères).
- Vous pourrez vous connecter en tant qu'employé et vérifier que vous ne pouvez PAS ajouter de produits, mais que vous POUVEZ faire une vente.
