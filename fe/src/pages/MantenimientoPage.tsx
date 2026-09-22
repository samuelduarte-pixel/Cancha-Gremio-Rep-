import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { fieldsApi, FieldResponse, FieldCreate, FieldUpdate } from '@/api/campos';
import { useToast } from '@/context/ToastContext';
import { Plus, Edit3, Trash2, ToggleLeft, ToggleRight, Loader, AlertCircle, X, Save } from 'lucide-react';

const defaultForm: FieldCreate = {
  name: '',
  description: '',
  price_per_hour: 0,
  surface_type: 'SYNTHETIC',
  capacity: 10,
  length_meters: 40,
  width_meters: 20,
  available_hour_start: '06:00',
  available_hour_end: '22:00',
};

const surfaceOptions = [
  { value: 'SYNTHETIC', label: 'Sintético' },
  { value: 'NATURAL', label: 'Natural' },
  { value: 'CEMENT', label: 'Cemento' },
];

export default function MantenimientoPage() {
  const { toast } = useToast();
  const [fields, setFields] = useState<FieldResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FieldCreate>({ ...defaultForm });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFields();
  }, []);

  async function loadFields() {
    try {
      setLoading(true);
      const res = await fieldsApi.getAllAdmin();
      setFields(res.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar canchas');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...defaultForm });
    setShowModal(true);
  }

  function openEdit(field: FieldResponse) {
    setEditingId(field.id);
    setForm({
      name: field.name,
      description: field.description || '',
      price_per_hour: field.price_per_hour,
      surface_type: field.surface_type,
      capacity: field.capacity,
      length_meters: field.length_meters,
      width_meters: field.width_meters,
      available_hour_start: field.available_hour_start || '06:00',
      available_hour_end: field.available_hour_end || '22:00',
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || form.price_per_hour <= 0) {
      toast('Nombre y precio son obligatorios', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await fieldsApi.update(editingId, form as FieldUpdate);
        toast('Cancha actualizada', 'success');
      } else {
        await fieldsApi.create(form);
        toast('Cancha creada', 'success');
      }
      closeModal();
      await loadFields();
    } catch (err) {
      toast('Error al guardar la cancha', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(field: FieldResponse) {
    try {
      await fieldsApi.update(field.id, { is_active: !field.is_active });
      toast(`Cancha ${field.is_active ? 'desactivada' : 'activada'}`, 'success');
      await loadFields();
    } catch {
      toast('Error al cambiar estado', 'error');
    }
  }

  async function handleDelete(field: FieldResponse) {
    if (!confirm(`¿Desactivar ${field.name}?`)) return;
    try {
      await fieldsApi.delete(field.id);
      toast('Cancha desactivada', 'success');
      await loadFields();
    } catch {
      toast('Error al desactivar', 'error');
    }
  }

  const activeFields = fields.filter(f => f.is_active);
  const inactiveFields = fields.filter(f => !f.is_active);

  if (loading) {
    return (
      <Layout title="GESTIÓN DE CANCHAS">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: 'var(--clr-text-muted)' }}>
          <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
          Cargando...
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="GESTIÓN DE CANCHAS">
        <div className="card" style={{ background: 'rgba(239,68,68,0.1)', borderLeft: '4px solid #ef4444', padding: 20, display: 'flex', alignItems: 'center', gap: 12, color: '#ef4444' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="GESTIÓN DE CANCHAS">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.875rem' }}>
          {fields.length} cancha{fields.length !== 1 ? 's' : ''} registrada{fields.length !== 1 ? 's' : ''}
        </p>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Nueva Cancha
        </button>
      </div>

      {/* Active fields */}
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, color: 'var(--clr-neon)' }}>
        Canchas Activas ({activeFields.length})
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        {activeFields.map(f => (
          <FieldCard
            key={f.id}
            field={f}
            onEdit={() => openEdit(f)}
            onToggle={() => handleToggleActive(f)}
            onDelete={() => handleDelete(f)}
          />
        ))}
        {activeFields.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 30, color: 'var(--clr-text-muted)' }}>
            No hay canchas activas
          </div>
        )}
      </div>

      {/* Inactive fields */}
      {inactiveFields.length > 0 && (
        <>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, color: 'var(--clr-text-muted)' }}>
            Canchas Inactivas ({inactiveFields.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {inactiveFields.map(f => (
              <FieldCard
                key={f.id}
                field={f}
                onEdit={() => openEdit(f)}
                onToggle={() => handleToggleActive(f)}
                onDelete={() => handleDelete(f)}
              />
            ))}
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20,
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: 560, padding: 28,
            position: 'relative', border: '1px solid var(--clr-border)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <button onClick={closeModal} style={{
              position: 'absolute', top: 16, right: 16,
              background: 'transparent', border: 'none',
              color: 'var(--clr-text-muted)', cursor: 'pointer',
            }}>
              <X size={18} />
            </button>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', letterSpacing: '0.05em', marginBottom: 20, color: 'var(--clr-neon)' }}>
              {editingId ? 'EDITAR CANCHA' : 'NUEVA CANCHA'}
            </h2>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Nombre *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Ej: Cancha Premium" style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Descripción</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Descripción opcional" rows={2} style={{ width: '100%', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Precio por hora *</label>
                  <input type="number" value={form.price_per_hour} onChange={e => setForm(p => ({ ...p, price_per_hour: +e.target.value }))} required min={0} step="1000" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Superficie</label>
                  <select value={form.surface_type} onChange={e => setForm(p => ({ ...p, surface_type: e.target.value }))} style={{ width: '100%' }}>
                    {surfaceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Capacidad (jugadores)</label>
                  <input type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: +e.target.value }))} min={1} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Largo (m)</label>
                  <input type="number" value={form.length_meters} onChange={e => setForm(p => ({ ...p, length_meters: +e.target.value }))} min={1} step="0.5" style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Ancho (m)</label>
                  <input type="number" value={form.width_meters} onChange={e => setForm(p => ({ ...p, width_meters: +e.target.value }))} min={1} step="0.5" style={{ width: '100%' }} />
                </div>
                <div></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Hora inicio</label>
                  <input type="time" value={form.available_hour_start} onChange={e => setForm(p => ({ ...p, available_hour_start: e.target.value }))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Hora fin</label>
                  <input type="time" value={form.available_hour_end} onChange={e => setForm(p => ({ ...p, available_hour_end: e.target.value }))} style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={closeModal} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? <Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <><Save size={14} /> {editingId ? 'Actualizar' : 'Crear'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

function FieldCard({ field, onEdit, onToggle, onDelete }: {
  field: FieldResponse;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card" style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
      opacity: field.is_active ? 1 : 0.6,
    }}>
      <div style={{
        width: 44, height: 44,
        background: field.is_active ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
        borderRadius: 'var(--radius-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: field.is_active ? 'var(--clr-neon)' : '#ef4444',
        flexShrink: 0,
        fontSize: '0.85rem', fontWeight: 700,
      }}>
        #{field.id}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{field.name}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span>${field.price_per_hour.toLocaleString('es-ES')}/h</span>
          <span>{field.surface_type}</span>
          <span>{field.capacity} jug</span>
          <span>{field.available_hour_start} – {field.available_hour_end}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={onEdit} className="btn btn-ghost" style={{ padding: '6px 8px' }}>
          <Edit3 size={14} />
        </button>
        <button onClick={onToggle} className="btn btn-ghost" style={{ padding: '6px 8px', color: field.is_active ? 'var(--clr-warn)' : 'var(--clr-neon)' }}>
          {field.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
        </button>
        <button onClick={onDelete} className="btn btn-ghost" style={{ padding: '6px 8px', color: '#ef4444' }}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
