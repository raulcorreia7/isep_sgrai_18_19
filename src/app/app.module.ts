import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations'
import {AppComponent} from './app.component';
import {ConfigService} from './config.service';
import {SceneComponent} from './scene.component';
import {MatMenuModule} from '@angular/material/menu';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {NgcFloatButtonModule} from 'ngc-float-button';
import { FloatingButtonComponent } from './floating-button/floating-button.component'
@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatMenuModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    NgcFloatButtonModule
  ],
  providers: [
    ConfigService,
  ],
  declarations: [
    AppComponent,
    SceneComponent,
    FloatingButtonComponent,
  ],
  bootstrap: [
    AppComponent,
  ],
})
export class AppModule {}
