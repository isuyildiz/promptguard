import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';

/* ─── SVG İkonlar ─────────────────────────────────────────────── */
const ShieldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" opacity="0.6" />
  </svg>
);

const PersonIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 9h1v1H9zM14 9h1v1h-1zM9 14h1v1H9zM14 14h1v1h-1z" fill="currentColor" stroke="none" />
    <path d="M9 8h2v2H9zM13 8h2v2h-2zM9 13h2v2H9zM13 13h2v2h-2zM10 21v-5h4v5" />
  </svg>
);

const EyeIcon = ({ show }) => show ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/* ─── Validasyon Şemaları ─────────────────────────────────────── */
const loginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().required('Required'),
});

const registerSchema = Yup.object().shape({
  name: Yup.string().required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  institutionCode: Yup.string().when('$userMode', {
    is: 'institutional',
    then: (s) => s.required('Institution code is required'),
    otherwise: (s) => s.notRequired(),
  }),
  password: Yup.string().min(8, 'At least 8 characters').required('Required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match')
    .required('Required'),
});

const resetSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
});

/* ─── Input Bileşeni ──────────────────────────────────────────── */
const InputField = ({ name, type = 'text', placeholder, label, showToggle, onToggle, showPassword }) => (
  <div className="input-group">
    <label className="input-label">{label}</label>
    <div className="input-wrapper">
      <Field
        name={name}
        type={showToggle ? (showPassword ? 'text' : 'password') : type}
        placeholder={placeholder}
        className="input-field"
      />
      {showToggle && (
        <button type="button" className="eye-btn" onClick={onToggle}>
          <EyeIcon show={showPassword} />
        </button>
      )}
    </div>
  </div>
);

