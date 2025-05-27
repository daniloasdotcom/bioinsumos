import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BioinsumosDisplayComponent } from './bioinsumos-display.component';

describe('BioinsumosDisplayComponent', () => {
  let component: BioinsumosDisplayComponent;
  let fixture: ComponentFixture<BioinsumosDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BioinsumosDisplayComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BioinsumosDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
