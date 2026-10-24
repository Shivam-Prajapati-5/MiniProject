import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
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
  securityAnswers: DEFAULT_ANSWERS(),
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const queryMode = searchParams.get('mode');
  const initialMode = queryMode === 'register' ? 'register' : queryMode === 'recovery' ? 'recovery' : 'login';

  const { login, register, resetPassword, loading } = useAuth();
  const [mode, setMode] = useState(initialMode); // login | register | recovery
  const [recoveryStep, setRecoveryStep] = useState('email'); // email | questions

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
      .catch(() => {
        // The built-in copy of the catalog keeps signup usable offline.
      });
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
    ? 'Welcome back'
    : mode === 'register'
      ? 'Create account'
      : recoveryStep === 'questions'
        ? 'Answer your questions'
        : 'Reset password';

  const subtitle = mode === 'login'
    ? 'Sign in to continue chatting'
    : mode === 'register'
      ? 'Join the conversation — recovery questions keep you safe'
      : recoveryStep === 'questions'
        ? `Confirm the answers for ${form.email}`
        : 'Use the security questions you chose at signup';

  return (
    <div className="auth-bg">
      <div className="auth-glow auth-glow-1" />
      <div className="auth-glow auth-glow-2" />

      <Link
        to="/"
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: '#94a3b8',
          textDecoration: 'none',
          fontSize: '0.9rem',
          fontWeight: 500,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '8px 16px',
          borderRadius: '999px',
          backdropFilter: 'blur(10px)',
          zIndex: 10,
          transition: 'all 0.2s',
        }}
      >
        ← Back to Homepage
      </Link>

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <span className="auth-logo-text">NexChat</span>
        </div>

        <h1 className="auth-title">{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-wrap">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input name="fullname" placeholder="John Doe" value={form.fullname} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Username</label>
                <div className="input-wrap">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <input name="username" placeholder="johndoe" value={form.username} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Gender</label>
                <div className="gender-select">
                  <button
                    type="button"
                    className={`gender-btn ${form.gender === 'male' ? 'active' : ''}`}
                    onClick={() => setForm(prev => ({ ...prev, gender: 'male' }))}
                  >
                    <span>👦</span> Male
                  </button>
                  <button
                    type="button"
                    className={`gender-btn ${form.gender === 'female' ? 'active' : ''}`}
                    onClick={() => setForm(prev => ({ ...prev, gender: 'female' }))}
                  >
                    <span>👧</span> Female
                  </button>
                </div>
              </div>
            </>
          )}

          {(mode !== 'recovery' || recoveryStep === 'email') && (
            <div className="form-group">
              <label>Email</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} />
              </div>
            </div>
          )}

          {mode === 'login' && (
            <button
              type="button"
              className="auth-forgot"
              onClick={() => switchMode('recovery')}
            >
              Forgot password?
            </button>
          )}

          {mode === 'register' && (
            <div className="security-block">
              <div className="security-block__title">Account recovery</div>
              <p className="security-block__hint">
                Choose three questions. Answers are hashed and only used to reset your password.
              </p>

              {form.securityAnswers.map((entry, index) => (
                <div className="security-row" key={index}>
                  <select
                    className="auth-select"
                    value={entry.questionId}
                    onChange={(event) => handleQuestionChange(index, event.target.value)}
                    aria-label={`Security question ${index + 1}`}
                  >
                    {catalog.map(question => (
                      <option key={question.questionId} value={question.questionId}>
                        {question.question}
                      </option>
                    ))}
                  </select>
                  <input
                    className="auth-answer-input"
                    placeholder="Your answer"
                    value={entry.answer}
                    onChange={(event) => handleAnswerChange(index, event.target.value)}
                    autoComplete="off"
                    aria-label={`Answer for security question ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          )}

          {mode === 'recovery' && recoveryStep === 'questions' && (
            <>
              {recoveryQuestions.map((question, index) => (
                <div className="form-group" key={question.questionId}>
                  <label>{question.question}</label>
                  <div className="input-wrap">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <input
                      placeholder="Your answer"
                      value={recoveryAnswers[index]?.answer || ''}
                      onChange={(event) => handleRecoveryAnswerChange(index, event.target.value)}
                      autoComplete="off"
                    />
                  </div>
                </div>
              ))}

              <div className="form-group">
                <label>New password</label>
                <div className="input-wrap">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    name="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="auth-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? (
              <span className="spinner" />
            ) : mode === 'login' ? (
              'Sign In'
            ) : mode === 'register' ? (
              'Create Account'
            ) : recoveryStep === 'email' ? (
              'Find My Questions'
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'register' ? (
            <>
              Already have an account?
              <button onClick={() => switchMode('login')}> Sign in</button>
            </>
          ) : mode === 'recovery' ? (
            <>
              Remembered your password?
              <button onClick={() => switchMode('login')}> Sign in</button>
            </>
          ) : (
            <>
              Don&apos;t have an account?
              <button onClick={() => switchMode('register')}> Sign up</button>
            </>
          )}
        </p>

        {mode === 'recovery' && recoveryStep === 'questions' && (
          <p className="auth-switch auth-switch--secondary">
            <button onClick={() => {
              setRecoveryStep('email');
              setRecoveryQuestions([]);
              setRecoveryAnswers([]);
              setError('');
            }}>
              Use a different email
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Auth;
