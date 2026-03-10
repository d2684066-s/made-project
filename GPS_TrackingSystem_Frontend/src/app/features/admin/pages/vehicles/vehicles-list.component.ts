import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { LucideAngularModule, Plus, Search, Loader2, Ambulance, Bus, MoreHorizontal } from 'lucide-angular';

interface Vehicle {
    id: string;
    vehicle_number: string;
    vehicle_type: 'bus' | 'ambulance';
    assigned_driver_name?: string;
    is_out_of_station?: boolean;
    status?: 'active' | 'inactive' | 'maintenance';
}

@Component({
    selector: 'app-vehicles-list',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, TranslateModule],
    templateUrl: './vehicles-list.component.html',
    styleUrl: './vehicles-list.component.css'
})
export class VehiclesListComponent implements OnInit {
    vehicles = signal<Vehicle[]>([]);
    loading = signal(true);

    constructor(private api: ApiService) { }

    ngOnInit() {
        this.fetchVehicles();
    }

    fetchVehicles() {
        this.loading.set(true);
        this.api.getVehicles().subscribe(
            (response: any) => {
                const vehicleList = response.vehicles || [];
                this.vehicles.set(vehicleList);
                this.loading.set(false);
            },
            (error) => {
                console.error('Failed to fetch vehicles:', error);
                this.loading.set(false);
            }
        );
    }

    deleteVehicle(id: string) {
        if (!confirm('Are you sure you want to delete this vehicle?')) {
            return;
        }
        this.loading.set(true);
        this.api.deleteVehicle(id).subscribe(
            () => {
                this.fetchVehicles();
            },
            (err) => {
                console.error('Error deleting vehicle', err);
                this.loading.set(false);
            }
        );
    }
}
