import { Component, OnInit } from '@angular/core';
import { WeatherService } from '../WeatherService';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { ChartModule } from 'primeng/chart';
import { fromUnixTime,format, isSameDay, addDays } from 'date-fns';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { forkJoin } from 'rxjs';
@Component({
  selector: 'app-weather',
  standalone: true,
  templateUrl: './WeatherComponent.html',
  styleUrls: ['./WeatherComponent.css'],
  providers: [DatePipe],
  imports: [CommonModule, AvatarModule, AvatarGroupModule,
    FormsModule,
    ButtonModule, ChartModule, AutoCompleteModule,
    InputTextModule, CardModule, ProgressSpinnerModule]
})
export class WeatherComponent implements OnInit {
  cityName: string = '';
  weather: any;
  weatherIcon: string = '';
  errorMessage: string = '';
  loading: boolean = false;
  latitude: number | null = null;
  longitude: number | null = null;
  currentDate: string = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  currentTime: string = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  weatherCondition: string = 'clear';
  currentlocation: string = '';
  pressureTrend: 'rising' | 'falling' | 'steady' = 'steady';
  previousPressure: number | null = null;
  currentUnit: 'F' | 'C' = 'C'; activeTab: 'today' | 'tomorrow' | 'yesterday' = 'today';
  todayForecast: any[] = [];
  tomorrowForecast: any[] = [];
  yesterdayForecast: any;
  currentWeather: any;
  pastWeekMoonPhases: any[] = [];
  currentMoonPhase: number = 0;
  currentMoonPhaseName: string = '';
  cities: any[] = []; // Stores all cities
  filteredCities: any[] = []; // Stores filtered results
  selectedCity: any;
  constructor(private weatherService: WeatherService) {

  }

  ngOnInit(): void {
    this.getLocation();
    this.loadCities();
  }


  getWeather() {
    if (!this.cityName.trim()) {
      this.errorMessage = 'Please enter a city name.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.weatherService.getWeather(this.cityName).subscribe(
      (data) => {
        this.weather = data;
        this.updatePressureTrend(data.main.pressure);
        this.loadWeatherData(data.coord.lon, data.coord.lat);
        this.errorMessage = '';
      },
      () => {
        this.errorMessage = 'City not found. Please try again.';
        this.weather = null;
        this.loading = false;
      }
    );
  }
  kelvinToFahrenheit(kelvin: number): number {
    return Math.round((kelvin - 273.15) * 9 / 5 + 32);
  }

  // Helper to convert meters/sec to mph
  msToMph(ms: number): number {
    return Math.round(ms * 2.237);
  }

