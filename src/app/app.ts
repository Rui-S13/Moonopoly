import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationBox } from './components/notification-box/notification-box';
import { NavigationHistory } from './services/navigation-history';

@Component({
  imports: [RouterOutlet, NotificationBox],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('Moonopoly');

  constructor(private history: NavigationHistory) {}
}
