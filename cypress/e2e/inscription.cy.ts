describe('Formulaire Inscription', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200/inscription'); 
  });

  it('devrait afficher le formulaire', () => {
    cy.get('form').should('exist');
    cy.get('input[formControlName="firstName"]').should('exist');
    cy.get('input[formControlName="lastName"]').should('exist');
    cy.get('input[formControlName="emailPhone"]').should('exist');
    cy.get('input[formControlName="password"]').should('exist');
    cy.get('input[formControlName="consent"]').should('exist');
  });

  it('devrait refuser la soumission si le formulaire est vide', () => {
    cy.get('form').submit();
    cy.get('.error-message').should('exist'); // adapte en fonction de ton template
  });

  it('devrait accepter un email valide et un mot de passe correct', () => {
    cy.get('input[formControlName="firstName"]').type('John');
    cy.get('input[formControlName="lastName"]').type('Doe');
    cy.get('input[formControlName="emailPhone"]').type('john.doe@example.com');
    cy.get('input[formControlName="password"]').type('longpassword');
    cy.get('input[formControlName="consent"]').check();

    cy.get('form').submit();

    // Vérifie le succès via un message Toastr ou une redirection
    cy.contains('Inscription réussie').should('exist'); 
  });

  it('devrait refuser un numéro de téléphone invalide', () => {
    cy.get('input[formControlName="emailPhone"]').type('12345');
    cy.get('form').submit();
    cy.contains('Email/téléphone invalide').should('exist');
  });
});
