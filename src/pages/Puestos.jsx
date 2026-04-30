// src/pages/Puestos.jsx
import { useState, useEffect } from 'react';
import { getPosts, savePost, deletePost } from '../data/store';

const BLANK = { name:'', location:'', address:'', shifts:['8:00AM/4:00PM'], armed:false, notes:'' };
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

export default function Puestos() {
  const [posts, setPosts] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [newShift, setNewShift] = useState('');

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
    setForm(post ? {...post, shifts:[...(post.shifts||['8:00AM/4:00PM'])]} : {...BLANK, id: Date.now().toString()});
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
    if(newShift.trim()){ setForm(f=>({...f,shifts:[...(f.shifts||[]),newShift.trim()]})); setNewShift(''); }
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
                  <span key={i} style={{ background:'rgba(96,165,250,0.1)', border:'1px solid rgba(96,165,250,0.2)', borderRadius:4, padding:'2px 8px', fontSize:12, color:'#93c5fd' }}>{s}</span>
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

            <label style={S.label}>Turnos disponibles</label>
            {(form.shifts||[]).map((s,i) => (
              <div key={i} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
                <span style={{ flex:1, color:'#93c5fd', fontSize:13 }}>{s}</span>
                <button onClick={()=>removeShift(i)} style={{ background:'none', border:'none', color:'#f87171', cursor:'pointer', fontSize:16 }}>✕</button>
              </div>
            ))}
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <input style={{ ...S.input, flex:1 }} value={newShift} onChange={e=>setNewShift(e.target.value)}
                placeholder="Ej. 8:00AM/5:00PM" onKeyDown={e=>e.key==='Enter'&&addShift()} />
              <button onClick={addShift} style={{ ...S.btn, padding:'10px 16px', flexShrink:0 }}>+</button>
            </div>

            <label style={S.label}>Notas</label>
            <textarea style={{ ...S.input, height:80, resize:'vertical' }} value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} />

            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button style={{ ...S.btn, flex:1 }} onClick={save}>Guardar</button>
              <button style={{ background:'rgba(220,38,38,0.15)', color:'#f87171', border:'1px solid rgba(220,38,38,0.3)', borderRadius:8, padding:'10px', flex:1, cursor:'pointer', fontWeight:600 }} onClick={close}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
