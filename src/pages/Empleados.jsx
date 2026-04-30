// src/pages/Empleados.jsx
import { useState, useEffect } from 'react';
import { getEmployees, saveEmployee, deleteEmployee } from '../data/store';

const BLANK = { name:'', position:'Guardia', phone:'', email:'', employeeId:'', type:'fulltime', restrictions:[], notes:'' };
const RESTRICTION_OPTIONS = [
  { value:'only_day',   label:'Solo turno diurno (6am-6pm)' },
  { value:'only_night', label:'Solo turno nocturno (6pm-6am)' },
  { value:'no_weekend', label:'No trabaja fines de semana' },
  { value:'no_monday',  label:'No disponible lunes' },
  { value:'no_tuesday', label:'No disponible martes' },
  { value:'no_wednesday',label:'No disponible miércoles' },
  { value:'no_thursday',label:'No disponible jueves' },
  { value:'no_friday',  label:'No disponible viernes' },
];

const S = {
  page: { color:'#fff' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' },
  title: { fontSize:'1.6rem', fontWeight:800, color:'#F5C518', margin:0 },
  btn: { background:'#F5C518', color:'#000', border:'none', borderRadius:8, padding:'10px 20px', fontWeight:700, cursor:'pointer', fontSize:14 },
  btnRed: { background:'rgba(220,38,38,0.15)', color:'#f87171', border:'1px solid rgba(220,38,38,0.3)', borderRadius:6, padding:'6px 12px', cursor:'pointer', fontSize:12 },
  btnEdit: { background:'rgba(245,197,24,0.15)', color:'#F5C518', border:'1px solid rgba(245,197,24,0.3)', borderRadius:6, padding:'6px 12px', cursor:'pointer', fontSize:12 },
  card: { background:'#1a1a1a', border:'1px solid #222', borderRadius:12, padding:'1.25rem', display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 },
  badge: (color) => ({ background:`rgba(${color},0.15)`, border:`1px solid rgba(${color},0.3)`, borderRadius:4, padding:'2px 8px', fontSize:11 }),
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  modal: { background:'#1a1a1a', border:'1px solid #333', borderRadius:16, padding:'2rem', width:'100%', maxWidth:500, maxHeight:'90vh', overflowY:'auto' },
  label: { display:'block', color:'#888', fontSize:12, marginBottom:4, marginTop:16 },
  input: { width:'100%', padding:'10px 12px', background:'#0d0d0d', border:'1px solid #333', borderRadius:8, color:'#fff', fontSize:14, boxSizing:'border-box' },
};

export default function Empleados() {
  const [employees, setEmployees] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [search, setSearch] = useState('');

  const reload = async () => {
  try {
    const data = await getEmployees();
    setEmployees(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Error cargando empleados:', error);
  }
};
  useEffect(() => { reload(); }, []);

  const open = (emp=null) => { setForm(emp ? {...emp} : {...BLANK, id: Date.now().toString()}); setModal(true); };
  const close = () => setModal(false);

  const save = async () => {
    if(!form.name.trim()){ alert('El nombre es requerido'); return; }
    await saveEmployee(form);
await reload();
    close();
  };

  const del = async (id) => {
   if(window.confirm('¿Eliminar este empleado?')){
  await deleteEmployee(id);
  await reload();
  };

  const toggleRestriction = (val) => {
    setForm(f => ({
      ...f,
      restrictions: f.restrictions?.includes(val)
        ? f.restrictions.filter(r=>r!==val)
        : [...(f.restrictions||[]), val]
    }));
  };

  const filtered = Array.isArray(employees)
  ? employees.filter(e => (e.name || '').toLowerCase().includes(search.toLowerCase()))
  : [];

  const restrictionLabel = { only_day:'Solo día', only_night:'Solo noche', no_weekend:'Sin fines de semana', no_monday:'Sin lunes', no_tuesday:'Sin martes', no_wednesday:'Sin miércoles', no_thursday:'Sin jueves', no_friday:'Sin viernes' };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Empleados</h1>
          <p style={{ color:'#666', margin:'4px 0 0', fontSize:14 }}>{employees.length} empleados registrados</p>
        </div>
        <button style={S.btn} onClick={() => open()}>+ Añadir empleado</button>
      </div>

      <input placeholder="Buscar empleado..." value={search} onChange={e=>setSearch(e.target.value)}
        style={{ ...S.input, marginBottom:20, maxWidth:320 }} />

      {filtered.map(emp => (
        <div key={emp.id} style={S.card}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:'rgba(245,197,24,0.15)', border:'1px solid rgba(245,197,24,0.3)', display:'flex', alignItems:'center', justifyContent:'center', color:'#F5C518', fontWeight:700, fontSize:14, flexShrink:0 }}>
                {emp.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight:600, fontSize:15 }}>{emp.name}</div>
                <div style={{ color:'#666', fontSize:12 }}>{emp.employeeId && `ID: ${emp.employeeId} · `}{emp.position}</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
              <span style={S.badge('245,197,24')}>{emp.type === 'parttime' ? 'Part-time' : 'Full-time'}</span>
              {emp.restrictions?.map(r => (
                <span key={r} style={S.badge('239,68,68')}>{restrictionLabel[r] || r}</span>
              ))}
            </div>
            {emp.phone && <div style={{ color:'#555', fontSize:12, marginTop:6 }}>📞 {emp.phone}</div>}
          </div>
          <div style={{ display:'flex', gap:8, flexShrink:0 }}>
            <button style={S.btnEdit} onClick={() => open(emp)}>Editar</button>
            <button style={S.btnRed} onClick={() => del(emp.id)}>Eliminar</button>
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign:'center', color:'#444', padding:'3rem' }}>
          {search ? 'No se encontraron empleados.' : 'No hay empleados. Añade el primero.'}
        </div>
      )}

      {modal && (
        <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&close()}>
          <div style={S.modal}>
            <h2 style={{ color:'#F5C518', margin:'0 0 1rem', fontSize:18 }}>{form.id && employees.find(e=>e.id===form.id) ? 'Editar' : 'Nuevo'} Empleado</h2>

            <label style={S.label}>Nombre completo *</label>
            <input style={S.input} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ej. Juan Pérez" />

            <label style={S.label}>ID de empleado</label>
            <input style={S.input} value={form.employeeId||''} onChange={e=>setForm({...form,employeeId:e.target.value})} placeholder="Ej. EMP-001" />

            <label style={S.label}>Puesto</label>
            <input style={S.input} value={form.position||''} onChange={e=>setForm({...form,position:e.target.value})} placeholder="Guardia" />

            <label style={S.label}>Tipo de empleado</label>
            <select style={S.input} value={form.type||'fulltime'} onChange={e=>setForm({...form,type:e.target.value})}>
              <option value="fulltime">Full-time</option>
              <option value="parttime">Part-time</option>
            </select>

            <label style={S.label}>Teléfono</label>
            <input style={S.input} value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="787-000-0000" />

            <label style={S.label}>Email</label>
            <input style={S.input} value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})} placeholder="correo@ejemplo.com" />

            <label style={S.label}>Restricciones de turno</label>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:4 }}>
              {RESTRICTION_OPTIONS.map(opt => (
                <label key={opt.value} style={{ display:'flex', alignItems:'center', gap:8, color:'#ccc', fontSize:13, cursor:'pointer' }}>
                  <input type="checkbox" checked={form.restrictions?.includes(opt.value)||false}
                    onChange={()=>toggleRestriction(opt.value)} />
                  {opt.label}
                </label>
              ))}
            </div>

            <label style={S.label}>Notas</label>
            <textarea style={{ ...S.input, height:80, resize:'vertical' }} value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Notas adicionales..." />

            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button style={{ ...S.btn, flex:1 }} onClick={save}>Guardar</button>
              <button style={{ ...S.btnRed, flex:1 }} onClick={close}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
