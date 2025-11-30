import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BioInsumoTreemapChartComponent } from './bio-insumo-treemap-chart.component';

describe('BioInsumoTreemapChartComponent', () => {
  let component: BioInsumoTreemapChartComponent;
  let fixture: ComponentFixture<BioInsumoTreemapChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BioInsumoTreemapChartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BioInsumoTreemapChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
