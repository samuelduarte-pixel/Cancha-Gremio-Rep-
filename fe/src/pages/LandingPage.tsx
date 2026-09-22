import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Shield, Sparkles, Zap, Trophy, Users, Clock, Loader } from 'lucide-react';
import { tarifasApi, Tarifa } from '@/api/tarifas';
import LoginModal from '@/components/LoginModal';
import { useAuth } from '@/context/AuthContext';

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-CO');

export default function LandingPage() {
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [tarifasLoading, setTarifasLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  function goToReservas() {
    if (isAuthenticated) navigate('/reservas');
    else setLoginOpen(true);
  }

  useEffect(() => {
    tarifasApi.getAll()
      .then(res => setTarifas(res.data || []))
      .catch(() => setTarifas([]))
      .finally(() => setTarifasLoading(false));
  }, []);

  const dayLabel: Record<string, string> = {
    weekday: 'Lunes a Viernes',
    saturday: 'Sábados',
    sunday_holiday: 'Domingos y Festivos',
  };

  return (
    <main style={{
      minHeight: '100vh',
      background: `
        repeating-linear-gradient(
          90deg,
          transparent 0px,
          transparent 60px,
          rgba(74, 222, 128, 0.015) 60px,
          rgba(74, 222, 128, 0.015) 120px
        ),
        radial-gradient(ellipse at 50% 0%, rgba(74, 222, 128, 0.06) 0%, transparent 60%),
        radial-gradient(circle at top left, #0b2216, #060a07 70%)
      `,
      color: '#e8f5ec',
      fontFamily: 'var(--font-sans)',
      overflowX: 'hidden',
      position: 'relative',
    }}>
      {/* Premium Navbar */}
      <header style={{
        padding: '20px 24px',
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(74, 222, 128, 0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: 'var(--clr-neon)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px rgba(74, 222, 128, 0.4)',
          }}>
            <span style={{ fontSize: '1.2rem' }}>⚽</span>
          </div>
          <div>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              letterSpacing: '0.05em',
              color: 'var(--clr-neon)',
              textShadow: '0 0 10px rgba(74, 222, 128, 0.2)',
            }}>
              CANCHA GREMIO
            </span>
          </div>
        </div>
        <div>
          <button onClick={() => (isAuthenticated ? navigate('/inicio') : setLoginOpen(true))} className="btn btn-ghost" style={{ fontSize: '0.9rem', padding: '8px 16px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            {isAuthenticated ? 'Mi cuenta' : 'Iniciar sesión'}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '100px 24px 60px',
        maxWidth: 1000,
        margin: '0 auto',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Stadium background image */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1600&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          filter: 'brightness(0.3) saturate(0.8)',
          zIndex: 0,
        }} />
        {/* Dark gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(6,10,7,0.6) 0%, rgba(6,10,7,0.3) 50%, rgba(6,10,7,0.7) 100%)',
          zIndex: 0,
        }} />
        {/* Center circle silhouette */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 280, height: 280,
          borderRadius: '50%',
          border: '2px solid rgba(74, 222, 128, 0.06)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 60, height: 60,
          borderRadius: '50%',
          border: '2px solid rgba(74, 222, 128, 0.04)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
        {/* Glow decoration */}
        <div style={{
          position: 'absolute',
          top: '10%', left: '50%',
          transform: 'translateX(-50%)',
          width: 300, height: 300,
          background: 'var(--clr-neon)',
          filter: 'blur(150px)',
          opacity: 0.12,
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(74, 222, 128, 0.08)',
            border: '1px solid rgba(74, 222, 128, 0.2)',
            padding: '6px 14px',
            borderRadius: 99,
            fontSize: '0.75rem',
            color: 'var(--clr-neon)',
            fontWeight: 600,
            letterSpacing: '0.05em',
            marginBottom: 24,
            textTransform: 'uppercase',
          }}>
            <Sparkles size={12} /> Gestión Deportiva de Alto Nivel
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.8rem, 7vw, 4.5rem)',
            letterSpacing: '0.05em',
            lineHeight: 1.05,
            marginBottom: 20,
            textTransform: 'uppercase',
          }}>
            RESERVA TU CANCHA <br />
            <span style={{
              color: 'transparent',
              WebkitTextStroke: '1px var(--clr-neon)',
              textShadow: '0 0 20px rgba(74, 222, 128, 0.1)',
            }}>
              JUEGA COMO PRO
            </span>
          </h1>

          <p style={{
            margin: '0 auto 35px',
            maxWidth: 680,
            fontSize: '1.1rem',
            color: 'var(--clr-text-muted)',
            lineHeight: 1.6,
          }}>
            La plataforma líder para reservar canchas sintéticas, unirse a los mejores torneos locales y coordinar partidos con tus amigos de la forma más rápida y moderna.
          </p>

          <div style={{ display: 'inline-flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/registro" className="btn btn-primary" style={{
              minWidth: 190,
              justifyContent: 'center',
              padding: '14px 28px',
              fontSize: '0.95rem',
              boxShadow: '0 0 20px rgba(74, 222, 128, 0.25)',
            }}>
              Regístrate Gratis
            </Link>
            <button onClick={goToReservas} className="btn btn-ghost" style={{
              minWidth: 190,
              justifyContent: 'center',
              padding: '14px 28px',
              fontSize: '0.95rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}>
              Ver Horarios Disponibles
            </button>
          </div>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section style={{
        maxWidth: 1200,
        margin: '20px auto 80px',
        padding: '0 24px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          background: 'rgba(13, 20, 16, 0.5)',
          border: '1px solid rgba(74, 222, 128, 0.1)',
          padding: '24px 20px',
          borderRadius: 16,
          backdropFilter: 'blur(8px)',
        }}>
          {[
            { label: 'Canchas Activas', value: '3 Campos', desc: 'Sintética, Cemento y Natural', color: 'var(--clr-neon)' },
            { label: 'Horario Flexible', value: '06:00 - 22:00', desc: 'Todos los días de la semana', color: 'var(--clr-info)' },
            { label: 'Comunidad', value: '+100 Jugadores', desc: 'Organiza partidos y torneos', color: 'var(--clr-accent)' },
          ].map((s, i) => (
            <div key={i} style={{
              textAlign: 'center',
              borderRight: i < 2 ? '1px solid rgba(74, 222, 128, 0.1)' : 'none',
              padding: '10px 20px',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                {s.label}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: s.color, letterSpacing: '0.02em', marginBottom: 2 }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--clr-text-dim)' }}>
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Visual Cards Section */}
      <section style={{
        maxWidth: 1200,
        margin: '0 auto 80px',
        padding: '0 24px',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          textAlign: 'center',
          letterSpacing: '0.05em',
          marginBottom: 32,
          color: 'var(--clr-neon)',
        }}>
          ¿POR QUÉ ELEGIR CANCHA GREMIO?
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
        }}>
          {[
            {
              title: 'Reservas en un clic',
              icon: <Zap size={24} style={{ color: 'var(--clr-neon)' }} />,
              text: 'Consulta la agenda en tiempo real desde tu móvil y asegura tu horario de juego de forma instantánea.'
            },
            {
              title: 'Torneos y Ligas',
              icon: <Trophy size={24} style={{ color: 'var(--clr-info)' }} />,
              text: 'Inscríbete a los torneos semanales, sigue la tabla de clasificación y demuestra el nivel de tu equipo.'
            },
            {
              title: 'Perfil de Jugador',
              icon: <Users size={24} style={{ color: 'var(--clr-accent)' }} />,
              text: 'Mantén un historial completo de tus reservas y eventos, y actualiza tus datos de contacto con facilidad.'
            },
            {
              title: 'Instalaciones Top',
              icon: <Shield size={24} style={{ color: 'var(--clr-warn)' }} />,
              text: 'Disfruta de canchas en perfecto estado. Monitoreamos constantemente el mantenimiento de los campos.'
            }
          ].map((feat, i) => (
            <article key={i} className="glass" style={{
              padding: 24,
              borderRadius: 12,
              border: '1px solid rgba(74, 222, 128, 0.08)',
              background: 'rgba(13, 20, 16, 0.4)',
              transition: 'all 0.2s ease',
            }}>
              <div style={{
                width: 48, height: 48,
                borderRadius: 8,
                background: 'rgba(74, 222, 128, 0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                {feat.icon}
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 8 }}>{feat.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', lineHeight: 1.6 }}>{feat.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Courts Preview Section */}
      <section style={{
        maxWidth: 1200,
        margin: '0 auto 80px',
        padding: '0 24px',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          textAlign: 'center',
          letterSpacing: '0.05em',
          marginBottom: 32,
          color: 'var(--clr-neon)',
        }}>
          NUESTROS CAMPOS DEPORTIVOS
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
        }}>
          {[
            {
              name: 'Cancha Fútbol 5',
              type: 'Sintética',
              dim: '30m x 16m',
              price: 'Desde $67.500 / hora',
              desc: 'Espacio ideal para partidos rápidos con amigos. Césped sintético de alta calidad, iluminación LED y arcos reglamentarios.',
              badge: '5vs5',
              img: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=600&q=80&fit=crop',
            },
            {
              name: 'Cancha Fútbol 6',
              type: 'Sintética',
              dim: '36m x 18m',
              price: 'Desde $67.500 / hora',
              desc: 'El tamaño perfecto para juntar a la familia y los amigos. Cómoda, amplia y con todas las comodidades.',
              badge: '6vs6',
              img: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&q=80&fit=crop',
            },
            {
              name: 'Cancha Fútbol 8',
              type: 'Sintética',
              dim: '50m x 25m',
              price: 'Desde $67.500 / hora',
              desc: 'La más grande del club. Ideal para torneos, cumpleaños y eventos deportivos. ¡El campo de tus sueños!',
              badge: '8vs8',
              img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=80&fit=crop',
            }
          ].map((cancha, i) => (
            <div key={i} className="card" style={{
              background: 'rgba(13, 20, 16, 0.4)',
              border: '1px solid rgba(74, 222, 128, 0.08)',
              padding: 0,
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 340,
              overflow: 'hidden',
            }}>
              <div style={{
                height: 140,
                backgroundImage: `url(${cancha.img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, transparent 50%, rgba(6,10,7,0.9) 100%)',
                }} />
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700,
                    color: 'var(--clr-neon)',
                    background: 'rgba(74, 222, 128, 0.1)',
                    padding: '3px 8px', borderRadius: 99,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {cancha.badge}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {cancha.dim}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>{cancha.name}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--clr-neon)', fontWeight: 600, marginBottom: 12 }}>
                  {cancha.type}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', lineHeight: 1.6 }}>
                  {cancha.desc}
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 12,
                  borderTop: '1px solid rgba(74, 222, 128, 0.08)',
                }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--clr-neon)' }}>
                    {cancha.price}
                  </span>
                  <button onClick={goToReservas} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.78rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    Reservar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      /* Tarifas Section */
      <section style={{ maxWidth: 1200, margin: '0 auto 80px', padding: '0 24px' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '2rem', textAlign: 'center',
          letterSpacing: '0.05em', marginBottom: 8, color: 'var(--clr-neon)',
        }}>
          TARIFAS POR FRANJA
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: '0.9rem', margin: '0 auto 32px', maxWidth: 640 }}>
          El precio depende del día y la hora. Se cobra el punto medio del rango indicado.
        </p>

        {tarifasLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40, color: 'var(--clr-text-muted)' }}>
            <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Cargando tarifas...
          </div>
        ) : tarifas.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--clr-text-muted)' }}>No hay tarifas configuradas.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
            {tarifas.map((t, i) => (
              <div key={t.id} className="card" style={{
                background: 'rgba(13, 20, 16, 0.4)',
                border: i === 1 ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(74, 222, 128, 0.08)',
                padding: 22, borderRadius: 12, position: 'relative', overflow: 'hidden',
              }}>
                {i === 1 && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                    color: 'var(--clr-neon)', background: 'rgba(74,222,128,0.12)', padding: '3px 8px', borderRadius: 99,
                  }}>
                    Mayor demanda
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{
                    width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(74,222,128,0.08)', color: 'var(--clr-neon)',
                  }}>
                    <Clock size={16} />
                  </span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--clr-text)' }}>{t.name}</h3>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--clr-info)', marginBottom: 8 }}>
                  {dayLabel[t.day_type]} · {t.start_time.slice(0, 5)} – {t.end_time.slice(0, 5)}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--clr-neon)', marginBottom: 6 }}>
                  {fmt(t.price)} <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', fontWeight: 500 }}>/ hora</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>
                  Rango informado: {fmt(t.price_min)} – {fmt(t.price_max)} COP
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-dim)', marginTop: 8, lineHeight: 1.5 }}>{t.notes}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Decorative side court images */}
      <div style={{
        position: 'fixed', left: 0, top: '30%', width: 120, height: 200,
        backgroundImage: 'url(https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=300&q=80)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.15, pointerEvents: 'none', zIndex: 0,
        borderTopRightRadius: 8, borderBottomRightRadius: 8,
        filter: 'grayscale(0.5)',
      }} />
      <div style={{
        position: 'fixed', right: 0, top: '50%', width: 120, height: 200,
        backgroundImage: 'url(https://images.unsplash.com/photo-1459865264687-595d652de67e?w=300&q=80)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.15, pointerEvents: 'none', zIndex: 0,
        borderTopLeftRadius: 8, borderBottomLeftRadius: 8,
        filter: 'grayscale(0.5)',
      }} />

      {/* Instalaciones Section */}
      <section style={{
        maxWidth: 1200, margin: '0 auto 80px', padding: '0 24px',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '2rem', textAlign: 'center',
          letterSpacing: '0.05em', marginBottom: 32, color: 'var(--clr-neon)',
        }}>
          MÁS QUE FÚTBOL — VIVE LA EXPERIENCIA
        </h2>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20,
        }}>
          {[
            {
              title: 'Bar & Bebidas',
              desc: 'Pequeño bar dentro de la cancha con cerveza fría, jugos naturales e hidratación. Ambiente minimalista y acogedor.',
              img: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&q=80&fit=crop',
            },
            {
              title: 'Espacio Social',
              desc: 'Zona de gradería con mesas y sombrillas. Perfecta para que la familia y amigos disfruten mientras juegan.',
              img: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&q=80&fit=crop',
            },
            {
              title: 'Eventos y Cumpleaños',
              desc: 'Celebra tu cumpleaños con nosotros. Paquetes especiales que incluyen cancha, decoración, comida y torta.',
              img: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&q=80&fit=crop',
            },
          ].map((item, i) => (
            <div key={i} className="card" style={{
              padding: 0, borderRadius: 12, overflow: 'hidden',
              background: 'rgba(13, 20, 16, 0.4)',
              border: '1px solid rgba(74, 222, 128, 0.08)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{
                height: 140,
                backgroundImage: `url(${item.img})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, transparent 40%, rgba(6,10,7,0.9) 100%)',
                }} />
              </div>
              <div style={{ padding: 16 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>{item.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modern Call to Action (CTA) */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(11, 34, 22, 0.8), rgba(6, 10, 7, 0.9))',
        borderTop: '1px solid rgba(74, 222, 128, 0.1)',
        borderBottom: '1px solid rgba(74, 222, 128, 0.1)',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
            fontFamily: 'var(--font-display)',
            color: 'var(--clr-neon)',
            letterSpacing: '0.05em',
            marginBottom: 14,
            textTransform: 'uppercase',
          }}>
            ¿LISTO PARA JUGAR?
          </h2>
          <p style={{
            fontSize: '1rem',
            color: 'var(--clr-text-muted)',
            marginBottom: 28,
            maxWidth: 600,
            margin: '0 auto 28px',
            lineHeight: 1.6,
          }}>
            Regístrate hoy, asocia tu número telefónico para confirmaciones instantáneas y empieza a disfrutar del deporte con tus amigos con una gestión impecable.
          </p>
          <Link to="/registro" className="btn btn-primary" style={{
            padding: '12px 28px',
            fontSize: '0.9rem',
            boxShadow: '0 0 20px rgba(74, 222, 128, 0.2)',
          }}>
            Crear Cuenta Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '30px 24px',
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.8rem',
        color: 'var(--clr-text-muted)',
        gap: 16,
      }}>
        <div>
          &copy; {new Date().getFullYear()} Cancha Gremio. Todos los derechos reservados.
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <span style={{ cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--clr-neon)'} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Términos de servicio</span>
          <span style={{ cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--clr-neon)'} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Política de privacidad</span>
        </div>
      </footer>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </main>
  );
}
