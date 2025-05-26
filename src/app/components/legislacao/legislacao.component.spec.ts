import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegislacaoComponent } from './legislacao.component';

describe('LegislacaoComponent', () => {
  let component: LegislacaoComponent;
  let fixture: ComponentFixture<LegislacaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegislacaoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LegislacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
