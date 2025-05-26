import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'; // Verifique estas importações
// Se você adicionou a classe .container dinamicamente ou algo assim, pode precisar do CommonModule
// import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root', // Geralmente app-root para o componente principal
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,         // ESSENCIAL para routerLink funcionar
    RouterLinkActive,   // ESSENCIAL para routerLinkActive funcionar
    // CommonModule    // Se necessário para outras diretivas
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  anioActual = new Date().getFullYear();
  // title = 'nome-do-seu-projeto'; // Pode ou não ter essa linha
}