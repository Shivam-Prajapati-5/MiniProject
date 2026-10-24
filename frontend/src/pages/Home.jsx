import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';
import './Home.css';

const DEMO_USERS = [
  {
    name: 'Alex Rivera',
    username: 'alex_r',
    email: 'alex@example.com',
    password: 'password123',
    role: 'Principal Systems Architect',
    avatar: '🦊',
    badge: 'Popular',
  },
  {
    name: 'Sarah Chen',
    username: 'sarah_c',
    email: 'sarah@example.com',
    password: 'password123',
    role: 'Lead Infrastructure',
    avatar: '✨',
    badge: 'Active Now',
  },
  {
    name: 'Devon Price',
    username: 'devon_p',
    email: 'devon@example.com',
    password: 'password123',
    role: 'Distributed Core',
    avatar: '⚡',
    badge: 'Online',
  },
  {
    name: 'Elena Rostova',
    username: 'elena_r',
    email: 'elena@example.com',
    password: 'password123',
    role: 'Security Architect',
    avatar: '🚀',
    badge: 'New Peer',
  },
];

const Home = () => {
  const { authUser, login, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loggingInEmail, setLoggingInEmail] = useState('');

  const handleQuickLogin = async (user) => {
    try {
      setLoggingInEmail(user.email);
      await login(user.email, user.password);
      addToast(`Welcome back, ${user.name}!`, 'success');
      navigate('/chat');
    } catch (err) {
      addToast(err?.response?.data?.message || 'Quick login failed', 'error');
    } finally {
      setLoggingInEmail('');
    }
  };

  return (
    <div className="editorial-home">
      {/* Editorial Navigation Bar */}
      <header className="editorial-header">
        <div className="editorial-header__inner">
          <Link to="/" className="editorial-brand">
            <div className="editorial-brand__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2L2 9l10 7 10-7-10-7z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 15l10 7 10-7" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                <path d="M2 11l10 7 10-7" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
              </svg>
            </div>
            <div className="editorial-brand__text">
              <span className="editorial-brand__title">NexChat</span>
              <span className="editorial-brand__sub">Protocol v2.4</span>
            </div>
          </Link>

          <nav className="editorial-nav">
            <a href="#showcase">Terminal</a>
            <a href="#demo-accounts">Demo Peers</a>
            <a href="#benchmarks">Telemetry</a>
            <a href="#primitives">Primitives</a>
          </nav>

          <div className="editorial-actions">
            {authUser ? (
              <div className="editorial-auth-group">
                <Avatar user={authUser} size={32} />
                <Link to="/chat" className="editorial-btn editorial-btn--primary">
                  <span>Open Chat</span>
                  <span className="editorial-arrow">→</span>
                </Link>
                <button onClick={logout} className="editorial-btn editorial-btn--ghost">
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="editorial-auth-group">
                <Link to="/auth" className="editorial-link">
                  Sign In
                </Link>
                <Link to="/auth?mode=register" className="editorial-btn editorial-btn--primary">
                  <span>Open App</span>
                  <span className="editorial-arrow">→</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Editorial Content */}
      <main className="editorial-main">
        {/* Architectural Hero */}
        <section className="editorial-hero">
          {/* Breadcrumb Status Strip */}
          <div className="editorial-hero__strip">
            <div className="strip-left">
              <span className="strip-gold">[01]</span>
              <span className="strip-light">TRANSMISSION ARCHITECTURE</span>
              <span className="strip-divider">//</span>
              <span className="strip-accent">LATENCY: &lt; 50ms</span>
              <span className="strip-divider">//</span>
              <span className="strip-status">
                <span className="status-dot"></span>
                TLS 1.3 ENCLAVE
              </span>
            </div>
            <div className="strip-right">
              <span>STORAGE: ZERO RASTER BLOAT</span>
              <span className="strip-pipe">|</span>
              <span className="strip-ratified">UTF-8 SQUIRCLE EMOJIS</span>
            </div>
          </div>

          {/* Hero Typography */}
          <div className="editorial-hero__grid">
            <div className="hero-left">
              <h1 className="hero-headline">
                Conversations without latency.
                <span className="hero-subline">Pure tactical focus.</span>
              </h1>
            </div>

            <div className="hero-right">
              <p className="hero-desc">
                High-frequency WebSocket relays, zero-leak session cookies, and privacy-first contact handshakes. Engineered for quantitative teams and low-latency workflows.
              </p>

              <div className="hero-cta-group">
                {authUser ? (
                  <Link to="/chat" className="editorial-btn editorial-btn--primary editorial-btn--lg">
                    <span>Enter Live Chat</span>
                    <span className="editorial-arrow">→</span>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth?mode=register" className="editorial-btn editorial-btn--primary editorial-btn--lg">
                      <span>Launch Protocol</span>
                      <span className="editorial-arrow">→</span>
                    </Link>
                    <a href="#demo-accounts" className="editorial-btn editorial-btn--secondary editorial-btn--lg">
                      <span>1-Click Demo Accounts</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Micro Hotkey Ribbon */}
          <div className="editorial-hero__ribbon">
            <div className="ribbon-item">
              <span>COMMAND SHORTCUT:</span>
              <kbd className="editorial-kbd">⌘K</kbd>
              <span className="ribbon-muted">INSTANT PEER SEARCH</span>
            </div>
            <span className="ribbon-right">REAL-TIME SOCKETS // EMERALD PRESENCE</span>
          </div>
        </section>

        {/* Museum-Grade Product Showcase Terminal */}
        <section className="editorial-showcase" id="showcase">
          <div className="showcase-window">
            {/* Terminal Header */}
            <div className="showcase-header">
              <div className="showcase-dots">
                <span className="dot dot--maroon"></span>
                <span className="dot dot--gold"></span>
                <span className="dot dot--emerald"></span>
              </div>
              <span className="showcase-title">
                SOCKET // nexchat-node — realtime [atlas-cluster]
              </span>
              <div className="showcase-enclave">
                <span className="status-dot"></span>
                <span>SECURE DISPATCH</span>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="showcase-body">
              {/* Left Channel Rail */}
              <div className="showcase-sidebar">
                <div className="showcase-sidebar__top">
                  <span>ACTIVE CONTACTS</span>
                  <span className="badge-count">3 ACCEPTED</span>
                </div>

                <div className="showcase-contacts">
                  <div className="showcase-contact showcase-contact--active">
                    <div className="avatar-squircle">🦊</div>
                    <div className="contact-info">
                      <span className="contact-name">Alex Rivera</span>
                      <span className="contact-sub">0.42ms roundtrip...</span>
                    </div>
                    <span className="badge-synced">SYNCED</span>
                  </div>

                  <div className="showcase-contact">
                    <div className="avatar-squircle">✨</div>
                    <div className="contact-info">
                      <span className="contact-name">Sarah Chen</span>
                      <span className="contact-sub">Telemetry ratified</span>
                    </div>
                    <span className="contact-time">14m</span>
                  </div>

                  <div className="showcase-contact">
                    <div className="avatar-squircle">⚡</div>
                    <div className="contact-info">
                      <span className="contact-name">Devon Price</span>
                      <span className="contact-sub">Socket connected</span>
                    </div>
                    <span className="contact-time">3m</span>
                  </div>
                </div>

                <div className="showcase-sidebar__footer">
                  <span>PRIVACY SHIELD</span>
                  <span className="strip-gold">ONLY MUTUAL CONTACTS</span>
                </div>
              </div>

              {/* Right Conversation Stream */}
              <div className="showcase-chat">
                <div className="showcase-chat__header">
                  <div className="chat-peer">
                    <div className="avatar-squircle avatar-squircle--sm">🦊</div>
                    <div>
                      <div className="peer-title">
                        <span>Alex Rivera</span>
                        <span className="peer-handle">@alex_r</span>
                      </div>
                      <span className="peer-desc">Principal Systems Architect</span>
                    </div>
                  </div>
                  <div className="chat-status-pill">
                    <span>MUTUAL CONTACT RATIFIED</span>
                  </div>
                </div>

                <div className="showcase-messages">
                  {/* Incoming */}
                  <div className="mock-bubble mock-bubble--theirs">
                    <div className="mock-avatar">🦊</div>
                    <div className="mock-bubble__content">
                      <div className="mock-meta">
                        <span className="mock-author">Alex Rivera</span>
                        <span className="mock-time">14:02:19 UTC</span>
                      </div>
                      <div className="mock-text">
                        Sarah, live telemetry is looking rock solid across all channels.
                      </div>
                    </div>
                  </div>

                  {/* Outgoing */}
                  <div className="mock-bubble mock-bubble--mine">
                    <div className="mock-bubble__content">
                      <div className="mock-meta">
                        <span className="mock-time">14:02:28 UTC</span>
                        <span className="mock-author">Sarah Chen</span>
                      </div>
                      <div className="mock-text">
                        Agreed! Real-time message transit is instantaneous. The emoji avatars feel exceptionally clean.
                      </div>
                      <div className="mock-receipt">
                        <span>✓✓ Delivered</span>
                      </div>
                    </div>
                    <div className="mock-avatar">✨</div>
                  </div>

                  {/* Typing Indicator */}
                  <div className="mock-typing">
                    <span className="typing-text">Alex is typing</span>
                    <span className="typing-dots">
                      <span></span><span></span><span></span>
                    </span>
                  </div>
                </div>

                {/* Input Dock Preview */}
                <div className="showcase-input-bar">
                  <span className="input-prompt">›</span>
                  <input
                    type="text"
                    disabled
                    value="Ready to broadcast socket frames across peer nodes."
                    className="mock-input"
                  />
                  <div className="mock-send-btn">↵</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 1-Click Instant Demo Login Strip */}
        <section className="editorial-demo-strip" id="demo-accounts">
          <div className="demo-strip__header">
            <span className="strip-gold">[02] ZERO SETUP TESTING</span>
            <h2 className="demo-strip__title">Instant Demo Node Access</h2>
            <p className="demo-strip__desc">
              Click any verified peer to authenticate immediately with seeded conversations and mutual contacts.
            </p>
          </div>

          <div className="demo-grid">
            {DEMO_USERS.map((user) => (
              <div key={user.email} className="demo-card">
                <div className="demo-card__top">
                  <div className="demo-avatar">
                    <span>{user.avatar}</span>
                    <span className="demo-beacon"></span>
                  </div>
                  <span className="demo-tag">{user.badge}</span>
                </div>

                <div className="demo-info">
                  <h3 className="demo-name">{user.name}</h3>
                  <span className="demo-handle">@{user.username}</span>
                  <span className="demo-role">{user.role}</span>
                </div>

                <button
                  onClick={() => handleQuickLogin(user)}
                  disabled={loggingInEmail === user.email}
                  className="editorial-btn editorial-btn--demo"
                >
                  {loggingInEmail === user.email ? (
                    <span className="spinner-sm" />
                  ) : (
                    <>
                      <span>Sign In as {user.name.split(' ')[0]}</span>
                      <span className="editorial-arrow">→</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Telemetry Strip */}
        <section className="editorial-telemetry" id="benchmarks">
          <div className="telemetry-grid">
            <div className="telemetry-cell">
              <div className="telemetry-label">PACKET DELIVERY</div>
              <div className="telemetry-value">&lt; 50ms</div>
              <div className="telemetry-desc">Zero external CDN hops, instant Socket.io frames</div>
            </div>

            <div className="telemetry-cell">
              <div className="telemetry-label">ASSET OVERHEAD</div>
              <div className="telemetry-value">0 KB</div>
              <div className="telemetry-desc">Zero broken images, 100% UTF-8 squircle emoji personas</div>
            </div>

            <div className="telemetry-cell">
              <div className="telemetry-label">PRIVACY MODEL</div>
              <div className="telemetry-value">Mutual</div>
              <div className="telemetry-desc">Directory hidden; conversations require reciprocal handshake</div>
            </div>
          </div>
        </section>

        {/* Architectural Primitives */}
        <section className="editorial-primitives" id="primitives">
          <div className="primitives-header">
            <span className="strip-gold">[03] SYSTEM PRIMITIVES</span>
            <h2 className="primitives-title">Engineered for focus and privacy.</h2>
          </div>

          <div className="primitives-grid">
            <div className="primitive-card">
              <div className="primitive-card__top">
                <span className="primitive-tag">FIG. 01 // PRIVACY</span>
                <span className="primitive-icon">🤝</span>
              </div>
              <h3 className="primitive-heading">Friend Request Gatekeeper</h3>
              <p className="primitive-body">
                No unsolicited direct messages or full directory browsing upon login. Users search by handle, dispatch a handshake request, and only accepted peers populate active channels.
              </p>
            </div>

            <div className="primitive-card">
              <div className="primitive-card__top">
                <span className="primitive-tag">FIG. 02 // MEDIA</span>
                <span className="primitive-icon">⚡</span>
              </div>
              <h3 className="primitive-heading">Lightweight Emoji Personas</h3>
              <p className="primitive-body">
                Eliminates expensive third-party image hosting limits, CDN outages, and broken avatar links. Stored natively in UTF-8 strings with zero render delay.
              </p>
            </div>

            <div className="primitive-card">
              <div className="primitive-card__top">
                <span className="primitive-tag">FIG. 03 // SECURITY</span>
                <span className="primitive-icon">🛡️</span>
              </div>
              <h3 className="primitive-heading">HttpOnly Enclave Sessions</h3>
              <p className="primitive-body">
                JWT auth tokens sealed in secure, HttpOnly, SameSite cookies. Immune to XSS credential extraction and cross-site telemetry trackers.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Editorial Master Footer */}
      <footer className="editorial-footer">
        <div className="editorial-footer__inner">
          <div className="footer-left">
            <div className="editorial-brand__icon editorial-brand__icon--sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 9l10 7 10-7-10-7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="footer-brand">NEXCHAT</span>
            <span className="footer-sep">|</span>
            <span className="footer-status">
              <span className="status-dot"></span>
              All Socket Relays Operational
            </span>
          </div>

          <div className="footer-right">
            <span>© 2026 NexChat. Built with Node, Express, MongoDB &amp; React.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
