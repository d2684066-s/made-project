import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { LucideAngularModule, Bus, Ambulance, CheckCircle2, Loader2 } from 'lucide-angular';
import { delay, of } from 'rxjs';

@Component({
    selector: 'app-add-vehicle',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule, LucideAngularModule, TranslateModule],
    templateUrl: './add-vehicle.component.html',
    styleUrl: './add-vehicle.component.css'
})
export class AddVehicleComponent {
    vehicleForm: FormGroup;
    loading = signal(false);
    errorMessage = signal<string | null>(null);

    constructor(
        private fb: FormBuilder,
        private api: ApiService,
        private router: Router
    ) {
        this.vehicleForm = this.fb.group({
            type: ['bus', Validators.required],
            vehicle_number: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}-[0-9]{2}-[A-Z]{1,2}-[0-9]{4}$/)]]
        });
    }

    onSubmit() {
        if (this.vehicleForm.invalid) {
            this.vehicleForm.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        const data: any = {
            vehicle_number: this.vehicleForm.value.vehicle_number,
            vehicle_type: this.vehicleForm.value.type
        };
        this.api.addVehicle(data).subscribe({
            next: () => {
                this.loading.set(false);
                this.router.navigate(['/admin/vehicles']);
            },
            error: (err) => {
                console.error('Failed to add vehicle', err);
                this.loading.set(false);
                // show message from backend if available
                if (err.error) {
                    if (typeof err.error === 'string') {
                        this.errorMessage.set(err.error);
                    } else if (err.error.detail) {
                        this.errorMessage.set(err.error.detail);
                    } else {
                        // display first field error
                        const firstKey = Object.keys(err.error)[0];
                        this.errorMessage.set(err.error[firstKey]);
                    }
                } else {
                    this.errorMessage.set('Failed to add vehicle');
                }
            }
        });
    }
}
