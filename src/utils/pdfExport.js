// src/utils/pdfExport.js
// PDF generation for biweekly work plans

export async function exportScheduleToPDF(schedule, biweekStart, biweekEnd, employees, posts) {
  // Dynamic import to avoid SSR issues
  const jsPDF = (await import('jspdf')).default;
  await import('jspdf-autotable');
  
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  
  const formatDateStr = (d) => new Date(d).toLocaleDateString('es-PR', { month: 'short', day: 'numeric', year: 'numeric' });
  const startStr = formatDateStr(biweekStart);
  const endStr = formatDateStr(biweekEnd);
  
  // Header
  doc.setFillColor(15, 40, 80);
  doc.rect(0, 0, 280, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('GGPC SECURITY', 14, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Plan de Trabajo Bisemanal: ${startStr} - ${endStr}`, 80, 12);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-PR')}`, 210, 12);
  
  doc.setTextColor(0, 0, 0);
  
  // Page 1: Employee schedule grid
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de Horarios por Empleado', 14, 28);
  
  const dayHeaders = ['Empleado', 'Puesto', 'L', 'M', 'X', 'J', 'V', 'S', 'D', 'L', 'M', 'X', 'J', 'V', 'S', 'D', 'Hrs/Bsm'];
  
  // Build rows per employee
  const rows = employees.filter(e => e.status === 'active').map(emp => {
    const row = [emp.name, ''];
    
    // 14 days
    for (let day = 0; day < 14; day++) {
      const d = new Date(biweekStart);
      d.setDate(d.getDate() + day);
      const dateStr = d.toISOString().split('T')[0];
      
      const empSchedules = schedule.filter(s => s.employeeId === emp.id && s.date === dateStr);
      if (empSchedules.length > 0) {
        const s = empSchedules[0];
        const shiftLabel = s.shift.replace(':00', '').replace('-', '-');
        row.push(shiftLabel + (s.isOvertime ? '*' : ''));
      } else {
        row.push('—');
      }
    }
    
    const totalHours = schedule.filter(s => s.employeeId === emp.id).reduce((sum, s) => sum + (s.hours || 0), 0);
    row.push(totalHours.toFixed(1));
    // Update post name
    const post = posts.find(p => p.id === emp.postAssignment);
    row[1] = post ? post.name.substring(0, 12) : '—';
    
    return row;
  });
  
  doc.autoTable({
    startY: 32,
    head: [dayHeaders],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [15, 40, 80], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 20 },
      17: { cellWidth: 14, fontStyle: 'bold' },
    },
  });
  
  // Page 2: Vacancies
  const vacancies = schedule.filter(s => s.isVacancy);
  if (vacancies.length > 0) {
    doc.addPage();
    doc.setFillColor(15, 40, 80);
    doc.rect(0, 0, 280, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('GGPC SECURITY — Vacantes Identificadas', 14, 12);
    doc.setTextColor(0, 0, 0);
    
    doc.setFontSize(11);
    doc.text('Turnos con Vacante en la Bisemana', 14, 28);
    
    const vacRows = vacancies.map(v => [
      new Date(v.date).toLocaleDateString('es-PR', { weekday: 'long', month: 'short', day: 'numeric' }),
      v.postName,
      v.shift,
      v.hours + 'h',
    ]);
    
    doc.autoTable({
      startY: 32,
      head: [['Fecha', 'Puesto', 'Turno', 'Horas']],
      body: vacRows,
      theme: 'grid',
      headStyles: { fillColor: [180, 30, 30], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9 },
    });
  }
  
  // Page 3: Per-post schedule
  doc.addPage();
  doc.setFillColor(15, 40, 80);
  doc.rect(0, 0, 280, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('GGPC SECURITY — Horarios por Puesto', 14, 12);
  doc.setTextColor(0, 0, 0);
  
  let yPos = 28;
  posts.forEach(post => {
    if (yPos > 170) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${post.name} — ${post.location}`, 14, yPos);
    yPos += 4;
    
    const postSchedule = schedule.filter(s => s.postId === post.id);
    const postRows = postSchedule.map(s => [
      new Date(s.date).toLocaleDateString('es-PR', { weekday: 'short', month: 'short', day: 'numeric' }),
      s.shift,
      s.employeeName,
      s.isVacancy ? 'VACANTE' : (s.isOvertime ? 'Overtime' : 'Regular'),
    ]);
    
    if (postRows.length > 0) {
      doc.autoTable({
        startY: yPos,
        head: [['Fecha', 'Turno', 'Guardia', 'Estado']],
        body: postRows,
        theme: 'grid',
        headStyles: { fillColor: [40, 70, 120], textColor: 255, fontSize: 8 },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
      });
      yPos = doc.lastAutoTable.finalY + 8;
    }
  });
  
  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`GGPC Security — Documento Confidencial — Página ${i} de ${pageCount}`, 14, 208);
    doc.text('* Turno con overtime', 200, 208);
  }
  
  doc.save(`GGPC_Horario_${biweekStart.toISOString().split('T')[0]}.pdf`);
}
