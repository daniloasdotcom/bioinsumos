import { Component, OnInit, Inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { StatsService } from '../../services/stats.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {

  stats: any = null;

  constructor(
    private statsService: StatsService,
    @Inject(PLATFORM_ID) private pid: any
  ) {}

  async ngOnInit() {
    if (isPlatformBrowser(this.pid)) {
      this.stats = await this.statsService.loadStats();
    }
  }
}
