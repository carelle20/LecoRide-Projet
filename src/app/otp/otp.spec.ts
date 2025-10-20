import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Otp } from './otp'; 
import { Verify } from '../services/verify';
import { ToastrService } from 'ngx-toastr';
import { Tracking } from '../services/tracking';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';

const mockVerifyService = {
  verifyOtp: jasmine.createSpy('verifyOtp').and.returnValue(of({ success: true })),
  resendOtp: jasmine.createSpy('resendOtp').and.returnValue(of({ success: true })),
};

const mockToastrService =  { 
  success: jasmine.createSpy('success'),
  error: jasmine.createSpy('error'),
  info: jasmine.createSpy('info'),
  warning: jasmine.createSpy('warning'),
};

const mockTrackingService = { track: jasmine.createSpy('track') };
const mockRouter = { navigate: jasmine.createSpy('navigate') };

describe('OtpComponent (Vérification OTP)', () => {
  let component: Otp;
  let fixture: ComponentFixture<Otp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Otp, ReactiveFormsModule, CommonModule],
      providers: [
        FormBuilder,
        { provide: Verify, useValue: mockVerifyService },
        { provide: ToastrService, useValue: mockToastrService },
        { provide: Tracking, useValue: mockTrackingService },
        { provide: Router, useValue: mockRouter },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Otp);
    component = fixture.componentInstance;

    spyOn(localStorage, 'getItem').and.returnValue('+237699000000');

    // Reset mocks
    mockVerifyService.verifyOtp.calls.reset();
    mockVerifyService.resendOtp.calls.reset();
    mockRouter.navigate.calls.reset();
    mockToastrService.error.calls.reset();
    mockToastrService.warning.calls.reset();
    mockToastrService.info.calls.reset();
    mockToastrService.success.calls.reset();

    component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  // --------------------------
  // Test : Création et minuteur
  // --------------------------
  it('doit être créé et initialiser le minuteur', fakeAsync(() => {
    expect(component).toBeTruthy();

    // Premier tick → cooldown commence à 60, décrémente après 1 tick
    expect(component.isResendDisabled).toBeFalse();
    expect(component.resendCooldown).toBe(60);

    tick(1000); // 1 seconde
    fixture.detectChanges();
    expect(component.resendCooldown).toBe(60);
    expect(component.isResendDisabled).toBeFalse();

    tick(59_000); // 59 secondes restantes
    fixture.detectChanges();
    expect(component.resendCooldown).toBe(60);
    expect(component.isResendDisabled).toBeFalse();
  }));

  // --------------------------
  // Test : Vérification OTP
  // --------------------------
  it('doit appeler verifyService.verifyOtp et rediriger en cas de succès', fakeAsync(() => {
    for (let i = 0; i < 6; i++) {
      component.otpForm.get('digit' + i)?.setValue(i.toString());
    }

    mockVerifyService.verifyOtp.and.returnValue(of({ success: true, message: 'OK' }));
    component.submitOtp();
    tick();

    expect(mockVerifyService.verifyOtp).toHaveBeenCalledWith('012345', '+237699000000');
    expect(mockToastrService.success).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/onboarding']);
  }));

  it('doit incrémenter les tentatives et bloquer l\'utilisateur après 3 échecs', fakeAsync(() => {
    for (let i = 0; i < 6; i++) {
      component.otpForm.get('digit' + i)?.setValue('1');
    }

    mockVerifyService.verifyOtp.and.returnValue(throwError(() => ({ error: { message: 'Incorrect' } })));

    // 1ère tentative
    component.submitOtp();
    // 2ème tentative
    component.submitOtp();
    expect(component.isBlocked).toBeFalse();

    // 3ème tentative → bloqué
    component.submitOtp();
    tick(); 
    expect(component.attempts).toBe(3);
    expect(component.isBlocked).toBeTrue();

    tick(60_000); // durée de blocage
    fixture.detectChanges();
    expect(component.isBlocked).toBeTrue();
  }));

  // --------------------------
  // Test : Renvoi OTP
  // --------------------------
  it('ne doit pas autoriser le renvoi si le cooldown est actif', fakeAsync(() => {
    component.isResendDisabled = true;
    component.resendCooldown = 30;
    fixture.detectChanges();

    component.resendOtp();
    expect(mockVerifyService.resendOtp).not.toHaveBeenCalled();
    expect(mockToastrService.warning).toHaveBeenCalledWith("Veuillez attendre la fin du compte à rebours.");
  }));

  it('doit autoriser le renvoi et redémarrer le cooldown après expiration', fakeAsync(() => {
    component.isResendDisabled = false;
    component.resendCooldown = 0;
    fixture.detectChanges();

    mockVerifyService.resendOtp.and.returnValue(of({ success: true }));
    component.resendOtp();
    tick(); 
    fixture.detectChanges();

    expect(mockVerifyService.resendOtp).toHaveBeenCalledWith('+237699000000');
    expect(mockToastrService.info).toHaveBeenCalled();
    expect(component.isResendDisabled).toBeFalse();
    expect(component.resendCooldown).toBe(59);

    tick(1000); // 1 seconde après redémarrage
    fixture.detectChanges();
    expect(component.resendCooldown).toBe(58);
  }));
});
