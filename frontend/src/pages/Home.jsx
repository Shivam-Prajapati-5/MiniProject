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
    role: 'Systems Architect',
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
    role: 'Backend Engineer',
    avatar: '⚡',
    badge: 'Online',
  },
  {
    name: 'Elena Rostova',
    username: 'elena_r',
    email: 'elena@example.com',
    password: 'password123',
    role: 'Security Engineer',
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
      {/* Ambient Dynamic Background Lighting */}
      <div className="ambient-glow-layer" aria-hidden="true">
        <div className="ambient-orb ambient-orb--maroon" />
        <div className="ambient-orb ambient-orb--gold" />
        <div className="ambient-orb ambient-orb--purple" />
      </div>

      {/* Navigation Bar */}
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
              <span className="editorial-brand__sub">Realtime Messenger</span>
            </div>
          </Link>

          <nav className="editorial-nav">
            <a href="#showcase">Preview</a>
            <a href="#demo-accounts">Demo Peers</a>
            <a href="#features">Features</a>
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
                  <span>Get Started</span>
                  <span className="editorial-arrow">→</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="editorial-main">
        {/* Hero Section */}
        <section className="editorial-hero">
          <div className="editorial-hero__tag">
            <span className="status-dot"></span>
            <span>Real-time Messaging Platform</span>
          </div>

          <div className="editorial-hero__grid">
            <div className="hero-left">
              <h1 className="hero-headline">
                Conversations without lag.
                <span className="hero-subline">Pure focus and clarity.</span>
              </h1>
            </div>

            <div className="hero-right">
              <p className="hero-desc">
                Fast real-time chat with mutual friend requests and lightweight emoji avatars. No broken images, no bloated media, and no spam.
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
                      <span>Create Free Account</span>
                      <span className="editorial-arrow">→</span>
                    </Link>
                    <a href="#demo-accounts" className="editorial-btn editorial-btn--secondary editorial-btn--lg">
                      <span>Try Demo Logins</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Product Showcase Window */}
        <section className="editorial-showcase" id="showcase">
          <div className="showcase-window">
            {/* Terminal Header */}
            <div className="showcase-header">
              <div className="showcase-dots">
                <span className="dot dot--maroon"></span>
                <span className="dot dot--gold"></span>
                <span className="dot dot--emerald"></span>
              </div>
              <span className="showcase-title">NexChat — Live Interface</span>
              <div className="showcase-status">
                <span className="status-dot"></span>
                <span>Active</span>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="showcase-body">
              {/* Left Channel Rail */}
              <div className="showcase-sidebar">
                <div className="showcase-sidebar__top">
                  <span>ACTIVE CONTACTS</span>
                  <span className="badge-count">3 MUTUAL</span>
                </div>

                <div className="showcase-contacts">
                  <div className="showcase-contact showcase-contact--active">
                    <div className="avatar-squircle">🦊</div>
                    <div className="contact-info">
                      <span className="contact-name">Alex Rivera</span>
                      <span className="contact-sub">The latest update looks great!</span>
                    </div>
                  </div>

                  <div className="showcase-contact">
                    <div className="avatar-squircle">✨</div>
                    <div className="contact-info">
                      <span className="contact-name">Sarah Chen</span>
                      <span className="contact-sub">Real-time chat is instant!</span>
                    </div>
                  </div>

                  <div className="showcase-contact">
                    <div className="avatar-squircle">⚡</div>
                    <div className="contact-info">
                      <span className="contact-name">Devon Price</span>
                      <span className="contact-sub">Sent you a friend request</span>
                    </div>
                  </div>
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
                      <span className="peer-desc">Systems Architect</span>
                    </div>
                  </div>
                  <div className="chat-status-pill">
                    <span>Direct Message</span>
                  </div>
                </div>

                <div className="showcase-messages">
                  {/* Incoming */}
                  <div className="mock-bubble mock-bubble--theirs">
                    <div className="mock-avatar">🦊</div>
                    <div className="mock-bubble__content">
                      <div className="mock-meta">
                        <span className="mock-author">Alex Rivera</span>
                        <span className="mock-time">14:02 UTC</span>
                      </div>
                      <div className="mock-text">
                        Sarah, message delivery is feeling completely instantaneous across all tabs.
                      </div>
                    </div>
                  </div>

                  {/* Outgoing */}
                  <div className="mock-bubble mock-bubble--mine">
                    <div className="mock-bubble__content">
                      <div className="mock-meta">
                        <span className="mock-time">14:02 UTC</span>
                        <span className="mock-author">Sarah Chen</span>
                      </div>
                      <div className="mock-text">
                        Agreed! The emoji avatars look clean and crisp, and only mutual friends can message us.
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
                    value="Type a message or press Enter to dispatch..."
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
            <span className="strip-gold">TEST THE APP INSTANTLY</span>
            <h2 className="demo-strip__title">One-Click Demo Accounts</h2>
            <p className="demo-strip__desc">
              Click any demo user below to sign in immediately with pre-configured contacts and conversations.
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

        {/* Core Features */}
        <section className="editorial-primitives" id="features">
          <div className="primitives-header">
            <span className="strip-gold">CORE VALUES</span>
            <h2 className="primitives-title">Designed for focus, speed, and privacy.</h2>
          </div>

          <div className="primitives-grid">
            <div className="primitive-card">
              <div className="primitive-card__top">
                <span className="primitive-tag">PRIVACY FIRST</span>
                <span className="primitive-icon">🤝</span>
              </div>
              <h3 className="primitive-heading">Friend Request Protection</h3>
              <p className="primitive-body">
                No random strangers or unwanted spam. You only see contacts you have explicitly accepted or invited. Search by username and send a request to start a chat.
              </p>
            </div>

            <div className="primitive-card">
              <div className="primitive-card__top">
                <span className="primitive-tag">ZERO BLOAT</span>
                <span className="primitive-icon">⚡</span>
              </div>
              <h3 className="primitive-heading">Emoji Profile Avatars</h3>
              <p className="primitive-body">
                Lightweight, vibrant squircle emoji avatars stored natively. Eliminates external image hosting limits, bandwidth lag, and broken image URLs.
              </p>
            </div>

            <div className="primitive-card">
              <div className="primitive-card__top">
                <span className="primitive-tag">SECURITY</span>
                <span className="primitive-icon">🛡️</span>
              </div>
              <h3 className="primitive-heading">Secure Cookie Authentication</h3>
              <p className="primitive-body">
                Protected by HttpOnly SameSite cookie authentication and account recovery security questions. Keeps your credentials secure without local storage vulnerabilities.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="editorial-footer">
        <div className="editorial-footer__inner">
          <div className="footer-left">
            <span className="footer-brand">NEXCHAT</span>
            <span className="footer-sep">|</span>
            <span className="footer-status">
              <span className="status-dot"></span>
              All Services Operational
            </span>
          </div>

          <div className="footer-right">
            <span>© 2026 NexChat. Built with React, Node &amp; Socket.io.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
