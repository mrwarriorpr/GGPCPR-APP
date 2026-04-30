// src/pages/Vacantes.jsx
import { useState, useEffect } from 'react';
import { getSchedules, saveSchedules, getEmployees } from '../data/store';
import { findAvailableForVacancy, getBiweekStart, formatDateDisplay } from '../utils/scheduler';

export default function Vacantes() {
  const [schedule, setSchedule] = useState([]);
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [availableEmps, setAvailableEmps] = useState([]);

  useEffect(() => {
  const loadData = async () => {
    try {
      const data = await getSchedules();
      setSchedule(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando vacantes:', error);
      setSchedule([]);
    }
  };

  loadData();
}, []);

  const vacancies = schedule.filter(s => s.isVacancy);

  const handleSelectVacancy = (v) => {
    setSelectedVacancy(v);
    const available = findAvailableForVacancy(v, schedule);
    setAvailableEmps(available);
  };

  const handleAssign = async (empId) => {
  const employees = await getEmployees();
  const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    const updated = schedule.map(s => {
      if (s.id === selectedVacancy.id) {
        return { ...s, employeeId: empId, employeeName: emp.name, isVacancy: false };
      }
      return s;
    });
    await saveSchedules(updated);
    setSchedule(updated);
    setSelectedVacancy(null);
    setAvailableEmps([]);
  };

  const groupedByPost = vacancies.reduce((acc, v) => {
    if (!acc[v.postName]) acc[v.postName] = [];
    acc[v.postName].push(v);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#0a1628' }}>Gestión de Vacantes</h1>
        <p style={{ margin: '4px 0 0', color: '#888', fontSize: 14 }}>
          {vacancies.length} vacante(s) en la bisemana actual
        </p>
      </div>

      {vacancies.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: 14, padding: '40px', textAlign: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
          <h2 style={{ color: '#166534', margin: 0 }}>Sin vacantes</h2>
          <p style={{ color: '#888', marginTop: 8 }}>Todos los turnos están cubiertos esta bisemana.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedVacancy ? '1fr 1fr' : '1fr', gap: 20 }}>
          {/* Vacancies list */}
          <div>
            {Object.entries(groupedByPost).map(([postName, pvacs]) => (
              <div key={postName} style={{
                background: 'white', borderRadius: 14, marginBottom: 16,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden',
              }}>
                <div style={{ background: '#0d0d0d', padding: '12px 20px' }}>
                  <h3 style={{ margin: 0, color: 'white', fontSize: 15, fontWeight: 700 }}>{postName}</h3>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{pvacs.length} vacante(s)</span>
                </div>
                {pvacs.map(v => (
                  <div
                    key={v.id}
                    onClick={() => handleSelectVacancy(v)}
                    style={{
                      padding: '14px 20px', borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: selectedVacancy?.id === v.id ? '#fff5f5' : 'white',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#111', fontSize: 14 }}>
                        {new Date(v.date + 'T12:00:00').toLocaleDateString('es-PR', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                        Turno: <strong>{v.shift}</strong> · {v.hours}h
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        background: '#fee2e2', color: '#b91c1c',
                        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                      }}>
                        VACANTE
                      </span>
                      <span style={{ color: '#b91c1c', fontSize: 18 }}>›</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Available employees panel */}
          {selectedVacancy && (
            <div>
              <div style={{
                background: 'white', borderRadius: 14,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden',
                position: 'sticky', top: 24,
              }}>
                <div style={{ background: '#0d0d0d', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, color: 'white', fontSize: 15, fontWeight: 700 }}>Empleados Disponibles</h3>
                      <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                        {selectedVacancy.postName} · {selectedVacancy.shift}
                      </p>
                    </div>
                    <button onClick={() => { setSelectedVacancy(null); setAvailableEmps([]); }} style={{
                      background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                      width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 16,
                    }}>×</button>
                  </div>
                </div>

                <div style={{ padding: '12px 0' }}>
                  {availableEmps.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#888' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>😔</div>
                      No hay empleados disponibles para este turno.
                      <div style={{ fontSize: 12, marginTop: 8, color: '#aaa' }}>
                        Posibles razones: todos tienen cita, ya trabajan ese día, o alcanzarían el límite de horas.
                      </div>
                    </div>
                  ) : (
                    availableEmps.map(emp => (
                      <div key={emp.id} style={{
                        padding: '12px 20px', borderBottom: '1px solid #f5f5f5',
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                          background: emp.wouldBeOvertime ? '#fef3c7' : '#dcfce7',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700,
                          color: emp.wouldBeOvertime ? '#92400e' : '#166534',
                        }}>
                          {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#111', fontSize: 14 }}>{emp.name}</div>
                          <div style={{ fontSize: 11, color: '#888' }}>
                            Hrs semana: <strong>{emp.currentWeekHours.toFixed(0)}h</strong> ·
                            {emp.type === 'full-time' ? ' Full-Time' : ' Part-Time'}
                          </div>
                          {emp.wouldBeOvertime && (
                            <div style={{ fontSize: 11, color: '#b97000', fontWeight: 600, marginTop: 2 }}>
                              ⚠ Overtime — Costo estimado: ${emp.totalShiftCost}
                              {emp.isSunday && ' (Domingo ×2)'}
                            </div>
                          )}
                          {!emp.wouldBeOvertime && (
                            <div style={{ fontSize: 11, color: '#166534', marginTop: 2 }}>
                              ✓ Sin overtime — ${emp.totalShiftCost} est.
                            </div>
                          )}
                        </div>
                        <button onClick={() => handleAssign(emp.id)} style={{
                          padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                          background: emp.wouldBeOvertime ? '#fef3c7' : '#dcfce7',
                          color: emp.wouldBeOvertime ? '#92400e' : '#166534',
                          border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                        }}>
                          Asignar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
