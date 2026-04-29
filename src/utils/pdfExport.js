// src/utils/pdfExport.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
function fmt(d){ return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; }
function fmtSlash(dateStr){
  // dateStr is DD/MM/YYYY, return MM/DD/YY
  const [dd,mm,yy] = dateStr.split('/');
  return `${mm}/${dd}/${yy.slice(2)}`;
}

function getBisemana(offset=0) {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day===0?6:day-1) + offset*14);
  return Array.from({length:14},(_,i)=>{ const d=new Date(monday); d.setDate(monday.getDate()+i); return d; });
}

// === HOJA DE ASISTENCIA (como imagen 1) ===
export function generateHojaAsistencia(employee, post, bisemanaOffset=0) {
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'letter' });
  const days = getBisemana(bisemanaOffset);
  const schedules = JSON.parse(localStorage.getItem('ggpc_schedules')||'[]');
  const schedMap = {};
  schedules.forEach(s=>{ schedMap[s.employeeId+'_'+s.date]=s; });

  const margin = 20;
  let y = margin;

  // Logo placeholder + Header
  doc.setFontSize(14);
  doc.setFont('helvetica','bold');
  doc.text('GLOBAL GUARD PROTECTION CORP.', 105, y+8, {align:'center'});
  doc.setFontSize(9);
  doc.setFont('helvetica','normal');
  doc.text('P. O. BOX 29596 SAN JUAN, P.R. 00929-0596, Tel.787-276-0400', 105, y+14, {align:'center'});

  // Line under header
  y += 20;
  doc.setLineWidth(0.5);
  doc.line(margin, y, 210-margin, y);

  // Title
  y += 8;
  doc.setFontSize(13);
  doc.setFont('helvetica','bold');
  doc.text('HOJA DE ASISTENCIA', 105, y, {align:'center'});

  // Nombre y Puesto
  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica','normal');
  doc.text('Nombre:', margin, y);
  doc.setFont('helvetica','bold');
  doc.text(employee.name.toUpperCase(), margin+20, y);
  // Armado / Desarmado boxes
  doc.setFont('helvetica','normal');
  doc.setFontSize(9);
  doc.text('Armado', 155, y-3);
  doc.rect(175, y-6, 8, 6);
  doc.text('Desarmado', 155, y+4);
  doc.rect(175, y+1, 8, 6);

  y += 6;
  doc.setFontSize(10);
  doc.text('Puesto:', margin, y);
  doc.line(margin+18, y+1, margin+80, y+1);
  if(post) {
    doc.setFont('helvetica','bold');
    doc.text(post.name.toUpperCase(), margin+22, y);
  }

  // Table
  y += 8;
  const colWidths = [22, 32, 26, 18, 18, 26];
  const headers = ['FECHA','DÍA','ENTRADA','SALIDA','SALIDA','TOTAL DE HORAS'];
  const subHeaders = ['','','','ENTRADA','SALIDA',''];
  const mergeLabel = 'TOMA DE ALIMENTOS';

  // Header row
  doc.setFontSize(8);
  doc.setFont('helvetica','bold');
  let x = margin;
  const rowH = 7;

  // Draw outer table border
  const tableW = colWidths.reduce((a,b)=>a+b,0);

  // Header backgrounds
  doc.setFillColor(220,220,220);

  // Row 1 headers (with merged "TOMA DE ALIMENTOS")
  x = margin;
  colWidths.forEach((w,i)=>{
    doc.rect(x, y, w, rowH*2);
    if(i===3||i===4){
      // These will be sub-headers under TOMA DE ALIMENTOS
    } else {
      doc.text(headers[i], x+w/2, y+rowH+2, {align:'center', maxWidth:w-2});
    }
    x+=w;
  });
  // "TOMA DE ALIMENTOS" merged header over cols 3+4
  const tomaX = margin + colWidths[0]+colWidths[1]+colWidths[2];
  const tomaW = colWidths[3]+colWidths[4];
  doc.text(mergeLabel, tomaX+tomaW/2, y+4, {align:'center'});
  doc.line(tomaX, y+rowH, tomaX+tomaW, y+rowH);
  doc.text('SALIDA', tomaX+colWidths[3]/2, y+rowH+4, {align:'center'});
  doc.text('ENTRADA', tomaX+colWidths[3]+colWidths[4]/2, y+rowH+4, {align:'center'});
  // Vertical line between sub-headers
  doc.line(tomaX+colWidths[3], y, tomaX+colWidths[3], y+rowH*2);

  y += rowH*2;

  // Data rows
  doc.setFont('helvetica','normal');
  days.forEach(d => {
    x = margin;
    const dateStr = fmt(d);
    const usDateStr = fmtSlash(dateStr);
    const diaName = DIAS[d.getDay()];
    colWidths.forEach((w,i)=>{
      doc.rect(x, y, w, rowH);
      if(i===0) doc.text(usDateStr, x+w/2, y+5, {align:'center'});
      if(i===1) { doc.setFont('helvetica','bold'); doc.text(diaName.toUpperCase(), x+w/2, y+5, {align:'center'}); doc.setFont('helvetica','normal'); }
      x+=w;
    });
    y += rowH;
  });

  // Total de horas row
  x = margin;
  const totalW = colWidths.slice(0,5).reduce((a,b)=>a+b,0);
  doc.rect(margin, y, totalW, rowH);
  doc.rect(margin+totalW, y, colWidths[5], rowH);
  doc.setFont('helvetica','bold');
  doc.setFontSize(8);
  doc.text('Total de horas', margin+totalW-2, y+5, {align:'right'});

  // Firma
  y += rowH + 15;
  doc.line(margin, y, margin+60, y);
  doc.setFont('helvetica','normal');
  doc.setFontSize(9);
  doc.text('Firma del empleado', margin+30, y+5, {align:'center'});

  doc.save(`Hoja_Asistencia_${employee.name.replace(/ /g,'_')}_${fmt(days[0])}.pdf`);
}

