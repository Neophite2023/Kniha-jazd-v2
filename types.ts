
export interface Car {
  id: string;
  name: string;
  licensePlate: string;
  isDefault: boolean;
  averageConsumption: number; // L/100km
  serviceReminders: ServiceReminder[];
}

export interface Trip {
  id: string;
  carId: string; // Priradené k autu
  date: string;
  startTime: string;
  endTime: string;
  distanceKm: number;
  fuelPriceAtTime: number;
  consumptionAtTime: number;
  totalCost: number;
  fuelConsumed: number;
  note?: string;
  startOdometer: number;
  endOdometer: number;
}

export interface ActiveTrip {
  carId: string;
  startDate: string;
  startTime: string;
  startOdometer: number;
  note?: string;
}

export interface ServiceReminder {
  id: string;
  name: string;
  type: 'distance' | 'date';
  interval?: number;
  lastServiceOdometer?: number;
  targetDate?: string;
}

export interface AppSettings {
  fuelPrice: number; // EUR/L
  cars: Car[];
  lastActiveCarId: string;
}

export interface HistoryStats {
  totalDistance: number;
  monthlyDistance: number;
  currentMonthName: string;
  currentYear: number;
  totalCost: number;
  totalFuel: number;
  averageTripDistance: number;
}
