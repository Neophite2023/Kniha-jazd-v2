import React, { useState } from 'react';
import { Trip } from '../types';

interface TripListProps {
  trips: Trip[];
  onDelete: (id: string) => void;
  onBack: () => void;
  highlightedTripId?: string;
  onHighlightComplete?: () => void;
}

const TripList: React.FC<TripListProps> = ({ trips, onDelete, onBack, highlightedTripId, onHighlightComplete }) => {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const tripRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

  React.useEffect(() => {
    if (highlightedTripId && tripRefs.current[highlightedTripId]) {
      // Small delay to ensure layout has settled, especially important for iOS/Safari
      const scrollTimer = setTimeout(() => {
        const element = tripRefs.current[highlightedTripId!];
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 600); // Slightly longer delay for stability

      // Delay clearing the highlight to allow the animation to play
      const clearTimer = setTimeout(() => {
        onHighlightComplete?.();
      }, 3600);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [highlightedTripId, onHighlightComplete]);

  const handleDeleteClick = (id: string) => setConfirmingId(id);
  const cancelDelete = () => setConfirmingId(null);
  const confirmDelete = (id: string) => {
    onDelete(id);
    setConfirmingId(null);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {trips.length === 0 ? (
        <div className="text-center py-40">
          <p className="text-zinc-200 dark:text-zinc-300 font-medium text-sm">Žiadne záznamy v archíve</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <div
              key={trip.id}
              ref={(el) => { tripRefs.current[trip.id] = el; }}
              className={`bg-[#3f3f42] rounded-3xl overflow-hidden border transition-all duration-700 ${highlightedTripId === trip.id ? 'border-white ring-4 ring-white/10 scale-[1.02] shadow-xl z-10' : 'border-[#4d4d50]/50 shadow-sm'}`}
            >
              <div
                className={`group relative p-4 flex justify-between items-center active:bg-[#38383b] transition-colors ${highlightedTripId === trip.id ? 'bg-[#38383b]/50' : ''}`}
              >
                {confirmingId === trip.id && (
                  <div className="absolute inset-0 bg-[#3f3f42] z-30 flex items-center justify-between px-6 animate-in slide-in-from-right duration-200">
                    <span className="text-sm font-bold text-zinc-50">Odstrániť?</span>
                    <div className="flex gap-2">
                      <button onClick={cancelDelete} className="px-4 py-2 text-sm font-medium text-zinc-200 hover:text-zinc-100">Zrušiť</button>
                      <button onClick={() => confirmDelete(trip.id)} className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-bold shadow-md">Vymazať</button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#38383b] rounded-xl flex items-center justify-center text-zinc-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-[#313134] dark:text-zinc-200 text-base tracking-tight">{trip.distanceKm.toFixed(1)} km</div>
                    <div className="text-[10px] font-medium text-zinc-200 dark:text-zinc-300 uppercase tracking-wide">
                      {new Date(trip.date).toLocaleDateString('sk-SK', { day: '2-digit', month: 'short', year: 'numeric' })} • {trip.startTime} – {trip.endTime}
                    </div>
                    {(trip.startGps || trip.endGps) && (
                      <div className="text-[9px] font-medium text-zinc-200 dark:text-zinc-300 tabular-nums mt-0.5">
                        GPS: {trip.startGps || '?'} → {trip.endGps || '?'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-[#313134] dark:text-zinc-200 text-sm tabular-nums">{trip.totalCost.toFixed(2)} €</div>
                    <div className="text-[10px] font-medium text-zinc-200 dark:text-zinc-300 uppercase tabular-nums">{trip.endOdometer} km</div>
                  </div>
                  <button
                    onClick={() => handleDeleteClick(trip.id)}
                    className="p-2 text-zinc-200 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
      }
    </div >
  );
};

export default TripList;