import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Tracking {
  constructor() { }

  track(eventName: string, properties: { [key: string]: any } = {}): void {
    console.log(`[TRACKING] Event: ${eventName}`, properties);
  }
  
}
