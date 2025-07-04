// components/ExportarPDF.jsx
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ExportarPDF({ registros, filtros }) {
  const generarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Informe de Cambios de Tóner', 14, 20);

    // Mostrar filtros aplicados
    let filtroTexto = '';
    if (filtros.cliente) filtroTexto += `Cliente: ${filtros.cliente}\n`;
    if (filtros.serie) filtroTexto += `Serie: ${filtros.serie}\n`;
    if (filtros.toner) filtroTexto += `Tóner: ${filtros.toner}\n`;
    if (filtros.rango) filtroTexto += `Desde: ${filtros.rango.inicio} - Hasta: ${filtros.rango.fin}\n`;
    if (filtros.limite) filtroTexto += `Últimos ${filtros.limite} registros\n`;

    doc.setFontSize(10);
    doc.text(filtroTexto, 14, 30);

    autoTable(doc, {
      startY: 40,
      head: [['Fecha', 'Cliente', 'Serie', 'Tóner', 'Último', 'Actual', 'Obs.']],
      body: registros.map((r) => [
        r.fecha,
        r.clientes?.nombre || '-',
        r.serie_maquina,
        r.toner?.modelo || '-',
        r.ultimo_contador,
        r.contador_actual,
        r.observaciones || '',
      ]),
    });

    doc.save('cambios_toner.pdf');
  };

  return (
    <button onClick={generarPDF} className="bg-red-600 text-white px-4 py-2 rounded">
      Exportar PDF
    </button>
  );
}
