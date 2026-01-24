# Ice Facture

Une application moderne de gestion de facturation Full-Stack construite avec la stack MERN (MongoDB, Express, React, Node.js). Cette application simplifie le processus de création, de gestion et de suivi des factures et des ventes.

## 🚀 Fonctionnalités

*   **Tableau de bord** : Vue d'ensemble des ventes et de l'activité récente en temps réel.
*   **Création de factures** : Interface intuitive pour générer des factures avec prise en charge du scan de codes-barres.
*   **Gestion des produits** : Gestion de l'inventaire et des prix.
*   **Authentification** : Connexion et inscription sécurisées des utilisateurs.
*   **Design Responsive** : Optimisé pour les ordinateurs et les tablettes.
*   **Génération PDF** : Génération automatique de factures professionnelles au format PDF.

## 🛠️ Stack Technique

*   **Frontend** : React, Vite, TailwindCSS, Framer Motion, Chart.js
*   **Backend** : Node.js, Express.js
*   **Base de données** : MongoDB
*   **Authentification** : JWT (JSON Web Tokens)

## 📦 Installation

Prérequis : Node.js (v18+) et MongoDB installés localement ou une URI MongoDB distante.

1.  **Cloner le dépôt :**
    ```bash
    git clone https://github.com/votre-nom-utilisateur/ice-facture.git
    cd ice-facture
    ```

2.  **Installer les dépendances :**
    ```bash
    # Installer les dépendances backend
    cd backend
    npm install

    # Installer les dépendances frontend
    cd ../frontend
    npm install
    ```

3.  **Configuration de l'environnement :**
    Créez un fichier `.env` dans le dossier `backend` :
    ```env
    PORT=5000
    MONGO_URI=votre_chaine_de_connexion_mongodb
    JWT_SECRET=votre_secret_jwt_securise
    ```

4.  **Lancer l'application :**

    **Backend (Terminal 1) :**
    ```bash
    cd backend
    npm start # ou npm run dev
    ```

    **Frontend (Terminal 2) :**
    ```bash
    cd frontend
    npm run dev
    ```

## 📄 Licence
Ce projet est sous licence MIT.
