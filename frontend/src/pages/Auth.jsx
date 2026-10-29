import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api';
import EmojiAvatarPicker from '../components/EmojiAvatarPicker';
import './Auth.css';

const FALLBACK_QUESTIONS = [
  { questionId: 'first_pet', question: 'What was the name of your first pet?' },
  { questionId: 'birth_city', question: 'What city were you born in?' },
  { questionId: 'first_school', question: 'What was the name of your first school?' },
  { questionId: 'childhood_nickname', question: 'What was your childhood nickname?' },
  { questionId: 'mother_maiden', question: "What is your mother's maiden name?" },
  { questionId: 'favorite_teacher', question: 'What was the name of your favorite teacher?' },
];

const DEFAULT_ANSWERS = () => ([
  { questionId: 'first_pet', answer: '' },
  { questionId: 'birth_city', answer: '' },
  { questionId: 'first_school', answer: '' },
]);

const emptyForm = () => ({
  fullname: '',
  username: '',
  email: '',
  password: '',
  gender: 'male',
  profilepicture: '🦊',
  securityAnswers: DEFAULT_ANSWERS(),
});

const DEMO_FILLS = [
  { label: 'Alex Rivera', email: 'alex@example.com', pass: 'password123' },
  { label: 'Sarah Chen', email: 'sarah@example.com', pass: 'password123' },
];

