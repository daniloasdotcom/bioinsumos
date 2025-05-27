// src/app/app.component.ts
import { Component, HostListener, OnInit, Inject, PLATFORM_ID } from '@angular/core'; // Adicione Inject, PLATFORM_ID
import { isPlatformBrowser, CommonModule } from '@angular/common'; // Adicione isPlatformBrowser
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  anioActual = new Date().getFullYear();
  menuAberto = false;
  isMobile = false;

  // Injete o PLATFORM_ID para saber em qual plataforma o código está rodando
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    // Verifica se está no navegador antes de chamar checkScreenWidth
    if (isPlatformBrowser(this.platformId)) {
      this.checkScreenWidth();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?: Event) {
    // Verifica se está no navegador antes de chamar checkScreenWidth
    if (isPlatformBrowser(this.platformId)) {
      this.checkScreenWidth();
    }
  }

  private checkScreenWidth() {
    // Este método agora só será chamado se isPlatformBrowser for true
    const screenWidth = window.innerWidth;
    this.isMobile = screenWidth <= 768;

    if (!this.isMobile && this.menuAberto) {
      this.menuAberto = false;
    }
  }

  toggleMenu() {
    if (isPlatformBrowser(this.platformId)) { // Idealmente, a lógica de isMobile já trataria isso
        if (this.isMobile) {
            this.menuAberto = !this.menuAberto;
        } else {
            this.menuAberto = false;
        }
    } else {
        // Comportamento padrão ou nenhum se não estiver no navegador (ex: menu sempre fechado)
        this.menuAberto = false;
    }
  }

  fecharMenuSeMobile() {
    if (isPlatformBrowser(this.platformId) && this.isMobile && this.menuAberto) {
      this.menuAberto = false;
    }
  }
}