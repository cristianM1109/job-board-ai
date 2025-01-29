import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalJobsComponent } from './external-jobs.component';

describe('ExternalJobsComponent', () => {
  let component: ExternalJobsComponent;
  let fixture: ComponentFixture<ExternalJobsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExternalJobsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExternalJobsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
