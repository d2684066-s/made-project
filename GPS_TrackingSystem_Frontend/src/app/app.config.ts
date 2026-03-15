import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { LucideAngularModule, LayoutDashboard, Bus, Plus, Users, UserCog, AlertTriangle, GraduationCap, Route, Ambulance, LogOut, Menu, X, Shield, CreditCard, RefreshCw, Search, Loader2, CheckCircle2, MoreHorizontal, Trash2 } from 'lucide-angular';

import { routes } from './app.routes';
import { tokenInterceptor } from './core/interceptors/token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([tokenInterceptor])),

    // ✅ Translation service + loader
    provideTranslateService({
      lang: 'en',
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({
        prefix: '/assets/i18n/',
        suffix: '.json'
      })
    }),

    // icons
    importProvidersFrom(
      LucideAngularModule.pick({
        LayoutDashboard,
        Bus,
        Plus,
        Users,
        UserCog,
        AlertTriangle,
        GraduationCap,
        Route,
        Ambulance,
        LogOut,
        Menu,
        X,
        Shield,
        CreditCard,
        RefreshCw,
        Search,
        Loader2,
        CheckCircle2,
        MoreHorizontal,
        Trash2
      })
    )
  ]
};
