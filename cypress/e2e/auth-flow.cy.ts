describe('Flux d\'Authentification Complet', () => {
  const phone = '0612345678';
  const password = 'TestPassword123';
  let otpCode = ''; // Pour stocker l'OTP lu depuis le terminal ou un mock

  // --- Étape de Préparation : Récupération de l'OTP ---
  // Dans un vrai projet, on mockerait la réponse du backend, 
  // mais pour simuler le flux manuel, nous allons supposer une méthode 
  // pour obtenir l'OTP (sinon, vous devrez le lire manuellement et le saisir).

  // 💡 Note : Comme l'OTP est visible dans le terminal, 
  // ce test ne peut pas être 100% automatique sans mocker le backend.
  // Nous allons donc nous concentrer sur les interactions IHM.

  beforeEach(() => {
    cy.visit('/connexion');
  });

  // ----------------------------------------------------------------------
  // TEST 1 : Inscription, Vérification OTP et Redirection Onboarding
  // ----------------------------------------------------------------------
  it('Doit s\'inscrire, vérifier l\'OTP et être redirigé vers /onboarding', () => {
    // 1. Accès à l'inscription
    cy.get('a[routerLink="/inscription"]').click();
    cy.url().should('include', '/inscription');

    // 2. Soumission du formulaire d'inscription
    cy.get('input[formControlName="emailPhone"]').type(phone);
    cy.get('input[formControlName="password"]').type(password);
    cy.get('button[type="submit"]').click();

    // 3. Redirection vers la vérification OTP après succès (hypothèse de la dernière étape)
    // 💡 Ici, dans un vrai test E2E, on lirait l'OTP depuis le backend mocké
    
    // 4. Redirection vers /onboarding après vérification (Manuelle pour l'OTP)
    // Pour l'automatisation E2E, nous allons simuler le succès de la vérification 
    // et vérifier la redirection vers /onboarding.
    
    // Après un succès d'inscription simulé (nous nous contentons ici du click et de l'URL)
    cy.url().should('include', '/verify-otp'); 
    
    // 5. Simuler le remplissage de l'OTP (vous devrez le faire manuellement pour le moment)
    // cy.get('input[formControlName="otp"]').type('LE_CODE_LU_DANS_TERMINAL');
    // cy.get('button[type="submit"]').click();
    
    // Après vérification réussie
    // cy.url().should('include', '/onboarding'); 
  });
  
  // ----------------------------------------------------------------------
  // TEST 2 : Connexion Réussie et Déconnexion
  // ----------------------------------------------------------------------
  it('Doit se connecter avec succès et se déconnecter', () => {
    // Précondition: L'utilisateur doit exister et être vérifié (fait manuellement ou par le test 1)
    
    // 1. Connexion
    cy.visit('/connexion');
    cy.get('input[formControlName="emailPhone"]').type(phone);
    cy.get('input[formControlName="password"]').type(password);
    cy.get('button[type="submit"]').click();

    // 2. Vérification de la redirection vers le dashboard
    cy.url().should('include', '/dashboard');

    // 3. Déconnexion
    cy.get('#logout-button').click(); // Assurez-vous que votre bouton de déconnexion a l'ID 'logout-button'

    // 4. Vérification de la déconnexion et de la redirection
    cy.url().should('include', '/connexion');
  });
  
  // ----------------------------------------------------------------------
  // TEST 3 : Accès Protégé
  // ----------------------------------------------------------------------
  it('Doit bloquer l\'accès au dashboard si non connecté', () => {
    // Assurez-vous d'être déconnecté
    localStorage.clear();
    
    // Tenter d'accéder au dashboard
    cy.visit('/dashboard');

    // Vérification de la redirection forcée vers la page de connexion
    cy.url().should('include', '/connexion');
  });
});