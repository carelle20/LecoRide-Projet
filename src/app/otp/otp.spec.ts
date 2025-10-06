import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Otp } from './otp'; 
import { Verify } from '../services/verify';
import { ToastrService } from 'ngx-toastr';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';


const mockVerifyService = {
  verifyOtp: jasmine.createSpy('verifyOtp'),
  resendOtp: jasmine.createSpy('resendOtp'),
};

const mockToastrService = {
  success: jasmine.createSpy('success'),
  error: jasmine.createSpy('error'),
  info: jasmine.createSpy('info'),
  warning: jasmine.createSpy('warning'),
};

const mockRouter = {
  navigate: jasmine.createSpy('navigate'),
};

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
        { provide: Router, useValue: mockRouter },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Otp);
    component = fixture.componentInstance;
    

    spyOn(localStorage, 'getItem').and.returnValue('+237699000000');
    

    mockVerifyService.verifyOtp.calls.reset();
    mockVerifyService.resendOtp.calls.reset();
    mockRouter.navigate.calls.reset();
    
    component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
    
  });

  // --- Tests de Base ---

  it('doit être créé et initialiser le minuteur', fakeAsync(() => {
    expect(component).toBeTruthy();
    expect(component.isResendDisabled).toBe(true);
    expect(component.resendCooldown).toBe(60); 
    tick(1000); 
    expect(component.resendCooldown).toBe(59); 
  }));

  // --- Tests du Flux de Vérification 

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

    component.submitOtp(); 
    component.submitOtp(); 
    expect(component.isBlocked).toBe(false);

    component.submitOtp(); 
    tick(); 

    expect(component.attempts).toBe(0); 
    expect(component.isBlocked).toBe(true);
    expect(mockToastrService.error).toHaveBeenCalled();
    
    expect(component.blockRemainingTime).toBe(60);
    
    tick(60000); 
    
    expect(component.isBlocked).toBe(false);
  }));

  // --- Tests du Flux de Renvoi 

  it('ne doit pas autoriser le renvoi si le cooldown est actif', fakeAsync(() => {
    component.resendOtp();

    expect(mockVerifyService.resendOtp).not.toHaveBeenCalled();
    expect(mockToastrService.warning).toHaveBeenCalled();
  }));
  
  it('doit autoriser le renvoi et redémarrer le cooldown après son expiration', fakeAsync(() => {
    tick(60000); 
    expect(component.isResendDisabled).toBe(false);

    mockVerifyService.resendOtp.and.returnValue(of({ success: true }));

    component.resendOtp();
    tick(); 

    expect(mockVerifyService.resendOtp).toHaveBeenCalledWith('+237699000000');
    expect(mockToastrService.info).toHaveBeenCalled();

    expect(component.isResendDisabled).toBe(true);
    expect(component.resendCooldown).toBe(60);
    tick(1000);
    expect(component.resendCooldown).toBe(59);
  }));
});