import React, { useState, useEffect } from 'react';
import { Trip, AppSettings, Car, ServiceReminder } from '../types';
import { exportToCsv } from '../services/exportService';

interface SettingsProps {
  settings: AppSettings;
  trips: Trip[];
  onSave: (settings: AppSettings) => void;
  requestNotificationPermission: () => Promise<void>;
  onBack?: () => void;
}


// Sub-component for editing a single car
const CarEditor: React.FC<{ car: Car; onSave: (car: Car) => void; onBack: () => void }> = ({ car, onSave, onBack }) => {
  const [editedCar, setEditedCar] = useState<Car>(car);
  const [consumptionStr, setConsumptionStr] = useState(car.averageConsumption.toString());

  const handleSave = () => {
    const avg = parseFloat(consumptionStr.replace(',', '.'));
    onSave({ ...editedCar, averageConsumption: isNaN(avg) ? 0 : avg });
  };

  const addReminder = () => {
    const newReminder: ServiceReminder = {
      id: Date.now().toString(),
      name: '',
      type: 'distance',
      interval: 15000,
      lastServiceOdometer: 0
    };
    setEditedCar({ ...editedCar, serviceReminders: [...editedCar.serviceReminders, newReminder] });
  };

  const updateReminder = (id: string, field: keyof ServiceReminder, value: any) => {
    setEditedCar({
      ...editedCar,
      serviceReminders: editedCar.serviceReminders.map(r => r.id === id ? { ...r, [field]: value } : r)
    });
  };

  const deleteReminder = (id: string) => {
    setEditedCar({
      ...editedCar,
      serviceReminders: editedCar.serviceReminders.filter(r => r.id !== id)
    });
  };

  return (
    <div className="animate-in slide-in-from-right duration-300 space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={onBack} className="p-2 -ml-2 text-zinc-500 hover:text-[#313134] dark:hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold tracking-tight text-white">Upraviť auto</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#3f3f42] rounded-3xl overflow-hidden border border-zinc-200 dark:border-[#4d4d50]/50 shadow-sm p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">Názov Auta</label>
              <input
                type="text"
                value={editedCar.name}
                onChange={e => setEditedCar({ ...editedCar, name: e.target.value })}
                className="w-full text-lg font-bold text-white bg-transparent outline-none placeholder-zinc-300 dark:placeholder-zinc-600"
                placeholder="Napr. Škoda Octavia"
              />
            </div>
            <div className="pt-2 border-t border-zinc-100 dark:border-[#4d4d50]/50">
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">EČV (ŠPZ)</label>
              <input
                type="text"
                value={editedCar.licensePlate}
                onChange={e => {
                  let val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                  if (val.length === 2 && !val.includes('-')) {
                    val = val + '-';
                  } else if (val.length === 3 && val[2] !== '-' && !val.includes('-')) {
                    val = val.substring(0, 2) + '-' + val.substring(2);
                  }
                  setEditedCar({ ...editedCar, licensePlate: val });
                }}
                className="w-full text-base font-mono font-bold text-white bg-transparent outline-none placeholder-zinc-300 dark:placeholder-zinc-600"
                placeholder="BA123XY"
              />
            </div>
            <div className="pt-2 border-t border-zinc-100 dark:border-[#4d4d50]/50 flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-300 uppercase">Ø Spotreba (L/100km)</label>
              <input
                type="text"
                inputMode="decimal"
                value={consumptionStr}
                onChange={e => setConsumptionStr(e.target.value)}
                className="w-24 text-right text-base font-medium text-white bg-transparent outline-none placeholder-zinc-300 dark:placeholder-zinc-600 tabular-nums"
                placeholder="6.5"
              />
            </div>
          </div>

          {/* Service Reminders Section */}
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-[11px] font-semibold text-zinc-200 uppercase tracking-widest">Servisné Pripomienky</h3>
              <button
                type="button"
                onClick={addReminder}
                className="text-xs font-bold text-zinc-950 px-3 py-1 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors"
              >
                + Pridať
              </button>
            </div>

            <div className="space-y-3">
              {editedCar.serviceReminders.length === 0 ? (
                <div className="px-4 py-6 text-center bg-[#38383b]/50 rounded-3xl border border-dashed border-[#4d4d50]/30">
                  <p className="text-xs font-medium text-zinc-500 uppercase">Žiadne pripomienky</p>
                </div>
              ) : (
                editedCar.serviceReminders.map(reminder => (
                  <div key={reminder.id} className="bg-[#3f3f42] rounded-3xl overflow-hidden border border-[#4d4d50]/50 shadow-sm p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={reminder.name}
                        onChange={e => updateReminder(reminder.id, 'name', e.target.value)}
                        className="flex-grow font-bold text-white bg-transparent outline-none placeholder-zinc-300 placeholder-zinc-600 text-sm"
                        placeholder="Názov servisu"
                      />
                      <button onClick={() => deleteReminder(reminder.id)} className="text-zinc-600 hover:text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex bg-[#38383b] p-1 rounded-lg mb-2">
                      <button onClick={() => updateReminder(reminder.id, 'type', 'distance')} className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${reminder.type === 'distance' ? 'bg-[#4d4d50] shadow text-white' : 'text-zinc-500'}`}>KM</button>
                      <button onClick={() => updateReminder(reminder.id, 'type', 'date')} className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${reminder.type === 'date' ? 'bg-[#4d4d50] shadow text-white' : 'text-zinc-500'}`}>DÁTUM</button>
                    </div>

                    {reminder.type === 'distance' ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-bold text-zinc-300 uppercase mb-0.5">Interval</label>
                          <div className="flex items-baseline gap-1">
                            <input type="number" value={reminder.interval || ''} onChange={e => updateReminder(reminder.id, 'interval', parseInt(e.target.value) || 0)} className="w-full bg-transparent font-medium text-sm text-white outline-none tabular-nums" placeholder="15000" />
                            <span className="text-[9px] text-zinc-500">km</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-zinc-300 uppercase mb-0.5">Naposledy</label>
                          <div className="flex items-baseline gap-1">
                            <input type="number" value={reminder.lastServiceOdometer || ''} onChange={e => updateReminder(reminder.id, 'lastServiceOdometer', parseInt(e.target.value) || 0)} className="w-full bg-transparent font-medium text-sm text-white outline-none tabular-nums" placeholder="0" />
                            <span className="text-[9px] text-zinc-500">km</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[9px] font-bold text-zinc-300 uppercase mb-0.5">Dátum</label>
                        <input type="date" value={reminder.targetDate || ''} onChange={e => updateReminder(reminder.id, 'targetDate', e.target.value)} className="w-full bg-transparent font-medium text-sm text-white outline-none" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <button onClick={handleSave} className="w-full py-3 bg-zinc-100 text-[#313134] rounded-2xl font-bold text-sm shadow-lg shadow-zinc-200 shadow-zinc-900/20 active:scale-[0.98] transition-all">
            Uložiť zmeny auta
          </button>
        </div>
      </div>
    </div>
  );
};

const Settings: React.FC<SettingsProps> = ({ settings, trips, onSave, requestNotificationPermission, onBack }) => {
  const [fuelPriceStr, setFuelPriceStr] = useState(settings.fuelPrice.toString());
  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  const [localCars, setLocalCars] = useState<Car[]>(settings.cars || []);
  const [isSaved, setIsSaved] = useState(false);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      setNotificationPermissionGranted(true);
    }
  }, []);

  // Update local state when prop changes
  useEffect(() => {
    setLocalCars(settings.cars || []);
  }, [settings.cars]);

  const handleSaveMain = () => {
    const fuelPrice = parseFloat(fuelPriceStr.replace(',', '.'));
    if (isNaN(fuelPrice)) return;

    onSave({
      ...settings,
      fuelPrice,
      cars: localCars
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleCreateCar = () => {
    const newCar: Car = {
      id: 'car-' + Date.now(),
      name: 'Nové Auto',
      licensePlate: '',
      isDefault: localCars.length === 0,
      averageConsumption: 6.5,
      serviceReminders: []
    };
    const updatedCars = [...localCars, newCar];
    setLocalCars(updatedCars);
    setEditingCarId(newCar.id);
  };

  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const handleDeleteCar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // If already confirming this car, proceed with delete
    if (deleteConfirmationId === id) {
      const updated = localCars.filter(c => c.id !== id);
      setLocalCars(updated);
      onSave({ ...settings, cars: updated });
      setDeleteConfirmationId(null);
    } else {
      // Otherwise set confirmation mode
      setDeleteConfirmationId(id);

      // Auto-reset confirmation after 3 seconds if not clicked
      setTimeout(() => setDeleteConfirmationId(current => current === id ? null : current), 3000);
    }
  };

  if (editingCarId) {
    const car = localCars.find(c => c.id === editingCarId);
    if (!car) {
      setEditingCarId(null);
      return null;
    }

    return (
      <CarEditor
        car={car}
        onSave={(updatedCar) => {
          const updatedCars = localCars.map(c => c.id === updatedCar.id ? updatedCar : c);
          setLocalCars(updatedCars);
          // Auto-save when going back from editor
          onSave({ ...settings, cars: updatedCars });
          setEditingCarId(null);
        }}
        onBack={() => setEditingCarId(null)}
      />
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="space-y-4">
        <div className="space-y-4">

          <div className="space-y-2">
            <h3 className="px-4 text-[11px] font-semibold text-zinc-200 uppercase tracking-widest">Všeobecné nastavenia</h3>
            <div className="bg-[#3f3f42] rounded-3xl overflow-hidden border border-[#4d4d50]/50 shadow-sm">
              <div className="p-4 flex items-center gap-4">
                <label className="w-40 text-sm font-semibold text-zinc-200">Cena paliva</label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={fuelPriceStr}
                  onChange={e => setFuelPriceStr(e.target.value)}
                  className="flex-grow bg-transparent text-sm font-medium text-white placeholder-zinc-400 placeholder-zinc-600 outline-none text-right tabular-nums"
                  placeholder="0.00"
                />
                <span className="text-xs font-semibold text-zinc-300">€ / L</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-[11px] font-semibold text-zinc-200 uppercase tracking-widest">Moje Autá</h3>
              <button
                onClick={handleCreateCar}
                className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all bg-zinc-100 text-[#313134] active:scale-95 shadow-lg shadow-zinc-900 hover:bg-zinc-200"
              >
                + Pridať
              </button>
            </div>
            <div className="space-y-3">
              {localCars.map(car => (
                <div
                  key={car.id}
                  onClick={() => setEditingCarId(car.id)}
                  className="bg-[#3f3f42] rounded-3xl p-4 border border-[#4d4d50]/50 shadow-sm flex justify-between items-center active:bg-[#38383b]/30 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="font-bold text-zinc-200">{car.name}</div>
                    <div className="text-xs text-zinc-300 font-mono font-bold uppercase">{car.licensePlate || 'Bez EČV'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        exportToCsv(trips, car);
                      }}
                      className="p-2 text-zinc-300 hover:text-green-600 hover:text-green-400 transition-colors"
                      title="Exportovať do Excelu"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDeleteCar(car.id, e)}
                      className={`p-2 transition-colors z-10 relative rounded-full ${deleteConfirmationId === car.id ? 'bg-red-500 text-white shadow-md' : 'text-zinc-300 hover:text-red-500'}`}
                    >
                      {deleteConfirmationId === car.id ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-300 dark:text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="px-4 text-[11px] font-semibold text-zinc-200 uppercase tracking-widest">Systémové Hlásenia</h3>
            <div className="bg-[#3f3f42] rounded-3xl overflow-hidden border border-[#4d4d50]/50 shadow-sm">
              <div className={`p-4 flex items-center justify-between gap-4 transition-colors ${notificationPermissionGranted ? 'bg-[#38383b]/50' : ''}`}>
                <div>
                  <label className="text-sm font-semibold text-zinc-200 block">Vyskakovacie notifikácie</label>
                  <p className="text-[10px] text-zinc-300 font-medium">Upozornenie pri dosiahnutí limitu</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (typeof Notification === 'undefined') {
                      alert('Váš prehliadač nepodporuje notifikácie.');
                      return;
                    }
                    if (Notification.permission === 'denied') {
                      alert('Notifikácie sú zablokované v nastaveniach prehliadača. Prosím, povoľte ich manuálne kliknutím na ikonu zámku v adresnom riadku.');
                      return;
                    }
                    await requestNotificationPermission();
                    setNotificationPermissionGranted(Notification.permission === 'granted');
                  }}
                  disabled={notificationPermissionGranted}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all ${notificationPermissionGranted
                    ? 'bg-zinc-800 text-zinc-500 cursor-default'
                    : 'bg-zinc-100 text-[#313134] active:scale-95 shadow-lg shadow-zinc-900'
                    }`}
                >
                  {notificationPermissionGranted ? 'Povolené' : (typeof Notification !== 'undefined' && Notification.permission === 'denied') ? 'Zablokované' : 'Povoliť'}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 px-2">
            <button
              onClick={handleSaveMain}
              disabled={isSaved}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] shadow-lg ${isSaved ? 'bg-[#38383b] text-zinc-500' : 'bg-zinc-100 text-[#313134] shadow-zinc-900/20'}`}
            >
              {isSaved ? 'Uložené' : 'Uložiť hlavné nastavenia'}
            </button>
          </div>


          <div className="mt-8 text-center">
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em]">Kniha Jázd Pro</div>
            <div className="text-[8px] text-zinc-600 font-bold uppercase tracking-[0.2em] mt-1">Version 2.0.0 • 2026</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;