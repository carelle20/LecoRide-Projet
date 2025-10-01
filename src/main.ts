import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';

import { App } from './app/app';
import { routes } from './app/app.routes';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ToastrModule } from 'ngx-toastr';
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),

    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'fr',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      }),
      ToastrModule.forRoot({
        positionClass: 'toast-top-right',
        preventDuplicates: true
      })
    )
  ]
}).catch(err => console.error(err));
