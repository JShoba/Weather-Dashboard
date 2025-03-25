import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { WeatherService } from './WeatherService';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';  // ✅ Import FormsModule
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,  // ✅ Add this line
    AppComponent, 
    CommonModule
  ],
  bootstrap: [],  // ✅ Ensure AppComponent is bootstrapped
  providers: [WeatherService],
})
export class AppModule { }
