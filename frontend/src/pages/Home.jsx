import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Home.css';

const DEMO_USERS = [
  {
    name: 'Alex Morgan',
    username: 'alex_m',
    email: 'alex@example.com',
    password: 'password123',
    role: 'Lead Architect',
    avatar: 'https://avatar.iran.liara.run/public/boy?username=alex_m',
    badge: 'Popular',
  },
  {
    name: 'Sophia Chen',
    username: 'sophia_c',
    email: 'sophia@example.com',
    password: 'password123',
    role: 'Product Designer',
    avatar: 'https://avatar.iran.liara.run/public/girl?username=sophia_c',
    badge: 'Active Now',
  },
  {
    name: 'Liam Novak',
    username: 'liam_n',
    email: 'liam@example.com',
    password: 'password123',
    role: 'Realtime Engineer',
    avatar: 'https://avatar.iran.liara.run/public/boy?username=liam_n',
    badge: 'Online',
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
    <div className="home-container">
      {/* Background ambient lighting */}
      <div className="home-glow home-glow-1" />
      <div className="home-glow home-glow-2" />
      <div className="home-glow home-glow-3" />

      {/* ── Fixed Navigation Bar ── */}
      <nav className="home-nav">
        <div className="home-nav__inner">
          <Link to="/" className="home-logo">
            <div className="home-logo__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <path d="M8 10h.01" />
                <path d="M12 10h.01" />
                <path d="M16 10h.01" />
              </svg>
            </div>
            <span className="home-logo__text">NexChat</span>
            <span className="home-badge">v2.4 Live</span>
          </Link>

          <div className="home-nav__links">
            <a href="#features">Features</a>
            <a href="#demo-accounts">Demo Accounts</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#architecture">Architecture</a>
          </div>

          <div className="home-nav__actions">
            {authUser ? (
              <div className="home-nav__user-group">
                <div className="home-nav__user-avatar">
                  {authUser.profilepicture ? (
                    <img src={authUser.profilepicture} alt={authUser.fullname} />
                  ) : (
                    <span>{authUser.fullname?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <Link to="/chat" className="btn-primary home-nav__btn">
                  Open Chat →
                </Link>
                <button
                  onClick={logout}
                  className="home-nav__logout-link"
                  title="Sign out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link to="/auth?mode=login" className="btn-secondary home-nav__login">
                  Sign In
                </Link>
                <Link to="/auth?mode=register" className="btn-primary home-nav__signup">
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <header className="home-hero">
        <div className="home-hero__badge">
          <span className="home-hero__badge-dot" />
          <span>Next-Gen Realtime Messaging Platform</span>
        </div>

        <h1 className="home-hero__title">
          Conversations at the speed of thought. <br />
          <span className="gradient-text">Zero latency. Pure flow.</span>
        </h1>

        <p className="home-hero__subtitle">
          Built on distributed Socket.IO event streams, hardened HttpOnly cookie sessions,
          and intelligent edge proxy routing. Chat smoothly without ISP blocks or connection drops.
        </p>

        <div className="home-hero__cta-group">
          <Link
            to={authUser ? '/chat' : '/auth?mode=register'}
            className="btn-primary home-hero__primary-btn"
          >
            {authUser ? 'Launch Chat Dashboard →' : 'Start Chatting Now — Free →'}
          </Link>
          <a href="#demo-accounts" className="btn-secondary home-hero__secondary-btn">
            Explore Demo Logins
          </a>
        </div>

        <div className="home-hero__status-pill">
          <span className="status-indicator-live" />
          <span>Cloud Cluster: Render + MongoDB Atlas Active (99.99% Uptime)</span>
        </div>

        {/* ── Interactive Chat Preview Card ── */}
        <div className="home-preview">
          <div className="home-preview__window">
            <div className="home-preview__bar">
              <div className="window-dots">
                <span className="window-dot window-dot-red" />
                <span className="window-dot window-dot-yellow" />
                <span className="window-dot window-dot-green" />
              </div>
              <div className="window-title">nexchat.app — Live Realtime Session</div>
              <div className="window-live-pill">
                <span className="live-dot" /> 3 Users Online
              </div>
            </div>

            <div className="home-preview__body">
              {/* Mock Sidebar */}
              <div className="preview-sidebar">
                <div className="preview-sidebar__search">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>Search contacts...</span>
                </div>

                <div className="preview-contact preview-contact--active">
                  <div className="preview-contact__avatar">
                    <img src="https://avatar.iran.liara.run/public/girl?username=sophia_c" alt="Sophia" />
                    <span className="online-beacon" />
                  </div>
                  <div className="preview-contact__info">
                    <div className="preview-contact__name">Sophia Chen</div>
                    <div className="preview-contact__last">The real-time messaging is so fast 🚀</div>
                  </div>
                </div>

                <div className="preview-contact">
                  <div className="preview-contact__avatar">
                    <img src="https://avatar.iran.liara.run/public/boy?username=alex_m" alt="Alex" />
                    <span className="online-beacon" />
                  </div>
                  <div className="preview-contact__info">
                    <div className="preview-contact__name">Alex Morgan</div>
                    <div className="preview-contact__last">Let's deploy to Vercel next!</div>
                  </div>
                </div>

                <div className="preview-contact">
                  <div className="preview-contact__avatar">
                    <img src="https://avatar.iran.liara.run/public/boy?username=liam_n" alt="Liam" />
                    <span className="online-beacon" />
                  </div>
                  <div className="preview-contact__info">
                    <div className="preview-contact__name">Liam Novak</div>
                    <div className="preview-contact__last">Cluster is running smooth.</div>
                  </div>
                </div>
              </div>

              {/* Mock Chat Panel */}
              <div className="preview-chat">
                <div className="preview-chat__header">
                  <div className="preview-chat__contact">
                    <img src="https://avatar.iran.liara.run/public/girl?username=sophia_c" alt="Sophia" />
                    <div>
                      <div className="preview-chat__name">Sophia Chen</div>
                      <div className="preview-chat__status">Active now • Product Designer</div>
                    </div>
                  </div>
                  <div className="preview-chat__badge">Instant Socket Mesh</div>
                </div>

                <div className="preview-chat__messages">
                  <div className="preview-msg preview-msg--incoming">
                    <div className="preview-msg__bubble">
                      Hey! Welcome to the new NexChat platform. Have you checked out the cyber-glass UI? ✨
                    </div>
                    <div className="preview-msg__time">10:42 AM</div>
                  </div>

                  <div className="preview-msg preview-msg--outgoing">
                    <div className="preview-msg__bubble">
                      Yes! The dark theme, ambient lighting, and instant delivery feel incredible.
                    </div>
                    <div className="preview-msg__time">
                      10:43 AM • Delivered
                    </div>
                  </div>

                  <div className="preview-msg preview-msg--incoming">
                    <div className="preview-msg__bubble">
                      And zero ISP blockage with Vercel edge proxying! 🚀
                    </div>
                    <div className="preview-msg__time">10:43 AM</div>
                  </div>

                  <div className="preview-typing">
                    <span>Sophia is typing</span>
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>

                <div className="preview-chat__input">
                  <input type="text" placeholder="Write a message..." readOnly value="Awesome! Let me invite the team..." />
                  <button className="preview-send-btn">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Demo Accounts Section (Answers user's question directly!) ── */}
      <section id="demo-accounts" className="home-section home-section--accent">
        <div className="section-head">
          <span className="section-eyebrow">READY-TO-USE TEST PROFILES</span>
          <h2 className="section-title">Log in instantly with Pre-Seeded Accounts</h2>
          <p className="section-subtitle">
            We pre-populated your database with 3 active demo users. Click <strong>"1-Click Log In"</strong> on any card to sign in immediately, or copy their credentials.
          </p>
        </div>

        <div className="demo-grid">
          {DEMO_USERS.map((user) => (
            <div key={user.email} className="demo-card">
              <div className="demo-card__header">
                <img src={user.avatar} alt={user.name} className="demo-card__avatar" />
                <span className="demo-card__badge">{user.badge}</span>
              </div>

              <div className="demo-card__body">
                <h3 className="demo-card__name">{user.name}</h3>
                <span className="demo-card__tag">@{user.username} • {user.role}</span>

                <div className="demo-card__credentials">
                  <div className="cred-row">
                    <span className="cred-label">Email:</span>
                    <span className="cred-val">{user.email}</span>
                  </div>
                  <div className="cred-row">
                    <span className="cred-label">Password:</span>
                    <span className="cred-val">{user.password}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleQuickLogin(user)}
                  disabled={loggingInEmail === user.email}
                  className="btn-primary demo-card__btn"
                >
                  {loggingInEmail === user.email ? 'Signing In...' : `1-Click Sign In as ${user.name.split(' ')[0]}`}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="demo-tip-banner">
          <div className="demo-tip-icon">💡</div>
          <div className="demo-tip-text">
            <strong>Pro Tip:</strong> Open <code>https://try-nextchat.vercel.app</code> in an <strong>Incognito window</strong> or a second browser. Log into <strong>Alex</strong> on one window and <strong>Sophia</strong> on the other to watch messages and online dots update in real-time!
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="home-section">
        <div className="section-head">
          <span className="section-eyebrow">ENGINEERED FOR EXCELLENCE</span>
          <h2 className="section-title">Built with modern real-time architecture</h2>
          <p className="section-subtitle">
            Every layer from database indexing to UI micro-interactions was tuned for low latency and security.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-card__icon feature-card__icon--cyan">⚡</div>
            <h3 className="feature-card__title">Sub-50ms Realtime Mesh</h3>
            <p className="feature-card__desc">
              Powered by Socket.IO with bi-directional event dispatch. Live presence, typing indicators, and instant message delivery without polling.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-card__icon feature-card__icon--amber">🛡️</div>
            <h3 className="feature-card__title">Zero-Leak Security</h3>
            <p className="feature-card__desc">
              HttpOnly strict session cookies, scoped token handshakes, bcrypt hashing (10 salt rounds), and security-question account recovery.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-card__icon feature-card__icon--emerald">🌐</div>
            <h3 className="feature-card__title">Edge-Routed ISP Bypass</h3>
            <p className="feature-card__desc">
              Vercel Edge reverse proxies API traffic directly to Render, eliminating ISP throttling (such as Jio) while keeping first-party cookie isolation.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-card__icon feature-card__icon--purple">💎</div>
            <h3 className="feature-card__title">Cyber-Glass Aesthetics</h3>
            <p className="feature-card__desc">
              DM Sans typography, deep obsidian surfaces, glowing cyan accents, smooth glassmorphism cards, and fluid responsive layouts.
            </p>
          </div>
        </div>
      </section>

      {/* ── How it Works Walkthrough ── */}
      <section id="how-it-works" className="home-section home-section--accent">
        <div className="section-head">
          <span className="section-eyebrow">GETTING STARTED</span>
          <h2 className="section-title">How to use NexChat in 3 simple steps</h2>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">01</div>
            <h3 className="step-title">Create or Pick an Account</h3>
            <p className="step-desc">
              Sign up with your custom username and avatar, or use one of our 1-click demo accounts above.
            </p>
          </div>

          <div className="step-card">
            <div className="step-num">02</div>
            <h3 className="step-title">Pick Anyone From Contacts</h3>
            <p className="step-desc">
              The sidebar automatically lists every registered user with live green online beacons. Search contacts instantly.
            </p>
          </div>

          <div className="step-card">
            <div className="step-num">03</div>
            <h3 className="step-title">Chat Realtime with History</h3>
            <p className="step-desc">
              Send messages with instant optimistic UI, live delivery updates, cursor-based pagination, and typing beacons.
            </p>
          </div>
        </div>
      </section>

      {/* ── Call To Action Banner ── */}
      <section className="home-cta">
        <div className="home-cta__inner">
          <h2 className="home-cta__title">Ready to experience real-time messaging?</h2>
          <p className="home-cta__subtitle">
            Join NexChat today. Create your profile or test with demo users in under 30 seconds.
          </p>
          <div className="home-cta__buttons">
            <Link to="/auth?mode=register" className="btn-primary home-cta__btn">
              Create Your Free Account →
            </Link>
            <Link to="/auth?mode=login" className="btn-secondary home-cta__btn">
              Sign In to Existing Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="home-footer">
        <div className="home-footer__inner">
          <div className="footer-col-brand">
            <div className="home-logo">
              <div className="home-logo__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <span className="home-logo__text">NexChat</span>
            </div>
            <p className="footer-tagline">
              Modern full-stack messaging platform deployed on Vercel + Render + MongoDB Atlas.
            </p>
          </div>

          <div className="footer-links">
            <a href="https://github.com/Shivam-Prajapati-5/MiniProject" target="_blank" rel="noreferrer">
              GitHub Repository
            </a>
            <a href="https://miniproject-39kl.onrender.com/api/health" target="_blank" rel="noreferrer">
              API Health Status
            </a>
            <Link to="/auth?mode=login">Sign In</Link>
            <Link to="/auth?mode=register">Register</Link>
          </div>
        </div>

        <div className="home-footer__bottom">
          <span>NexChat © 2026 • Crafted with Vite, React, Node.js & Socket.IO</span>
        </div>
      </footer>
    </div>
  );
};

export default Home;
