import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BioCatIngredChartComponent } from './bio-cat-ingred-chart.component';

describe('BioCatIngredChartComponent', () => {
  let component: BioCatIngredChartComponent;
  let fixture: ComponentFixture<BioCatIngredChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BioCatIngredChartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BioCatIngredChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
