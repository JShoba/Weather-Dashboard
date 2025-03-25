import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
interface MoonPhaseResponse {
  days: {
    moonphase: number;
    datetime?: string; // Add other properties you might use
  }[];
  // Add other top-level properties from your response
  queryCost?: number;
  latitude?: number;
  longitude?: number;
}
@Injectable({
  providedIn: 'root'
})

export class WeatherService {
  

  constructor(private http: HttpClient) {}

  // Fetch weather by city name
  getWeather(city: string): Observable<any> {
    return this.http.get(`${environment.baseUrl}/weather?q=${city}&units=metric&appid=${environment.apiKey}`);
  }
  // Current weather
  getWeatherByLatLong(latitude: number, longitude: number): Observable<any> {
    return this.http.get(
      `${environment.baseUrl}/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${environment.apiKey}`
    );
  }

  getCurrentWeather(lat: number, lon: number): Observable<any> {
    return this.http.get(`${environment.baseUrl}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${environment.apiKey}`);
  }

  getFiveDayForecast(lat: number, lon: number): Observable<any> {
    return this.http.get(`${environment.baseUrl}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${environment.apiKey}`);
  }

  // Simulate yesterday's data using current day's data (free plan limitation)
  getYesterdaySimulated(lat: number, lon: number): Observable<any> {
    // Note: This is a simulation - real historical data requires paid plan
    return this.http.get(`${environment.baseUrl}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${environment.apiKey}`);
  }


getMoonPhase(lat: number, lon: number) {
  const today = new Date().toISOString().split('T')[0];
  return this.http.get<MoonPhaseResponse>(
    `${environment.MOON_APIUrl}/${lat},${lon}/${today}?unitGroup=metric&include=days&key=${environment.MoonKey}&elements=moonphase`
  );
}
getPastWeekMoonPhases(lat: number, lon: number) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);
  
  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];

  return this.http.get<MoonPhaseResponse>(
    `${environment.MOON_APIUrl}/${lat},${lon}/${start}/${end}?unitGroup=metric&include=days&key=${environment.MoonKey}&elements=moonphase`
  );
}
loadCities(): Observable<any[]> {
  return this.http.get<any[]>('assets/cities.json'); 
}

}
