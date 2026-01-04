import React, { useState, useEffect } from 'react';
import { Trip, AppSettings, ActiveTrip, Car } from '../types';

interface TripFormProps {
  settings: AppSettings;
  activeCar: Car;
  activeTrip: ActiveTrip | null;
  onStart: (trip: ActiveTrip) => void;
  onSave: (trip: Trip) => void;
  onCancel: () => void;
  lastTripEndOdometer: number;
}

const TripForm: React.FC<TripFormProps> = ({
  settings,
  activeCar,
  activeTrip,
  onStart,
  onSave,
  onCancel,
  lastTripEndOdometer
}) => {
  const [odometer, setOdometer] = useState<string>(
    activeTrip
      ? activeTrip.startOdometer.toString()
      : (lastTripEndOdometer > 0 ? lastTripEndOdometer.toString() : '')
  );
  const [note, setNote] = useState<string>(activeTrip?.note || '');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const generateId = () => Math.random().toString(36).substring(2, 10);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const startVal = parseFloat(odometer);
    if (isNaN(startVal) || startVal < 0) return;
    const now = new Date();
    onStart({
      carId: activeCar.id,
      startDate: now.toISOString().split('T')[0],
      startTime: now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' }),
      startOdometer: startVal,
      note: note,
    });
  };

  const activeCarConsumption = activeCar.averageConsumption;

  const handleEnd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;
    const endVal = parseFloat(odometer);
    if (isNaN(endVal) || endVal <= activeTrip.startOdometer) return;

    const distance = endVal - activeTrip.startOdometer;
    const fuelConsumed = (distance / 100) * activeCarConsumption;
    const totalCost = fuelConsumed * settings.fuelPrice;
    const now = new Date();
    const endTimeStr = now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });

    onSave({
      id: generateId(),
      carId: activeTrip.carId,
      date: activeTrip.startDate,
      startTime: activeTrip.startTime,
      endTime: endTimeStr,
      distanceKm: parseFloat(distance.toFixed(2)),
      startOdometer: activeTrip.startOdometer,
      endOdometer: endVal,
      fuelPriceAtTime: settings.fuelPrice,
      consumptionAtTime: activeCarConsumption,
      fuelConsumed: parseFloat(fuelConsumed.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      note: note.trim() || activeTrip.note,
    });
  };

  const handleAdjustOdometer = (amount: number) => {
    const current = parseFloat(odometer) || 0;
    setOdometer((current + amount).toString());
  };

  return (
    <div className="max-w-lg mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="bg-white rounded-3xl overflow-hidden border border-zinc-200 shadow-sm">
        <div className="p-4 border-b border-zinc-100 flex justify-between items-center">
          <label className="text-sm font-semibold text-zinc-900">Aktuálny Čas</label>
          <div className="text-sm font-medium text-zinc-500 tabular-nums">{currentTime || '00:00'}</div>
        </div>
        <div className="p-4 flex justify-between items-center">
          <label className="text-sm font-semibold text-zinc-900">Dátum</label>
          <div className="text-sm font-medium text-zinc-500">{currentDate}</div>
        </div>
      </div>

      <form onSubmit={activeTrip ? handleEnd : handleStart} className="space-y-8">
        <div className="space-y-2">
          <h3 className="px-4 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">Údaje o jazde</h3>
          <div className="bg-white rounded-3xl overflow-hidden border border-zinc-200 shadow-sm">
            <div className="p-4 border-b border-zinc-100 space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-zinc-900">Stav tachometra</label>
                <span className="text-xs font-semibold text-zinc-400">km</span>
              </div>

              <div className="flex items-center justify-between gap-1 bg-zinc-50 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => handleAdjustOdometer(-1)}
                  className="w-11 h-11 flex items-center justify-center bg-white rounded-xl shadow-sm border border-zinc-100 text-zinc-950 active:scale-90 transition-transform shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                  </svg>
                </button>

                <input
                  type="number"
                  inputMode="decimal"
                  required
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  className="flex-grow min-w-0 bg-transparent text-2xl font-bold text-zinc-950 text-center outline-none tabular-nums h-11"
                  placeholder="000.0"
                  onFocus={(e) => e.target.select()}
                />

                <button
                  type="button"
                  onClick={() => handleAdjustOdometer(1)}
                  className="w-11 h-11 flex items-center justify-center bg-white rounded-xl shadow-sm border border-zinc-100 text-zinc-950 active:scale-90 transition-transform shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center gap-4">
              <label className="w-24 text-sm font-semibold text-zinc-900">Poznámka</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex-grow bg-transparent text-sm font-medium text-zinc-950 placeholder-zinc-300 outline-none text-right"
                placeholder="Napr. Smer Bratislava..."
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 px-2">
          <button
            type="submit"
            className="w-full py-4 bg-zinc-950 text-white rounded-2xl font-bold text-base transition-all active:scale-[0.98] shadow-lg shadow-zinc-200"
          >
            {activeTrip ? 'Ukončiť Jazdu' : 'Zahájiť Jazdu'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2 text-zinc-400 text-sm font-medium hover:text-zinc-900 transition-colors"
          >
            Zrušiť
          </button>
        </div>
      </form>
    </div>
  );
};

export default TripForm;