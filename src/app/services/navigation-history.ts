import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NavigationHistory {
  private current: string | null = null;
  previousUrl: string | null = null;
  lastContentUrl: string | null = null;

  constructor(private router: Router) {
    if (router.navigated) {
      this.current = router.url;
      this.lastContentUrl = this.isAuthPage(router.url) ? null : router.url;
    }

    router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      const url = event.urlAfterRedirects;
      this.previousUrl = this.current;
      this.current = url;
      if (!this.isAuthPage(url)) {
        this.lastContentUrl = url;
      }
    });
  }

  goBack(fallback: string): void {
    const prev = this.previousUrl;
    const usable =
      prev !== null &&
      prev !== this.current &&
      !this.isAuthPage(prev) &&
      !prev.startsWith('/publish') &&
      !/\/edit(\?|$)/.test(prev);

    this.router.navigateByUrl(usable ? prev : fallback);
  }

  goBackFromAuth(): void {
    this.router.navigateByUrl(this.lastContentUrl ?? '/');
  }

  private isAuthPage(url: string): boolean {
    return /^\/(login|signup)(\?|\/|$)/.test(url);
  }
}
