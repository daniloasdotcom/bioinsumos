import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BioCategoriasChartComponent } from './bio-categorias-chart.component';

describe('BioCategoriasChartComponent', () => {
  let component: BioCategoriasChartComponent;
  let fixture: ComponentFixture<BioCategoriasChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BioCategoriasChartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BioCategoriasChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
