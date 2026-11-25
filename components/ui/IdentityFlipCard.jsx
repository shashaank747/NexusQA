import React from 'react';
import { createRoot } from 'react-dom/client';
import FlipCard from './FlipCard.jsx';

function getDesignationBadgeClass(designation) {
  if (designation === 'Senior Developer') return 'badge-passed';
  if (designation === 'Junior Developer') return 'badge-ai';
  if (designation === 'Senior Tester') return 'badge-version';
  if (designation === 'Junior Tester') return 'badge-untested';
  return 'badge-blocked';
}

export function IdentityFlipCard({
  fullName = 'User Name',
  designation = 'Pending Admin Assignment',
  department = '',
  userId = 'user-current',
  email = 'user@nexusqa.io',
  phone = '—',
  bio = '',
  lastLogin = '—',
  lastLogout = '—',
  avatarUrl = '',
  initials = 'QA',
  verified = true,
  isLightTheme = false
}) {
  const cardBg = isLightTheme ? '#ffffff' : '#131926';
  const cardColor = isLightTheme ? '#0f172a' : '#f1f5f9';
  const shadowColor = isLightTheme ? '#0f172a' : '#000000';
  const shadowOpacity = isLightTheme ? 0.16 : 0.45;
  const desigClass = getDesignationBadgeClass(designation);

  const frontFace = (
    <div className="nexus-fc-face nexus-fc-front">
      <div className="nexus-fc-banner">
        <div className="nexus-fc-brand">
          <i className="fa-solid fa-cube text-primary" />
          <span>NEXUSQA WORKSPACE</span>
        </div>
        <span className="badge badge-passed text-xs">
          <i className="fa-solid fa-circle-check" /> {verified ? 'Verified' : 'Pending'}
        </span>
      </div>

      <div className="nexus-fc-front-body">
        <div className="nexus-fc-avatar-wrap">
          <div className="nexus-fc-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="nexus-fc-avatar-img" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <span className="nexus-fc-online-dot" title="Online" />
        </div>

        <h2 className="nexus-fc-name">{fullName || 'User Name'}</h2>

        <div className="nexus-fc-badges">
          <span className={`badge ${desigClass}`}>{designation}</span>
          <span className="nexus-fc-dept-pill">
            <i className="fa-solid fa-building" /> {department || 'Workspace Team'}
          </span>
        </div>
      </div>

      <div className="nexus-fc-footer">
        <span className="nexus-fc-hint">Click or drag card to flip ↻</span>
        <span className="nexus-fc-userid font-mono">{userId}</span>
      </div>
    </div>
  );

  const backFace = (
    <div className="nexus-fc-face nexus-fc-back">
      <div className="nexus-fc-banner">
        <div className="nexus-fc-brand">
          <i className="fa-solid fa-shield-halved text-primary" />
          <span>Credentials &amp; Activity Telemetry</span>
        </div>
      </div>

      <div className="nexus-fc-back-rows">
        <div className="nexus-fc-row">
          <span className="nexus-fc-label"><i className="fa-solid fa-envelope" /> Email ID</span>
          <span className="nexus-fc-val font-mono">{email || '—'}</span>
        </div>
        <div className="nexus-fc-row">
          <span className="nexus-fc-label"><i className="fa-solid fa-phone" /> Phone</span>
          <span className="nexus-fc-val font-mono">{phone || '—'}</span>
        </div>
        <div className="nexus-fc-row">
          <span className="nexus-fc-label"><i className="fa-solid fa-building" /> Department</span>
          <span className="nexus-fc-val">{department || '—'}</span>
        </div>
        <div className="nexus-fc-row nexus-fc-row-bio">
          <span className="nexus-fc-label"><i className="fa-solid fa-quote-left" /> Bio / Focus</span>
          <span className="nexus-fc-val nexus-fc-bio-text">{bio || '—'}</span>
        </div>
        <div className="nexus-fc-row">
          <span className="nexus-fc-label"><i className="fa-solid fa-right-to-bracket" /> Last Login</span>
          <span className="nexus-fc-val font-mono text-xs">{lastLogin || '—'}</span>
        </div>
        <div className="nexus-fc-row">
          <span className="nexus-fc-label"><i className="fa-solid fa-right-from-bracket" /> Last Logout</span>
          <span className="nexus-fc-val font-mono text-xs">{lastLogout || '—'}</span>
        </div>
      </div>

      <div className="nexus-fc-footer">
        <span className="nexus-fc-hint">Click or drag to return to front ↺</span>
      </div>
    </div>
  );

  return (
    <FlipCard
      front={frontFace}
      back={backFace}
      axis="y"
      flipOnClick
      draggable
      dragDistance={0}
      tilt
      tiltMax={10}
      glare
      glareOpacity={0.22}
      hoverScale={1.03}
      perspective={1100}
      stiffness={170}
      damping={20}
      width={360}
      height={460}
      radius={22}
      background={cardBg}
      color={cardColor}
      shadow
      shadowColor={shadowColor}
      shadowOpacity={shadowOpacity}
      ariaLabel="NexusQA Live Identity Badge"
      className={isLightTheme ? 'nexus-identity-flip-card light' : 'nexus-identity-flip-card dark'}
    />
  );
}

const mountedRoots = new WeakMap();

export function mountIdentityFlipCard(container, props) {
  if (!container) return;
  let root = mountedRoots.get(container);
  if (!root) {
    container.innerHTML = '';
    root = createRoot(container);
    mountedRoots.set(container, root);
  }
  root.render(<IdentityFlipCard {...props} />);
}

if (typeof window !== 'undefined') {
  window.NexusIdentityFlipCard = {
    render: mountIdentityFlipCard,
    IdentityFlipCard
  };
}
