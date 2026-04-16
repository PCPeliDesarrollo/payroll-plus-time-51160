import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PRIMARY_COLOR: [number, number, number] = [155, 89, 182]; // Purple matching the app
const HEADER_BG: [number, number, number] = [142, 68, 173];
const LIGHT_BG: [number, number, number] = [245, 238, 248];
const TEXT_COLOR: [number, number, number] = [44, 44, 44];
const MUTED_COLOR: [number, number, number] = [120, 120, 120];

function addHeader(doc: jsPDF, title: string, startDate: string, endDate: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Purple header bar
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 18);

  // Date range
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const formattedStart = format(new Date(startDate + 'T00:00:00'), "d 'de' MMMM yyyy", { locale: es });
  const formattedEnd = format(new Date(endDate + 'T00:00:00'), "d 'de' MMMM yyyy", { locale: es });
  doc.text(`Período: ${formattedStart} — ${formattedEnd}`, 14, 28);

  // Generated date
  doc.text(
    `Generado: ${format(new Date(), "d/MM/yyyy HH:mm")}`,
    pageWidth - 14,
    28,
    { align: 'right' }
  );
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setDrawColor(...MUTED_COLOR);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

    doc.setFontSize(8);
    doc.setTextColor(...MUTED_COLOR);
    doc.text('RRHH PcPeli', 14, pageHeight - 8);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }
}

function addSummaryBox(doc: jsPDF, items: { label: string; value: string }[], startY: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const boxWidth = pageWidth - 28;
  const boxHeight = 22;

  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(14, startY, boxWidth, boxHeight, 3, 3, 'F');

  const colWidth = boxWidth / items.length;
  items.forEach((item, i) => {
    const x = 14 + colWidth * i + colWidth / 2;
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_COLOR);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, x, startY + 9, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(...TEXT_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, x, startY + 18, { align: 'center' });
  });

  return startY + boxHeight + 8;
}

export function exportAttendancePDF(data: any[], startDate: string, endDate: string, employeeName?: string) {
  const doc = new jsPDF('landscape');
  const title = employeeName ? `Fichajes — ${employeeName}` : 'Informe de Fichajes';
  addHeader(doc, title, startDate, endDate);

  const totalEntries = data.length;
  const withCheckout = data.filter(d => d.check_out_time).length;
  const pending = totalEntries - withCheckout;

  const tableY = addSummaryBox(doc, [
    { label: 'Total Registros', value: totalEntries.toString() },
    { label: 'Completados', value: withCheckout.toString() },
    { label: 'Sin Salida', value: pending.toString() },
  ], 44);

  const rows = data.map(item => {
    const profile = item.profiles || {};
    const checkInLoc = item.check_in_latitude && item.check_in_longitude
      ? `${Number(item.check_in_latitude).toFixed(4)}, ${Number(item.check_in_longitude).toFixed(4)}`
      : '—';
    const checkOutLoc = item.check_out_latitude && item.check_out_longitude
      ? `${Number(item.check_out_latitude).toFixed(4)}, ${Number(item.check_out_longitude).toFixed(4)}`
      : '—';

    return [
      item.date || '',
      profile.full_name || '',
      profile.employee_id || '',
      profile.department || '—',
      item.check_in_time ? format(new Date(item.check_in_time), 'HH:mm') : '—',
      checkInLoc,
      item.check_out_time ? format(new Date(item.check_out_time), 'HH:mm') : '—',
      checkOutLoc,
      item.total_hours || '—',
      item.status || '',
    ];
  });

  autoTable(doc, {
    startY: tableY,
    head: [['Fecha', 'Empleado', 'ID', 'Depto.', 'Entrada', 'Ubic. Entrada', 'Salida', 'Ubic. Salida', 'Horas', 'Estado']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: HEADER_BG,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: TEXT_COLOR,
      cellPadding: 3,
    },
    alternateRowStyles: { fillColor: [250, 246, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 18 },
      4: { halign: 'center', cellWidth: 18 },
      6: { halign: 'center', cellWidth: 18 },
      8: { halign: 'center', cellWidth: 16 },
      9: { halign: 'center', cellWidth: 18 },
    },
    margin: { left: 14, right: 14 },
  });

  addFooter(doc);
  const fileName = employeeName
    ? `fichajes_${employeeName.replace(/\s+/g, '_')}_${startDate}_${endDate}.pdf`
    : `fichajes_${startDate}_${endDate}.pdf`;
  doc.save(fileName);
}

