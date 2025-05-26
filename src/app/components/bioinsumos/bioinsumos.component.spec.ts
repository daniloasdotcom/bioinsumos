import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BioinsumosComponent } from './bioinsumos.component';

describe('BioinsumosComponent', () => {
  let component: BioinsumosComponent;
  let fixture: ComponentFixture<BioinsumosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BioinsumosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BioinsumosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
