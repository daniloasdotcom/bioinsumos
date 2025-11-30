import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuscaGuiadaComponent } from './busca-guiada.component';

describe('BuscaGuiadaComponent', () => {
  let component: BuscaGuiadaComponent;
  let fixture: ComponentFixture<BuscaGuiadaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuscaGuiadaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BuscaGuiadaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
