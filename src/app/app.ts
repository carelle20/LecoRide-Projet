import { Component, signal } from '@angular/core';
// import { RouterOutlet } from '@angular/router';
import { Inscription } from './inscription/inscription';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // RouterOutlet,
    Inscription
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('formulaire');
}
