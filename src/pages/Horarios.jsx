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

function checkConflict(emp, date, shift) {
  if(!emp) return null;
  const d = date instanceof Date ? date : new Date(date.split('/').reverse().join('-'));
  const dow = d.getDay();
  const r = emp.preferred_shifts || emp.restrictions || [];
  const isNight = shift && (shift.includes('PM/') || (parseInt(shift)>=18) || shift.toLowerCase().includes('noche') || shift.startsWith('6:00PM') || shift.startsWith('7:00PM') || shift.startsWith('8:00PM') || shift.startsWith('10:00PM') || shift.startsWith('11:00PM'));
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

export default function Horarios() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeePDF, setSelectedEmployeePDF] = useState('all');
  const [posts, setPosts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [bisemana, setBisemana] = useState(0);
  const [selectedPost, setSelectedPost] = useState('all');
  const [dragEmp, setDragEmp] = useState(null);
  const [modal, setModal] = useState(null);

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
  schedMap[empId + '_' + s.date] = s;
});

  const getEmpSchedule = (empId, date) => schedMap[empId+'_'+fmt(date)];

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
    const existing = schedMap[empId+'_'+dateStr];
    await saveSchedule({
  id: existing?.id || Date.now().toString(),
  employee_id: empId,
  date: dateStr,
  shift,
  post_id: postId || null,
});
    await reload();
    setConflictInfo(null);
    setPendingAssign(null);
  };

  const removeShift = async (empId, date) => {
    const dateStr = fmt(date);
    const s = schedMap[empId+'_'+dateStr];
    if(s) { 
      await deleteSchedule(s.id); 
      await reload(); }
  };

  const onDrop = (empId, date) => {
    if(!dragEmp || dragEmp===empId) return;
    const src = getEmpSchedule(dragEmp, date);
    if(src) { assignShift(empId, date, src.shift, src.post_id || src.postId); }
    setDragEmp(null);
  };

  const openAssign = (empId, date) => {
    const post = posts.find(p=>p.id===selectedPost) || posts[0];
    setModal({ empId, date, postId: post?.id||'', shift: post?.shifts?.[0]||'8:00AM/4:00PM' });
  };

