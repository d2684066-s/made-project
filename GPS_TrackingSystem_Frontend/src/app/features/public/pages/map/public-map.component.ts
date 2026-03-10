import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-public-map',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
      <div class="text-center">
        <!-- public map placeholder removed, only login link remains -->
        <a href="/admin/login" class="inline-block px-6 py-3 bg-blue-600 rounded-lg text-white hover:bg-blue-700">
          Go to Admin Login
        </a>
      </div>
    </div>
  `
})
export class PublicMapComponent { }