export function exportVacationsPDF(data: any[], startDate: string, endDate: string) {
  const doc = new jsPDF('landscape');
  addHeader(doc, 'Informe de Vacaciones', startDate, endDate);

  const total = data.length;
  const approved = data.filter(d => d.status === 'approved').length;
  const pending = data.filter(d => d.status === 'pending').length;
  const rejected = data.filter(d => d.status === 'rejected').length;

  const tableY = addSummaryBox(doc, [
    { label: 'Total Solicitudes', value: total.toString() },
    { label: 'Aprobadas', value: approved.toString() },
    { label: 'Pendientes', value: pending.toString() },
    { label: 'Rechazadas', value: rejected.toString() },
  ], 44);

  const statusMap: Record<string, string> = {
    pending: 'Pendiente',
    approved: 'Aprobada',
    rejected: 'Rechazada',
  };

  const rows = data.map(item => {
    const profile = item.profiles || {};
    return [
      profile.full_name || '',
      profile.employee_id || '',
      profile.department || '—',
      item.start_date || '',
      item.end_date || '',
      item.total_days?.toString() || '',
      statusMap[item.status] || item.status || '',
      item.reason || '—',
      item.comments || '—',
      item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : '',
    ];
  });

  autoTable(doc, {
    startY: tableY,
    head: [['Empleado', 'ID', 'Depto.', 'Inicio', 'Fin', 'Días', 'Estado', 'Motivo', 'Comentarios', 'Solicitud']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: HEADER_BG,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: TEXT_COLOR,
      cellPadding: 3,
    },
    alternateRowStyles: { fillColor: [250, 246, 252] },
    columnStyles: {
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 22 },
      5: { halign: 'center', cellWidth: 14 },
      6: { halign: 'center', cellWidth: 20 },
      9: { halign: 'center', cellWidth: 22 },
    },
    margin: { left: 14, right: 14 },
  });

  addFooter(doc);
  doc.save(`vacaciones_${startDate}_${endDate}.pdf`);
}

export function exportScheduleChangesPDF(data: any[], startDate: string, endDate: string) {
  const doc = new jsPDF('landscape');
  addHeader(doc, 'Informe de Cambios de Horario', startDate, endDate);

  const total = data.length;
  const approved = data.filter(d => d.status === 'approved').length;
  const pending = data.filter(d => d.status === 'pending').length;

  const tableY = addSummaryBox(doc, [
    { label: 'Total Solicitudes', value: total.toString() },
    { label: 'Aprobadas', value: approved.toString() },
    { label: 'Pendientes', value: pending.toString() },
  ], 44);

  const statusMap: Record<string, string> = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
  };

  const rows = data.map(item => {
    const profile = item.profiles || {};
    return [
      profile.full_name || '',
      profile.employee_id || '',
      profile.department || '—',
      item.requested_date || '',
      item.current_check_in || '—',
      item.current_check_out || '—',
      item.requested_check_in || '—',
      item.requested_check_out || '—',
      item.reason || '—',
      statusMap[item.status] || item.status || '',
      item.admin_comments || '—',
    ];
  });

  autoTable(doc, {
    startY: tableY,
    head: [['Empleado', 'ID', 'Depto.', 'Fecha', 'Entrada Actual', 'Salida Actual', 'Entrada Solic.', 'Salida Solic.', 'Motivo', 'Estado', 'Comentarios']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: HEADER_BG,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: TEXT_COLOR,
      cellPadding: 3,
    },
    alternateRowStyles: { fillColor: [250, 246, 252] },
    columnStyles: {
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
      7: { halign: 'center' },
      9: { halign: 'center', cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
  });

  addFooter(doc);
  doc.save(`cambios_horario_${startDate}_${endDate}.pdf`);
}
