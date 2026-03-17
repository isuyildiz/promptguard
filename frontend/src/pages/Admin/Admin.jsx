import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/* ─── SVG İkonlar ─────────────────────────────────────────────── */
const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" opacity="0.6" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const WarnIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const ShieldCheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
  </svg>
);
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const ChevronIcon = ({ up }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points={up ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
  </svg>
);

/* ─── Mock Veriler ────────────────────────────────────────────── */
const MOCK_STATS = {
  totalUsers: 142,
  activeAlerts: 23,
  blockedPrompts: 8,
  safePrompts: 311,
};

const MOCK_RECENT_ALERTS = [
  { id: 1, user: 'Ahmet Yılmaz', initials: 'AY', category: 'academic_misuse', riskLevel: 'medium', action: 'warn_and_log', time: '2 mins ago' },
  { id: 2, user: 'Zeynep Kaya', initials: 'ZK', category: 'exam_cheating_attempt', riskLevel: 'critical', action: 'block', time: '15 mins ago' },
  { id: 3, user: 'Mehmet Demir', initials: 'MD', category: 'full_task_delegation', riskLevel: 'high', action: 'warn_and_log', time: '42 mins ago' },
  { id: 4, user: 'Elif Şahin', initials: 'EŞ', category: 'suspicious_request', riskLevel: 'low', action: 'warn', time: '1 hour ago' },
  { id: 5, user: 'Can Öztürk', initials: 'CÖ', category: 'policy_violation', riskLevel: 'high', action: 'warn_and_log', time: '2 hours ago' },
];

const MOCK_ALERTS = [
  { id: 1, user: 'Ahmet Yılmaz', userId: 'u001', maskedPrompt: '"Write my entire [TASK] for me so I can submit..."', category: 'full_task_delegation', riskScore: 88, action: 'warn_and_log', reviewed: false, time: '2m ago' },
  { id: 2, user: 'Zeynep Kaya', userId: 'u002', maskedPrompt: '"My name is [PERSON_1], ID: [ID_NUMBER]. Solve this exam..."', category: 'exam_cheating_attempt', riskScore: 95, action: 'block', reviewed: false, time: '14m ago' },
  { id: 3, user: 'Mehmet Demir', userId: 'u003', maskedPrompt: '"Complete the homework assignment on neural networks..."', category: 'academic_misuse', riskScore: 72, action: 'warn_and_log', reviewed: true, time: '1h ago' },
  { id: 4, user: 'Elif Şahin', userId: 'u004', maskedPrompt: '"Can you help me understand this concept better..."', category: 'suspicious_request', riskScore: 34, action: 'warn', reviewed: true, time: '2h ago' },
  { id: 5, user: 'Can Öztürk', userId: 'u005', maskedPrompt: '"My credit card [FINANCIAL_DATA] process payment..."', category: 'policy_violation', riskScore: 91, action: 'block', reviewed: false, time: '3h ago' },
];

const MOCK_USERS = [
  { id: 'u001', name: 'Ahmet Yılmaz', initials: 'AY', email: 'ahmet@university.edu', role: 'institutional', isActive: true, alerts: 3, joined: '12 Mar 2026' },
  { id: 'u002', name: 'Zeynep Kaya', initials: 'ZK', email: 'zeynep@university.edu', role: 'institutional', isActive: true, alerts: 5, joined: '10 Mar 2026' },
  { id: 'u003', name: 'Mehmet Demir', initials: 'MD', email: 'mehmet@university.edu', role: 'institutional', isActive: false, alerts: 1, joined: '8 Mar 2026' },
  { id: 'u004', name: 'Elif Şahin', initials: 'EŞ', email: 'elif@university.edu', role: 'institutional', isActive: true, alerts: 0, joined: '5 Mar 2026' },
  { id: 'u005', name: 'Can Öztürk', initials: 'CÖ', email: 'can@university.edu', role: 'institutional', isActive: true, alerts: 2, joined: '1 Mar 2026' },
];

const MOCK_LOGS = [
  { id: 'log001', user: 'Ahmet Yılmaz', maskedPrompt: 'Write my entire [TASK] for me...', finalAction: 'warn_and_log', riskLevel: 'high', riskScore: 88, timestamp: '2026-03-12T20:42:00Z' },
  { id: 'log002', user: 'Zeynep Kaya', maskedPrompt: 'My name is [PERSON_1], ID: [ID_NUMBER]...', finalAction: 'block', riskLevel: 'critical', riskScore: 95, timestamp: '2026-03-12T20:30:00Z' },
  { id: 'log003', user: 'Mehmet Demir', maskedPrompt: 'Explain recursion with a simple example.', finalAction: 'allow', riskLevel: 'low', riskScore: 4, timestamp: '2026-03-12T20:15:00Z' },
  { id: 'log004', user: 'Elif Şahin', maskedPrompt: 'My email is [EMAIL]. Can you help me write...', finalAction: 'mask_and_allow', riskLevel: 'medium', riskScore: 55, timestamp: '2026-03-12T19:58:00Z' },
  { id: 'log005', user: 'Can Öztürk', maskedPrompt: 'Credit card [FINANCIAL_DATA] process payment...', finalAction: 'block', riskLevel: 'critical', riskScore: 91, timestamp: '2026-03-12T19:40:00Z' },
];

/* ─── Badge Yardımcıları ──────────────────────────────────────── */
const RISK_COLORS = {
  low:      { bg: 'rgba(107,114,128,0.2)', border: 'rgba(107,114,128,0.4)', color: '#9ca3af' },
  medium:   { bg: 'rgba(234,179,8,0.15)',  border: 'rgba(234,179,8,0.4)',   color: '#fbbf24' },
  high:     { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.4)',  color: '#fb923c' },
  critical: { bg: 'rgba(220,38,38,0.15)',  border: 'rgba(220,38,38,0.4)',   color: '#f87171' },
};
const ACTION_COLORS = {
  allow:          { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)',   color: '#4ade80' },
  warn:           { bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.3)', color: '#a78bfa' },
  warn_and_log:   { bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.3)', color: '#a78bfa' },
  mask_and_allow: { bg: 'rgba(37,99,235,0.12)',  border: 'rgba(37,99,235,0.3)',  color: '#60a5fa' },
  block:          { bg: 'rgba(220,38,38,0.12)',  border: 'rgba(220,38,38,0.3)',  color: '#f87171' },
};

const Badge = ({ text, colors }) => (
  <span style={{
    background: colors.bg, border: `1px solid ${colors.border}`,
    color: colors.color, fontSize: 11, fontWeight: 700,
    letterSpacing: '0.5px', padding: '3px 9px', borderRadius: 6,
    fontFamily: 'monospace', whiteSpace: 'nowrap',
  }}>{text}</span>
);

const RiskBadge = ({ level }) => <Badge text={level.toUpperCase()} colors={RISK_COLORS[level] || RISK_COLORS.low} />;
const ActionBadge = ({ action }) => <Badge text={action} colors={ACTION_COLORS[action] || ACTION_COLORS.allow} />;

/* ─── Stat Kartı ─────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accentColor }) => (
  <div style={{
    flex: 1, minWidth: 180,
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid rgba(255,255,255,0.08)`,
    borderRadius: 16, padding: '20px 22px',
    display: 'flex', flexDirection: 'column', gap: 12,
    backdropFilter: 'blur(10px)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{label}</span>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `${accentColor}18`,
        border: `1px solid ${accentColor}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accentColor,
      }}>{icon}</div>
    </div>
    <span style={{
      fontSize: 32, fontWeight: 800, color: accentColor,
      fontFamily: 'Syne, sans-serif', lineHeight: 1.3,
    }}>{value}</span>
  </div>
);

/* ─── Tablo Sarmalayıcısı ─────────────────────────────────────── */
const TableWrap = ({ children }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16, overflow: 'hidden',
  }}>{children}</div>
);