/* ─── Ana Bileşen ─────────────────────────────────────────────── */
const AuthPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [currentView, setCurrentView] = useState('login');
  const [userMode, setUserMode] = useState('individual');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #07070f;
          font-family: 'DM Sans', sans-serif;
          padding: 24px 16px;
          position: relative;
          overflow: hidden;
        }

        /* Arka plan blob'ları */
        .bg-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
        }
        .bg-blob-purple {
          width: 520px; height: 520px;
          background: radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 70%);
          top: -160px; left: -160px;
        }
        .bg-blob-blue {
          width: 480px; height: 480px;
          background: radial-gradient(circle, rgba(37,99,235,0.22) 0%, transparent 70%);
          bottom: -140px; right: -140px;
        }
        .bg-blob-indigo {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
        }

        /* Logo */
        .logo-area {
          text-align: center;
          margin-bottom: 28px;
        }
        .logo-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 52px; height: 52px;
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          border-radius: 16px;
          color: white;
          margin-bottom: 12px;
          box-shadow: 0 8px 32px rgba(124,58,237,0.35);
        }
        .logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: white;
          letter-spacing: -0.5px;
        }
        .logo-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.45);
          margin-top: 4px;
          letter-spacing: 0.2px;
        }

        /* Kart */
        .auth-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 24px;
          padding: 28px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          position: relative;
          z-index: 1;
          box-shadow: 0 24px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08);
        }

        /* Kullanıcı tipi seçici */
        .mode-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 24px;
        }
        .mode-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 14px 10px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }
        .mode-btn:hover {
          color: rgba(255,255,255,0.6);
          border-color: rgba(255,255,255,0.15);
        }
        .mode-btn.active {
          border-color: #7c3aed;
          background: rgba(124,58,237,0.12);
          color: white;
          box-shadow: 0 0 0 1px rgba(124,58,237,0.4), inset 0 0 20px rgba(124,58,237,0.08);
        }

        /* Tab */
        .tabs {
          display: flex;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          margin-bottom: 24px;
        }
        .tab-btn {
          flex: 1;
          padding: 10px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: rgba(255,255,255,0.35);
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: -1px;
        }
        .tab-btn.active {
          color: white;
          border-bottom-color: #7c3aed;
        }
        .tab-btn:hover:not(.active) {
          color: rgba(255,255,255,0.6);
        }

        /* Form */
        .form-stack { display: flex; flex-direction: column; gap: 14px; }

        .input-group { display: flex; flex-direction: column; gap: 6px; }
        .input-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
        }
        .input-wrapper { position: relative; }
        .input-field {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 12px;
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }
        .input-field::placeholder { color: rgba(255,255,255,0.25); }
        .input-field:focus {
          border-color: rgba(124,58,237,0.7);
          background: rgba(124,58,237,0.06);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.15);
        }
        .eye-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .eye-btn:hover { color: rgba(255,255,255,0.7); }

        /* Password+Confirm yan yana */
        .pw-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

        /* Forgot link */
        .forgot-row {
          display: flex;
          justify-content: flex-end;
          margin-top: -6px;
        }
        .forgot-link {
          background: none; border: none;
          color: rgba(124,58,237,0.9);
          font-size: 13px; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: color 0.2s;
        }
        .forgot-link:hover { color: #a78bfa; }

        /* Submit butonu */
        .submit-btn {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          border: none;
          border-radius: 12px;
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(124,58,237,0.35);
          margin-top: 4px;
        }
        .submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(124,58,237,0.45);
        }
        .submit-btn:active { transform: translateY(0); }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 4px 0;
        }
        .divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.08); }
        .divider-text { font-size: 12px; color: rgba(255,255,255,0.25); white-space: nowrap; }

        /* Footer linkleri */
        .auth-footer {
          text-align: center;
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          margin-top: 20px;
        }
        .auth-footer button {
          background: none; border: none;
          color: #a78bfa;
          font-size: 13px; font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          cursor: pointer;
        }
        .auth-footer button:hover { color: white; }

        /* ToS */
        .tos-text {
          font-size: 11px;
          color: rgba(255,255,255,0.25);
          text-align: center;
          margin-top: 16px;
          line-height: 1.6;
        }
        .tos-text a { color: rgba(124,58,237,0.8); text-decoration: none; }
        .tos-text a:hover { color: #a78bfa; }

        /* Hata mesajı */
        .field-error {
          font-size: 11px;
          color: #f87171;
          margin-top: 3px;
        }

        /* Fade animasyonu */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.25s ease forwards; }
      `}</style>

      <div className="auth-root">
        {/* Arka plan efektleri */}
        <div className="bg-blob bg-blob-purple" />
        <div className="bg-blob bg-blob-blue" />
        <div className="bg-blob bg-blob-indigo" />

        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Logo */}
          <div className="logo-area">
            <div className="logo-icon"><ShieldIcon /></div>
            <div className="logo-text">PromptGuard</div>
            <div className="logo-sub">Your intelligent AI gateway</div>
          </div>

          {/* Kart */}
          <div className="auth-card">

            {/* ── LOGIN / REGISTER ─────────────────────────── */}
            {(currentView === 'login' || currentView === 'register') && (
              <div className="fade-up">
                {/* Kullanıcı tipi */}
                <div className="mode-selector">
                  <button
                    type="button"
                    className={`mode-btn ${userMode === 'individual' ? 'active' : ''}`}
                    onClick={() => setUserMode('individual')}
                  >
                    <PersonIcon />
                    Individual
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${userMode === 'institutional' ? 'active' : ''}`}
                    onClick={() => setUserMode('institutional')}
                  >
                    <BuildingIcon />
                    Institutional
                  </button>
                </div>

                {/* Tab */}
                <div className="tabs">
                  <button
                    className={`tab-btn ${currentView === 'login' ? 'active' : ''}`}
                    onClick={() => setCurrentView('login')}
                  >
                    Login
                  </button>
                  <button
                    className={`tab-btn ${currentView === 'register' ? 'active' : ''}`}
                    onClick={() => setCurrentView('register')}
                  >
                    Register
                  </button>
                </div>

                {/* LOGIN FORMU */}
                {currentView === 'login' && (
                  <Formik
                    initialValues={{ email: '', password: '' }}
                    validationSchema={loginSchema}
                    onSubmit={async (values, { setStatus, setSubmitting }) => {
                      try {
                        const res = await api.post('/auth/login', {
                          email: values.email,
                          password: values.password,
                        });
                        login(res.data.access_token, { email: values.email, mode: userMode });
                        // Decode JWT to get role without importing AuthContext helper
                        let role = null;
                        try {
                          const base64 = res.data.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
                          role = JSON.parse(atob(base64))?.role;
                        } catch {}
                        navigate(role === 'corporate_admin' ? '/admin' : '/chat');
                      } catch (err) {
                        const msg = err.response?.data?.detail || 'Login failed.';
                        setStatus(msg);
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                  >
                    {({ errors, touched, status, isSubmitting }) => (
                      <Form className="form-stack">
                        {status && (
                          <div style={{ color: '#f87171', fontSize: 13, textAlign: 'center', padding: '8px 12px', background: 'rgba(220,38,38,0.08)', borderRadius: 8, border: '1px solid rgba(220,38,38,0.2)' }}>
                            {status}
                          </div>
                        )}
                        <div className="input-group">
                          <label className="input-label">Email Address</label>
                          <Field name="email" type="email" placeholder="name@company.com" className="input-field" />
                          {errors.email && touched.email && <span className="field-error">{errors.email}</span>}
                        </div>

                        <div className="input-group">
                          <label className="input-label">Password</label>
                          <div className="input-wrapper">
                            <Field
                              name="password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="input-field"
                              style={{ paddingRight: 40 }}
                              autoComplete="new-password"
                            />
                            <button type="button" className="eye-btn" onClick={() => setShowPassword(p => !p)}>
                              <EyeIcon show={showPassword} />
                            </button>
                          </div>
                          {errors.password && touched.password && <span className="field-error">{errors.password}</span>}
                        </div>

                        <div className="forgot-row">
                          <button type="button" className="forgot-link" onClick={() => setCurrentView('reset')}>
                            Forgot password?
                          </button>
                        </div>

                        <button type="submit" className="submit-btn" disabled={isSubmitting}>
                          {isSubmitting ? 'Logging in...' : 'Login'}
                        </button>

                        <div className="tos-text">
                          By continuing, you agree to PromptGuard's{' '}
                          <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                        </div>
                      </Form>
                    )}
                  </Formik>
                )}

                {/* REGISTER FORMU */}
                {currentView === 'register' && (
                  <Formik
                    initialValues={{ name: '', email: '', institutionCode: '', password: '', confirmPassword: '' }}
                    validationSchema={registerSchema}
                    validationContext={{ userMode }}
                    onSubmit={async (values, { setStatus, setSubmitting }) => {
                      try {
                        await api.post('/auth/register', {
                          email: values.email,
                          full_name: values.name || undefined,
                          password: values.password,
                          user_mode: userMode,
                          institution_code: userMode === 'institutional' ? values.institutionCode : undefined,
                        });
                        setCurrentView('login');
                      } catch (err) {
                        const msg = err.response?.data?.detail || 'Registration failed.';
                        setStatus(msg);
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                  >
                    {({ errors, touched, status, isSubmitting }) => (
                      <Form className="form-stack">
                        {status && (
                          <div style={{ color: '#f87171', fontSize: 13, textAlign: 'center', padding: '8px 12px', background: 'rgba(220,38,38,0.08)', borderRadius: 8, border: '1px solid rgba(220,38,38,0.2)' }}>
                            {status}
                          </div>
                        )}
                        <div className="input-group">
                          <label className="input-label">Full Name</label>
                          <Field name="name" type="text" placeholder="John Doe" className="input-field" />
                          {errors.name && touched.name && <span className="field-error">{errors.name}</span>}
                        </div>

                        <div className="input-group">
                          <label className="input-label">Email Address</label>
                          <Field name="email" type="email" placeholder="name@company.com" className="input-field" />
                          {errors.email && touched.email && <span className="field-error">{errors.email}</span>}
                        </div>

                        {userMode === 'institutional' && (
                          <div className="input-group">
                            <label className="input-label">Institution Code</label>
                            <Field name="institutionCode" type="text" placeholder="PG-INST-XXXX" className="input-field" />
                            {errors.institutionCode && touched.institutionCode && (
                              <span className="field-error">{errors.institutionCode}</span>
                            )}
                          </div>
                        )}

                        <div className="pw-row">
                          <div className="input-group">
                            <label className="input-label">Password</label>
                            <div className="input-wrapper">
                              <Field
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="input-field"
                                style={{ paddingRight: 40 }}
                                autoComplete="new-password"
                              />
                              <button type="button" className="eye-btn" onClick={() => setShowPassword(p => !p)}>
                                <EyeIcon show={showPassword} />
                              </button>
                            </div>
                            {errors.password && touched.password && <span className="field-error">{errors.password}</span>}
                          </div>
                          <div className="input-group">
                            <label className="input-label">Confirm</label>
                            <div className="input-wrapper">
                              <Field
                                name="confirmPassword"
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="input-field"
                                style={{ paddingRight: 40 }}
                                autoComplete="new-password"
                              />
                              <button type="button" className="eye-btn" onClick={() => setShowConfirm(p => !p)}>
                                <EyeIcon show={showConfirm} />
                              </button>
                            </div>
                            {errors.confirmPassword && touched.confirmPassword && (
                              <span className="field-error">{errors.confirmPassword}</span>
                            )}
                          </div>
                        </div>

                        <button type="submit" className="submit-btn" disabled={isSubmitting}>
                          {isSubmitting ? 'Creating account...' : 'Register Account'}
                        </button>

                        <div className="tos-text">
                          By continuing, you agree to PromptGuard's{' '}
                          <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                        </div>
                      </Form>
                    )}
                  </Formik>
                )}
              </div>
            )}

            {/* ── RESET PASSWORD ───────────────────────────── */}
            {currentView === 'reset' && (
              <div className="fade-up">
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>🔑</div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 6 }}>
                    Reset Password
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                    Enter your email to receive a reset link
                  </div>
                </div>

                <Formik
                  initialValues={{ email: '' }}
                  validationSchema={resetSchema}
                  onSubmit={() => setCurrentView('login')}
                >
                  {({ errors, touched }) => (
                    <Form className="form-stack">
                      <div className="input-group">
                        <label className="input-label">Email Address</label>
                        <Field name="email" type="email" placeholder="name@company.com" className="input-field" />
                        {errors.email && touched.email && <span className="field-error">{errors.email}</span>}
                      </div>
                      <button type="submit" className="submit-btn">Send Reset Link</button>
                    </Form>
                  )}
                </Formik>

                <div className="auth-footer">
                  Remember your password?{' '}
                  <button onClick={() => setCurrentView('login')}>Back to login</button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;