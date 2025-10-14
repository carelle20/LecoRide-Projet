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
  
  // Supposons que nous ayons une information utilisateur simple
  userName: string = 'Utilisateur Connecté'; 

  constructor(
    private authService: Authentification,
    private tokenService: Token,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 💡 Exemple : On pourrait charger les données utilisateur ici
    // const userData = this.tokenService.getUserDataFromToken();
    // if (userData) {
    //   this.userName = userData.firstName;
    // }

    console.log('Dashboard chargé. L\'AuthGuard a réussi.');
  }

  /**
   * Gère la déconnexion de l'utilisateur.
   * La méthode logout dans Authentification gère déjà la purge des tokens et la redirection.
   */
  onLogout(): void {
    this.authService.logout();
    // L'utilisateur sera redirigé vers /login par le service
  }
}