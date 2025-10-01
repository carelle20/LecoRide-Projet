import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './accueil.html',
  styleUrls: ['./accueil.scss']
})
export class Accueil {
  // constructor(private router: Router) {}

  // onContinue() {
  //   this.router.navigateByUrl('inscription');
  // }


}
