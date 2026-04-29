// src/pages/Horarios.jsx
import { useState, useEffect } from 'react';
import { getSchedules, saveSchedules, getEmployees, getPosts } from '../data/store';
import { generateBiweeklySchedule, getBiweekStart, formatDateDisplay, getWeekDates, formatDate } from '../utils/scheduler';

const SHIFT_COLORS = {
  '7:00-15:00': { bg: '#dbeafe', text: '#F5C518' },
  '15:00-23:00': { bg: '#fce7f3', text: '#9d174d' },
  '23:00-7:00': { bg: '#ede9fe', text: '#5b21b6' },
  '6:00-14:00': { bg: '#dcfce7', text: '#166534' },
  '14:00-22:00': { bg: '#fef9c3', text: '#854d0e' },
  '6:00-18:00': { bg: '#ffedd5', text: '#9a3412' },
  '18:00-6:00': { bg: '#f1f5f9', text: '#475569' },
};

function getShiftColor(shift) {
  return SHIFT_COLORS[shift] || { bg: '#f0f0f0', text: '#555' };
}

export default function Horarios() {
  const [schedule, setSchedule] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [posts, setPosts] = useState([]);
  const [biweekStart, setBiweekStart] = useState(null);
  const [biweekEnd, setBiweekEnd] = useState(null);
  const [activeWeek, setActiveWeek] = useState(0);
  const [viewMode, setViewMode] = useState('employee'); // 'employee' | 'post'
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);

  const reload = () => {
    const emps = getEmployees();
    const pts = getPosts();
    setEmployees(emps);
    setPosts(pts);

    let existing = getSchedules();
    if (existing.length === 0) {
      const result = generateBiweeklySchedule();
      existing = result.schedule;
      saveSchedules(existing);
      setBiweekStart(result.biweekStart);
      setBiweekEnd(result.biweekEnd);
    } else {
      const bw = getBiweekStart();
      setBiweekStart(bw);
      setBiweekEnd(new Date(bw.getTime() + 13 * 24 * 60 * 60 * 1000));
    }
    setSchedule(existing);
  };

  useEffect(() => { reload(); }, []);

  const handleGenerate = async () => {
    if (!window.confirm('¿Regenerar el horario bisemanal? Se reemplazará el horario actual.')) return;
    setGenerating(true);
    await new Promise(r => setTimeout(r, 800));
    const result = generateBiweeklySchedule();
    saveSchedules(result.schedule);
    setSchedule(result.schedule);
    setBiweekStart(result.biweekStart);
    setBiweekEnd(result.biweekEnd);
    setGenerating(false);
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { exportScheduleToPDF } = await import('../utils/pdfExport');
      await exportScheduleToPDF(schedule, biweekStart, biweekEnd, employees, posts);
    } catch (err) {
      alert('Error exportando PDF. Intente de nuevo.');
      console.error(err);
    }
    setExporting(false);
  };

  const weekStart = biweekStart ? new Date(biweekStart.getTime() + activeWeek * 7 * 24 * 60 * 60 * 1000) : null;
  const weekDates = weekStart ? getWeekDates(weekStart) : [];
  const activeEmployees = employees.filter(e => e.status === 'active');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#0a1628' }}>Plan de Trabajo Bisemanal</h1>
          {biweekStart && biweekEnd && (
            <p style={{ margin: '4px 0 0', color: '#888', fontSize: 14 }}>
              {formatDateDisplay(biweekStart)} – {formatDateDisplay(biweekEnd)}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleGenerate} disabled={generating} style={{
            padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: generating ? '#e0e0e0' : '#0d0d0d', color: generating ? '#aaa' : 'white',
            border: 'none',
          }}>
            {generating ? '⟳ Generando...' : '⟳ Regenerar'}
          </button>
          <button onClick={handleExportPDF} disabled={exporting} style={{
            padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: exporting ? '#e0e0e0' : '#b94040', color: exporting ? '#aaa' : 'white',
            border: 'none',
          }}>
            {exporting ? 'Exportando...' : '⬇ Exportar PDF'}
          </button>
        </div>
      </div>

      {/* Week selector & view mode */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: 'white', borderRadius: 10, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
          {[0, 1].map(w => (
            <button key={w} onClick={() => setActiveWeek(w)} style={{
              padding: '8px 20px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: activeWeek === w ? '#0d0d0d' : 'white',
              color: activeWeek === w ? 'white' : '#555',
            }}>
              Semana {w + 1}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', background: 'white', borderRadius: 10, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
          {[['employee', 'Por Empleado'], ['post', 'Por Puesto']].map(([v, l]) => (
            <button key={v} onClick={() => setViewMode(v)} style={{
              padding: '8px 18px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: viewMode === v ? '#F5C518' : 'white',
              color: viewMode === v ? 'white' : '#555',
            }}>
              {l}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.entries(SHIFT_COLORS).slice(0, 4).map(([shift, colors]) => (
            <span key={shift} style={{
              background: colors.bg, color: colors.text,
              fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 5,
            }}>
              {shift}
            </span>
          ))}
        </div>
      </div>

      {/* Schedule grid */}
      <div style={{ background: 'white', borderRadius: 14, overflow: 'auto', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {viewMode === 'employee' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ background: '#0d0d0d' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  Guardia
                </th>
                {weekDates.map(d => (
                  <th key={d} style={{ padding: '12px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 600, minWidth: 80 }}>
                    <div>{d.toLocaleDateString('es-PR', { weekday: 'short' })}</div>
                    <div style={{ fontWeight: 400, opacity: 0.7, fontSize: 11 }}>{d.toLocaleDateString('es-PR', { month: 'short', day: 'numeric' })}</div>
                  </th>
                ))}
                <th style={{ padding: '12px 12px', textAlign: 'center', color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 600 }}>Hrs</th>
              </tr>
            </thead>
            <tbody>
              {activeEmployees.map((emp, idx) => {
                let weekHours = 0;
                return (
                  <tr key={emp.id} style={{ borderTop: '1px solid #f0f0f0', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: '#0a1628', fontSize: 14 }}>{emp.name}</div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>{emp.badge} · {emp.type === 'full-time' ? 'FT' : 'PT'}</div>
                    </td>
                    {weekDates.map(d => {
                      const dateStr = formatDate(d);
                      const daySchedules = schedule.filter(s => s.employeeId === emp.id && s.date === dateStr);
                      if (daySchedules.length > 0) weekHours += daySchedules[0].hours || 0;
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                      return (
                        <td key={d} style={{
                          padding: '6px 4px', textAlign: 'center',
                          background: isWeekend ? '#fafafa' : 'transparent',
                        }}>
                          {daySchedules.length > 0 ? (
                            <div>
                              {daySchedules.map(s => {
                                const colors = getShiftColor(s.shift);
                                return (
                                  <div key={s.id} style={{
                                    background: colors.bg, color: colors.text,
                                    borderRadius: 5, padding: '3px 4px', fontSize: 10, fontWeight: 700,
                                    marginBottom: 2,
                                  }}>
                                    {s.shift}
                                    {s.isOvertime && <span style={{ display: 'block', fontSize: 9, opacity: 0.8 }}>OT</span>}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span style={{ color: '#ddd', fontSize: 16 }}>–</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: 13, fontWeight: 700,
                        color: weekHours > 40 ? '#b94040' : weekHours >= 32 ? '#166534' : '#888',
                      }}>
                        {weekHours.toFixed(0)}h
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          /* By post view */
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ background: '#0d0d0d' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: 'white', fontSize: 12, fontWeight: 600 }}>Puesto</th>
                <th style={{ padding: '12px 12px', textAlign: 'center', color: 'white', fontSize: 12, fontWeight: 600 }}>Turno</th>
                {weekDates.map(d => (
                  <th key={d} style={{ padding: '12px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 600, minWidth: 80 }}>
                    <div>{d.toLocaleDateString('es-PR', { weekday: 'short' })}</div>
                    <div style={{ fontWeight: 400, opacity: 0.7, fontSize: 11 }}>{d.toLocaleDateString('es-PR', { month: 'short', day: 'numeric' })}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map((post, pIdx) =>
                (post.shifts || []).map((shift, sIdx) => {
                  return (
                    <tr key={`${post.id}-${shift}`} style={{
                      borderTop: '1px solid #f0f0f0',
                      background: pIdx % 2 === 0 ? 'white' : '#fafafa',
                    }}>
                      {sIdx === 0 && (
                        <td rowSpan={post.shifts.length} style={{
                          padding: '10px 16px', fontWeight: 700, color: '#0a1628', fontSize: 14,
                          borderRight: '2px solid #e8f5f0', verticalAlign: 'top',
                        }}>
                          {post.name}
                          <div style={{ fontSize: 11, color: '#aaa', fontWeight: 400 }}>{post.location}</div>
                          <div style={{ fontSize: 11, color: '#0f6e56', fontWeight: 600, marginTop: 2 }}>Req: {post.requiredGuards}</div>
                        </td>
                      )}
                      <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                        <span style={{ ...getShiftColor(shift), borderRadius: 5, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                          {shift}
                        </span>
                      </td>
                      {weekDates.map(d => {
                        const dateStr = formatDate(d);
                        const daySchedules = schedule.filter(s => s.postId === post.id && s.shift === shift && s.date === dateStr);
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                        return (
                          <td key={d} style={{
                            padding: '5px 4px', textAlign: 'center',
                            background: isWeekend ? '#f8fafb' : 'transparent',
                          }}>
                            {daySchedules.length > 0 ? (
                              daySchedules.map(s => (
                                <div key={s.id} style={{ fontSize: 11, fontWeight: 600 }}>
                                  {s.isVacancy ? (
                                    <span style={{ color: '#b91c1c', background: '#fee2e2', borderRadius: 4, padding: '2px 5px' }}>VACANTE</span>
                                  ) : (
                                    <span style={{ color: '#166534' }}>{s.employeeName.split(' ')[0]}</span>
                                  )}
                                </div>
                              ))
                            ) : (
                              <span style={{ color: '#ddd' }}>–</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 20 }}>
        {[
          { label: 'Total turnos semana', value: schedule.filter(s => !s.isVacancy && s.weekNum === activeWeek).length, color: '#c9a000' },
          { label: 'Vacantes', value: schedule.filter(s => s.isVacancy && s.weekNum === activeWeek).length, color: '#b94040' },
          { label: 'Turnos overtime', value: schedule.filter(s => s.isOvertime && s.weekNum === activeWeek).length, color: '#b97000' },
          { label: 'Turnos domingo', value: schedule.filter(s => s.isSunday && !s.isVacancy && s.weekNum === activeWeek).length, color: '#7c3aed' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'white', borderRadius: 10, padding: '14px 16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: `3px solid ${stat.color}`,
          }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
