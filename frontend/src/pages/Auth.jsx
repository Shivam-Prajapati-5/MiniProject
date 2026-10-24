import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  { label: 'Alex Rivera', email: 'alex@example.com' },
  { label: 'Sarah Chen', email: 'sarah@example.com' },
];

const Auth = () => {
  const [searchParams] = useSearchParams();
  const queryMode = searchParams.get('mode');
  const initialMode = queryMode === 'register' ? 'register' : queryMode === 'recovery' ? 'recovery' : 'login';

  const { login, register, resetPassword, loading } = useAuth();
  const [mode, setMode] = useState(initialMode); // login | register | recovery
  const [recoveryStep, setRecoveryStep] = useState('email'); // email | questions
  const [showPassword, setShowPassword] = useState(false);

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

  const fillDemo = (email) => {
    setForm(prev => ({ ...prev, email, password: 'password123' }));
    setError('');
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
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const title = mode === 'login'
    ? 'Sign In'
    : mode === 'register'
      ? 'Create Your Account'
      : recoveryStep === 'questions'
        ? 'Security Verification'
        : 'Reset Password';

  const subtitle = mode === 'login'
    ? 'Welcome back to NexChat. Continue your conversations.'
    : mode === 'register'
      ? 'Choose your username, emoji avatar, and security questions.'
      : recoveryStep === 'questions'
        ? `Answer the security questions for ${form.email}`
        : 'Enter your email to find your security questions.';

  return (
    <div className="auth-chamber">
      {/* Ambient Dynamic Background Lighting */}
      <div className="ambient-glow-layer" aria-hidden="true">
        <div className="ambient-orb ambient-orb--maroon" />
        <div className="ambient-orb ambient-orb--gold" />
        <div className="ambient-orb ambient-orb--purple" />
      </div>

      {/* Top Header */}
      <header className="auth-chamber__header">
        <Link to="/" className="terminal-back">
          <span className="terminal-back__arrow">←</span>
          <span>Back to Home</span>
        </Link>
        <span className="terminal-brand-pill">NexChat</span>
      </header>

      {/* Main Authentication Card */}
      <div className="auth-surface-wrap">
        <section className="auth-surface">
          <div className="surface-hairline" />

          {/* Monogram & Title */}
          <div className="surface-header">
            <div className="surface-monogram">
              <span className="monogram-lock">💬</span>
            </div>
            <h1 className="surface-title">{title}</h1>
            <p className="surface-subtitle">{subtitle}</p>
          </div>

          {/* Mode Switcher */}
          <div className="auth-segment-grid">
            <button
              type="button"
              className={`segment-tab ${mode === 'login' ? 'segment-tab--active' : ''}`}
              onClick={() => switchMode('login')}
            >
              <span>Sign In</span>
              {mode === 'login' && <div className="tab-indicator" />}
            </button>
            <button
              type="button"
              className={`segment-tab ${mode === 'register' ? 'segment-tab--active' : ''}`}
              onClick={() => switchMode('register')}
            >
              <span>Sign Up</span>
              {mode === 'register' && <div className="tab-indicator" />}
            </button>
            <button
              type="button"
              className={`segment-tab ${mode === 'recovery' ? 'segment-tab--active' : ''}`}
              onClick={() => switchMode('recovery')}
            >
              <span>Recovery</span>
              {mode === 'recovery' && <div className="tab-indicator" />}
            </button>
          </div>

          {/* Quick Demo Logins (Sign In mode) */}
          {mode === 'login' && (
            <div className="fast-dispatch-row">
              <span className="fast-dispatch-label">QUICK DEMO:</span>
              {DEMO_FILLS.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => fillDemo(demo.email)}
                  className="fast-dispatch-btn"
                >
                  {demo.label}
                </button>
              ))}
            </div>
          )}

          {/* Form */}
          <form className="auth-dispatch-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <div className="dispatch-field">
                  <label className="field-label">Full Name</label>
                  <div className="field-input-wrap">
                    <input
                      name="fullname"
                      placeholder="Alex Rivera"
                      value={form.fullname}
                      onChange={handleChange}
                      className="field-input"
                    />
                  </div>
                </div>

                <div className="dispatch-field">
                  <label className="field-label">Username</label>
                  <div className="field-input-wrap">
                    <span className="field-prefix">@</span>
                    <input
                      name="username"
                      placeholder="alex_r"
                      value={form.username}
                      onChange={handleChange}
                      className="field-input field-input--prefixed"
                    />
                  </div>
                </div>

                <div className="dispatch-field">
                  <label className="field-label">Gender</label>
                  <div className="gender-toggle-row">
                    <button
                      type="button"
                      className={`gender-chip ${form.gender === 'male' ? 'gender-chip--active' : ''}`}
                      onClick={() => setForm(prev => ({ ...prev, gender: 'male' }))}
                    >
                      <span>👦</span> Male
                    </button>
                    <button
                      type="button"
                      className={`gender-chip ${form.gender === 'female' ? 'gender-chip--active' : ''}`}
                      onClick={() => setForm(prev => ({ ...prev, gender: 'female' }))}
                    >
                      <span>👧</span> Female
                    </button>
                  </div>
                </div>

                <div className="dispatch-field">
                  <label className="field-label">Choose Your Avatar</label>
                  <EmojiAvatarPicker
                    selected={form.profilepicture || '🦊'}
                    onSelect={(emoji) => setForm(prev => ({ ...prev, profilepicture: emoji }))}
                    label=""
                  />
                </div>
              </>
            )}

            {(mode !== 'recovery' || recoveryStep === 'email') && (
              <div className="dispatch-field">
                <label className="field-label">Email Address</label>
                <div className="field-input-wrap">
                  <input
                    name="email"
                    type="email"
                    placeholder="alex@example.com"
                    value={form.email}
                    onChange={handleChange}
                    className="field-input"
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'register') && (
              <div className="dispatch-field">
                <div className="field-label-row">
                  <label className="field-label">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      className="field-link"
                      onClick={() => switchMode('recovery')}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="field-input-wrap">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={form.password}
                    onChange={handleChange}
                    className="field-input"
                  />
                  <button
                    type="button"
                    className="passkey-toggle"
                    onClick={() => setShowPassword(p => !p)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="security-recovery-box">
                <div className="recovery-title">Account Recovery Questions</div>
                <p className="recovery-desc">
                  Choose 3 questions. Answers are securely hashed and used if you ever forget your password.
                </p>

                {form.securityAnswers.map((entry, index) => (
                  <div className="recovery-row" key={index}>
                    <select
                      className="recovery-select"
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
                      className="recovery-input"
                      placeholder="Your secret answer"
                      value={entry.answer}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                ))}
              </div>
            )}

            {mode === 'recovery' && recoveryStep === 'questions' && (
              <>
                {recoveryQuestions.map((q, index) => (
                  <div className="dispatch-field" key={q.questionId}>
                    <label className="field-label">{q.question}</label>
                    <input
                      className="field-input"
                      placeholder="Your answer"
                      value={recoveryAnswers[index]?.answer || ''}
                      onChange={(e) => handleRecoveryAnswerChange(index, e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                ))}

                <div className="dispatch-field">
                  <label className="field-label">New Password (Min 6 Characters)</label>
                  <input
                    name="password"
                    type="password"
                    placeholder="Enter new password"
                    value={form.password}
                    onChange={handleChange}
                    className="field-input"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="auth-error-banner">
                <span className="error-icon">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button className="auth-submit-btn" type="submit" disabled={loading}>
              {loading ? (
                <span className="spinner-auth" />
              ) : mode === 'login' ? (
                'Sign In →'
              ) : mode === 'register' ? (
                'Create Account →'
              ) : recoveryStep === 'email' ? (
                'Find Questions →'
              ) : (
                'Reset Password →'
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="surface-footer">
            <span className="surface-footer__icon">🛡️</span>
            <p className="surface-footer__text">
              NexChat protects your privacy with secure cookie sessions and contact requests.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Auth;
