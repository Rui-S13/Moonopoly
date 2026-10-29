import { Component, signal, HostListener } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notification';
import { ProfileService } from '../../services/profile';
import { Logo } from '../logo/logo';
import { NavigationHistory } from '../../services/navigation-history';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, Logo],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  isHomePage = false;
  isScrolled = false;

  constructor(
    private router: Router,
    public auth: AuthService,
    private notifications: NotificationService,
    public profiles: ProfileService,
    private navHistory: NavigationHistory,
  ) {
    this.isHomePage = this.router.url === '/';
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.isHomePage = event.urlAfterRedirects === '/';
      });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 20;
  }

  openListings(event: MouseEvent): void {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;

    const last = this.navHistory.lastListingsUrl();
    if (!last) return;

    event.preventDefault();
    this.router.navigateByUrl(last);
  }

  logout(): void {
    this.auth.logout().subscribe(() => {
      this.router.navigate(['/']);
      this.notifications.info('You have been logged out.');
    });
  }
}
