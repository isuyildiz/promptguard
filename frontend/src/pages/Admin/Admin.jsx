import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';

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

/* Loading Spinner */
const Spinner = () => (
  <div style={{ textAlign: 'center', padding: 28, color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
    Loading...
  </div>
);

/* Overview */
const OverviewTab = () => {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoadingStats(false));
    api.get('/admin/alerts')
      .then(r => setAlerts(r.data.alerts || []))
      .catch(() => {})
      .finally(() => setLoadingAlerts(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 4 }}>Admin Panel</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Real-time system health and security monitoring.</p>
      </div>

      {/* Stat kartları */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <StatCard label="Total Users"     value={stats?.total_users ?? '—'}   icon={<UsersIcon />}      accentColor="#a78bfa" />
        <StatCard label="Active Alerts"   value={stats?.total_alerts ?? '—'}  icon={<WarnIcon />}       accentColor="#fbbf24" />
        <StatCard label="Blocked Prompts" value={stats?.blocked_count ?? '—'} icon={<LockIcon />}       accentColor="#f87171" />
        <StatCard label="Total Prompts"   value={stats?.total_prompts ?? '—'} icon={<ShieldCheckIcon />} accentColor="#4ade80" />
      </div>

      {/* Recent Alerts tablosu */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: 'white' }}>Recent Alerts</h2>
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
              {loadingAlerts ? (
                <tr><td colSpan={5}><Spinner /></td></tr>
              ) : alerts.length === 0 ? (
                <tr><Td colSpan={5} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 24 }}>No alerts yet.</Td></tr>
              ) : alerts.slice(0, 5).map(row => (
                <tr key={row.id} style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <UserAvatar initials={(row.full_name || row.email || row.user_id || '?').slice(0, 2).toUpperCase()} />
                      <div>
                        {row.full_name && <div style={{ fontWeight: 600, color: 'white', fontSize: 13 }}>{row.full_name}</div>}
                        <div style={{ fontSize: 12, color: row.full_name ? 'rgba(255,255,255,0.45)' : 'white', fontWeight: row.full_name ? 400 : 500 }}>{row.email || row.user_id}</div>
                      </div>
                    </div>
                  </Td>
                  <Td><span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.5)' }}>{row.category || row.alert_type || '—'}</span></Td>
                  <Td><RiskBadge level={row.risk_level || row.severity || 'low'} /></Td>
                  <Td><ActionBadge action={row.action || 'block'} /></Td>
                  <Td style={{ color: 'rgba(255,255,255,0.35)' }}>{row.timestamp ? new Date(row.timestamp).toLocaleTimeString() : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </div>
    </div>
  );
};

/* Alerts */
const AlertsTab = () => {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/alerts')
      .then(r => setAlerts(r.data.alerts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = alerts.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      String(a.user_id).toLowerCase().includes(q) ||
      String(a.full_name || '').toLowerCase().includes(q) ||
      String(a.email || '').toLowerCase().includes(q) ||
      String(a.masked_prompt || '').toLowerCase().includes(q);
    const matchRisk = riskFilter === 'all' || a.risk_score >= { high: 70, critical: 90 }[riskFilter] || 0;
    return matchSearch && matchRisk;
  });

  const toggleReviewed = (id, currentReviewed) => {
    const newVal = !currentReviewed;
    api.patch(`/admin/alerts/${id}/review`, null, { params: { is_reviewed: newVal } })
      .then(res => setAlerts(prev => prev.map(a =>
        a.id === id
          ? { ...a, is_reviewed: newVal, reviewed: newVal, reviewed_by: res.data.reviewed_by ?? null }
          : a
      )))
      .catch(err => console.error('Review toggle failed:', err?.response?.data || err.message));
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
            {loading ? (
              <tr><td colSpan={7}><Spinner /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><Td colSpan={7} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 24 }}>No alerts found.</Td></tr>
            ) : filtered.map(row => (
              <tr key={row.id}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <UserAvatar initials={(row.full_name || row.email || row.user_id || '?').slice(0, 2).toUpperCase()} />
                    <div>
                      {row.full_name && <div style={{ fontWeight: 600, color: 'white', fontSize: 13 }}>{row.full_name}</div>}
                      <div style={{ fontSize: 12, color: row.full_name ? 'rgba(255,255,255,0.45)' : 'white', fontWeight: row.full_name ? 400 : 500 }}>{row.email || row.user_id}</div>
                    </div>
                  </div>
                </Td>
                <Td style={{ maxWidth: 240 }}>
                  <span style={{
                    display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', fontStyle: 'italic', fontSize: 12,
                    color: 'rgba(255,255,255,0.5)',
                  }}>{row.masked_prompt || '—'}</span>
                </Td>
                <Td><Badge text={row.category || row.alert_type || '—'} colors={{ bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }} /></Td>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: (row.risk_score ?? 0) >= 90 ? '#f87171' : (row.risk_score ?? 0) >= 70 ? '#fb923c' : '#fbbf24',
                    }} />
                    <span style={{ fontWeight: 700, color: 'white' }}>{row.risk_score ?? '—'}</span>
                  </div>
                </Td>
                <Td><ActionBadge action={row.action || 'block'} /></Td>
                <Td>
                  <button
                    onClick={() => toggleReviewed(row.id, row.is_reviewed || row.reviewed)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: (row.reviewed || row.is_reviewed) ? 'rgba(107,114,128,0.12)' : 'rgba(251,146,60,0.12)',
                      border: `1px solid ${(row.reviewed || row.is_reviewed) ? 'rgba(107,114,128,0.3)' : 'rgba(251,146,60,0.35)'}`,
                      color: (row.reviewed || row.is_reviewed) ? 'rgba(156,163,175,0.8)' : '#fb923c',
                      borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                      fontSize: 12, fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                    }}
                  >
                    {(row.reviewed || row.is_reviewed) ? <><CheckIcon /> Reviewed</> : <><ClockIcon /> Pending</>}
                  </button>
                </Td>
                <Td style={{ color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
                  {row.timestamp ? new Date(row.timestamp).toLocaleTimeString() : '—'}
                </Td>
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
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/users').then(r => setUsers(r.data.users || [])).catch(() => {});
  }, []);

  const toggleActive = (id, currentState) => {
    api.patch(`/admin/users/${id}`, null, { params: { is_active: !currentState } })
      .then(() => setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u)))
      .catch(() => {});
  };

  const filtered = users.filter(u =>
    !search ||
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
              <Th>Role</Th>
              <Th>Mode</Th>
              <Th>Status</Th>
              <Th>Access</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><Td colSpan={5} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 24 }}>No users found.</Td></tr>
            ) : filtered.map(u => (
              <tr key={u.id}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <UserAvatar initials={(u.full_name || u.email).slice(0, 2).toUpperCase()} />
                    <div>
                      {u.full_name && (
                        <div style={{ fontWeight: 600, color: 'white', fontSize: 13 }}>{u.full_name}</div>
                      )}
                      <div style={{ fontWeight: u.full_name ? 400 : 500, color: u.full_name ? 'rgba(255,255,255,0.5)' : 'white', fontSize: 13 }}>{u.email}</div>
                    </div>
                  </div>
                </Td>
                <Td style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{u.role}</Td>
                <Td style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{u.user_mode}</Td>
                <Td>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6,
                    background: u.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.15)',
                    border: `1px solid ${u.is_active ? 'rgba(34,197,94,0.3)' : 'rgba(107,114,128,0.3)'}`,
                    color: u.is_active ? '#4ade80' : '#6b7280',
                  }}>{u.is_active ? 'Active' : 'Inactive'}</span>
                </Td>
                <Td>
                  <button
                    onClick={() => toggleActive(u.id, u.is_active)}
                    style={{
                      padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: u.is_active ? 'rgba(220,38,38,0.15)' : 'rgba(34,197,94,0.15)',
                      color: u.is_active ? '#f87171' : '#4ade80',
                      fontSize: 12, fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                  >
                    {u.is_active ? 'Revoke Access' : 'Grant Access'}
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
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/logs')
      .then(r => setLogs(r.data.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    actionFilter === 'all' || l.final_action === actionFilter
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
        {['all', 'warn_and_log', 'mask_and_allow', 'block'].map(v => (
          <option key={v} value={v} style={{ background: '#1a1a2e' }}>
            {v === 'all' ? 'All Actions' : v}
          </option>
        ))}
      </select>

      <TableWrap>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <Th>User</Th>
              <Th>Masked Prompt</Th>
              <Th>Final Action</Th>
              <Th>Risk Level</Th>
              <Th>Risk Score</Th>
              <Th>Timestamp</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><Spinner /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><Td colSpan={6} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 24 }}>No logs yet.</Td></tr>
            ) : filtered.map(log => (
              <tr key={log.id}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <UserAvatar initials={(log.full_name || log.email || log.user_id || '?').slice(0, 2).toUpperCase()} />
                    <div>
                      {log.full_name && <div style={{ fontWeight: 600, color: 'white', fontSize: 13 }}>{log.full_name}</div>}
                      <div style={{ fontSize: 12, color: log.full_name ? 'rgba(255,255,255,0.45)' : 'white', fontWeight: log.full_name ? 400 : 500 }}>{log.email || log.user_id}</div>
                    </div>
                  </div>
                </Td>
                <Td style={{ maxWidth: 220 }}>
                  <span style={{
                    display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', fontStyle: 'italic', fontSize: 12,
                    color: 'rgba(255,255,255,0.45)',
                  }}>{log.masked_prompt}</span>
                </Td>
                <Td><ActionBadge action={log.final_action} /></Td>
                <Td><RiskBadge level={log.risk_level || 'low'} /></Td>
                <Td><span style={{ fontWeight: 700, color: 'white' }}>{log.risk_score}</span></Td>
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

/* ─── Policy Sekmesi ─────────────────────────────────────────── */
const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);
const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
);

const PolicyTab = () => {
  const [policy, setPolicy]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const [message, setMessage]           = useState(null); // { type: 'success'|'error', text }
  const [expandedCats, setExpandedCats] = useState({});
  const [showAddRule, setShowAddRule]   = useState(false);
  const [addingRule, setAddingRule]     = useState(false);
  const [ruleForm, setRuleForm]         = useState({
    name: '', description: '', keywords: '', risk_level: 'high', risk_score: 70, recommended_action: 'warn_and_log',
  });
  const fileInputRef = React.useRef();

  const toggleCatExpand = (i) => setExpandedCats(prev => ({ ...prev, [i]: !prev[i] }));

  const submitRule = async () => {
    if (!ruleForm.name.trim() || !ruleForm.keywords.trim()) {
      setMessage({ type: 'error', text: 'Kategori adı ve en az bir anahtar kelime zorunludur.' });
      return;
    }
    setAddingRule(true);
    try {
      const keywords = ruleForm.keywords.split(',').map(k => k.trim()).filter(Boolean);
      await api.post('/admin/policy/categories', {
        name: ruleForm.name.trim().replace(/\s+/g, '_').toLowerCase(),
        description: ruleForm.description.trim(),
        keywords,
        risk_level: ruleForm.risk_level,
        risk_score: Number(ruleForm.risk_score),
        recommended_action: ruleForm.recommended_action,
      });
      setMessage({ type: 'success', text: 'Kural başarıyla eklendi.' });
      setShowAddRule(false);
      setRuleForm({ name: '', description: '', keywords: '', risk_level: 'high', risk_score: 70, recommended_action: 'warn_and_log' });
      fetchPolicy();
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.detail || 'Kural eklenemedi.' });
    } finally {
      setAddingRule(false);
    }
  };

  const deleteCategory = async (catName) => {
    if (!window.confirm(`"${catName}" kategorisi silinsin mi?`)) return;
    try {
      await api.delete(`/admin/policy/categories/${encodeURIComponent(catName)}`);
      fetchPolicy();
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.detail || 'Kategori silinemedi.' });
    }
  };

  const fetchPolicy = () => {
    setLoading(true);
    api.get('/admin/policy')
      .then(r => setPolicy(r.data))
      .catch(() => setPolicy({ has_policy: false }))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => { fetchPolicy(); }, []);

  const uploadFile = async (file) => {
    if (!file) return;
    const allowed = ['application/pdf', 'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|txt|docx)$/i)) {
      setMessage({ type: 'error', text: 'Yalnızca PDF, TXT veya DOCX yükleyebilirsiniz.' });
      return;
    }
    setUploading(true);
    setMessage(null);
    const form = new FormData();
    form.append('file', file);
    try {
      const r = await api.post('/admin/policy/upload', form, {
        headers: { 'Content-Type': undefined },
      });
      setMessage({
        type: 'success',
        text: `Politika başarıyla yüklendi. ${r.data.categories_count} kategori üretildi: ${r.data.categories.join(', ')}`,
      });
      fetchPolicy();
    } catch (e) {
      const status = e.response?.status;
      const detail = e.response?.data?.detail;
      let errorText;
      if (status === 413) {
        errorText = 'Dosya boyutu çok büyük. Lütfen 5 MB\'dan küçük bir dosya yükleyin.';
      } else if (status === 400) {
        errorText = typeof detail === 'string' ? detail : 'Geçersiz dosya. Lütfen PDF, DOCX veya TXT formatında bir politika belgesi yükleyin.';
      } else if (status === 429) {
        errorText = 'Çok fazla yükleme denemesi yaptınız. Lütfen bir süre bekleyin ve tekrar deneyin.';
      } else if (status === 500) {
        errorText = 'Sunucu hatası oluştu. Lütfen sistem yöneticinizle iletişime geçin.';
      } else if (status === 502 || (typeof detail === 'string' && detail.includes('Gemini'))) {
        errorText = 'Politika analizi şu anda gerçekleştirilemiyor. Yapay zeka servisi geçici olarak kullanılamıyor. Lütfen birkaç dakika sonra tekrar deneyin.';
      } else if (!e.response) {
        errorText = 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
      } else {
        errorText = 'Politika yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.';
      }
      setMessage({ type: 'error', text: errorText });
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    uploadFile(e.dataTransfer.files[0]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 4 }}>Ethics Policy</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
          Kurumunuza özgü etik politika dosyasını yükleyin. Yüklenen dosya yapay zeka tarafından analiz edilerek otomatik kural seti oluşturulur.
        </p>
      </div>

      {/* Mevcut politika durumu */}
      {!loading && policy?.has_policy && (
        <div style={{
          background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 14, padding: '18px 22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ color: '#4ade80' }}><FileIcon /></span>
            <span style={{ color: '#4ade80', fontWeight: 700, fontFamily: 'Syne, sans-serif', fontSize: 15 }}>
              Aktif Politika
            </span>
            <span style={{
              marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '2px 9px',
              background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
              color: '#4ade80', borderRadius: 6,
            }}>AKTİF</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
            <div style={{ color: 'rgba(255,255,255,0.6)' }}>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Dosya: </span>
              {policy.policy.file_name}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)' }}>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Yükleme tarihi: </span>
              {new Date(policy.policy.uploaded_at).toLocaleString('tr-TR')}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)' }}>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Kurum: </span>
              {policy.policy.institution_name}
            </div>
          </div>
          {/* Kategoriler */}
          {policy.policy.categories?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
                  Kategoriler ({policy.policy.categories.length})
                </span>
                <button
                  onClick={() => setShowAddRule(v => !v)}
                  style={{
                    marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '4px 12px',
                    background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)',
                    color: '#a78bfa', borderRadius: 6, cursor: 'pointer',
                  }}
                >
                  {showAddRule ? 'İptal' : '+ Kural Ekle'}
                </button>
              </div>

              {/* Manuel Kural Ekleme Formu */}
              {showAddRule && (
                <div style={{
                  background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)',
                  borderRadius: 12, padding: '16px', marginBottom: 12,
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', marginBottom: 2 }}>Yeni Kural Ekle</div>
                  {[
                    { label: 'Kategori Adı (snake_case)', key: 'name', placeholder: 'örn: unauthorized_tool_use' },
                    { label: 'Açıklama', key: 'description', placeholder: 'Bu kural ne tür ihlalleri kapsar?' },
                    { label: 'Anahtar Kelimeler (virgülle ayır)', key: 'keywords', placeholder: 'örn: şirketten veri çal, gizli bilgi sızdır' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{label}</div>
                      <input
                        value={ruleForm[key]}
                        onChange={e => setRuleForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 8, padding: '7px 10px', color: 'white', fontSize: 12,
                          outline: 'none', fontFamily: 'DM Sans, sans-serif',
                        }}
                      />
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Risk Seviyesi</div>
                      <select value={ruleForm.risk_level} onChange={e => setRuleForm(f => ({ ...f, risk_level: e.target.value }))}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 10px', color: 'white', fontSize: 12, outline: 'none' }}>
                        {['low', 'medium', 'high', 'critical'].map(v => <option key={v} value={v} style={{ background: '#1a1a2e' }}>{v}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Risk Skoru (0-100)</div>
                      <input type="number" min="0" max="100" value={ruleForm.risk_score}
                        onChange={e => setRuleForm(f => ({ ...f, risk_score: e.target.value }))}
                        style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 10px', color: 'white', fontSize: 12, outline: 'none' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Eylem</div>
                      <select value={ruleForm.recommended_action} onChange={e => setRuleForm(f => ({ ...f, recommended_action: e.target.value }))}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 10px', color: 'white', fontSize: 12, outline: 'none' }}>
                        {['warn', 'warn_and_log', 'block'].map(v => <option key={v} value={v} style={{ background: '#1a1a2e' }}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <button onClick={submitRule} disabled={addingRule}
                    style={{
                      alignSelf: 'flex-end', padding: '8px 20px', borderRadius: 8,
                      background: addingRule ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.8)',
                      border: 'none', color: 'white', fontSize: 13, fontWeight: 700, cursor: addingRule ? 'not-allowed' : 'pointer',
                    }}>
                    {addingRule ? 'Ekleniyor...' : 'Ekle'}
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {policy.policy.categories.map((cat, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10, padding: '12px 14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
                        color: '#a78bfa', background: 'rgba(124,58,237,0.12)',
                        border: '1px solid rgba(124,58,237,0.25)', padding: '2px 8px', borderRadius: 5,
                      }}>{cat.name}</span>
                      <span
                        onClick={() => deleteCategory(cat.name)}
                        title="Kategoriyi sil"
                        style={{
                          fontSize: 10, padding: '2px 6px', borderRadius: 4,
                          cursor: 'pointer', color: 'rgba(248,113,113,0.55)',
                          border: '1px solid rgba(248,113,113,0.15)', userSelect: 'none',
                        }}>✕</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                        background: cat.risk_level === 'critical' ? 'rgba(220,38,38,0.15)' :
                                    cat.risk_level === 'high'     ? 'rgba(249,115,22,0.15)' :
                                    cat.risk_level === 'medium'   ? 'rgba(234,179,8,0.12)'  : 'rgba(107,114,128,0.15)',
                        color: cat.risk_level === 'critical' ? '#f87171' :
                               cat.risk_level === 'high'     ? '#fb923c' :
                               cat.risk_level === 'medium'   ? '#fbbf24' : '#9ca3af',
                        border: `1px solid ${cat.risk_level === 'critical' ? 'rgba(220,38,38,0.3)' :
                                             cat.risk_level === 'high'     ? 'rgba(249,115,22,0.3)' :
                                             cat.risk_level === 'medium'   ? 'rgba(234,179,8,0.3)'  : 'rgba(107,114,128,0.3)'}`,
                      }}>{(cat.risk_level || 'low').toUpperCase()}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                        Skor: {cat.risk_score} · {cat.recommended_action}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: 6 }}>{cat.description}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(expandedCats[i] ? (cat.keywords || []) : (cat.keywords || []).slice(0, 6)).map((kw, j) => (
                        <span key={j} style={{
                          fontSize: 11, fontFamily: 'monospace', padding: '2px 7px', borderRadius: 4,
                          background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)',
                          color: '#60a5fa',
                        }}>{kw}</span>
                      ))}
                      {(cat.keywords || []).length > 6 && (
                        <span
                          onClick={() => toggleCatExpand(i)}
                          style={{
                            fontSize: 11, color: '#60a5fa', cursor: 'pointer',
                            padding: '2px 7px', borderRadius: 4,
                            background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.15)',
                            userSelect: 'none',
                          }}
                        >
                          {expandedCats[i] ? 'daha az göster' : `+${cat.keywords.length - 6} more`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mesaj */}
      {message && (
        <div style={{
          background: message.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(220,38,38,0.08)',
          border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(220,38,38,0.25)'}`,
          borderRadius: 10, padding: '12px 16px',
          color: message.type === 'success' ? '#4ade80' : '#f87171',
          fontSize: 13, lineHeight: 1.5,
        }}>{message.text}</div>
      )}

      {/* Dosya yükleme alanı */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 16,
          padding: '48px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
          cursor: uploading ? 'not-allowed' : 'pointer',
          background: dragOver ? 'rgba(124,58,237,0.05)' : 'rgba(255,255,255,0.02)',
          transition: 'all 0.2s',
          opacity: uploading ? 0.6 : 1,
        }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#a78bfa',
        }}>
          <UploadIcon />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'white', marginBottom: 6 }}>
            {uploading ? 'Analiz ediliyor...' : 'Politika dosyasını sürükle veya tıkla'}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            PDF, DOCX veya TXT · Maks. 10 MB
          </div>
          {uploading && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#a78bfa' }}>
              Gemini politikayı analiz ediyor, lütfen bekleyin...
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.docx"
          style={{ display: 'none' }}
          onChange={e => uploadFile(e.target.files[0])}
        />
      </div>

      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', lineHeight: 1.7 }}>
        Yüklenen dosya yapay zeka tarafından analiz edilir ve kurumunuza özgü etik ihlal kategorileri otomatik olarak oluşturulur.
        Yeni bir dosya yüklendiğinde önceki politika devre dışı kalır. Ham politika metni sunucuda saklanır ancak kullanıcı promptlarıyla paylaşılmaz.
      </div>
    </div>
  );
};

/* ─── Ana Bileşen ─────────────────────────────────────────────── */
const TABS = ['Overview', 'Alerts', 'Users', 'Logs', 'Policy'];

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
            <button
              onClick={() => navigate('/chat')}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.55)', borderRadius: 8, padding: '5px 12px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              Go to Chat
            </button>
            <span className="lecturer-badge">
              {user?.role === 'corporate_admin' ? 'Admin' : user?.role || 'Lecturer'}
            </span>
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
          {activeTab === 'Policy'   && <PolicyTab />}
        </div>
      </div>
    </>
  );
};

export default Admin;