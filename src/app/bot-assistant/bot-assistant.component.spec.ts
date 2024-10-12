import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BotAssistantComponent } from './bot-assistant.component';

describe('BotAssistantComponent', () => {
  let component: BotAssistantComponent;
  let fixture: ComponentFixture<BotAssistantComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BotAssistantComponent]
    });
    fixture = TestBed.createComponent(BotAssistantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
