import { Component, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notification';
import { Profile, ProfileService } from '../../services/profile';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  isHomePage = false;

  constructor(
    private router: Router,
    public auth: AuthService,
    private notifications: NotificationService,
    public profiles: ProfileService
  ) {
    this.isHomePage = this.router.url === '/';

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.isHomePage = event.urlAfterRedirects === '/';
      });
  }

  logout(): void {
    this.auth.logout().subscribe(() => {
      this.router.navigate(['/']);
      this.notifications.info('You have been logged out.');
    });
  }
}
