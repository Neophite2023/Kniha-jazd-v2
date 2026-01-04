import React, { useState } from 'react';
import { Trip } from '../types';

interface TripListProps {
  trips: Trip[];
  onDelete: (id: string) => void;
  onBack: () => void;
}

const TripList: React.FC<TripListProps> = ({ trips, onDelete, onBack }) => {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

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
          <p className="text-zinc-600 font-medium text-sm">Žiadne záznamy v archíve</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <div key={trip.id} className="bg-white rounded-3xl overflow-hidden border border-zinc-200 shadow-sm">
              <div
                className="group relative p-4 flex justify-between items-center active:bg-zinc-50 transition-colors"
              >
                {confirmingId === trip.id && (
                  <div className="absolute inset-0 bg-white/95 z-30 flex items-center justify-between px-6 animate-in slide-in-from-right duration-200">
                    <span className="text-sm font-bold text-zinc-950">Odstrániť?</span>
                    <div className="flex gap-2">
                      <button onClick={cancelDelete} className="px-4 py-2 text-sm font-medium text-zinc-400">Zrušiť</button>
                      <button onClick={() => confirmDelete(trip.id)} className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-bold">Vymazať</button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-zinc-950 text-base tracking-tight">{trip.distanceKm.toFixed(1)} km</div>
                    <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">
                      {new Date(trip.date).toLocaleDateString('sk-SK', { day: '2-digit', month: 'short', year: 'numeric' })} • {trip.startTime} – {trip.endTime}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-zinc-950 text-sm tabular-nums">{trip.totalCost.toFixed(2)} €</div>
                    <div className="text-[10px] font-medium text-zinc-400 uppercase tabular-nums">{trip.endOdometer} km</div>
                  </div>
                  <button
                    onClick={() => handleDeleteClick(trip.id)}
                    className="p-2 text-zinc-200 hover:text-red-500 transition-colors"
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
      )}
    </div>
  );
};

export default TripList;