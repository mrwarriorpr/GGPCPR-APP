// src/pages/Horarios.jsx
import { useState, useEffect } from 'react';
import { getEmployees, getPosts, getSchedules, saveSchedule, deleteSchedule } from '../data/store';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
 
const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const DIAS_FULL = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

function getBisemana(offset=0) {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day===0?6:day-1) + offset*14);
  return Array.from({length:14},(_,i)=>{ const d=new Date(monday); d.setDate(monday.getDate()+i); return d; });
}

function fmt(d){ return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; }
function formatShift12h(shift) {
  if (!shift) return '';

  if (shift.includes('AM') || shift.includes('PM')) {
    return shift.replace('/', ' - ');
  }

  let start = '';
  let end = '';

  if (shift.includes('/')) {
    [start, end] = shift.split('/');
  } else if (shift.includes('-')) {
    [start, end] = shift.split('-');
  } else {
    return shift;
  }

  const convert = (time) => {
    if (!time) return '';

    let [h, m] = time.split(':');
    h = parseInt(h, 10);
    m = m || '00';

    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;

    return `${h}${m === '00' ? '' : ':' + m} ${ampm}`;
  };

  return `${convert(start)} - ${convert(end)}`;
}

function to24h(hour, min, ampm) {
  if (!hour) return '';
  let h = parseInt(hour, 10);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2,'0')}:${min || '00'}`;
}
function checkConflict(emp, date, shift) {
  if(!emp) return null;
  const d = date instanceof Date ? date : new Date(date.split('/').reverse().join('-'));
  const dow = d.getDay();
  const r = emp.preferred_shifts || emp.restrictions || [];
  const getStartHour = (shift) => {
  if (!shift) return 0;
  const start = shift.split('/')[0];

  // Si viene en 24h → "08:00"
  if (start.includes(':')) {
    return parseInt(start.split(':')[0], 10);
  }

  return 0;
};

const startHour = getStartHour(shift);
const isNight = startHour >= 18 || shift?.toLowerCase().includes('noche');
const isDay = !isNight;
  if(r.includes('only_night') && isDay) return { type:'block', msg:`${emp.name} SOLO trabaja turno nocturno` };
  if(r.includes('only_day') && isNight) return { type:'block', msg:`${emp.name} SOLO trabaja turno diurno` };
  if(r.includes('no_weekend') && (dow===0||dow===6)) return { type:'warn', msg:`${emp.name} normalmente no trabaja fines de semana` };
  if(r.includes('no_monday') && dow===1) return { type:'warn', msg:`${emp.name} normalmente no trabaja lunes` };
  if(r.includes('no_tuesday') && dow===2) return { type:'warn', msg:`${emp.name} normalmente no trabaja martes` };
  if(r.includes('no_wednesday') && dow===3) return { type:'warn', msg:`${emp.name} normalmente no trabaja miércoles` };
  if(r.includes('no_thursday') && dow===4) return { type:'warn', msg:`${emp.name} normalmente no trabaja jueves` };
  if(r.includes('no_friday') && dow===5) return { type:'warn', msg:`${emp.name} normalmente no trabaja viernes` };
  return null;
}

const loadImageAsBase64 = async (url) => {
  const res = await fetch(url);
  const blob = await res.blob();

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

export default function Horarios() {
  const [specialShift, setSpecialShift] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeePDF, setSelectedEmployeePDF] = useState('all');
  const [selectedPostPDF, setSelectedPostPDF] = useState('all');
  const [posts, setPosts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [bisemana, setBisemana] = useState(0);
  const [selectedPost, setSelectedPost] = useState('all');
  const [dragEmp, setDragEmp] = useState(null);
  const [modal, setModal] = useState(null);
 const [noPuedeCubrir, setNoPuedeCubrir] = useState(null);

  const [conflictInfo, setConflictInfo] = useState(null);
  const [pendingAssign, setPendingAssign] = useState(null);

  const days = getBisemana(bisemana);
  const reload = async () => {
  const data = await getSchedules();
  setSchedules(data);
};

useEffect(() => {
  const loadData = async () => {
    try {
      setEmployees(await getEmployees());
      setPosts(await getPosts());
      setSchedules(await getSchedules());
    } catch (error) {
      console.error('Error cargando horarios:', error);
    }
  };

  loadData();
}, []);
  const schedMap = {};
  schedules.forEach(s => {
  const empId = s.employee_id || s.employeeId;
  const key = empId + '_' + s.date;

if (!schedMap[key]) {
  schedMap[key] = [];
}

schedMap[key].push(s);
});

  const getEmpSchedule = (empId, date) => schedMap[empId+'_'+fmt(date)] || [];

  const assignShift = async (empId, date, shift, postId, force=false) => {
    const emp = employees.find(e=>e.id===empId);
    if(!force && emp) {
      const conflict = checkConflict(emp, date, shift);
      if(conflict) {
        setConflictInfo(conflict);
        setPendingAssign({empId,date,shift,postId});
        return;
      }
    }
    const dateStr = fmt(date);
   const existingSameDay = schedules.filter(s =>
  String(s.employee_id || s.employeeId) === String(empId) &&
  s.date === dateStr
);

if (existingSameDay.length > 0 && !force) {
  const confirmAdd = window.confirm(
    'Este empleado ya tiene un turno asignado ese día. ¿Deseas añadir otro turno adicional?'
  );

  if (!confirmAdd) return;
}

await saveSchedule({
  id: Date.now().toString(),
  employee_id: empId,
  date: dateStr,
  shift,
  post_id: postId || null,
});
    await reload();
    setConflictInfo(null);
    setPendingAssign(null);
    setModal(null);
  };
const openNoPuedeCubrir = (schedule) => {
  const vacancy = {
    post: {
      id: schedule.post_id || schedule.postId,
      name: schedule.post_name || posts.find(p => String(p.id) === String(schedule.post_id || schedule.postId))?.name
    },
    date: schedule.date,
    shift: schedule.shift
  };

  setNoPuedeCubrir({
    schedule,
    vacancy
  });
};
  const removeShift = async (empId, date) => {


  const onDrop = (empId, date) => {
    if(!dragEmp || dragEmp===empId) return;
    const srcList = getEmpSchedule(dragEmp, date);
const src = srcList[0];

if (src) {
  assignShift(empId, date, src.shift, src.post_id || src.postId);
}
    setDragEmp(null);
  };

  const openAssign = (empId, date) => {
   const post = selectedPost === 'all'
  ? posts[0]
  : posts.find(p => String(p.id) === String(selectedPost)) || posts[0];
    setSpecialShift(false);
    setModal({
  empId,
  date,
  postId: post?.id || '',
  shift: post?.shifts?.[0] || '08:00/16:00',
  startHour: '8',
  startMin: '00',
  startAmpm: 'AM',
  endHour: '4',
  endMin: '00',
  endAmpm: 'PM'
});
  };

const generateEmployeePDFs = async () => {
  const logoBase64 = await loadImageAsBase64('/logo-ggpc.jpg');
 const employeeSelected = String(selectedEmployeePDF);

const list = employeeSelected === 'all'
  ? employees
  : employees.filter(e => String(e.id) === employeeSelected);

  list.forEach((emp) => {
    const empSchedules = days.flatMap((day) => {
      const dateStr = fmt(day);

      const daySchedules = schedules.filter(s =>
  String(s.employee_id || s.employeeId) === String(emp.id) &&
  s.date === dateStr
);

return daySchedules.map((sched) => {
  const postId = sched?.post_id || sched?.postId;
  const post = posts.find(p => String(p.id) === String(postId));

  return {
    date: dateStr,
    day: DIAS_FULL[day.getDay()].toUpperCase(),
    shift: sched?.shift || '',
    postName: post?.name || sched?.post_name || '',
    hours: sched?.hours || '',
  };
});
    });

    const schedulesByPost = {};

    empSchedules
      .filter(s => s.shift)
      .forEach(s => {
        const key = s.postName || 'SIN PUESTO';
        if (!schedulesByPost[key]) schedulesByPost[key] = [];
        schedulesByPost[key].push(s);
      });

    Object.entries(schedulesByPost)
  .filter(([postName]) => {
    if (selectedPostPDF === 'all') return true;

    const post = posts.find(p => p.name === postName);
    return String(post?.id) === String(selectedPostPDF);
  })
  .forEach(([postName, scheds]) => {
      const doc = new jsPDF('p', 'mm', 'letter');

  // LOGO
doc.addImage(logoBase64, 'jpeg', 15, 10, 42, 42);

// HEADER
doc.setFont('helvetica', 'bold');
doc.setFontSize(15);
doc.text('GLOBAL GUARD PROTECTION CORP.', 60, 28);

doc.setFont('helvetica', 'normal');
doc.setFontSize(9);
doc.text('P. O. BOX 29596 SAN JUAN, P.R. 00929-0596, Tel.787-276-0400', 60, 35);

doc.setDrawColor(245, 197, 24);
doc.setLineWidth(0.3);
doc.line(60, 37, 200, 37);    
    

      // TITULO
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('HOJA DE ASISTENCIA', 105, 50, { align: 'center' });

      // INFO
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setDrawColor(0, 0, 0);
doc.setLineWidth(0.3);
      doc.text(`Nombre: ${emp.name}`, 20, 65);
      doc.line(45, 66, 150, 66);

      doc.setDrawColor(0, 0, 0);
doc.setLineWidth(0.3);
      doc.text(`Puesto: ${postName}`, 20, 78);
      doc.line(45, 79, 150, 79);

      doc.setDrawColor(0, 0, 0);
doc.setLineWidth(0.3);

doc.setDrawColor(0, 0, 0);
doc.setFillColor(255, 255, 255);
doc.setLineWidth(0.4);

doc.text('Armado', 158, 63);
doc.rect(198, 58, 6, 6, 'S');

doc.text('Desarmado', 158, 78);
doc.rect(198, 73, 6, 6, 'S');

      // TABLA 1
      autoTable(doc, {
  startY: 95,
  head: [['FECHA', 'DÍA', 'ENTRADA', 'TOMA DE\nALIMENTOS', 'SALIDA', 'TOTAL\nDE\nHORAS']],
  body: days.map(day => [
    fmt(day),
    DIAS_FULL[day.getDay()].toUpperCase(),
    '',
    '',
    '',
    ''
  ]),
  theme: 'grid',
  styles: {
    fontSize: 9,
    halign: 'center',
    valign: 'middle',
    lineColor: [0, 0, 0],
    lineWidth: 0.2,
    textColor: [0, 0, 0],
    minCellHeight: 8,
  },
  headStyles: {
    fillColor: false,
    textColor: [0, 0, 0],
    fontStyle: 'bold',
  },
  columnStyles: {
    0: { cellWidth: 25 },
    1: { cellWidth: 35 },
    2: { cellWidth: 30 },
    3: { cellWidth: 40 },
    4: { cellWidth: 30 },
    5: { cellWidth: 25 },
  },
  margin: { left: 15, right: 15 },
});
      const finalY = doc.lastAutoTable.finalY + 25;

doc.setDrawColor(0, 0, 0);
doc.setLineWidth(0.3);
doc.line(25, finalY, 95, finalY);

doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.text('Firma del empleado', 45, finalY + 5);

      // PAGINA 2
      doc.addPage();

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Turnos Asignados', 105, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.text(emp.name.toUpperCase(), 25, 32);
      doc.setDrawColor(0, 0, 0);
doc.setLineWidth(0.3);
      doc.text(`Puesto: ${postName}`, 25, 39);
      
      autoTable(doc, {
        startY: 45,
        head: [['Fecha', 'Día', 'Turno']],
       body: days.map(day => {
  const dateStr = fmt(day);
  const found = scheds.find(s => s.date === dateStr);

  return [
    dateStr,
    DIAS_FULL[day.getDay()],
    found ? formatShift12h(found.shift) : ''
  ];
}),
        theme: 'grid',
       styles: {
  fontSize: 12,
  halign: 'center',
  valign: 'middle',
  lineColor: [0, 0, 0],
  lineWidth: 0.2,
  textColor: [0, 0, 0],
  minCellHeight: 12,
},
headStyles: {
  fillColor: false,
  textColor: [0, 0, 0],
  fontStyle: 'normal',
  fontSize: 16,
},
columnStyles: {
  0: { cellWidth: 55 },
  1: { cellWidth: 55, fontStyle: 'bold', fontSize: 16 },
  2: { cellWidth: 55 },
},
    margin: { left: 25, right: 25 },    
      });

      doc.setFontSize(9);
      doc.text('*Este horario está sujeto a cambio.', 20, 245);

      const safeName = emp.name.replace(/[^a-z0-9]/gi, '_');
      const safePost = postName.replace(/[^a-z0-9]/gi, '_');

      doc.save(`Plan_${safeName}_${safePost}_${fmt(days[0]).replaceAll('/','-')}.pdf`);
    });
  });
};

const filteredEmployees = selectedPost === 'all'
  ? employees
  : employees.filter(emp =>
      schedules.some(s =>
        String(s.employee_id || s.employeeId) === String(emp.id) &&
        String(s.post_id || s.postId) === String(selectedPost)
      )
    );
  return (
    <div style={{ color:'#fff' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:'1.6rem', fontWeight:800, color:'#F5C518', margin:0 }}>Horarios</h1>
          <p style={{ color:'#666', margin:'4px 0 0', fontSize:14 }}>
            {fmt(days[0])} — {fmt(days[13])}
          </p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
         <select
  value={selectedEmployeePDF}
  onChange={e => setSelectedEmployeePDF(e.target.value)}
  style={{
    padding:'8px 12px',
    background:'#1a1a1a',
    border:'1px solid #333',
    borderRadius:8,
    color:'#fff'
  }}
>
  <option value="all">Todos los empleados</option>
  {employees.map(emp => (
    <option key={emp.id} value={String(emp.id)}>
      {emp.name}
    </option>
  ))}
</select>

<select
  value={selectedPostPDF}
  onChange={e => setSelectedPostPDF(e.target.value)}
  style={{
    padding:'8px 12px',
    background:'#1a1a1a',
    border:'1px solid #333',
    borderRadius:8,
    color:'#fff'
  }}
>
  <option value="all">Todos los puestos</option>
  {posts.map(post => (
    <option key={post.id} value={String(post.id)}>
      {post.name}
    </option>
  ))}
</select>
          
<button
  onClick={generateEmployeePDFs}
  style={{
    background:'#F5C518',
    border:'none',
    color:'#000',
    borderRadius:8,
    padding:'8px 16px',
    cursor:'pointer',
    fontWeight:700
  }}
>
  Descargar PDF
</button>
          <button onClick={()=>setBisemana(b=>b-1)} style={{ background:'#1a1a1a', border:'1px solid #333', color:'#fff', borderRadius:8, padding:'8px 16px', cursor:'pointer' }}>← Anterior</button>
          <button onClick={()=>setBisemana(0)} style={{ background:'rgba(245,197,24,0.15)', border:'1px solid rgba(245,197,24,0.3)', color:'#F5C518', borderRadius:8, padding:'8px 16px', cursor:'pointer' }}>Bisemana actual</button>
          <button onClick={()=>setBisemana(b=>b+1)} style={{ background:'#1a1a1a', border:'1px solid #333', color:'#fff', borderRadius:8, padding:'8px 16px', cursor:'pointer' }}>Siguiente →</button>
        </div>
      </div>

      {/* Filtro por puesto */}
      <div style={{ marginBottom:16 }}>
        <select value={selectedPost} onChange={e=>setSelectedPost(e.target.value)}
          style={{ padding:'8px 14px', background:'#1a1a1a', border:'1px solid #333', borderRadius:8, color:'#fff', fontSize:14 }}>
          <option value="all">Todos los puestos</option>
          {posts.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Leyenda */}
      <div style={{ display:'flex', gap:16, marginBottom:16, fontSize:12, flexWrap:'wrap' }}>
        <span style={{ color:'#34d399' }}>● Turno asignado</span>
        <span style={{ color:'#666' }}>○ Sin turno (click para asignar)</span>
        <span style={{ color:'#fbbf24' }}>⚠ Restricción (con override)</span>
        <span style={{ color:'#f87171' }}>🚫 Bloqueado por restricción</span>
      </div>

      {/* Tabla bisemana */}
      <div style={{ overflowX:'auto' }}>
        <table style={{ borderCollapse:'collapse', minWidth:900, width:'100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign:'left', padding:'8px 12px', color:'#666', fontSize:12, borderBottom:'1px solid #222', minWidth:150 }}>Empleado</th>
              {days.map((d,i) => {
                const isToday = fmt(d)===fmt(new Date());
                return (
                  <th key={i} style={{ padding:'6px 4px', color: isToday ? '#F5C518' : '#666', fontSize:11, borderBottom:'1px solid #222', textAlign:'center', minWidth:60,
                    borderLeft: i===7 ? '2px solid #333' : 'none' }}>
                    <div style={{ fontWeight:600 }}>{DIAS[d.getDay()]}</div>
                    <div style={{ fontSize:10 }}>{d.getDate()}/{d.getMonth()+1}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(emp => (
              <tr key={emp.id} style={{ borderBottom:'1px solid #1a1a1a' }}
                draggable onDragStart={()=>setDragEmp(emp.id)}>
                <td style={{ padding:'8px 12px', fontSize:13, whiteSpace:'nowrap' }}>
                  <div style={{ fontWeight:500 }}>{emp.name}</div>
                  <div style={{ color:'#555', fontSize:11 }}>
                    {emp.type==='parttime'?'Part-time':'Full-time'}
                    {(emp.preferred_shifts || emp.restrictions || []).includes('only_night') && ' · 🌙'}
{(emp.preferred_shifts || emp.restrictions || []).includes('only_day') && ' · ☀️'}
                  </div>
                </td>
                {days.map((d,i) => {
                 const daySchedules = getEmpSchedule(emp.id, d).filter(s => selectedPost === 'all' || String(s.post_id || s.postId) === String(selectedPost));

                  const isToday = fmt(d)===fmt(new Date());
                  return (
                    <td key={i} style={{ padding:'3px', textAlign:'center', background: isToday?'rgba(245,197,24,0.03)':'transparent', borderLeft: i===7?'2px solid #333':'none' }}
                      onDragOver={e=>e.preventDefault()} onDrop={()=>onDrop(emp.id,d)}>
                      {daySchedules.length > 0 ? (
  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
    {daySchedules.map((s) => (
      <div
        key={s.id}
        style={{
          background:'rgba(52,211,153,0.15)',
          border:'1px solid rgba(52,211,153,0.3)',
          borderRadius:4,
          padding:'3px 2px',
          cursor:'pointer',
          fontSize:10,
          color:'#34d399',
          position:'relative'
        }}
        onClick={()=>openAssign(emp.id,d)}
      >
        <div style={{ fontWeight:600, fontSize:9 }}>
          {formatShift12h(s.shift)}
        </div>

        <div style={{ color:'#6ee7b7', fontSize:8 }}>
          {posts.find(p => String(p.id) === String(s.post_id || s.postId))?.name || ''}
        </div>

        {/* BOTÓN ELIMINAR */}
<button
  onClick={e=>{ e.stopPropagation(); deleteSchedule(s.id).then(reload); }}
  style={{
    position:'absolute',
    top:-4,
    right:-4,
    background:'#ef4444',
    border:'none',
    color:'#fff',
    borderRadius:'50%',
    width:14,
    height:14,
    fontSize:9,
    cursor:'pointer',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    lineHeight:1
  }}
>
  ✕
</button>

{/* BOTÓN NO PUEDE CUBRIR */}
<button
  onClick={e => {
    e.stopPropagation();
    openNoPuedeCubrir(s);
  }}
  style={{
    position:'absolute',
    bottom:-4,
    right:-4,
    background:'#fbbf24',
    border:'none',
    color:'#000',
    borderRadius:'50%',
    width:14,
    height:14,
    fontSize:9,
    cursor:'pointer',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    lineHeight:1
  }}
>
  !
</button>
  style={{
    position:'absolute',
    bottom:-4,
    right:-4,
    background:'#fbbf24',
    border:'none',
    color:'#000',
    borderRadius:'50%',
    width:14,
    height:14,
    fontSize:9,
    cursor:'pointer',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    lineHeight:1
  }}
>
  !
</button>
          style={{
            position:'absolute',
            top:-4,
            right:-4,
            background:'#ef4444',
            border:'none',
            color:'#fff',
            borderRadius:'50%',
            width:14,
            height:14,
            fontSize:9,
            cursor:'pointer',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            lineHeight:1
          }}
        >
          ✕
        </button>
      </div>
    ))}
  </div>
) : (
  <div
    style={{
      color:'#2a2a2a',
      cursor:'pointer',
      fontSize:18,
      lineHeight:'32px',
      borderRadius:4,
      border:'1px dashed #222'
    }}
    onClick={()=>openAssign(emp.id,d)}
    onDragOver={e=>e.preventDefault()}
    onDrop={()=>onDrop(emp.id,d)}
  >
    +
  </div>
)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal asignar turno */}
      {modal && !conflictInfo && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}
          onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={{ background:'#1a1a1a',border:'1px solid #333',borderRadius:16,padding:'2rem',width:'100%',maxWidth:420 }}>
            <h3 style={{ color:'#F5C518',margin:'0 0 1rem',fontSize:16 }}>
              Asignar turno — {employees.find(e=>e.id===modal.empId)?.name}
            </h3>
            <p style={{ color:'#888',fontSize:13,margin:'0 0 1rem' }}>{DIAS_FULL[modal.date.getDay()]}, {fmt(modal.date)}</p>

           <label style={{ display:'block',color:'#888',fontSize:12,marginBottom:4 }}>Puesto</label>
<select
  value={modal.postId}
  onChange={e => {
    const post = posts.find(p => String(p.id) === String(e.target.value));
    setModal({
      ...modal,
      postId: e.target.value,
      shift: post?.shifts?.[0] || '08:00/16:00'
    });
  }}
  style={{ width:'100%',padding:'10px',background:'#0d0d0d',border:'1px solid #333',borderRadius:8,color:'#fff',fontSize:14,marginBottom:12,boxSizing:'border-box' }}
>
  <option value="">Sin puesto específico</option>
  {posts.map(p => (
    <option key={p.id} value={p.id}>{p.name}</option>
  ))}
</select>

<label style={{ display:'block',color:'#888',fontSize:12,marginBottom:4 }}>Turno</label>
<select
  value={modal.shift}
  onChange={e => setModal({ ...modal, shift: e.target.value })}
  style={{ width:'100%',padding:'10px',background:'#0d0d0d',border:'1px solid #333',borderRadius:8,color:'#fff',fontSize:14,marginBottom:10,boxSizing:'border-box' }}
>
  {(posts.find(p => String(p.id) === String(modal.postId))?.shifts || ['08:00/16:00']).map(s => (
  <option key={s} value={s}>{formatShift12h(s)}</option>
))}
</select>

<button
  type="button"
  onClick={() => setSpecialShift(v => !v)}
  style={{ marginBottom:12,padding:'6px 10px',background:'#222',color:'#F5C518',border:'1px solid #444',borderRadius:6,cursor:'pointer',fontSize:12 }}
>
  {specialShift ? 'Usar turno predeterminado' : 'Horario especial'}
</button>

{specialShift && (
  <>
    {/* ENTRADA */}
    <label style={{ display:'block',color:'#888',fontSize:12,marginBottom:4 }}>Entrada</label>
<div style={{ display:'flex', gap:6, marginBottom:10 }}>
  <input type="number" min="1" max="12"
    value={modal.startHour || ''}
    onChange={e => setModal({ ...modal, startHour: e.target.value })}
    style={{ width:'60px', padding:'8px' }}
  />

  <select value={modal.startMin || '00'}
    onChange={e => setModal({ ...modal, startMin: e.target.value })}>
    <option value="00">00</option>
    <option value="15">15</option>
    <option value="30">30</option>
    <option value="45">45</option>
  </select>

  <select value={modal.startAmpm || 'AM'}
    onChange={e => setModal({ ...modal, startAmpm: e.target.value })}>
    <option>AM</option>
    <option>PM</option>
  </select>
</div>

{/* SALIDA */}
<label style={{ display:'block',color:'#888',fontSize:12,marginBottom:4 }}>Salida</label>
<div style={{ display:'flex', gap:6, marginBottom:16 }}>
  <input type="number" min="1" max="12"
    value={modal.endHour || ''}
    onChange={e => setModal({ ...modal, endHour: e.target.value })}
    style={{ width:'60px', padding:'8px' }}
  />

  <select value={modal.endMin || '00'}
    onChange={e => setModal({ ...modal, endMin: e.target.value })}>
    <option value="00">00</option>
    <option value="15">15</option>
    <option value="30">30</option>
    <option value="45">45</option>
  </select>

  <select value={modal.endAmpm || 'PM'}
    onChange={e => setModal({ ...modal, endAmpm: e.target.value })}>
    <option>AM</option>
    <option>PM</option>
  </select>
</div>
  </>
)}
            <div style={{ display:'flex',gap:10 }}>
              <button onClick={() => {
  if (specialShift && (!modal.startHour || !modal.endHour)) {
    alert('Debes completar la hora de entrada y salida.');
    return;
  }

  const shift = specialShift
    ? `${to24h(modal.startHour, modal.startMin, modal.startAmpm)}/${to24h(modal.endHour, modal.endMin, modal.endAmpm)}`
    : modal.shift;

  assignShift(modal.empId, modal.date, shift, modal.postId);
}}
  style={{ flex:1,padding:'10px',background:'#F5C518',color:'#000',border:'none',borderRadius:8,fontWeight:700,cursor:'pointer' }}>
  Asignar
</button>
              <button onClick={()=>setModal(null)} style={{ flex:1,padding:'10px',background:'rgba(220,38,38,0.15)',color:'#f87171',border:'1px solid rgba(220,38,38,0.3)',borderRadius:8,cursor:'pointer',fontWeight:600 }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal conflicto/restricción */}
      {conflictInfo && pendingAssign && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
          <div style={{ background:'#1a1a1a',border:`1px solid ${conflictInfo.type==='block'?'rgba(239,68,68,0.5)':'rgba(251,191,36,0.5)'}`,borderRadius:16,padding:'2rem',width:'100%',maxWidth:420 }}>
            <div style={{ fontSize:32,textAlign:'center',marginBottom:12 }}>{conflictInfo.type==='block'?'🚫':'⚠️'}</div>
            <h3 style={{ color:conflictInfo.type==='block'?'#f87171':'#fbbf24',margin:'0 0 1rem',textAlign:'center' }}>
              {conflictInfo.type==='block'?'Restricción bloqueada':'Atención — Restricción'}
            </h3>
            <p style={{ color:'#ccc',fontSize:14,textAlign:'center',marginBottom:'1.5rem' }}>{conflictInfo.msg}</p>
            {conflictInfo.type==='block' ? (
              <div>
                <p style={{ color:'#888',fontSize:12,textAlign:'center',marginBottom:12 }}>
                  Puedes hacer override si lo autorizas manualmente (ej. llamaste al guardia y aceptó).
                </p>
                <div style={{ display:'flex',gap:10 }}>
                  <button onClick={()=>{ assignShift(pendingAssign.empId,pendingAssign.date,pendingAssign.shift,pendingAssign.postId,true); setModal(null); }}
                    style={{ flex:1,padding:'10px',background:'rgba(239,68,68,0.2)',color:'#f87171',border:'1px solid rgba(239,68,68,0.4)',borderRadius:8,cursor:'pointer',fontWeight:700 }}>
                    Sí, autorizar override
                  </button>
                  <button onClick={()=>{ setConflictInfo(null); setPendingAssign(null); }}
                    style={{ flex:1,padding:'10px',background:'#333',color:'#fff',border:'1px solid #444',borderRadius:8,cursor:'pointer',fontWeight:600 }}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex',gap:10 }}>
                <button onClick={()=>{ assignShift(pendingAssign.empId,pendingAssign.date,pendingAssign.shift,pendingAssign.postId,true); setModal(null); }}
                  style={{ flex:1,padding:'10px',background:'#F5C518',color:'#000',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700 }}>
                  Sí, asignar de todas formas
                </button>
                <button onClick={()=>{ setConflictInfo(null); setPendingAssign(null); }}
                  style={{ flex:1,padding:'10px',background:'#333',color:'#fff',border:'1px solid #444',borderRadius:8,cursor:'pointer',fontWeight:600 }}>
                  No, cancelar
                </button>
              </div>
            )}
          </div>
         {noPuedeCubrir && (
  <div style={{
    position:'fixed',
    inset:0,
    background:'rgba(0,0,0,0.8)',
    zIndex:300,
    display:'flex',
    alignItems:'center',
    justifyContent:'center'
  }}>
    <div style={{
      background:'#1a1a1a',
      padding:20,
      borderRadius:12,
      width:400
    }}>
      <h3 style={{ color:'#F5C518' }}>Reemplazo de turno</h3>

      <p style={{ color:'#f87171' }}>
        {formatShift12h(noPuedeCubrir.schedule.shift)} en {noPuedeCubrir.vacancy.post.name}
      </p>

      <div style={{ marginTop:10 }}>
        <div style={{ color:'#F5C518', fontSize:12, fontWeight:700 }}>
          Sugerencias:
        </div>

        {getAvailable(noPuedeCubrir.vacancy).recommended.slice(0,5).map(({ emp }) => (
          <div key={emp.id} style={{ marginTop:6, color:'#34d399' }}>
            • {emp.name}
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:10, marginTop:20 }}>
        <button
          onClick={async () => {
            await deleteSchedule(noPuedeCubrir.schedule.id);
            setNoPuedeCubrir(null);
            await reload();
          }}
          style={{
            flex:1,
            background:'#f87171',
            padding:10,
            borderRadius:6
          }}
        >
          Liberar turno
        </button>

        <button
          onClick={() => setNoPuedeCubrir(null)}
          style={{
            flex:1,
            background:'#444',
            padding:10,
            borderRadius:6
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}
        </div>
      )}
    </div>
  );
}
