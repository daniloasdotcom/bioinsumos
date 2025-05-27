import '@angular/compiler'; // Adicione esta linha ANTES de qualquer outro import do Angular ou da sua aplicação

// O resto do seu main.ts continua abaixo, por exemplo:
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));