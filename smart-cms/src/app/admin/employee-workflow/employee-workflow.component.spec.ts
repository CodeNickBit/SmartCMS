import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeWorkflowComponent } from './employee-workflow.component';

describe('EmployeeWorkflowComponent', () => {
  let component: EmployeeWorkflowComponent;
  let fixture: ComponentFixture<EmployeeWorkflowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeWorkflowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeWorkflowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