const generateEmployeePDFs = () => {
  const list = selectedEmployeePDF === 'all'
    ? employees
    : employees.filter(e => String(e.id) === String(selectedEmployeePDF));

  list.forEach((emp) => {
    const empSchedules = days.map((day) => {
      const dateStr = fmt(day);

      const sched = schedules.find(s =>
        String(s.employee_id || s.employeeId) === String(emp.id) &&
        s.date === dateStr
      );

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

    const schedulesByPost = {};

    empSchedules
      .filter(s => s.shift)
      .forEach(s => {
        const key = s.postName || 'SIN PUESTO';
        if (!schedulesByPost[key]) schedulesByPost[key] = [];
        schedulesByPost[key].push(s);
      });

    Object.entries(schedulesByPost).forEach(([postName, scheds]) => {
      const doc = new jsPDF('p', 'mm', 'letter');

import logo from '../assets/logo.png';
doc.addImage(logo, 'PNG', 20, 18, 40, 20);
      
      // HEADER
     
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('GLOBAL GUARD PROTECTION CORP.', 65, 25);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('P. O. BOX 29596 SAN JUAN, P.R. 00929-0596, Tel.787-276-0400', 65, 31);

      doc.setDrawColor(245, 197, 24);
      doc.line(70, 33, 200, 33);

      // TITULO
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('HOJA DE ASISTENCIA', 105, 50, { align: 'center' });

      // INFO
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${emp.name}`, 20, 65);
      doc.line(45, 66, 150, 66);

      doc.text(`Puesto: ${postName}`, 20, 78);
      doc.line(45, 79, 150, 79);

      // TABLA 1
      autoTable(doc, {
        startY: 95,
        head: [['FECHA', 'DÍA', 'ENTRADA', 'TOMA DE\nALIMENTOS', 'SALIDA', 'TOTAL\nDE\nHORAS']],
        body: scheds.map(s => [s.date, s.day, '', '', '', '']),
        theme: 'grid',
        styles: {
          fontSize: 9,
          halign: 'center',
          valign: 'middle',
        }
      });

      const finalY = doc.lastAutoTable.finalY + 25;
      doc.line(25, finalY, 95, finalY);
      doc.text('Firma del empleado', 45, finalY + 5);

      // PAGINA 2
      doc.addPage();

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Turnos Asignados', 105, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.text(emp.name.toUpperCase(), 25, 32);
      doc.text(`Puesto: ${postName}`, 25, 39);

      autoTable(doc, {
        startY: 45,
        head: [['Fecha', 'Día', 'Turno']],
        body: scheds.map(s => [
          s.date,
          s.day.charAt(0) + s.day.slice(1).toLowerCase(),
          s.shift || ''
        ]),
        theme: 'grid',
        styles: {
          fontSize: 12,
          halign: 'center',
          valign: 'middle',
        }
      });

      doc.setFontSize(9);
      doc.text('*Este horario está sujeto a cambio.', 20, 245);

      const safeName = emp.name.replace(/[^a-z0-9]/gi, '_');
      const safePost = postName.replace(/[^a-z0-9]/gi, '_');

      doc.save(`Plan_${safeName}_${safePost}_${fmt(days[0]).replaceAll('/','-')}.pdf`);
    });
  });
};


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
            {employees.map(emp => (
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
                  const s = getEmpSchedule(emp.id, d);
                  const isToday = fmt(d)===fmt(new Date());
                  return (
                    <td key={i} style={{ padding:'3px', textAlign:'center', background: isToday?'rgba(245,197,24,0.03)':'transparent', borderLeft: i===7?'2px solid #333':'none' }}
                      onDragOver={e=>e.preventDefault()} onDrop={()=>onDrop(emp.id,d)}>
                      {s?.shift ? (
                        <div style={{ background:'rgba(52,211,153,0.15)', border:'1px solid rgba(52,211,153,0.3)', borderRadius:4, padding:'3px 2px', cursor:'pointer', fontSize:10, color:'#34d399', position:'relative' }}
                          onClick={()=>openAssign(emp.id,d)}
                          title={
  s.shift +
  ((s.post_id || s.postId) && posts.find(p => String(p.id) === String(s.post_id || s.postId))
    ? ' - ' + posts.find(p => String(p.id) === String(s.post_id || s.postId)).name
    : '')
}>
                          <div style={{ fontWeight:600, fontSize:9 }}>{s.shift.replace(':00','').replace('AM','a').replace('PM','p')}</div>
                          <div style={{ color:'#6ee7b7', fontSize:8 }}>
  {posts.find(p => String(p.id) === String(s.post_id || s.postId))?.name || ''}
</div>
                          <button onClick={e=>{e.stopPropagation();removeShift(emp.id,d);}} style={{ position:'absolute',top:-4,right:-4,background:'#ef4444',border:'none',color:'#fff',borderRadius:'50%',width:14,height:14,fontSize:9,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1 }}>✕</button>
                        </div>
                      ) : (
                        <div style={{ color:'#2a2a2a', cursor:'pointer', fontSize:18, lineHeight:'32px', borderRadius:4, border:'1px dashed #222' }}
                          onClick={()=>openAssign(emp.id,d)}
                          onDragOver={e=>e.preventDefault()} onDrop={()=>onDrop(emp.id,d)}>
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
            <select value={modal.postId} onChange={e=>setModal({...modal,postId:e.target.value,shift:posts.find(p=>p.id===e.target.value)?.shifts?.[0]||modal.shift})}
              style={{ width:'100%',padding:'10px',background:'#0d0d0d',border:'1px solid #333',borderRadius:8,color:'#fff',fontSize:14,marginBottom:12,boxSizing:'border-box' }}>
              <option value="">Sin puesto específico</option>
              {posts.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <label style={{ display:'block',color:'#888',fontSize:12,marginBottom:4 }}>Turno</label>
            <select value={modal.shift} onChange={e=>setModal({...modal,shift:e.target.value})}
              style={{ width:'100%',padding:'10px',background:'#0d0d0d',border:'1px solid #333',borderRadius:8,color:'#fff',fontSize:14,marginBottom:16,boxSizing:'border-box' }}>
              {(posts.find(p=>p.id===modal.postId)?.shifts||['8:00AM/4:00PM','4:00PM/12:00AM','12:00AM/8:00AM']).map(s=><option key={s} value={s}>{s}</option>)}
            </select>

            <div style={{ display:'flex',gap:10 }}>
              <button onClick={()=>{ assignShift(modal.empId,modal.date,modal.shift,modal.postId); setModal(null); }}
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
        </div>
      )}
    </div>
  );
}
