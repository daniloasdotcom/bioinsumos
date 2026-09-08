import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatInsumoComponent } from './chat-insumo.component';

describe('ChatInsumoComponent', () => {
  let component: ChatInsumoComponent;
  let fixture: ComponentFixture<ChatInsumoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatInsumoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChatInsumoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
