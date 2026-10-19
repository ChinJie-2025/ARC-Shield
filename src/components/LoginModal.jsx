import React, { useState } from 'react';
import './LoginModal.css';

const PRESET_ACCOUNTS = [
  {
    role: 'Property Staff',
    name: 'Officer Alex Tan',
    id: 'STAFF-8841',
    access: 'Field Operations & Dispatch',
    avatar: 'AT',
    pin: '1234',
  },
  {
    role: 'Executive',
    name: 'Dir. Marcus Vance',
    id: 'EXEC-0012',
    access: 'C-Level Escalations & Governance',
    avatar: 'MV',
    pin: '8888',
  },
];

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState(PRESET_ACCOUNTS[0]);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

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

    setTimeout(() => {
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
        setErrorMsg('Invalid Security PIN. Click a preset account badge below.');
      }
    }, 450);
  };

  return (
    <div
      className="login-scrim-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="login-glass-chassis">
        {/* Hardware-styled Top Header */}
        <div className="login-top-bar">
          <div className="login-identity-mark">
            <div className="login-logo-orb">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <span className="login-brand-title">ARC-SHIELD OS</span>
              <span className="login-brand-sub">IDENTITY &amp; ACCESS GATEWAY</span>
            </div>
          </div>
          <button type="button" className="btn-login-close" onClick={onClose} aria-label="Close Login">
            ✕
          </button>
        </div>

        <form onSubmit={handleAuthenticate} className="login-form-body">
          <div className="login-prompt-copy">
            <h2 className="login-headline">Authenticate Console Session</h2>
            <p className="login-sub-lead">
              Select an authorized security profile or enter an assigned operator PIN to route terminal privileges.
            </p>
          </div>

          {/* Quick-Select Demo Badges */}
          <div className="accounts-preset-shelf">
            <span className="shelf-label">Quick-Select Operator Profile:</span>
            <div className="accounts-cards-pair">
              {PRESET_ACCOUNTS.map((acc) => {
                const isSelected = selectedRole.role === acc.role;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    className={`account-badge-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelectPreset(acc)}
                  >
                    <div className="badge-avatar-circle">{acc.avatar}</div>
                    <div className="badge-meta">
                      <strong className="badge-role">{acc.role}</strong>
                      <span className="badge-name">{acc.name}</span>
                      <span className="badge-access">{acc.access}</span>
                    </div>
                    {isSelected && <span className="badge-active-dot" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN Input with Affix */}
          <div className="pin-input-group">
            <div className="pin-label-row">
              <label htmlFor="operator-pin" className="pin-label-text">
                Passcode / Operator PIN
              </label>
              <span className="pin-hint-tag">Default: {selectedRole.pin}</span>
            </div>
            <div className="pin-input-shell">
              <span className="pin-lock-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </span>
              <input
                id="operator-pin"
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="pin-native-input"
                placeholder="Enter 4-digit PIN"
                required
              />
            </div>
            {errorMsg && <p className="login-error-text">{errorMsg}</p>}
          </div>

          <div className="login-action-shelf">
            <button
              type="submit"
              disabled={isVerifying || !pin.trim()}
              className="btn-authenticate-submit"
            >
              {isVerifying ? (
                <span>Validating Cryptographic Handshake...</span>
              ) : (
                <>
                  <span>Sign In as {selectedRole.role}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
            <p className="login-audit-note">
              Session is encrypted under FIPS 140-2 compliance. Actions are logged to immutable dispatch logs.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}