import { Trip, Car } from '../types';

export const exportToCsv = (trips: Trip[], car: Car) => {
    // Filtrujeme jazdy len pre toto konkrétne auto
    const carTrips = trips.filter(t => t.carId === car.id);

    if (carTrips.length === 0) {
        alert(`Žiadne jazdy pre vozidlo ${car.name} (${car.licensePlate || 'bez EČV'}) na exportovanie.`);
        return;
    }

    // Definícia šírok stĺpcov (v bodoch)
    const colWidths = {
        date: 80,
        time: 50,
        dist: 70,
        odo: 85,
        gps: 150,
        price: 70,
        cons: 70,
        total: 70,
        note: 200
    };

    // Budovanie XML obsahu (SpreadsheetML)
    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Arial" x:CharSet="238" ss:Size="10"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Arial" x:CharSet="238" ss:Bold="1"/>
   <Interior ss:Color="#E0E0E0" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Info">
   <Font ss:FontName="Arial" x:CharSet="238" ss:Bold="1" ss:Size="11"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Kniha Jázd">
  <Table>
   <Column ss:Width="${colWidths.date}"/>
   <Column ss:Width="${colWidths.time}"/>
   <Column ss:Width="${colWidths.time}"/>
   <Column ss:Width="${colWidths.dist}"/>
   <Column ss:Width="${colWidths.odo}"/>
   <Column ss:Width="${colWidths.odo}"/>
   <Column ss:Width="${colWidths.gps}"/>
   <Column ss:Width="${colWidths.gps}"/>
   <Column ss:Width="${colWidths.price}"/>
   <Column ss:Width="${colWidths.cons}"/>
   <Column ss:Width="${colWidths.total}"/>
   <Column ss:Width="${colWidths.note}"/>

   <Row ss:Height="20">
    <Cell ss:StyleID="Info"><Data ss:Type="String">Vozidlo:</Data></Cell>
    <Cell ss:StyleID="Info"><Data ss:Type="String">${car.name}</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="Info"><Data ss:Type="String">EČV:</Data></Cell>
    <Cell ss:StyleID="Info"><Data ss:Type="String">${car.licensePlate || 'Nezadané'}</Data></Cell>
   </Row>
   <Row /> <!-- Prázdny riadok -->

   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Dátum</Data></Cell>
    <Cell><Data ss:Type="String">Štart</Data></Cell>
    <Cell><Data ss:Type="String">Koniec</Data></Cell>
    <Cell><Data ss:Type="String">Vzdialenosť (km)</Data></Cell>
    <Cell><Data ss:Type="String">Tachometer Štart</Data></Cell>
    <Cell><Data ss:Type="String">Tachometer Koniec</Data></Cell>
    <Cell><Data ss:Type="String">GPS Štart</Data></Cell>
    <Cell><Data ss:Type="String">GPS Koniec</Data></Cell>
    <Cell><Data ss:Type="String">Cena paliva (€/L)</Data></Cell>
    <Cell><Data ss:Type="String">Spotreba (L/100km)</Data></Cell>
    <Cell><Data ss:Type="String">Cena celkom (€)</Data></Cell>
    <Cell><Data ss:Type="String">Poznámka</Data></Cell>
   </Row>
`;

    carTrips.forEach(trip => {
        xml += `   <Row>
    <Cell><Data ss:Type="String">${trip.date}</Data></Cell>
    <Cell><Data ss:Type="String">${trip.startTime}</Data></Cell>
    <Cell><Data ss:Type="String">${trip.endTime}</Data></Cell>
    <Cell><Data ss:Type="Number">${trip.distanceKm}</Data></Cell>
    <Cell><Data ss:Type="Number">${trip.startOdometer}</Data></Cell>
    <Cell><Data ss:Type="Number">${trip.endOdometer}</Data></Cell>
    <Cell><Data ss:Type="String">${trip.startGps || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${trip.endGps || ''}</Data></Cell>
    <Cell><Data ss:Type="Number">${trip.fuelPriceAtTime}</Data></Cell>
    <Cell><Data ss:Type="Number">${trip.consumptionAtTime}</Data></Cell>
    <Cell><Data ss:Type="Number">${trip.totalCost}</Data></Cell>
    <Cell><Data ss:Type="String">${(trip.note || '').replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '\'': '&apos;', '"': '&quot;' }[c] || ''))}</Data></Cell>
   </Row>\n`;
    });

    xml += `  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const safePlate = (car.licensePlate || car.name).replace(/[^a-z0-9]/gi, '_');

    link.setAttribute('href', url);
    link.setAttribute('download', `kniha_jazd_${safePlate}_${dateStr}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
