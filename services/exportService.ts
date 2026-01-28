import { Trip } from '../types';

export const exportToCsv = (trips: Trip[]) => {
    if (!trips || trips.length === 0) {
        alert('Žiadne jazdy na exportovanie.');
        return;
    }

    // Hlavička CSV
    const headers = [
        'Dátum',
        'Štart',
        'Koniec',
        'Vzdialenosť (km)',
        'Tachometer Štart',
        'Tachometer Koniec',
        'GPS Štart',
        'GPS Koniec',
        'Cena paliva (€/L)',
        'Spotreba (L/100km)',
        'Cena celkom (€)',
        'Poznámka'
    ];

    // Mapovanie dát na riadky
    const rows = trips.map(trip => [
        trip.date,
        trip.startTime,
        trip.endTime,
        trip.distanceKm.toString().replace('.', ','),
        trip.startOdometer.toString().replace('.', ','),
        trip.endOdometer.toString().replace('.', ','),
        `"${trip.startGps || ''}"`,
        `"${trip.endGps || ''}"`,
        trip.fuelPriceAtTime.toString().replace('.', ','),
        trip.consumptionAtTime.toString().replace('.', ','),
        trip.totalCost.toString().replace('.', ','),
        `"${(trip.note || '').replace(/"/g, '""')}"`
    ]);

    // Spojenie do jedného reťazca (používame bodkočiarku pre Excel v SK/CZ)
    const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
    ].join('\n');

    // Pridanie BOM (Byte Order Mark) pre správne kódovanie UTF-8 v Exceli
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Vytvorenie odkazu na stiahnutie
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute('download', `kniha_jazd_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
