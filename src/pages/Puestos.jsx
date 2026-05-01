// src/pages/Puestos.jsx
import { useState, useEffect } from 'react';
import { getPosts, savePost, deletePost } from '../data/store';

const BLANK = {
  name:'',
  location:'',
  address:'',
  shifts:['08:00/16:00'],
  armed:false,
  notes:'',

  // NUEVO
  coverage: '24/7', // '24/7', 'weekly', 'custom'
  days: [1,2,3,4,5,6,0], // días activos
  guardsPerShift: 1 // cuántos guardias necesita por turno
};
const S = {
  page: { color:'#fff' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' },
  title: { fontSize:'1.6rem', fontWeight:800, color:'#F5C518', margin:0 },
  btn: { background:'#F5C518', color:'#000', border:'none', borderRadius:8, padding:'10px 20px', fontWeight:700, cursor:'pointer', fontSize:14 },
  btnRed: { background:'rgba(220,38,38,0.15)', color:'#f87171', border:'1px solid rgba(220,38,38,0.3)', borderRadius:6, padding:'6px 12px', cursor:'pointer', fontSize:12 },
  btnEdit: { background:'rgba(245,197,24,0.15)', color:'#F5C518', border:'1px solid rgba(245,197,24,0.3)', borderRadius:6, padding:'6px 12px', cursor:'pointer', fontSize:12 },
  card: { background:'#1a1a1a', border:'1px solid #222', borderRadius:12, padding:'1.25rem', marginBottom:12 },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  modal: { background:'#1a1a1a', border:'1px solid #333', borderRadius:16, padding:'2rem', width:'100%', maxWidth:500, maxHeight:'90vh', overflowY:'auto' },
  label: { display:'block', color:'#888', fontSize:12, marginBottom:4, marginTop:16 },
  input: { width:'100%', padding:'10px 12px', background:'#0d0d0d', border:'1px solid #333', borderRadius:8, color:'#fff', fontSize:14, boxSizing:'border-box' },
};
function to24h(hour, min, ampm) {
  if (!hour) return '';
  let h = parseInt(hour, 10);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2,'0')}:${min || '00'}`;
}
function formatShift12h(shift) {
  if (!shift) return '';

  const [start, end] = shift.includes('/') ? shift.split('/') : shift.split('-');

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

export default function Puestos() {
  const [posts, setPosts] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(BLANK);
const [shiftForm, setShiftForm] = useState({
  startHour:'8',
  startMin:'00',
  startAmpm:'AM',
  endHour:'4',
  endMin:'00',
  endAmpm:'PM'
});
  const reload = async () => {
  try {
    const data = await getPosts();
    setPosts(data);
  } catch (error) {
    console.error('Error cargando puestos:', error);
  }
};

useEffect(() => { reload(); }, []);

const open = (post=null) => {
  setForm(post ? {
    ...post,
    shifts: [...(post.shifts || ['08:00/16:00'])],
    coverage: post.coverage || '24/7',
    days: post.days || [1,2,3,4,5,6,0],
    guardsPerShift: post.guardsPerShift || 1
  } : {
    ...BLANK,
    id: Date.now().toString()
  });

  setModal(true);
};
  const close = () => setModal(false);

  const save = async () => {
    if(!form.name.trim()){ alert('El nombre del puesto es requerido'); return; }
   await savePost(form);
    await reload();
    close();
  };

  const del = async (id) => {
    if(window.confirm('¿Eliminar este puesto?')){ 
      await deletePost(id); 
      await reload();
    }
  };

  const addShift = () => {
  const start = to24h(shiftForm.startHour, shiftForm.startMin, shiftForm.startAmpm);
  const end = to24h(shiftForm.endHour, shiftForm.endMin, shiftForm.endAmpm);
  const shift = `${start}/${end}`;

  if (!start || !end) {
    alert('Debes completar la hora de entrada y salida.');
    return;
  }

  if ((form.shifts || []).includes(shift)) {
    alert('Ese turno ya existe.');
    return;
  }

  setForm(f => ({
    ...f,
    shifts: [...(f.shifts || []), shift]
  }));
};

  const removeShift = (idx) => setForm(f=>({...f,shifts:f.shifts.filter((_,i)=>i!==idx)}));

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Puestos</h1>
          <p style={{ color:'#666', margin:'4px 0 0', fontSize:14 }}>{posts.length} puestos registrados</p>
        </div>
        <button style={S.btn} onClick={()=>open()}>+ Añadir puesto</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
        {posts.map(post => (
          <div key={post.id} style={S.card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:16, color:'#F5C518' }}>{post.name}</div>
                {post.location && <div style={{ color:'#888', fontSize:12, marginTop:2 }}>📍 {post.location}</div>}
                {post.address && <div style={{ color:'#666', fontSize:11, marginTop:2 }}>{post.address}</div>}
              </div>
              <span style={{ background: post.armed ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)', border:`1px solid ${post.armed ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'}`, borderRadius:4, padding:'2px 8px', fontSize:11, color: post.armed ? '#f87171' : '#34d399', flexShrink:0 }}>
                {post.armed ? '🔫 Armado' : '🛡 Desarmado'}
              </span>
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ color:'#666', fontSize:11, marginBottom:4 }}>TURNOS:</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {(post.shifts||[]).map((s,i) => (
                  <span key={i} style={{ background:'rgba(96,165,250,0.1)', border:'1px solid rgba(96,165,250,0.2)', borderRadius:4, padding:'2px 8px', fontSize:12, color:'#93c5fd' }}>
  {formatShift12h(s)}
</span>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button style={S.btnEdit} onClick={()=>open(post)}>Editar</button>
              <button style={S.btnRed} onClick={()=>del(post.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div style={{ textAlign:'center', color:'#444', padding:'3rem' }}>No hay puestos. Añade el primero.</div>
      )}

      {modal && (
        <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&close()}>
          <div style={S.modal}>
            <h2 style={{ color:'#F5C518', margin:'0 0 1rem', fontSize:18 }}>{form.id && posts.find(p=>p.id===form.id) ? 'Editar' : 'Nuevo'} Puesto</h2>

            <label style={S.label}>Nombre del puesto *</label>
            <input style={S.input} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ej. CSM-CAGUAS" />

            <label style={S.label}>Localización</label>
            <input style={S.input} value={form.location||''} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Ej. Caguas" />

            <label style={S.label}>Dirección</label>
            <input style={S.input} value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Dirección completa" />

       <label style={S.label}>Tipo</label>
<select style={S.input} value={form.armed?'armed':'unarmed'} onChange={e=>setForm({...form,armed:e.target.value==='armed'})}>
  <option value="unarmed">Desarmado</option>
  <option value="armed">Armado</option>
</select>

<label style={S.label}>Cobertura del puesto</label>
<select
  style={S.input}
  value={form.coverage || '24/7'}
  onChange={e=>setForm({...form, coverage:e.target.value})}
>
  <option value="24/7">24/7 - todos los días</option>
  <option value="weekly">Días específicos</option>
</select>

{form.coverage === 'weekly' && (
  <>
    <label style={S.label}>Días de trabajo</label>
    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
      {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map((d,i)=>(
        <button
          type="button"
          key={i}
          onClick={()=>{
            const exists = form.days?.includes(i);
            setForm({
              ...form,
              days: exists
                ? form.days.filter(x=>x!==i)
                : [...(form.days || []), i]
            });
          }}
          style={{
            padding:'6px 10px',
            borderRadius:6,
            border:'1px solid #333',
            background: form.days?.includes(i) ? '#F5C518' : '#0d0d0d',
            color: form.days?.includes(i) ? '#000' : '#fff',
            cursor:'pointer'
          }}
        >
          {d}
        </button>
      ))}
    </div>
  </>
)}

<label style={S.label}>Guardias por turno</label>
<input
  type="number"
  min="1"
  style={S.input}
  value={form.guardsPerShift || 1}
  onChange={e=>setForm({...form, guardsPerShift:parseInt(e.target.value) || 1})}
/>

<label style={S.label}>Turnos disponibles</label>
{(form.shifts||[]).map((s,i) => (
  <div key={i} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
    <span style={{ flex:1, color:'#93c5fd', fontSize:13 }}>
{formatShift12h(s)}
    </span>
    <button
      type="button"
      onClick={()=>removeShift(i)}
      style={{ background:'none', border:'none', color:'#f87171', cursor:'pointer', fontSize:16 }}
    >
      ✕
    </button>
  </div>
))}
            <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
  <input type="number" min="1" max="12" value={shiftForm.startHour}
    onChange={e=>setShiftForm({...shiftForm,startHour:e.target.value})}
    style={{ ...S.input, width:60 }} />

  <select value={shiftForm.startMin} onChange={e=>setShiftForm({...shiftForm,startMin:e.target.value})} style={{ ...S.input, width:75 }}>
    <option value="00">00</option>
    <option value="15">15</option>
    <option value="30">30</option>
    <option value="45">45</option>
  </select>

  <select value={shiftForm.startAmpm} onChange={e=>setShiftForm({...shiftForm,startAmpm:e.target.value})} style={{ ...S.input, width:80 }}>
    <option>AM</option>
    <option>PM</option>
  </select>

  <span style={{ color:'#888', alignSelf:'center' }}>a</span>

  <input type="number" min="1" max="12" value={shiftForm.endHour}
    onChange={e=>setShiftForm({...shiftForm,endHour:e.target.value})}
    style={{ ...S.input, width:60 }} />

  <select value={shiftForm.endMin} onChange={e=>setShiftForm({...shiftForm,endMin:e.target.value})} style={{ ...S.input, width:75 }}>
    <option value="00">00</option>
    <option value="15">15</option>
    <option value="30">30</option>
    <option value="45">45</option>
  </select>

  <select value={shiftForm.endAmpm} onChange={e=>setShiftForm({...shiftForm,endAmpm:e.target.value})} style={{ ...S.input, width:80 }}>
    <option>AM</option>
    <option>PM</option>
  </select>

  <button type="button" onClick={addShift} style={{ ...S.btn, padding:'10px 16px' }}>+</button>
</div>

            <label style={S.label}>Notas</label>
            <textarea style={{ ...S.input, height:80, resize:'vertical' }} value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} />

            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button type="button" style={{ ...S.btn, flex:1 }} onClick={save}>
  Guardar
</button>
              <button style={{ background:'rgba(220,38,38,0.15)', color:'#f87171', border:'1px solid rgba(220,38,38,0.3)', borderRadius:8, padding:'10px', flex:1, cursor:'pointer', fontWeight:600 }} onClick={close}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
