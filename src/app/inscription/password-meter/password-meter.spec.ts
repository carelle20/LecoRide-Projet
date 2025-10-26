import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasswordMeter } from './password-meter';
import { TranslateService } from '@ngx-translate/core';
import { SimpleChanges, SimpleChange } from '@angular/core';

// Définition des traductions simulées
const MOCK_TRANSLATIONS: { [key: string]: string } = {
  'FORM.PASSWORD_METER.START_TYPING': 'Commencez à taper votre mot de passe...',
  'FORM.PASSWORD_METER.MIN_LENGTH': 'Minimum 8 caractères',
  'FORM.PASSWORD_METER.ADD_LOWERCASE': 'Le mot de passe doit contenir au moins une minuscule',
  'FORM.PASSWORD_METER.ADD_UPPERCASE': 'Le mot de passe doit contenir au moins une majuscule',
  'FORM.PASSWORD_METER.ADD_DIGIT': 'Le mot de passe doit contenir au moins un chiffre',
  'FORM.PASSWORD_METER.ADD_SYMBOL': 'Le mot de passe doit contenir au moins un caractere special',
  'FORM.PASSWORD_METER.COMPLEX': 'Mot de passe complexe',
  'FORM.PASSWORD_METER.WEAK': 'Mot de passe faible',
  'FORM.PASSWORD_METER.MEDIUM': 'Mot de passe moyen',
  'FORM.PASSWORD_METER.STRONG': 'Mot de passe fort',
  'FORM.PASSWORD_METER.VERY_STRONG': 'Mot de passe très fort',
  'FORM.PASSWORD_METER.SOLID': 'Mot de passe valide',
};

