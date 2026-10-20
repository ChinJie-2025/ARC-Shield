import React, { useEffect, useRef, useState } from 'react';
import './theme.css';
import './LoginModal.css';

const PRESET_ACCOUNTS = [
  {
    role: 'Resident',
    name: 'Resident User',
    id: 'RES-1001',
    access: 'Report hazards & view safety tools',
    avatar: 'RU',
    pin: '1234',
  },
  {
    role: 'Executive',
    name: 'Dir. Marcus Vance',
    id: 'EXEC-0012',
    access: 'Incident oversight & executive summaries',
    avatar: 'MV',
    pin: '8888',
  },
];

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState(PRESET_ACCOUNTS[0]);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const pinRef = useRef(null);
  const timerRef = useRef(null);

  // Reset the form and focus the PIN field each time the dialog opens.
  useEffect(() => {
    if (!isOpen) {
      clearTimeout(timerRef.current);
      return undefined;
    }
    setPin('');
    setErrorMsg('');
    setIsVerifying(false);
    const frame = requestAnimationFrame(() => pinRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (!isOpen) return null;

  const handleSelectPreset = (account) => {
    setSelectedRole(account);
    setPin(account.pin);
    setErrorMsg('');
  };

  const handleAuthenticate = (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setErrorMsg('');

    timerRef.current = setTimeout(() => {
      if (pin === selectedRole.pin) {
        setIsVerifying(false);
        onLoginSuccess({
          role: selectedRole.role,
          name: selectedRole.name,
          id: selectedRole.id,
          avatar: selectedRole.avatar,
        });
        onClose();
      } else {
        setIsVerifying(false);
        setErrorMsg('Incorrect PIN. Select a profile above to fill in the demo PIN.');
      }
    }, 450);
  };

  return (
    <div
      className="as-login__scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="as-login__dialog" role="dialog" aria-modal="true" aria-labelledby="login-title">
        <div className="as-login__top">
          <div className="as-login__brand">
            <span className="as-login__logo" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <span className="as-login__brand-text">
              <strong>ARC-SHIELD</strong>
              <span>Resident &amp; executive access</span>
            </span>
          </div>
          <button type="button" className="as-login__close" onClick={onClose} aria-label="Close sign in">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleAuthenticate} className="as-login__body">
          <div>
            <h2 id="login-title" className="as-login__title">Choose your dashboard</h2>
            <p className="as-login__lead">
              Residents can report hazards and view safety tools. Executives can review reports and response operations.
            </p>
          </div>

          <div>
            <span className="as-login__label" id="profile-label">Choose access</span>
            <div className="as-login__profiles" role="radiogroup" aria-labelledby="profile-label">
              {PRESET_ACCOUNTS.map((acc) => {
                const isSelected = selectedRole.role === acc.role;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`as-login__profile ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelectPreset(acc)}
                  >
                    <span className="as-login__avatar" aria-hidden="true">{acc.avatar}</span>
                    <span className="as-login__profile-meta">
                      <strong>{acc.role}</strong>
                      <span>{acc.name}</span>
                      <small>{acc.access}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="as-login__pin-row">
              <label htmlFor="operator-pin" className="as-login__label">Demo access PIN</label>
              <span className="as-login__demo-hint">Demo PIN: {selectedRole.pin}</span>
            </div>
            <div className="as-login__pin-shell">
              <svg className="as-login__pin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <input
                ref={pinRef}
                id="operator-pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="as-login__pin"
                placeholder="Enter PIN"
                aria-invalid={errorMsg ? 'true' : undefined}
                aria-describedby={errorMsg ? 'login-error' : undefined}
                required
              />
            </div>
            {errorMsg && (
              <p id="login-error" className="as-login__error" role="alert">
                {errorMsg}
              </p>
            )}
          </div>

          <div className="as-login__actions">
            <button
              type="submit"
              className="as-btn as-btn--primary as-btn--lg as-btn--block"
              disabled={isVerifying || !pin.trim()}
              aria-busy={isVerifying}
            >
              {isVerifying ? (
                <span>Signing in…</span>
              ) : (
                <>
                  <span>Sign in as {selectedRole.role}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
            <p className="as-login__note">
              Prototype sign-in for demonstration only. No real credentials are used.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
