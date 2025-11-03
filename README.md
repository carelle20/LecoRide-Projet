
# [LecoRide-Projet]


## Revue Qualité - Documentation du Projet


Ce document sert de support pour une comprehension globale du projet.

Le lien GitHub public pour ce dépôt est : `https://github.com/carelle20/LecoRide-Projet`.


### 1\. Architecture et Responsabilités du Projet

Le projet suit l'architecture modulaire standard d'Angular, organisée par fonctionnalité.

  * **`src/app/auth`**: Gère l'ensemble des pages d'authentification (`Login`, `Inscription`).
  * **`src/app/models`**: Gère la definition des proprietes d'un utilisateur.
  * **`src/app/services`**: Contient les services d'interaction avec l'API ( `Verify`, `AuthService`). Ces services sont injectés dans les composants pour assurer un bon découplage (DIP).
  * **`src/environments`**: Contient les variables d'environnement spécifiques aux contextes de développement et de production.

### 2\. Démarrage et Consignes de Build/CI

Le projet est construit avec Angular CLI. Pour démarrer, assurez-vous d'avoir Node.js (v22.14.0) installé.

1.  **Installation des dépendances :** Utilisez `npm install`.
2.  **Lancement du développement :** La commande `ng serve` lance le serveur de développement local à l'adresse `http://localhost:4200/`.
3.  **Lancement du serveur backend :** La commande `node src/server.js` lance le serveur backend local à l'adresse `http://localhost:3000/`.

### 3\. Variables d'Environnement

La configuration des environnements est gérée via le dossier `src/environments/`. Les variables essentielles sont :

  * `API_BASE_URL`: L'URL de base du backend API (`https://api.lecoride.com/`).

Pour configurer une nouvelle variable, elle doit être ajoutée aux fichiers `environment.ts` (dev) et `environment.prod.ts` (production).

### 4\. Tests Unitaires et e2e

#### a. Tests Unitaires

Les tests unitaires sont implémentés avec Jasmine pour le framework test et Karma comme lanceur de tests. la commande pour lanacer le test est `ng test`.

#### b. Tests End-to-End (e2e)

Les tests e2e sont implémentés avec Cypress. Installer Cypress avec la commande `npm install cypress --save-dev` et dans le fichier package.json ajouter dans la section "scripts" la ligne "cypress:open". Pour lancer donc le test cypress taper dans un autre terminal la commande `npx cypress open` apres avoir lance le projet avec `ng serve`.

  * Scénarios couverts :
      * Connexion réussie et redirection vers le tableau de bord.
      * Validation et soumission correcte du formulaire d'inscription sans le consentement utilisateur.
      * Test du cycle complet de la vérification OTP (échec, blocage, et réussite).


### 5\. Routes et Tickets

Voici la cartographie des routes de l'application liées aux tickets fonctionnels majeurs :

  * **`/inscription`** : Formulaire d'inscription utilisateur.
  * **`/otp`** : Composant de vérification du code OTP.
  * **`/verify-email?token=...`** : Gestion du lien de vérification par email.
  * **`/login` ou `/authentification`** : Page de connexion.
