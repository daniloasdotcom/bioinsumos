import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
// Modifique esta linha de importação
import { provideHttpClient, withInterceptorsFromDi, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    // Adicione withFetch() aqui
    provideHttpClient(
      withInterceptorsFromDi(), // Você já tinha isso para interceptadores baseados em DI
      withFetch()             // Adicione esta função
    )
  ]
};