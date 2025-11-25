import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class StatsService {

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private pid: any
  ) {}

  async loadStats() {

    // ❗ Não tentar rodar no servidor
    if (!isPlatformBrowser(this.pid)) {
      return null;
    }

    const bio = await firstValueFrom(
      this.http.get<any[]>('assets/todos_bioinsumos.json')
    );

    const inoc = await firstValueFrom(
      this.http.get<any[]>('assets/todos_inoculantes.json')
    );

    const categoriasBio = bio.flatMap(
      item => item.classe_categoria_agronomica ?? []
    );

    const tiposInoc = inoc.map(
      item => item.tipo ?? null
    );

    const categorias = new Set(categoriasBio);

    const especies = new Set(
      inoc.flatMap(item => item.especie ?? [])
    );

    const categoriasUnificadas = new Set([
      ...categoriasBio,
      ...tiposInoc
    ]);

    return {
      totalBioinsumos: bio.length,
      totalInoculantes: inoc.length,
      totalCategorias: categorias.size,
      totalEspecies: especies.size,
      totalCategoriasUnificadas: categoriasUnificadas.size
    };
  }
}
