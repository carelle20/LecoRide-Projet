describe('OTP Verification Component E2E', () => {
  const phone = '+237699000000';
  const validOtp = '123456';
  const invalidOtp = '999999';

  // Sélecteurs de base 
  const selectors = {
    otpInputs: 'input[data-cy^="otp-digit"]', 
    errorMessage: '[data-cy="error-message"]',
    submitButton: '[data-cy="submit-otp"]',
    resendButton: '[data-cy="resend-otp"]',
    cooldownTimer: '[data-cy="resend-cooldown"]',
  };

  beforeEach(() => {
    // 1. Initialisation de l'état
    cy.window().then((win) => {
      win.localStorage.setItem('phone', phone);
    });

    // 2. Mock des services API
    cy.intercept('POST', '/api/auth/verify-otp', (req) => {
      const otp = req.body.otp;
      if (otp === validOtp) {
        req.reply({ statusCode: 200, body: { success: true } });
      } else {
        req.reply({ statusCode: 400, body: { success: false, message: 'Code OTP incorrect.' } });
      }
    }).as('verifyOtp');

    cy.intercept('POST', '/api/auth/resend-otp', {
      statusCode: 200,
      body: { success: true, message: 'Nouveau code envoyé.' },
    }).as('resendOtp');

    // 3. Visite de la page 
    cy.visit('/otp'); 
  });

  // Fonctions utilitaires

  const enterOtp = (otp) => {
    // Remplir les 6 champs séparément
    otp.split('').forEach((digit, index) => {
      cy.get(selectors.otpInputs).eq(index).type(digit);
    });
  };
  
  // TESTS

  it('1. Doit rediriger vers /inscription si le téléphone est manquant', () => {
    cy.window().then((win) => {
      win.localStorage.removeItem('phone');
    });
    cy.visit('/otp');
    // Vérifie que le Router a navigué
    cy.url().should('include', '/inscription');
  });

  it('2. Doit afficher le timer et désactiver le bouton de renvoi au chargement', () => {
    // Vérifie que le timer est visible et non expiré
    cy.get(selectors.cooldownTimer).should('be.visible'); 
    cy.get(selectors.resendButton).should('be.disabled');
  });

  it('3. Doit vérifier l\'OTP avec succès et rediriger vers /onboarding', () => {
    enterOtp(validOtp);
    cy.get(selectors.submitButton).click();

    // Vérifie l'appel API
    cy.wait('@verifyOtp').its('request.body').should('deep.include', { otp: validOtp, phone: phone });

    // Vérifie la redirection
    cy.url().should('include', '/onboarding');
  });

  it('4. Doit afficher un message d\'erreur après un échec de vérification', () => {
    enterOtp(invalidOtp);
    cy.get(selectors.submitButton).click();

    cy.wait('@verifyOtp');

    // Vérifie l'incrémentation des tentatives et le message d'erreur
    cy.get(selectors.errorMessage).should('contain', 'Code OTP incorrect.');
  });
  
  it('5. Doit bloquer l\'utilisateur après 3 tentatives échouées et démarrer le timer de blocage', () => {
    cy.clock(); // Contrôle le temps Angular

    // Tentative 1
    enterOtp(invalidOtp);
    cy.get(selectors.submitButton).click();
    cy.wait('@verifyOtp');

    // Tentative 2
    enterOtp(invalidOtp);
    cy.get(selectors.submitButton).click();
    cy.wait('@verifyOtp');

    // Tentative 3 -> Doit bloquer
    enterOtp(invalidOtp);
    cy.get(selectors.submitButton).click();
    cy.wait('@verifyOtp');

    // Vérifie l'état de blocage (simule le `isBlocked = true`)
    cy.get(selectors.submitButton).should('be.disabled');
    cy.get(selectors.resendButton).should('be.disabled');

    // Avance le temps de blocage (60s)
    cy.tick(60000); 

    // Après l'expiration du blocage, le bouton de renvoi doit être à nouveau dans un cooldown standard
    cy.get(selectors.resendButton).should('be.disabled'); 
    cy.get(selectors.submitButton).should('be.enabled'); 
  });

  it('6. Doit renvoyer le code OTP après l\'expiration du cooldown initial', () => {
    cy.clock();

    // 1. Démarrer le cooldown initial 
    cy.get(selectors.resendButton).should('be.disabled');

    // 2. Avancer le temps
    cy.tick(59000); 
    cy.get(selectors.resendButton).should('be.disabled');

    // 3. Avancer jusqu'à expiration
    cy.tick(1000);
    cy.get(selectors.resendButton).should('be.enabled'); // Le bouton est activé

    // 4. Clic de renvoi
    cy.get(selectors.resendButton).click();

    // Vérifie l'appel API et la réponse
    cy.wait('@resendOtp');
    
    // Le cooldown redémarre
    cy.get(selectors.resendButton).should('be.disabled'); 
    cy.get(selectors.cooldownTimer).should('contain', '59'); 
  });
});