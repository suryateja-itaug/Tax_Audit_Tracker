import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxDashboardComponent } from './tax-dashboard.component';

describe('TaxDashboardComponent', () => {
  let component: TaxDashboardComponent;
  let fixture: ComponentFixture<TaxDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaxDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