  // Format sunrise/sunset time
  getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  }

  getLocation() {
    this.loading = true;
    this.weatherCondition = this.getRandomWeatherLoader(); // Set random loader

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;

          this.weatherService.getWeatherByLatLong(this.latitude, this.longitude).subscribe(
            (data) => {
              this.weather = data;
              this.currentlocation = data.name;
              this.updatePressureTrend(data.main.pressure);
              this.errorMessage = '';
              
             this.loadWeatherData(position.coords.latitude, position.coords.longitude);
            },
            () => {
              this.errorMessage = 'City not found. Please try again.';
              this.weather = null;
              this.loading = false;
            }
          );
        },
        (error) => {
          console.error('Error getting location', error);
          this.loading = false;
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      this.loading = false;
    }
  }


  private getRandomWeatherLoader(): string {
    const conditions = ['clear', 'rain', 'clouds'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }
  getWeatherIcon(condition: string): string {
    const icons: { [key: string]: string } = {
      'Clear': 'fas fa-sun',
      'Clouds': 'fas fa-cloud',
      'Rain': 'fas fa-cloud-rain',
      'Drizzle': 'fas fa-cloud-rain',
      'Thunderstorm': 'fas fa-bolt',
      'Snow': 'fas fa-snowflake',
      'Mist': 'fas fa-smog',
      'Smoke': 'fas fa-smog',
      'Haze': 'fas fa-smog',
      'Dust': 'fas fa-smog',
      'Fog': 'fas fa-smog',
      'Sand': 'fas fa-smog',
      'Ash': 'fas fa-smog',
      'Squall': 'fas fa-wind',
      'Tornado': 'fas fa-wind'
    };
    return icons[condition] || 'fas fa-cloud';
  }


  updatePressureTrend(currentPressure: number): void {
    if (this.previousPressure === null) {
      this.previousPressure = currentPressure;
      return;
    }

    const difference = currentPressure - this.previousPressure;

    if (difference > 2) {
      this.pressureTrend = 'rising';
    } else if (difference < -2) {
      this.pressureTrend = 'falling';
    } else {
      this.pressureTrend = 'steady';
    }

    this.previousPressure = currentPressure;
  }
  getWeatherQuote(): string {
    const condition = this.weather?.weather[0]?.main;
    const temp = this.kelvinToFahrenheit(this.weather?.main?.temp);

    const quotes: { [key: string]: string[] } = {
      'Clear': [
        "It's so bright, I need sunglasses just to check my phone!",
        "Sun's out, buns out!",
        "Perfect weather for pretending to work while actually sunbathing"
      ],
      'Clouds': [
        "The sky looks like my motivation today - cloudy with a chance of naps",
        "Cloudy with a chance of... more clouds",
        "Gray skies are just nature's way of saying 'stay in bed'"
      ],
      'Rain': [
        "Rain rain go away... just kidding, I wasn't going outside anyway",
        "The weather app says 'rain', my hair says 'frizz festival'",
        "I like long walks in the rain... said no one with good hair ever"
      ],
      'Thunderstorm': [
        "Thor is clearly having a bad day",
        "The sky's throwing a tantrum - someone check if it needs a nap",
        "This isn't weather, it's a free light show!"
      ],
      'Snow': [
        "Winter is coming... and it brought its cold, wet blanket",
        "Snow problem! (See what I did there?)",
        "The weather outside is frightful, but the couch is so delightful"
      ],
      'Hot': [
        "It's so hot outside, I saw a squirrel fanning itself",
        "Hot enough to fry an egg on the sidewalk... brb, gonna try",
        "I'm not sweating, I'm just sparkling... excessively"
      ],
      'Cold': [
        "Cold enough to freeze the nose off a snowman",
        "I can see my breath! And also regret going outside",
        "This weather is perfect... for hibernating"
      ]
    };

    // Temperature-based additions
    if (temp > 90) {
      return quotes['Hot'][Math.floor(Math.random() * quotes['Hot'].length)];
    } else if (temp < 40) {
      return quotes['Cold'][Math.floor(Math.random() * quotes['Cold'].length)];
    }

    // Condition-based quotes
    if (condition && quotes[condition]) {
      const conditionQuotes = quotes[condition];
      return conditionQuotes[Math.floor(Math.random() * conditionQuotes.length)];
    }

    // Default funny quote
    const defaults = [
      "The weather can't make up its mind today",
      "Nice weather we're having... if you're a duck",
      "I'd check the weather, but I already stepped outside and regretted it"
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }
  getQuoteStyle() {
    const condition = this.weather?.weather[0]?.main;
    const styles: { [key: string]: any } = {
      'Clear': { 'color': '#FFD700', 'font-weight': '600' },
      'Rain': { 'color': '#6495ED', 'font-style': 'italic' },
      'Snow': { 'color': '#E0FFFF', 'text-shadow': '0 1px 3px rgba(0,0,0,0.5)' },
      'Thunderstorm': { 'color': '#FF6347', 'font-weight': 'bold' }
    };
    return styles[condition] || {};
  }
  toggleUnit() {
    this.currentUnit = this.currentUnit === 'F' ? 'C' : 'F';
  }

  // Update your temperature display methods
  displayTemp(temp: number): string {
    return this.currentUnit === 'F'
      ? this.celsiusToFahrenheit(temp).toFixed(0)
      : temp.toFixed(0); // No conversion needed for Celsius
  }


  celsiusToFahrenheit(celsius: number): number {
    return (celsius * 9 / 5) + 32;
  }




  loadWeatherData(lat: number, lon: number) {
    this.loading = true; // Start loading
  
    // Fetch all required weather data
    forkJoin({
      currentWeather: this.weatherService.getCurrentWeather(lat, lon),
      fiveDayForecast: this.weatherService.getFiveDayForecast(lat, lon),
      moonPhase: this.weatherService.getMoonPhase(lat, lon),
      pastWeekMoonPhases: this.weatherService.getPastWeekMoonPhases(lat, lon),
      yesterdayForecast: this.weatherService.getYesterdaySimulated(lat, lon)
    }).subscribe(
      ({ currentWeather, fiveDayForecast, moonPhase, pastWeekMoonPhases, yesterdayForecast }) => {
        this.currentWeather = currentWeather;
        this.processForecastData(fiveDayForecast.list);
  
        // Moon phase data
        this.currentMoonPhase = moonPhase.days[0].moonphase;
        this.currentMoonPhaseName = this.getMoonPhaseName(this.currentMoonPhase);
  
        // Process past week moon phases
        this.pastWeekMoonPhases = pastWeekMoonPhases.days.map((day: any, index: number) => {
          const date = new Date();
          date.setDate(date.getDate() - (pastWeekMoonPhases.days.length - 1 - index));
          return {
            date: date.toLocaleDateString('en-US', { weekday: 'short' }),
            phase: day.moonphase,
            phaseName: this.getMoonPhaseName(day.moonphase),
            icon: this.getMoonIcon(day.moonphase)
          };
        });
  
        // Simulated yesterday forecast
        this.yesterdayForecast = {
          ...yesterdayForecast,
          main: {
            ...yesterdayForecast.main,
            temp: yesterdayForecast.main.temp - 2,
            temp_max: yesterdayForecast.main.temp_max - 2,
            temp_min: yesterdayForecast.main.temp_min - 2
          }
        };
  
        this.loading = false; // ✅ Set loading to false only after all API calls are completed
      },
      (error) => {
        console.error('Error fetching weather data:', error);
        this.loading = false; // In case of error, stop loading
      }
    );
  }
  getMoonPhaseName(phase: number): string {
    if (phase < 0.03 || phase >= 0.97) return 'New Moon';
    if (phase < 0.22) return 'Waxing Crescent';
    if (phase < 0.28) return 'First Quarter';
    if (phase < 0.47) return 'Waxing Gibbous';
    if (phase < 0.53) return 'Full Moon';
    if (phase < 0.72) return 'Waning Gibbous';
    if (phase < 0.78) return 'Last Quarter';
    return 'Waning Crescent';
  }

  getMoonIcon(phase: number): string {
    // Returns Font Awesome icon class based on phase
    if (phase < 0.03 || phase >= 0.97) return 'far fa-circle'; // New moon
    if (phase < 0.47) return 'fas fa-moon'; // Waxing phases
    if (phase < 0.53) return 'fas fa-moon'; // Full moon
    return 'fas fa-moon'; // Waning phases
  }
  processForecastData(forecastList: any[]) {
    const now = new Date();
    const tomorrow = addDays(now, 1);

    this.todayForecast = forecastList
      .filter(item => isSameDay(fromUnixTime(item.dt), now))
      .slice(0, 8); // Limit to 8 time slots

    this.tomorrowForecast = forecastList
      .filter(item => isSameDay(fromUnixTime(item.dt), tomorrow))
      .slice(0, 8);
}
formatTime(timestamp: number): string {
  return format(fromUnixTime(timestamp), 'h a'); 
}

  // Add this method for date formatting
  formatDate(timestamp: number, dateFormat: string = 'MMM d'): string {
    return format(fromUnixTime(timestamp), dateFormat);
  }
  setActiveTab(tab: 'today' | 'tomorrow' | 'yesterday') {
    this.activeTab = tab;
  }
  getMoonStyle(phase: number): any {
    // For waxing phases (new moon to full moon)
    if (phase <= 0.5) {
      return {
        'background': '#f8f8f8',
        'box-shadow': `inset ${phase * 100}px 0 0 0 #333`
      };
    }
    // For waning phases (full moon to new moon)
    else {
      return {
        'background': '#333',
        'box-shadow': `inset ${(1 - phase) * 100}px 0 0 0 #f8f8f8`
      };
    }
  }
  onInputChange() {
    if (!this.cityName || this.cityName.trim() === '') {
      this.getLocation();
    }
  }


  loadCities() {
    this.weatherService.loadCities().subscribe((data) => {
      if (data) {
        this.cities = data;
      }
    });
  }
  search(event: any) {
    let query = event.query.toLowerCase(); // Get user input

    this.filteredCities = this.cities
      .filter(city => city.city.toLowerCase().includes(query)) // Filter by city name
      .slice(0, 10); // Limit results to 10
  }

}
