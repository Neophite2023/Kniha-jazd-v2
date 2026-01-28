import React, { useState, useEffect, useMemo } from 'react';
import { Trip, AppSettings, HistoryStats, ActiveTrip, Car } from './types';
import TripForm from './components/TripForm';
import TripList from './components/TripList';
import Settings from './components/Settings';
import Dashboard from './components/Dashboard';

const STORAGE_KEY_TRIPS = 'kniha_jazd_trips_v1';
const STORAGE_KEY_SETTINGS = 'kniha_jazd_settings_v1';
const STORAGE_KEY_ACTIVE = 'kniha_jazd_active_v1';

// Safe storage wrapper to prevent crashes in private mode or restricted environments
const safeStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('Storage access failed:', e);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('Storage saving failed:', e);
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('Storage removal failed:', e);
    }
  }
};

const App: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>(() => {
    const stored = safeStorage.getItem(STORAGE_KEY_TRIPS);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(() => {
    const stored = safeStorage.getItem(STORAGE_KEY_ACTIVE);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const stored = safeStorage.getItem(STORAGE_KEY_SETTINGS);
    const defaults: AppSettings = {
      fuelPrice: 1.65,
      cars: [],
      lastActiveCarId: '',
      theme: 'system'
    };

    if (!stored) {
      // Init default car if new
      const defaultCar: Car = {
        id: 'default-car-1',
        name: 'Moje Auto',
        licensePlate: '',
        isDefault: true,
        averageConsumption: 6.5,
        serviceReminders: []
      };
      return {
        ...defaults,
        cars: [defaultCar],
        lastActiveCarId: defaultCar.id
      };
    }

    try {
      const parsed = JSON.parse(stored);

      // MIGRATION: Old structure to new structure
      if (!parsed.cars) {
        // Handle legacy service reminders
        let legacyReminders = parsed.serviceReminders || [];
        if ((parsed.serviceInterval || parsed.serviceName) && !parsed.serviceReminders) {
          legacyReminders = [{
            id: 'migrated-' + Date.now(),
            name: parsed.serviceName || 'Servisný interval',
            type: 'distance',
            interval: parsed.serviceInterval || 15000,
            lastServiceOdometer: parsed.lastServiceOdometer || 0
          }];
        }
        // Ensure type safety for reminders
        legacyReminders = legacyReminders.map((r: any) => ({
          type: 'distance',
          ...r
        }));

        const migratedCar: Car = {
          id: 'default-car-1',
          name: 'Moje Auto',
          licensePlate: '',
          isDefault: true,
          averageConsumption: parsed.averageConsumption || 6.5,
          serviceReminders: legacyReminders
        };

        return {
          fuelPrice: parsed.fuelPrice || 1.65,
          cars: [migratedCar],
          lastActiveCarId: migratedCar.id,
          theme: parsed.theme || 'system'
        };
      }

      return {
        ...defaults,
        ...parsed
      };
    } catch (e) {
      return defaults;
    }
  });

  // MIGRATION for trips: Ensure all trips have a carId
  useEffect(() => {
    const defaultCarId = settings.cars[0]?.id;
    if (!defaultCarId) return;

    let hasChanges = false;
    const updatedTrips = trips.map(t => {
      if (!t.carId) {
        hasChanges = true;
        return { ...t, carId: defaultCarId };
      }
      return t;
    });

    if (hasChanges) {
      setTrips(updatedTrips);
    }
  }, []); // Run once on mount

  const activeCar = useMemo(() => {
    return settings.cars.find(c => c.id === settings.lastActiveCarId) || settings.cars[0];
  }, [settings.cars, settings.lastActiveCarId]);

  const [view, setView] = useState<'dashboard' | 'add' | 'history' | 'settings' | 'info'>('dashboard');

  const [notifiedReminders, setNotifiedReminders] = useState<string[]>(() => {
    const stored = safeStorage.getItem('kniha_jazd_notifications_v1');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    safeStorage.setItem('kniha_jazd_notifications_v1', JSON.stringify(notifiedReminders));
  }, [notifiedReminders]);

  // Theme handling effect
  useEffect(() => {
    const applyTheme = () => {
      const isDark =
        settings.theme === 'dark' ||
        (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        document.documentElement.classList.add('dark');
        // Update meta theme-color for mobile browsers
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#09090b');
      } else {
        document.documentElement.classList.remove('dark');
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#ffffff');
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const lastOdometer = trips.length > 0 ? trips[0].endOdometer : 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const newNotifications: string[] = [];

    settings.cars.forEach(car => {
      car.serviceReminders.forEach(reminder => {
        let isDue = false;
        let message = '';

        // Find last odometer for this specific car
        // Note: This optimization assumes trips are sorted desc. 
        // For accurate result we should filter trips by car first.
        const carTrips = trips.filter(t => t.carId === car.id);
        const lastOdometer = carTrips.length > 0 ? carTrips[0].endOdometer : 0;

        if (reminder.type === 'distance' && reminder.interval) {
          const remaining = reminder.interval - (lastOdometer - (reminder.lastServiceOdometer || 0));
          if (remaining <= 1000) {
            isDue = true;
            message = `${car.name}: Zostáva už len ${Math.max(0, remaining).toLocaleString()} km do cieľa!`;
          }
        } else if (reminder.type === 'date' && reminder.targetDate) {
          const target = new Date(reminder.targetDate);
          const diffTime = target.getTime() - now.getTime();
          const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (daysRemaining <= 14) {
            isDue = true;
            message = daysRemaining <= 0
              ? `${car.name}: Termín ${reminder.name} už vypršal!`
              : `${car.name}: Zostáva už len ${daysRemaining} dní do termínu!`;
          }
        }

        // Ak je servis splatný a ešte sme o ňom neoboznámili v tomto cykle
        const notificationKey = `${car.id}-${reminder.id}-${reminder.lastServiceOdometer || reminder.targetDate}`;
        if (isDue && !notifiedReminders.includes(notificationKey)) {
          new Notification(`Servisná pripomienka: ${reminder.name}`, {
            body: message,
            icon: 'https://cdn-icons-png.flaticon.com/512/2555/2555013.png'
          });
          newNotifications.push(notificationKey);
        }
      });
    });

    if (newNotifications.length > 0) {
      setNotifiedReminders(prev => [...prev, ...newNotifications]);
    }
  }, [settings.cars, trips, notifiedReminders]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (activeTrip) {
      safeStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(activeTrip));
    } else {
      safeStorage.removeItem(STORAGE_KEY_ACTIVE);
    }
  }, [activeTrip]);

  const stats: HistoryStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (!activeCar) {
      return {
        totalDistance: 0,
        monthlyDistance: 0,
        currentMonthName: '',
        currentYear: now.getFullYear(),
        totalCost: 0,
        totalFuel: 0,
        averageTripDistance: 0,
      };
    }

    const carTrips = trips.filter(t => t.carId === activeCar.id);
    const totalDistance = carTrips.reduce((acc, t) => acc + t.distanceKm, 0);
    const totalCost = carTrips.reduce((acc, t) => acc + t.totalCost, 0);
    const totalFuel = carTrips.reduce((acc, t) => acc + t.fuelConsumed, 0);

    const monthlyTrips = carTrips.filter(t => {
      const tripDate = new Date(t.date);
      return tripDate.getMonth() === currentMonth && tripDate.getFullYear() === currentYear;
    });
    const monthlyDistance = monthlyTrips.reduce((acc, t) => acc + t.distanceKm, 0);

    const monthName = now.toLocaleDateString('sk-SK', { month: 'long' });

    return {
      totalDistance,
      monthlyDistance,
      currentMonthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      currentYear,
      totalCost,
      totalFuel,
      averageTripDistance: carTrips.length > 0 ? totalDistance / carTrips.length : 0,
    };
  }, [trips, activeCar]);

  const handleSaveTrip = (newTrip: Trip) => {
    setTrips(prev => [newTrip, ...prev]);
    setActiveTrip(null);
    setView('dashboard');
  };

  const handleStartTrip = (trip: ActiveTrip) => {
    // Ensure carId is set (if coming from quick start without car selection, use active)
    const tripWithCar = { ...trip, carId: trip.carId || activeCar?.id || '' };
    setActiveTrip(tripWithCar);
    setView('dashboard');
  };

  const handleDeleteTrip = (id: string) => {
    setTrips(current => current.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col text-zinc-900 dark:text-zinc-200 selection:bg-zinc-200 dark:selection:bg-zinc-500/30 antialiased overflow-x-hidden relative transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex justify-center items-center">
        <h1 className="text-lg font-semibold tracking-tight">Kniha Jázd</h1>
      </header>

      <main className="flex-grow w-full max-w-lg mx-auto p-4 pb-32">
        {view !== 'dashboard' && (
          <div className="mb-4 px-2 pt-2">
            <h2 className="text-4xl font-extrabold tracking-tight">
              {view === 'add' ? 'Záznam' : view === 'history' ? 'História' : view === 'info' ? 'Informácie' : 'Nastavenia'}
            </h2>
          </div>
        )}

        <div className="view-transition">
          {view === 'dashboard' && (
            <Dashboard
              stats={stats}
              recentTrips={trips.filter(t => t.carId === activeCar?.id).slice(0, 5)}
              activeTrip={activeTrip}
              settings={settings}
              activeCar={activeCar}
              onActiveCarChange={(id) => setSettings({ ...settings, lastActiveCarId: id })}
              lastOdometer={
                activeCar
                  ? (trips.filter(t => t.carId === activeCar.id)[0]?.endOdometer || 0)
                  : 0
              }
              onViewAll={() => setView('history')}
              onAddTrip={() => setView('add')}
            />
          )}
          {view === 'add' && activeCar && (
            <TripForm
              key={activeTrip ? 'active' : 'new'}
              settings={settings}
              activeCar={activeTrip ? settings.cars.find(c => c.id === activeTrip.carId) || activeCar : activeCar}
              activeTrip={activeTrip}
              onStart={handleStartTrip}
              onSave={handleSaveTrip}
              onCancel={() => setView('dashboard')}
              lastTripEndOdometer={
                trips.filter(t => t.carId === activeCar.id)[0]?.endOdometer || 0
              }
            />
          )}
          {view === 'history' && (
            <TripList
              trips={activeCar ? trips.filter(t => t.carId === activeCar.id) : []}
              onDelete={handleDeleteTrip}
              onBack={() => setView('dashboard')}
            />
          )}
          {view === 'settings' && (
            <Settings
              settings={settings}
              trips={trips}
              onSave={setSettings}
              requestNotificationPermission={requestNotificationPermission}
              onBack={() => setView('dashboard')}
            />
          )}
          {view === 'info' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Prehľad funkcií</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Kniha Jázd Pro je navrhnutá pre jednoduchú a prehľadnú evidenciu vašich ciest s dôrazom na rýchlosť a natívny zážitok.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-900 dark:text-zinc-100 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Mesačné štatistiky</h4>
                      <p className="text-xs text-zinc-500">Okamžitý prehľad o najazdených kilometroch v aktuálnom mesiaci priamo na hlavnej obrazovke.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-900 dark:text-zinc-100 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Inteligentné pripomienky</h4>
                      <p className="text-xs text-zinc-500">Sledujte zostávajúce kilometre do servisu, výmeny oleja alebo klimatizácie s grafickým ukazovateľom.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-900 dark:text-zinc-100 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Výpočet nákladov</h4>
                      <p className="text-xs text-zinc-500">Aplikácia automaticky počíta cenu paliva a spotrebu pre každú jazdu na základe vašich nastavení.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-900 dark:text-zinc-100 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Rýchly záznam</h4>
                      <p className="text-xs text-zinc-500">Odštartujte jazdu jedným kliknutím. Aplikácia si pamätá váš posledný stav tachometra.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-900 dark:text-zinc-100 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Správa flotily</h4>
                      <p className="text-xs text-zinc-500">Pridajte neobmedzený počet áut a spravujte celú firemnú alebo rodinnú flotilu na jednom mieste.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-900 dark:text-zinc-100 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Offline fungovanie (PWA)</h4>
                      <p className="text-xs text-zinc-500">Pridajte si apku na plochu iPhone. Funguje bleskovo aj bez internetu a ukladá dáta priamo v zariadení.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={() => setView('dashboard')}
                    className="w-full py-3 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
                  >
                    Rozumiem
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl border-t border-zinc-200 dark:border-zinc-800 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-lg mx-auto flex justify-between items-center h-16 px-6">
          <button
            onClick={() => setView('dashboard')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${view === 'dashboard' ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-400 dark:text-zinc-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-[22px] w-[22px]" fill={view === 'dashboard' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-tight">Prehľad</span>
          </button>

          <button
            onClick={() => setView('history')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${view === 'history' ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-400 dark:text-zinc-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-[22px] w-[22px]" fill={view === 'history' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-tight">História</span>
          </button>

          <button
            onClick={() => view === 'add' ? setView('dashboard') : setView('add')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${view === 'add' ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-400 dark:text-zinc-500'}`}
          >
            <div className={`p-1.5 rounded-full shadow-lg transition-transform active:scale-95 ${activeTrip ? 'bg-red-500 text-white animate-pulse' : view === 'add' ? 'bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950' : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={activeTrip ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
              </svg>
            </div>
          </button>

          <button
            onClick={() => setView('info')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${view === 'info' ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-400 dark:text-zinc-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-[22px] w-[22px]" fill={view === 'info' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-tight">Info</span>
          </button>

          <button
            onClick={() => setView('settings')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${view === 'settings' ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-400 dark:text-zinc-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-[22px] w-[22px]" fill={view === 'settings' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-tight">Nastavenia</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;