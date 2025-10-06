/// <reference types="cypress" />

describe('Flux Complet d\'Inscription (E2E)', () => {

    const baseEmail = `e2e-mail-${Date.now()}`;
    const uniquePassword = 'Password123!';
    
    // Numéro unique simulé pour éviter les conflits
    const basePhone = '0699' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

    // Mettre les éléments récurrents dans des commandes Cypress ou des variables
    const fillBaseForm = (emailPhone: string) => {
        cy.get('input[formControlName="firstName"]').type('E2E');
        cy.get('input[formControlName="lastName"]').type('TestUser');
        cy.get('input[formControlName="emailPhone"]').type(emailPhone);
        cy.get('input[formControlName="password"]').type(uniquePassword);
        cy.get('input[formControlName="consent"]').check();
    };

    beforeEach(() => {
        cy.visit('/inscription'); 
    });


    it('doit refuser la soumission si le consentement est manquant', () => {
        fillBaseForm(`${baseEmail}@test.com`);
        cy.get('input[formControlName="consent"]').uncheck();
        cy.get('form').submit();
        cy.get('button[type="submit"]').should('be.disabled'); 
    });
    


    it('doit s\'inscrire par email, valider le lien, et atteindre Onboarding', () => {
        const testEmail = `${baseEmail}-mail@test.com`;

        // 1. Inscription
        fillBaseForm(testEmail);
        cy.get('form').submit();

        // 2. Redirection vers la page de confirmation mail
        cy.url().should('include', '/email-confirmation');
        cy.contains('Vérifiez votre boîte mail !').should('exist');
        
        // 3. Simuler la vérification du lien 
        
        const mockToken = 'mock-email-token-success'; 
        
        // Simuler la navigation vers le lien de vérification
        cy.visit(`/verify-email?token=${mockToken}&email=${testEmail}`);
        
        // 4. Vérification et Redirection vers Onboarding
        cy.contains('Vérification en cours').should('exist');
        
        cy.intercept('GET', `http://localhost:3000/auth/verify/email?token=${mockToken}&email=${testEmail}`, {
            statusCode: 200,
            body: { success: true, message: 'Email vérifié avec succès' }
        }).as('verifyEmailSuccess');

        cy.wait('@verifyEmailSuccess'); 

        cy.wait(3500); 
        
        cy.url().should('include', '/onboarding');
        cy.contains('Finalisez votre profil.').should('exist'); 
    });


    it('doit s\'inscrire par téléphone, entrer l\'OTP, et atteindre Onboarding', () => {
        const testPhone = basePhone;
        const knownOtp = '123456'; 

        // 1. Inscription par téléphone
        fillBaseForm(testPhone);
        cy.get('form').submit();

        // 2. Redirection vers la page OTP
        cy.url().should('include', '/otp');
        cy.contains('Confirmez votre numéro de téléphone').should('exist');
        
        // 3. Simuler l'entrée du code OTP 
        cy.wrap(knownOtp.split('')).each((digit: string, index: number) => {
            cy.get(`input[formControlName="digit${index}"]`).type(digit);
        });

        // 4. Soumettre l'OTP
        cy.get('button').contains('Vérifier le code').click();

        // 5. Vérification et Redirection vers Onboarding
        cy.intercept('POST', 'http://localhost:3000/auth/verify/otp', {
            statusCode: 200,
            body: { success: true, message: 'OTP valide. Bienvenue !' }
        }).as('verifyOtpSuccess');

        cy.wait('@verifyOtpSuccess');
        
        cy.url().should('include', '/onboarding');
        cy.contains('Finalisez votre profil.').should('exist');
    });
});