// === TURNOS ASIGNADOS (como imagen 2) ===
export function generateTurnosAsignados(employee, bisemanaOffset=0) {
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'letter' });
  const days = getBisemana(bisemanaOffset);
  const schedules = JSON.parse(localStorage.getItem('ggpc_schedules')||'[]');
  const schedMap = {};
  schedules.forEach(s=>{ schedMap[s.employeeId+'_'+s.date]=s; });

  const margin = 20;
  let y = margin;

  // Watermark logo (light)
  doc.setFontSize(60);
  doc.setTextColor(240,240,240);
  doc.text('GGPC', 105, 150, {align:'center', angle:30});
  doc.setTextColor(0,0,0);

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica','bold');
  doc.text('Turnos Asignados', 105, y, {align:'center'});

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica','bold');
  doc.text(employee.name.toUpperCase(), margin, y);

  y += 8;

  // Table
  doc.autoTable({
    startY: y,
    head: [['Fecha','Día','Turno']],
    body: days.map(d => {
      const dateStr = fmt(d);
      const usDate = fmtSlash(dateStr);
      const diaName = DIAS[d.getDay()];
      const sched = schedMap[employee.id+'_'+dateStr];
      return [usDate, diaName, sched?.shift || ''];
    }),
    styles: { fontSize:11, cellPadding:4, font:'helvetica' },
    headStyles: { fillColor:[255,255,255], textColor:[0,0,0], fontStyle:'bold', lineWidth:0.5, lineColor:[0,0,0] },
    bodyStyles: { textColor:[0,0,0], lineWidth:0.3, lineColor:[180,180,180] },
    columnStyles: {
      0: { cellWidth:35, halign:'center' },
      1: { cellWidth:55, halign:'center', fontStyle:'bold', fontSize:13 },
      2: { cellWidth:70, halign:'center' },
    },
    margin: { left:margin, right:margin },
    theme:'grid',
    didDrawCell: (data) => {
      if(data.section==='body' && data.column.index===1) {
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  // Footer note
  const finalY = doc.lastAutoTable.finalY + 6;
  doc.setFontSize(9);
  doc.setFont('helvetica','italic');
  doc.text('*Este horario está sujeto a cambio.', margin, finalY);

  doc.save(`Turnos_${employee.name.replace(/ /g,'_')}_${fmt(days[0])}.pdf`);
}

// === PDF de todos los empleados de una bisemana ===
export function generateAllSchedulesPDF(employees, posts, bisemanaOffset=0) {
  employees.forEach(emp => {
    const post = posts.find(p=>p.id===emp.postId) || null;
    generateHojaAsistencia(emp, post, bisemanaOffset);
    generateTurnosAsignados(emp, bisemanaOffset);
  });
}
