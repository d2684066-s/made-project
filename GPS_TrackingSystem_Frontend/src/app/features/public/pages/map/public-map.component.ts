import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-public-map',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="relative h-screen w-full overflow-hidden font-sans">
      <!-- Background Slider -->
      <div class="absolute inset-0 bg-gray-900">
        <div *ngFor="let img of images; let i = index"
             class="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
             [style.backgroundImage]="'url(' + img + ')'"
             [class.opacity-100]="i === currentImageIndex"
             [class.opacity-0]="i !== currentImageIndex">
        </div>
        <!-- Dark Overlay -->
        <div class="absolute inset-0 bg-black/50"></div>
      </div>

      <!-- Content Overflow layer -->
      <div class="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
        <h1 class="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight animate-fade-in-up">
          {{ 'FRONT_TITLE' | translate }}
        </h1>
        <p class="text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl animate-fade-in-up delay-100">
          {{ 'FRONT_SUBTITLE' | translate }}
        </p>

        <div class="flex flex-wrap gap-4 animate-fade-in-up delay-200">
          <a href="/admin/login"
             class="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 hover:scale-105 transition-all shadow-lg active:scale-95">
            {{ 'FRONT_ADMIN_LOGIN' | translate }}
          </a>
          <button class="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 font-semibold rounded-xl hover:bg-white/20 transition-all active:scale-95">
            {{ 'FRONT_LEARN_MORE' | translate }}
          </button>
        </div>
      </div>

      <!-- Slider Indicators -->
      <div class="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        <button *ngFor="let img of images; let i = index"
                (click)="setSlide(i)"
                class="h-3 rounded-full transition-all duration-300"
                [ngClass]="i === currentImageIndex ? 'bg-white w-8' : 'bg-white/30 w-3'">
        </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.8s ease-out forwards;
    }
    .delay-100 { animation-delay: 0.1s; }
    .delay-200 { animation-delay: 0.2s; }
  `]
})
export class PublicMapComponent implements OnInit, OnDestroy {
  images = [
    '/assets/images/Image1.jpg',
    '/assets/images/Image2.jpeg',
    '/assets/images/Image3.jpeg',
    '/assets/images/Image4.jpeg',
    '/assets/images/Image5.jpeg'
  ];

  currentImageIndex = 0;
  private intervalId: any;

  ngOnInit() {
    this.startSlider();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  startSlider() {
    this.intervalId = setInterval(() => {
      this.nextSlide();
    }, 3500);
  }

  nextSlide() {
    this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
  }

  setSlide(index: number) {
    this.currentImageIndex = index;
    // Reset timer when manually changing slide
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.startSlider();
    }
  }
}