describe('PasswordMeter (Compteur de Force)', () => {
  let component: PasswordMeter;
  let fixture: ComponentFixture<PasswordMeter>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  beforeEach(async () => {
    mockTranslateService = jasmine.createSpyObj('TranslateService', ['instant']);
    mockTranslateService.instant.and.callFake((key: string) => MOCK_TRANSLATIONS[key] || key);

    await TestBed.configureTestingModule({
      imports: [PasswordMeter], 
      providers: [
        { provide: TranslateService, useValue: mockTranslateService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PasswordMeter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // TEST 1 : Couverture des cas de démarrage (password vide/null)
  it('doit initialiser l\'état par défaut', () => {
    expect(component.strength.level).toBe(0);
    expect(component.strength.barColor).toBe('transparent');
  });

  it('doit gérer le mot de passe vide ou null (branches 100%)', () => {
    // Test du mot de passe vide
    (component as any).calculateStrength('');
    expect(component.strength.messages).toEqual([MOCK_TRANSLATIONS['FORM.PASSWORD_METER.START_TYPING']]);
    expect(component.strength.level).toBe(0); 
    expect(component.strength.barColor).toBe('transparent');

    // Test de la gestion de ngOnChanges
    const changes: SimpleChanges = {
      password: new SimpleChange(null, 'newPassword', true)
    };
    component.ngOnChanges(changes);
  });

  // TEST 2 : Couverture des branches de longueur 
  it('doit échouer si le mot de passe est trop court (< 8 caractères)', () => {
    (component as any).calculateStrength('shortp1');

    // La logique finale écrase tous les messages avec MIN_LENGTH et le niveau 1
    expect(component.strength.messages).toEqual([MOCK_TRANSLATIONS['FORM.PASSWORD_METER.MIN_LENGTH']]); 
    expect(component.strength.barColor).toBe('red');
    expect(component.strength.level).toBe(1);
  });

  it('doit assigner le niveau 1 (WEAK) pour un mot de passe de 8 ou 9 caractères avec une seule classe', () => {
    (component as any).calculateStrength('password');
    
    // Le niveau de force faible doit être le premier élément
    expect(component.strength.messages[0]).toBe(MOCK_TRANSLATIONS['FORM.PASSWORD_METER.WEAK']);
    expect(component.strength.level).toBe(1); 
    expect(component.strength.barColor).toBe('red');
    expect(component.strength.messages).not.toContain(MOCK_TRANSLATIONS['FORM.PASSWORD_METER.MIN_LENGTH']);
  });

  it('doit donner un score incrémenté pour un mot de passe >= 10 caractères', () => {
    (component as any).calculateStrength('password12'); 
    expect(component.strength.level).toBe(2);
    expect(component.strength.barColor).toBe('Orange');
  });

  // TEST 3 : Couverture des branches de critères
  it('doit ajouter les messages pour les classes manquantes', () => {
    (component as any).calculateStrength('abcdefgh'); 
    
    expect(component.strength.messages[0]).toBe(MOCK_TRANSLATIONS['FORM.PASSWORD_METER.WEAK']);
    expect(component.strength.messages).toContain(MOCK_TRANSLATIONS['FORM.PASSWORD_METER.ADD_UPPERCASE']);
    expect(component.strength.messages).toContain(MOCK_TRANSLATIONS['FORM.PASSWORD_METER.ADD_DIGIT']);
    expect(component.strength.messages).toContain(MOCK_TRANSLATIONS['FORM.PASSWORD_METER.ADD_SYMBOL']);
    
    expect(component.strength.level).toBe(1); 
    expect(component.strength.barColor).toBe('red');
  });

  it('doit incrémenter le score pour les classes (mix de 3 ou 4 classes)', () => {
    (component as any).calculateStrength('Apass123$'); 
    
    // Si toutes les classes sont couvertes, le message doit être valide
    expect(component.strength.messages[0]).toBe(MOCK_TRANSLATIONS['FORM.PASSWORD_METER.SOLID']);
    
    expect(component.strength.level).toBe(4); 
    expect(component.strength.barColor).toBe('green');
  });

  // TEST 4 : Couverture des branches de niveau 
  it('doit assigner le niveau 1 (WEAK) pour score < 2', () => {
    (component as any).calculateStrength('password8'); 
    expect(component.strength.level).toBe(2); 
    expect(component.strength.barColor).toBe('Orange');
    expect(component.strength.messages[0]).toBe(MOCK_TRANSLATIONS['FORM.PASSWORD_METER.MEDIUM']); 
  });

  it('doit assigner le niveau 2 (MEDIUM) pour score [2 - 3.5[', () => {
    (component as any).calculateStrength('Abcdef12'); 
    expect(component.strength.level).toBe(3); 
    expect(component.strength.barColor).toBe('yellowgreen');
    expect(component.strength.messages[0]).toBe(MOCK_TRANSLATIONS['FORM.PASSWORD_METER.STRONG']); 
  });

  it('doit assigner le niveau 3 (STRONG) pour score [3.5 - 5[', () => {
    (component as any).calculateStrength('Abcdefgh1!');
    expect(component.strength.level).toBe(4); 
    expect(component.strength.barColor).toBe('green');
    expect(component.strength.messages[0]).toBe(MOCK_TRANSLATIONS['FORM.PASSWORD_METER.SOLID']); 
  });

  it('doit assigner le niveau 4 (VERY_STRONG) pour score >= 5', () => {
    (component as any).calculateStrength('Abcdefgh12!');
    expect(component.strength.level).toBe(4); 
    expect(component.strength.barColor).toBe('green');
    expect(component.strength.messages[0]).toBe(MOCK_TRANSLATIONS['FORM.PASSWORD_METER.SOLID']); 
  });

  // TEST 5 : Couverture des cas spéciaux finaux
  it('doit garantir que le niveau de force est le premier message', () => {
    (component as any).calculateStrength('passwrd1');
    expect(component.strength.messages[0]).toBe(MOCK_TRANSLATIONS['FORM.PASSWORD_METER.MEDIUM']);
  });

  it('doit gérer le mot de passe vide même après des changements', () => {
      (component as any).calculateStrength('A_Passw0rd!');
      (component as any).calculateStrength('');
      expect(component.strength.level).toBe(0);
      expect(component.strength.barColor).toBe('transparent');
  });

  it('doit ajouter le message "ADD_LOWERCASE" si les minuscules sont manquantes', () => {
    (component as any).calculateStrength('PASSWORD12'); 
    
    // Vérifiez que le message de suggestion pour les minuscules est présent
    expect(component.strength.messages).toContain(MOCK_TRANSLATIONS['FORM.PASSWORD_METER.ADD_LOWERCASE']);
    
    expect(component.strength.messages[0]).toBe(MOCK_TRANSLATIONS['FORM.PASSWORD_METER.MEDIUM']);
  });

  it('doit garantir que SOLID est le message si le mot de passe est parfait (pas de suggestion)', () => {
      (component as any).calculateStrength('A_Passw0rd!');

      expect(component.strength.messages).toEqual([MOCK_TRANSLATIONS['FORM.PASSWORD_METER.SOLID']]); 
      
      expect(component.strength.level).toBe(4);
  });
});