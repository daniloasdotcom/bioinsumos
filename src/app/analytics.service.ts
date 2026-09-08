import { Injectable } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { filter } from 'rxjs/operators';

declare const gtag: any;

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor(private router: Router) {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event) => {
        gtag('config', 'G-CMVCPF81B5', {
          page_path: event.urlAfterRedirects,
        });
      });
  }
}
