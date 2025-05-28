import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InoculantesComponent } from './inoculantes.component';

describe('InoculantesComponent', () => {
  let component: InoculantesComponent;
  let fixture: ComponentFixture<InoculantesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InoculantesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InoculantesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
