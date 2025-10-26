import { TestBed } from '@angular/core/testing';
import { Tracking } from './tracking';

describe('Tracking Service', () => {
  let service: Tracking;
  let consoleSpy: jasmine.Spy; 

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Tracking]
    });
    service = TestBed.inject(Tracking);
    // Initialiser l'espion sur console.log avant chaque test
    // On utilise spyOn() pour s'assurer qu'aucune sortie réelle n'est générée
    consoleSpy = spyOn(console, 'log');
  });

  afterEach(() => {
    // Restaurer la fonction console.log originale après chaque test
    consoleSpy.calls.reset();
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  // 1. Couverture de track(eventName, properties)
  it('doit appeler console.log avec le nom de l\'événement et les propriétés fournies', () => {
    const eventName = 'UserLoggedIn';
    const properties = { userId: 123, method: 'email' };
    service.track(eventName, properties);

    // Vérification que console.log a été appelé
    expect(consoleSpy).toHaveBeenCalled();
    
    // Vérification des arguments passés à console.log
    expect(consoleSpy).toHaveBeenCalledWith(`[TRACKING] Event: ${eventName}`, properties);
  });

  // 2. Couverture de track(eventName) sans propriétés
  it('doit gérer l\'appel sans le paramètre "properties" (valeur par défaut)', () => {
    const eventName = 'PageLoaded';
    
    // Appel du service sans le deuxième paramètre 
    service.track(eventName);

    // Vérification des arguments passés à console.log
    expect(consoleSpy).toHaveBeenCalledWith(`[TRACKING] Event: ${eventName}`, {});
  });
});