const Th = ({ children, style }) => (
  <th style={{
    padding: '12px 16px', textAlign: 'left',
    fontSize: 11, fontWeight: 700, letterSpacing: '0.8px',
    color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    whiteSpace: 'nowrap', ...style,
  }}>{children}</th>
);

const Td = ({ children, style }) => (
  <td style={{
    padding: '13px 16px', fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    borderBottom: '1px solid rgba(255,255,255,0.05)', ...style,
  }}>{children}</td>
);

const UserAvatar = ({ initials }) => (
  <div style={{
    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
    background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(37,99,235,0.4))',
    border: '1px solid rgba(124,58,237,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: '#c4b5fd',
  }}>{initials}</div>
);

/* ─── Tab İçerikleri ─────────────────────────────────────────── */

/* Overview */
const OverviewTab = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
    <div>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 4 }}>Admin Panel</h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Real-time system health and security monitoring.</p>
    </div>

    {/* Stat kartları */}
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
      <StatCard label="Total Users"      value={MOCK_STATS.totalUsers}      icon={<UsersIcon />}     accentColor="#a78bfa" />
      <StatCard label="Active Alerts"    value={MOCK_STATS.activeAlerts}    icon={<WarnIcon />}      accentColor="#fbbf24" />
      <StatCard label="Blocked Prompts"  value={MOCK_STATS.blockedPrompts}  icon={<LockIcon />}      accentColor="#f87171" />
      <StatCard label="Safe Prompts"     value={MOCK_STATS.safePrompts}     icon={<ShieldCheckIcon />} accentColor="#4ade80" />
    </div>

    {/* Recent Alerts tablosu */}
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: 'white' }}>Recent Alerts</h2>
        <span style={{ fontSize: 12, color: '#7c3aed', cursor: 'pointer' }}>View All →</span>
      </div>
      <TableWrap>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <Th>User</Th>
              <Th>Category</Th>
              <Th>Risk Level</Th>
              <Th>Action Taken</Th>
              <Th>Time</Th>
            </tr>
          </thead>
          <tbody>
            {MOCK_RECENT_ALERTS.map(row => (
              <tr key={row.id} style={{ transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <UserAvatar initials={row.initials} />
                    <span style={{ fontWeight: 500, color: 'white' }}>{row.user}</span>
                  </div>
                </Td>
                <Td><span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.5)' }}>{row.category}</span></Td>
                <Td><RiskBadge level={row.riskLevel} /></Td>
                <Td><ActionBadge action={row.action} /></Td>
                <Td style={{ color: 'rgba(255,255,255,0.35)' }}>{row.time}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </div>
  </div>
);

/* Alerts */
const AlertsTab = () => {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [alerts, setAlerts] = useState(MOCK_ALERTS);

  const filtered = alerts.filter(a => {
    const matchSearch = a.user.toLowerCase().includes(search.toLowerCase()) ||
      a.maskedPrompt.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === 'all' || a.riskScore >= { high: 70, critical: 90 }[riskFilter] || 0;
    return matchSearch && matchRisk;
  });

  const toggleReviewed = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, reviewed: !a.reviewed } : a));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 4 }}>Alerts</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Monitor and manage potential policy violations.</p>
      </div>

      {/* Filtre bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 10, padding: '8px 12px', flex: '1', minWidth: 200,
        }}>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}><SearchIcon /></span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search user or content..."
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: 'white', fontSize: 13, width: '100%',
              fontFamily: 'DM Sans, sans-serif',
            }}
          />
        </div>
        <select
          value={riskFilter}
          onChange={e => setRiskFilter(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
            color: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '8px 12px',
            fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="all" style={{ background: '#1a1a2e' }}>Risk: All</option>
          <option value="high" style={{ background: '#1a1a2e' }}>Risk: High+</option>
          <option value="critical" style={{ background: '#1a1a2e' }}>Risk: Critical</option>
        </select>
      </div>

      <TableWrap>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <Th>User</Th>
              <Th>Masked Prompt</Th>
              <Th>Category</Th>
              <Th>Risk Score</Th>
              <Th>Action</Th>
              <Th>Reviewed</Th>
              <Th>Time</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => (
              <tr key={row.id}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserAvatar initials={row.user.split(' ').map(n => n[0]).join('')} />
                    <div>
                      <div style={{ fontWeight: 500, color: 'white', fontSize: 13 }}>{row.user}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{row.userId}</div>
                    </div>
                  </div>
                </Td>
                <Td style={{ maxWidth: 240 }}>
                  <span style={{
                    display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', fontStyle: 'italic', fontSize: 12,
                    color: 'rgba(255,255,255,0.5)',
                  }}>{row.maskedPrompt}</span>
                </Td>
                <Td><Badge text={row.category} colors={{ bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }} /></Td>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: row.riskScore >= 90 ? '#f87171' : row.riskScore >= 70 ? '#fb923c' : '#fbbf24',
                    }} />
                    <span style={{ fontWeight: 700, color: 'white' }}>{row.riskScore}</span>
                  </div>
                </Td>
                <Td><ActionBadge action={row.action} /></Td>
                <Td>
                  <button
                    onClick={() => toggleReviewed(row.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: row.reviewed ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${row.reviewed ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                      color: row.reviewed ? '#4ade80' : 'rgba(255,255,255,0.35)',
                      borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                      fontSize: 12, fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                    }}
                  >
                    {row.reviewed ? <><CheckIcon /> Reviewed</> : <><ClockIcon /> Pending</>}
                  </button>
                </Td>
                <Td style={{ color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>{row.time}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Showing {filtered.length} of {alerts.length} entries</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Previous', '1', '2', '3', 'Next'].map(p => (
              <button key={p} style={{
                padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
                background: p === '1' ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.03)',
                color: p === '1' ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              }}>{p}</button>
            ))}
          </div>
        </div>
      </TableWrap>
    </div>
  );
};

/* Users */
const UsersTab = () => {
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState('');

  const toggleActive = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
    // Gerçek API: PATCH /admin/users/:id → { is_active: !current }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 4 }}>Users</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Manage institutional user accounts and access.</p>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 10, padding: '8px 12px', maxWidth: 320,
      }}>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}><SearchIcon /></span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users..."
          style={{
            background: 'none', border: 'none', outline: 'none',
            color: 'white', fontSize: 13, width: '100%',
            fontFamily: 'DM Sans, sans-serif',
          }}
        />
      </div>

      <TableWrap>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <Th>User</Th>
              <Th>Email</Th>
              <Th>Alerts</Th>
              <Th>Joined</Th>
              <Th>Status</Th>
              <Th>Access</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <UserAvatar initials={u.initials} />
                    <div>
                      <div style={{ fontWeight: 500, color: 'white', fontSize: 13 }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{u.id}</div>
                    </div>
                  </div>
                </Td>
                <Td style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{u.email}</Td>
                <Td>
                  <span style={{
                    fontWeight: 700,
                    color: u.alerts > 3 ? '#f87171' : u.alerts > 0 ? '#fbbf24' : '#4ade80',
                  }}>{u.alerts}</span>
                </Td>
                <Td style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{u.joined}</Td>
                <Td>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6,
                    background: u.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.15)',
                    border: `1px solid ${u.isActive ? 'rgba(34,197,94,0.3)' : 'rgba(107,114,128,0.3)'}`,
                    color: u.isActive ? '#4ade80' : '#6b7280',
                  }}>{u.isActive ? 'Active' : 'Inactive'}</span>
                </Td>
                <Td>
                  <button
                    onClick={() => toggleActive(u.id)}
                    style={{
                      padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: u.isActive
                        ? 'rgba(220,38,38,0.15)' : 'rgba(34,197,94,0.15)',
                      color: u.isActive ? '#f87171' : '#4ade80',
                      fontSize: 12, fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                  >
                    {u.isActive ? 'Revoke Access' : 'Grant Access'}
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
};

/* Logs */
const LogsTab = () => {
  const [actionFilter, setActionFilter] = useState('all');

  const filtered = MOCK_LOGS.filter(l =>
    actionFilter === 'all' || l.finalAction === actionFilter
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 4 }}>Logs</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Full prompt log history for all institutional users.</p>
      </div>

      <select
        value={actionFilter}
        onChange={e => setActionFilter(e.target.value)}
        style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
          color: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '8px 12px',
          fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none',
          cursor: 'pointer', width: 'fit-content',
        }}
      >
        {['all', 'allow', 'warn', 'warn_and_log', 'mask_and_allow', 'block'].map(v => (
          <option key={v} value={v} style={{ background: '#1a1a2e' }}>
            {v === 'all' ? 'All Actions' : v}
          </option>
        ))}
      </select>

      <TableWrap>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <Th>Log ID</Th>
              <Th>User</Th>
              <Th>Masked Prompt</Th>
              <Th>Final Action</Th>
              <Th>Risk Level</Th>
              <Th>Risk Score</Th>
              <Th>Timestamp</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => (
              <tr key={log.id}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Td style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{log.id}</Td>
                <Td style={{ fontWeight: 500, color: 'white' }}>{log.user}</Td>
                <Td style={{ maxWidth: 220 }}>
                  <span style={{
                    display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', fontStyle: 'italic', fontSize: 12,
                    color: 'rgba(255,255,255,0.45)',
                  }}>{log.maskedPrompt}</span>
                </Td>
                <Td><ActionBadge action={log.finalAction} /></Td>
                <Td><RiskBadge level={log.riskLevel} /></Td>
                <Td>
                  <span style={{ fontWeight: 700, color: 'white' }}>{log.riskScore}</span>
                </Td>
                <Td style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                  {log.timestamp}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
};

