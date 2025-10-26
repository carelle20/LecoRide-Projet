import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Authentification } from '../services/authentification';
import { Token } from '../services/token';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {
  
  userName: string = 'Utilisateur Connecté'; 

  constructor(
    private authService: Authentification,
    private tokenService: Token,
    private router: Router
  ) {}

  ngOnInit(): void {

    console.log('Dashboard chargé. L\'AuthGuard a réussi.');
  }


  //Gère la déconnexion de l'utilisateur.
  onLogout(): void {
    this.authService.logout();
  }
}