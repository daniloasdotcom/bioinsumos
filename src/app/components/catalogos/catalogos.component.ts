// src/app/components/catalogos/catalogos.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Para *ngIf, *ngFor, etc.
import { RouterLink } from '@angular/router'; // <--- IMPORTE O RouterLink AQUI

@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink // <--- ADICIONE RouterLink AOS IMPORTS AQUI
  ],
  templateUrl: './catalogos.component.html',
  styleUrls: ['./catalogos.component.scss'] // ou .css
})
export class CatalogosComponent {
  constructor() { }
}