const Auth = () => {
  const [searchParams] = useSearchParams();
  const queryMode = searchParams.get('mode');
  const initialMode = queryMode === 'register' ? 'register' : queryMode === 'recovery' ? 'recovery' : 'login';

  const { login, register, resetPassword, loading } = useAuth();
  const { addToast } = useToast();
  const [mode, setMode] = useState(initialMode); // login | register | recovery
  const [recoveryStep, setRecoveryStep] = useState('email'); // email | questions
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    const m = searchParams.get('mode');
    if (m === 'register' || m === 'login' || m === 'recovery') {
      setMode(m);
    }
  }, [searchParams]);

  const [catalog, setCatalog] = useState(FALLBACK_QUESTIONS);
  const [recoveryQuestions, setRecoveryQuestions] = useState([]);
  const [recoveryAnswers, setRecoveryAnswers] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    api.get('/auth/recovery/catalog')
      .then(({ data }) => {
        if (Array.isArray(data.questions) && data.questions.length >= 3) {
          setCatalog(data.questions);
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (event) => {
    setForm(prev => ({ ...prev, [event.target.name]: event.target.value }));
    setError('');
  };

  const handleAnswerChange = (index, value) => {
    setForm(prev => ({
      ...prev,
      securityAnswers: prev.securityAnswers.map((entry, entryIndex) => (
        entryIndex === index ? { ...entry, answer: value } : entry
      )),
    }));
    setError('');
  };

  const handleQuestionChange = (index, questionId) => {
    setForm(prev => ({
      ...prev,
      securityAnswers: prev.securityAnswers.map((entry, entryIndex) => (
        entryIndex === index ? { ...entry, questionId } : entry
      )),
    }));
    setError('');
  };

  const handleRecoveryAnswerChange = (index, value) => {
    setRecoveryAnswers(prev => prev.map((entry, entryIndex) => (
      entryIndex === index ? { ...entry, answer: value } : entry
    )));
    setError('');
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setRecoveryStep('email');
    setRecoveryQuestions([]);
    setRecoveryAnswers([]);
    setError('');
    setForm(emptyForm());
  };

  const fillDemo = (email, pass = 'password123') => {
    setForm(prev => ({ ...prev, email, password: pass }));
    setError('');
    addToast(`Loaded ${email} credentials!`, 'info');
  };

  const handleSocialClick = (provider) => {
    // Fill demo account for instant test convenience
    fillDemo('alex@example.com', 'password123');
    addToast(`Demo login pre-filled with ${provider}! Click 'Login' to proceed.`, 'info');
  };

  const validateRegister = () => {
    if (!form.fullname || !form.username || !form.email || !form.password) {
      return 'Please fill in all fields';
    }

    const questionIds = form.securityAnswers.map(entry => entry.questionId);

    if (new Set(questionIds).size !== questionIds.length) {
      return 'Please choose three different security questions';
    }

    if (form.securityAnswers.some(entry => !entry.answer.trim())) {
      return 'Please answer all three security questions';
    }

    return '';
  };

  const requestRecoveryQuestions = async () => {
    if (!form.email.trim()) {
      setError('Please enter your email address');
      return;
    }

    const { data } = await api.post('/auth/recovery/questions', {
      email: form.email.trim(),
    });

    const questions = data.questions || [];
    setRecoveryQuestions(questions);
    setRecoveryAnswers(questions.map(question => ({
      questionId: question.questionId,
      answer: '',
    })));
    setRecoveryStep('questions');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        return;
      }

      if (mode === 'register') {
        const validationError = validateRegister();

        if (validationError) {
          setError(validationError);
          return;
        }

        await register({
          ...form,
          securityAnswers: form.securityAnswers.map(entry => ({
            questionId: entry.questionId,
            answer: entry.answer.trim(),
          })),
        });
        return;
      }

      if (recoveryStep === 'email') {
        await requestRecoveryQuestions();
        return;
      }

      if (!form.password || form.password.length < 6) {
        setError('New password must be at least 6 characters long');
        return;
      }

      if (recoveryAnswers.some(entry => !entry.answer.trim())) {
        setError('Please answer all security questions');
        return;
      }

      await resetPassword({
        email: form.email.trim(),
        newPassword: form.password,
        securityAnswers: recoveryAnswers.map(entry => ({
          questionId: entry.questionId,
          answer: entry.answer.trim(),
        })),
      });
      addToast('Password reset successfully! You can now sign in.', 'success');
      switchMode('login');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="auth-viewport">
      {/* Dynamic Background Ambient Glow Orbs */}
      <div className="auth-ambient-glow" aria-hidden="true">
        <div className="auth-glow-orb auth-glow-orb--blue" />
        <div className="auth-glow-orb auth-glow-orb--cyan" />
        <div className="auth-glow-orb auth-glow-orb--indigo" />
      </div>

      <div className="auth-container">
        {/* ── LEFT SHOWCASE PANEL ── */}
        <div className="auth-hero-panel">
          {/* Brand Header */}
          <div className="auth-hero-brand">
            <div className="auth-hero-brand__icon">
              <svg viewBox="0 0 24 24" className="chat-bubble-svg" fill="none">
                <path
                  d="M12 2C6.477 2 2 6.03 2 11c0 2.217.89 4.254 2.384 5.812L3.06 20.94a1 1 0 0 0 1.306 1.306l4.128-1.324C9.697 21.517 10.828 22 12 22c5.523 0 10-4.03 10-9s-4.477-9-10-9z"
                  fill="url(#bubbleGrad)"
                />
                <circle cx="8" cy="11.5" r="1.5" fill="#FFFFFF" />
                <circle cx="12" cy="11.5" r="1.5" fill="#FFFFFF" />
                <circle cx="16" cy="11.5" r="1.5" fill="#FFFFFF" />
                <defs>
                  <linearGradient id="bubbleGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38BDF8" />
                    <stop offset="1" stopColor="#1D4ED8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="auth-hero-brand__info">
              <span className="auth-hero-brand__title">NextChat</span>
              <span className="auth-hero-brand__tagline">Connect · Chat · Share</span>
            </div>
          </div>

          {/* Hero Headline */}
          <div className="auth-hero-text">
            <h1 className="auth-hero-text__heading">
              Real-time conversations, bigger connections.
            </h1>
            <p className="auth-hero-text__desc">
              NextChat helps you stay in touch with your friends, team and community — anytime, anywhere.
            </p>
          </div>

          {/* Interactive 3D Phone Preview with Glassmorphic Floating Elements */}
          <div className="auth-mockup-wrapper">
            {/* Floating Badges */}
            <div className="mockup-float-badge float-badge--photo">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>

            <div className="mockup-float-badge float-badge--share">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </div>

            <div className="mockup-float-badge float-badge--user">
              <span className="badge-avatar">🦊</span>
            </div>

            <div className="mockup-float-badge float-badge--msg">
              <div className="mini-bars">
                <span className="bar bar-1" />
                <span className="bar bar-2" />
              </div>
            </div>

            {/* Mobile Phone Mockup Body */}
            <div className="auth-phone-chassis">
              <div className="phone-screen">
                {/* Status Bar */}
                <div className="phone-status-bar">
                  <span className="phone-time">9:41</span>
                  <div className="phone-island" />
                  <div className="phone-icons">
                    <span className="phone-dot" />
                    <span className="phone-dot" />
                    <span className="phone-battery" />
                  </div>
                </div>

                {/* Chat Top Header */}
                <div className="phone-chat-header">
                  <div className="phone-avatar-wrap">
                    <span className="phone-avatar">👩‍💼</span>
                    <span className="phone-online-dot" />
                  </div>
                  <div className="phone-chat-meta">
                    <span className="phone-contact-name">Sarah Chen</span>
                    <span className="phone-contact-status">Online</span>
                  </div>
                </div>

                {/* Messages in Phone */}
                <div className="phone-bubbles">
                  <div className="phone-bubble phone-bubble--theirs">
                    <span>Hey Alex! Have you seen the new glassmorphism interface? 🚀</span>
                  </div>
                  <div className="phone-bubble phone-bubble--mine">
                    <span>Yes! It feels ultra smooth and responsive. Loving it! ✨</span>
                  </div>
                  <div className="phone-bubble phone-bubble--theirs">
                    <span>Real-time chat is live and connected.</span>
                  </div>
                </div>

                {/* Bottom Input Mockup */}
                <div className="phone-input-bar">
                  <span className="phone-input-placeholder">Type a message…</span>
                  <div className="phone-send-btn">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Feature Highlights Row */}
          <div className="auth-features-row">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">⚡</div>
              <span className="auth-feature-title">Instant Messaging</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">👥</div>
              <span className="auth-feature-title">Group Chats</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">🛡️</div>
              <span className="auth-feature-title">Secure &amp; Private</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">📱</div>
              <span className="auth-feature-title">On Any Device</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT AUTH CARD PANEL ── */}
        <div className="auth-form-panel">
          {/* Top Switcher Link */}
          <div className="auth-top-switch">
            {mode === 'login' ? (
              <span className="auth-top-switch__text">
                New here?{' '}
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={() => switchMode('register')}
                >
                  Create an account →
                </button>
              </span>
            ) : mode === 'register' ? (
              <span className="auth-top-switch__text">
                Already have an account?{' '}
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={() => switchMode('login')}
                >
                  Sign in →
                </button>
              </span>
            ) : (
              <span className="auth-top-switch__text">
                Remember your credentials?{' '}
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={() => switchMode('login')}
                >
                  Back to login →
                </button>
              </span>
            )}
          </div>

          {/* Main Form Box */}
          <div className="auth-card">
            {/* Header */}
            <div className="auth-card__header">
              <h2 className="auth-card__title">
                {mode === 'login' && 'Welcome Back 👋'}
                {mode === 'register' && 'Create Account 🚀'}
                {mode === 'recovery' && (recoveryStep === 'email' ? 'Reset Password 🔐' : 'Security Verification 🛡️')}
              </h2>
              <p className="auth-card__subtitle">
                {mode === 'login' && 'Login to your account to continue'}
                {mode === 'register' && 'Sign up in seconds to start chatting'}
                {mode === 'recovery' && (recoveryStep === 'email' ? 'Enter your email to find your security questions' : `Answer questions for ${form.email}`)}
              </p>
            </div>

            {/* Quick Demo Pre-fills (Available in Login mode) */}
            {mode === 'login' && (
              <div className="auth-quick-demos">
                <span className="quick-demos-label">Demo accounts:</span>
                <div className="quick-demos-btns">
                  {DEMO_FILLS.map((demo) => (
                    <button
                      key={demo.email}
                      type="button"
                      className="demo-chip-btn"
                      onClick={() => fillDemo(demo.email, demo.pass)}
                    >
                      {demo.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* The Actual Form */}
            <form className="auth-form-body" onSubmit={handleSubmit}>
              {mode === 'register' && (
                <>
                  <div className="auth-input-group">
                    <label className="auth-input-label">Full Name</label>
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </span>
                      <input
                        name="fullname"
                        type="text"
                        placeholder="Alex Rivera"
                        value={form.fullname}
                        onChange={handleChange}
                        className="auth-text-input"
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label className="auth-input-label">Username</label>
                    <div className="auth-input-wrapper">
                      <span className="auth-input-prefix">@</span>
                      <input
                        name="username"
                        type="text"
                        placeholder="alex_rivera"
                        value={form.username}
                        onChange={handleChange}
                        className="auth-text-input auth-text-input--prefixed"
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label className="auth-input-label">Gender</label>
                    <div className="auth-gender-row">
                      <button
                        type="button"
                        className={`auth-gender-chip ${form.gender === 'male' ? 'auth-gender-chip--active' : ''}`}
                        onClick={() => setForm(prev => ({ ...prev, gender: 'male' }))}
                      >
                        <span>👦</span> Male
                      </button>
                      <button
                        type="button"
                        className={`auth-gender-chip ${form.gender === 'female' ? 'auth-gender-chip--active' : ''}`}
                        onClick={() => setForm(prev => ({ ...prev, gender: 'female' }))}
                      >
                        <span>👧</span> Female
                      </button>
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label className="auth-input-label">Choose Avatar</label>
                    <EmojiAvatarPicker
                      selected={form.profilepicture || '🦊'}
                      onSelect={(emoji) => setForm(prev => ({ ...prev, profilepicture: emoji }))}
                      label=""
                    />
                  </div>
                </>
              )}

              {(mode !== 'recovery' || recoveryStep === 'email') && (
                <div className="auth-input-group">
                  <label className="auth-input-label">
                    {mode === 'login' ? 'Email or Username' : 'Email Address'}
                  </label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                      </svg>
                    </span>
                    <input
                      name="email"
                      type="text"
                      placeholder="Enter your email or username"
                      value={form.email}
                      onChange={handleChange}
                      className="auth-text-input"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>
              )}

              {(mode === 'login' || mode === 'register') && (
                <div className="auth-input-group">
                  <div className="auth-label-row">
                    <label className="auth-input-label">Password</label>
                  </div>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={handleChange}
                      className="auth-text-input"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      required
                    />
                    <button
                      type="button"
                      className="auth-pwd-toggle"
                      onClick={() => setShowPassword(p => !p)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Remember me & Forgot password in login mode */}
              {mode === 'login' && (
                <div className="auth-remember-row">
                  <label className="auth-remember-checkbox">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="auth-checkbox"
                    />
                    <span className="auth-remember-text">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="auth-forgot-link"
                    onClick={() => switchMode('recovery')}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Security Questions in Register mode */}
              {mode === 'register' && (
                <div className="auth-recovery-box">
                  <div className="auth-recovery-heading">Security Questions (For Password Reset)</div>
                  <p className="auth-recovery-desc">
                    Choose 3 distinct questions. These let you safely recover your account if you forget your password.
                  </p>
                  {form.securityAnswers.map((entry, index) => (
                    <div className="auth-recovery-row" key={index}>
                      <select
                        className="auth-recovery-select"
                        value={entry.questionId}
                        onChange={(e) => handleQuestionChange(index, e.target.value)}
                      >
                        {catalog.map(q => (
                          <option key={q.questionId} value={q.questionId}>
                            {q.question}
                          </option>
                        ))}
                      </select>
                      <input
                        className="auth-recovery-input"
                        placeholder="Your secret answer"
                        value={entry.answer}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        autoComplete="off"
                        required
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Recovery Questions verification */}
              {mode === 'recovery' && recoveryStep === 'questions' && (
                <>
                  {recoveryQuestions.map((q, index) => (
                    <div className="auth-input-group" key={q.questionId}>
                      <label className="auth-input-label">{q.question}</label>
                      <input
                        className="auth-text-input auth-text-input--solo"
                        placeholder="Your secret answer"
                        value={recoveryAnswers[index]?.answer || ''}
                        onChange={(e) => handleRecoveryAnswerChange(index, e.target.value)}
                        autoComplete="off"
                        required
                      />
                    </div>
                  ))}

                  <div className="auth-input-group">
                    <label className="auth-input-label">New Password (Min 6 Characters)</label>
                    <input
                      name="password"
                      type="password"
                      placeholder="Enter new password"
                      value={form.password}
                      onChange={handleChange}
                      className="auth-text-input auth-text-input--solo"
                      required
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="auth-error-alert" role="alert">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Primary Vibrant Action Button */}
              <button
                type="submit"
                className="auth-primary-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="auth-btn-spinner" />
                ) : (
                  <>
                    <span>
                      {mode === 'login' && 'Login'}
                      {mode === 'register' && 'Create Account'}
                      {mode === 'recovery' && (recoveryStep === 'email' ? 'Find Questions' : 'Reset Password')}
                    </span>
                    <span className="auth-btn-arrow">→</span>
                  </>
                )}
              </button>
            </form>

            {/* OR Divider */}
            {mode === 'login' && (
              <>
                <div className="auth-divider">
                  <span className="auth-divider__line" />
                  <span className="auth-divider__text">OR</span>
                  <span className="auth-divider__line" />
                </div>

                {/* Social Login Options */}
                <div className="auth-social-buttons">
                  <button
                    type="button"
                    className="auth-social-btn auth-social-btn--google"
                    onClick={() => handleSocialClick('Google')}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" className="social-icon">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <button
                    type="button"
                    className="auth-social-btn auth-social-btn--github"
                    onClick={() => handleSocialClick('GitHub')}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="social-icon">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    <span>Continue with GitHub</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