/* ─── Ana Bileşen ─────────────────────────────────────────────── */
const TABS = ['Overview', 'Alerts', 'Users', 'Logs'];

const Admin = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminName = user?.email?.split('@')[0] || 'Admin';
  const initials = adminName.slice(0, 2).toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .admin-root {
          min-height: 100vh;
          background: #07070f;
          font-family: 'DM Sans', sans-serif;
          color: white;
        }

        /* Navbar */
        .admin-navbar {
          display: flex; align-items: center;
          padding: 0 28px;
          height: 58px;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          gap: 32px;
          position: sticky; top: 0; z-index: 10;
          backdrop-filter: blur(10px);
        }
        .admin-logo {
          display: flex; align-items: center; gap: 9px; flex-shrink: 0;
        }
        .admin-logo-icon {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          color: white;
          box-shadow: 0 2px 10px rgba(124,58,237,0.3);
        }
        .admin-logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 800; color: white;
        }
        .admin-logo-sub {
          font-size: 10px; color: rgba(255,255,255,0.3);
          font-weight: 600; letter-spacing: 0.5px;
        }

        /* Tab nav */
        .tab-nav {
          display: flex; align-items: center; gap: 4;
          flex: 1;
        }
        .tab-nav-btn {
          padding: 6px 16px;
          background: none; border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500;
          color: rgba(255,255,255,0.4);
          cursor: pointer; border-radius: 8px;
          transition: all 0.15s;
          position: relative;
        }
        .tab-nav-btn:hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.04); }
        .tab-nav-btn.active { color: white; font-weight: 600; }
        .tab-nav-btn.active::after {
          content: '';
          position: absolute; bottom: -16px; left: 50%; transform: translateX(-50%);
          width: 80%; height: 2px;
          background: linear-gradient(90deg, #7c3aed, #2563eb);
          border-radius: 2px;
        }

        /* Navbar sağ */
        .navbar-right {
          display: flex; align-items: center; gap: 12; flex-shrink: 0;
        }
        .lecturer-badge {
          font-size: 11px; font-weight: 700; letter-spacing: 0.6px;
          padding: 4px 10px;
          background: rgba(124,58,237,0.15);
          border: 1px solid rgba(124,58,237,0.3);
          border-radius: 20px; color: #a78bfa;
          display: flex; align-items: center; gap: 5;
        }
        .lecturer-badge::before {
          content: ''; width: 6px; height: 6px;
          border-radius: 50%; background: #7c3aed;
        }
        .admin-avatar {
          width: 32px; height: 32px; border-radius: 9px;
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: white;
        }
        .admin-logout-btn {
          background: none; border: none;
          color: rgba(255,255,255,0.3); cursor: pointer;
          padding: 6px; border-radius: 7px; display: flex;
          transition: color 0.2s, background 0.2s;
        }
        .admin-logout-btn:hover { color: #f87171; background: rgba(220,38,38,0.1); }

        /* İçerik */
        .admin-content {
          padding: 32px 28px;
          max-width: 1200px;
          margin: 0 auto;
        }
      `}</style>

      <div className="admin-root">
        {/* Navbar */}
        <nav className="admin-navbar">
          <div className="admin-logo">
            <div className="admin-logo-icon"><ShieldIcon /></div>
            <div>
              <div className="admin-logo-text">PromptGuard</div>
              <div className="admin-logo-sub">Admin Panel</div>
            </div>
          </div>

          <div className="tab-nav">
            {TABS.map(tab => (
              <button
                key={tab}
                className={`tab-nav-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >{tab}</button>
            ))}
          </div>

          <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="lecturer-badge">Lecturer</span>
            <div className="admin-avatar">{initials}</div>
            <button className="admin-logout-btn" onClick={handleLogout} title="Logout">
              <LogoutIcon />
            </button>
          </div>
        </nav>

        {/* Tab İçeriği */}
        <div className="admin-content">
          {activeTab === 'Overview' && <OverviewTab />}
          {activeTab === 'Alerts'   && <AlertsTab />}
          {activeTab === 'Users'    && <UsersTab />}
          {activeTab === 'Logs'     && <LogsTab />}
        </div>
      </div>
    </>
  );
};

export default Admin;