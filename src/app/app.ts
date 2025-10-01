import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// import { Inscription } from './inscription/inscription';
import { Header } from './header/header';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    Header
    // Inscription
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  // protected readonly title = signal('formulaire');
}
