import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Authentification } from '../services/authentification';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    CommonModule
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'] 
})
export class Header {

  constructor(private authService: Authentification) {}
  get isLoggedIn(): boolean {
    return this.authService.getIsLoggedIn();
  }

  onLogout(): void {
    this.authService.logout();
  }
}
