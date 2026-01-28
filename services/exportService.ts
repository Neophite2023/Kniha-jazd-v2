import { Trip, Car } from '../types';

export const exportToCsv = (trips: Trip[], car: Car) => {
    // Filtrujeme jazdy len pre toto konkrétne auto
    const carTrips = trips.filter(t => t.carId === car.id);

    if (carTrips.length === 0) {
        alert(`Žiadne jazdy pre vozidlo ${car.name} (${car.licensePlate || 'bez EČV'}) na exportovanie.`);
        return;
    }

    // Info o aute na začiatku CSV
    const carInfo = [
        `Vozidlo:;${car.name}`,
        `EČV:;${car.licensePlate || 'Nezadané'}`,
        '' // Prázdny riadok
    ];

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
    const rows = carTrips.map(trip => [
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

    // Spojenie do jedného reťazca
    // Pridávame 'sep=;' aby Excel vedel, že oddeľovačom je bodkočiarka
    const csvContent = [
        'sep=;',
        ...carInfo,
        headers.join(';'),
        ...rows.map(row => row.join(';'))
    ].join('\n');

    // Pridanie BOM
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Vytvorenie odkazu na stiahnutie
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const safePlate = (car.licensePlate || car.name).replace(/[^a-z0-9]/gi, '_');

    link.setAttribute('href', url);
    link.setAttribute('download', `kniha_jazd_${safePlate}_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
