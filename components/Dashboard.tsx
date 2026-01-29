import { Trip, HistoryStats, ActiveTrip, AppSettings, Car } from '../types';
import { exportToCsv } from '../services/exportService';

interface DashboardProps {
  allTrips: Trip[];
  stats: HistoryStats;
  recentTrips: Trip[];
  activeTrip: ActiveTrip | null;
  settings: AppSettings;
  activeCar: Car | undefined;
  onActiveCarChange: (id: string) => void;
  lastOdometer: number;
  onViewAll: () => void;
  onAddTrip: () => void;
  onTripClick: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  allTrips,
  stats,
  recentTrips,
  activeTrip,
  settings,
  activeCar,
  onActiveCarChange,
  lastOdometer,
  onViewAll,
  onAddTrip,
  onTripClick
}) => {
  if (!activeCar) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-[#3f3f42] rounded-3xl p-8 border border-zinc-200 dark:border-[#4d4d50]/50 shadow-sm text-center">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Pridajte svoje prvé auto v nastaveniach</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-[#3f3f42] rounded-3xl p-5 border border-zinc-200 dark:border-[#4d4d50]/50 shadow-sm relative overflow-hidden">
        {/* Car Selector */}
        <div className="absolute top-5 right-5 z-10">
          {settings.cars.length > 1 && (
            <select
              value={activeCar.id}
              onChange={(e) => onActiveCarChange(e.target.value)}
              className="bg-zinc-100 dark:bg-[#38383b] text-zinc-900 dark:text-zinc-100 text-[10px] font-bold uppercase tracking-wide py-1.5 px-3 rounded-full outline-none border-none cursor-pointer hover:bg-zinc-200 dark:hover:bg-[#4d4d50] transition-colors appearance-none"
              style={{ WebkitAppearance: 'none' }}
            >
              {settings.cars.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Export Button */}
        <div className="absolute top-[64px] right-5 z-10">
          <button
            onClick={() => exportToCsv(allTrips, activeCar)}
            className="flex items-center gap-1.5 bg-zinc-50 dark:bg-[#38383b]/50 text-zinc-500 dark:text-zinc-400 py-1.5 px-3 rounded-xl hover:text-green-600 dark:hover:text-green-400 hover:bg-zinc-100 dark:hover:bg-[#38383b] transition-all border border-zinc-100 dark:border-[#4d4d50]/50 active:scale-95"
            title="Exportovať jazdy auta"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-tight">Export</span>
          </button>
        </div>

        <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
          {activeCar.name} • {stats.currentMonthName} {stats.currentYear}
        </span>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">{stats.monthlyDistance.toFixed(0)}</span>
          <span className="text-xl font-medium text-zinc-400 dark:text-zinc-500">km</span>
        </div>
        {activeCar.licensePlate && (
          <div className="mt-2 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 font-bold tracking-wider">{activeCar.licensePlate}</div>
        )}
      </div>

      {activeCar.serviceReminders && activeCar.serviceReminders.length > 0 && (
        <div className="bg-white dark:bg-[#3f3f42] rounded-3xl p-5 border border-zinc-200 dark:border-[#4d4d50]/50 shadow-sm space-y-5">
          <h3 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest px-1">Servisné Pripomienky</h3>
          <div className="space-y-6">
            {activeCar.serviceReminders.map(reminder => {
              if (reminder.type === 'date' && reminder.targetDate) {
                const target = new Date(reminder.targetDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffTime = target.getTime() - today.getTime();
                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const dateFormatted = target.toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric' });

                return (
                  <div key={reminder.id} className="space-y-2">
                    <div className="flex justify-between items-end px-1">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">
                          {reminder.name}
                        </span>
                        <div className="text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-none">
                          {Math.max(0, daysRemaining).toLocaleString()}
                          <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 ml-1.5 uppercase">dní do termínu</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">termín: {dateFormatted}</span>
                      </div>
                    </div>

                    <div className="h-1.5 bg-zinc-100 dark:bg-[#38383b] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${daysRemaining < 14 ? 'bg-red-500' : 'bg-zinc-900 dark:bg-white'}`}
                        style={{ width: daysRemaining <= 0 ? '100%' : daysRemaining < 14 ? '95%' : '10%' }}
                      />
                    </div>
                  </div>
                );
              }

              // Distance based
              const remaining = (reminder.interval || 0) - (lastOdometer - (reminder.lastServiceOdometer || 0));
              const progress = Math.min(100, Math.max(0, ((lastOdometer - (reminder.lastServiceOdometer || 0)) / (reminder.interval || 1)) * 100));

              return (
                <div key={reminder.id} className="space-y-2">
                  <div className="flex justify-between items-end px-1">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">
                        {reminder.name}
                      </span>
                      <div className="text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-none">
                        {Math.max(0, remaining).toLocaleString()}
                        <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 ml-1.5 uppercase">km do cieľa</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">pri {((reminder.lastServiceOdometer || 0) + (reminder.interval || 0)).toLocaleString()} km</span>
                    </div>
                  </div>

                  <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${remaining < 1000 ? 'bg-red-500' : 'bg-zinc-900 dark:bg-white'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTrip && (
        <div className="bg-white dark:bg-[#3f3f42] rounded-3xl p-4 flex items-center justify-between shadow-xl ring-1 ring-zinc-200 dark:ring-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Práve prebieha • {activeCar.name}</div>
              <div className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight">{activeTrip.startTime} • {activeTrip.startOdometer} km</div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddTrip();
            }}
            className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-95 transition-all"
          >
            Ukončiť
          </button>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">Nedávne Aktivity</h3>
          <button onClick={onViewAll} className="text-xs font-medium text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">Všetky</button>
        </div>

        <div className="bg-white dark:bg-[#3f3f42] rounded-3xl overflow-hidden border border-zinc-200 dark:border-[#4d4d50]/50 shadow-sm">
          {recentTrips.length > 0 ? (
            recentTrips.map((trip, idx) => (
              <div
                key={trip.id}
                onClick={(e) => {
                  e.preventDefault();
                  onTripClick(trip.id);
                }}
                className={`p-4 flex justify-between items-center active:bg-zinc-100 dark:active:bg-[#38383b] transition-all cursor-pointer select-none touch-manipulation ${idx !== recentTrips.length - 1 ? 'border-b border-zinc-100 dark:border-[#4d4d50]/30' : ''}`}
                role="button"
                tabIndex={0}
              >
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-zinc-100 dark:bg-[#38383b] rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-50 text-base tracking-tight">{trip.distanceKm.toFixed(1)} km</div>
                    <div className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                      {new Date(trip.date).toLocaleDateString('sk-SK', { day: '2-digit', month: 'short' })} • {trip.startTime}
                    </div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-50 text-sm tabular-nums">{trip.totalCost.toFixed(2)} €</div>
                    <div className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase">{trip.fuelConsumed.toFixed(1)} L</div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <p className="text-zinc-400 dark:text-zinc-400 text-xs font-medium uppercase tracking-widest">Žiadne záznamy</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;