import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';

/* ─── SVG İkonlar ─────────────────────────────────────────────── */
const ShieldIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" opacity="0.6" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ChatIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const WarnIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const BlockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ShieldWarnIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const BotIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" /><path d="M12 3v4" />
    <circle cx="12" cy="3" r="1" fill="currentColor" /><path d="M8 11V9a4 4 0 0 1 8 0v2" />
    <line x1="9" y1="15" x2="9" y2="17" /><line x1="15" y1="15" x2="15" y2="17" />
  </svg>
);

/* ─── Geçmiş konuşmalar (mock) ───────────────────────────────── */
const HISTORY = [
  { id: 1, title: 'Privacy Inquiry', time: '10:42 AM', active: true },
  { id: 2, title: 'Financial Summary', time: 'Yesterday' },
  { id: 3, title: 'Customer Support Bot', time: 'Mon' },
  { id: 4, title: 'System Policy Check', time: 'Sun' },
];

/* ─── PII Uyarı Kutusu ───────────────────────────────────────── */
const PiiWarningBox = ({ entities = [], riskScore = 0, maskedPrompt }) => (
  <div style={{
    background: 'rgba(217,119,6,0.08)',
    border: '1px solid rgba(217,119,6,0.3)',
    borderRadius: 14,
    padding: '14px 16px',
    margin: '8px 0 4px 0',
    backdropFilter: 'blur(10px)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#f59e0b', display: 'flex' }}><ShieldWarnIcon /></span>
        <span style={{ color: '#fbbf24', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14 }}>
          Sensitive Data Detected
        </span>
      </div>
      <span style={{
        background: 'rgba(217,119,6,0.2)', border: '1px solid rgba(217,119,6,0.4)',
        color: '#fbbf24', fontSize: 10, fontWeight: 700, letterSpacing: '0.8px',
        padding: '3px 8px', borderRadius: 6,
      }}>
        RISK SCORE: {riskScore}
      </span>
    </div>
    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>
      Your prompt was masked before sending to ensure privacy compliance.
    </p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {entities.map((e, i) => (
        <span key={i} style={{
          background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.35)',
          color: '#fcd34d', fontSize: 12, fontWeight: 600, fontFamily: 'monospace',
          padding: '3px 10px', borderRadius: 6,
        }}>{e}</span>
      ))}
    </div>
  </div>
);

/* ─── Warn Bandı ─────────────────────────────────────────────── */
const WarnBanner = ({ message }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(124,58,237,0.08)',
    border: '1px solid rgba(124,58,237,0.2)',
    borderRadius: 10, padding: '9px 14px', margin: '6px 0',
  }}>
    <span style={{ color: '#a78bfa', display: 'flex', flexShrink: 0 }}><WarnIcon /></span>
    <span style={{ color: 'rgba(167,139,250,0.9)', fontSize: 12, fontWeight: 500, letterSpacing: '0.3px' }}>
      {message || 'Activity has been logged due to policy risk.'}
    </span>
  </div>
);

/* ─── Block Kartı ────────────────────────────────────────────── */
const BlockCard = ({ reason, message }) => (
  <div style={{
    background: 'rgba(220,38,38,0.08)',
    border: '1px solid rgba(220,38,38,0.3)',
    borderRadius: 14, padding: '14px 16px',
    backdropFilter: 'blur(10px)',
    margin: '6px 0',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          background: 'rgba(220,38,38,0.2)', borderRadius: 8,
          padding: 6, color: '#f87171', display: 'flex',
        }}><BlockIcon /></span>
        <span style={{ color: '#f87171', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14 }}>
          Prompt Blocked
        </span>
      </div>
      {reason && (
        <span style={{
          background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)',
          color: '#fca5a5', fontSize: 10, fontWeight: 700, letterSpacing: '0.8px',
          padding: '3px 8px', borderRadius: 6, fontFamily: 'monospace',
        }}>{reason}</span>
      )}
    </div>
    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 1.5 }}>
      {message || 'This prompt was blocked and could not be sent to the AI model.'}
    </p>
  </div>
);

/* ─── Mesaj Balonu ───────────────────────────────────────────── */
const MessageBubble = ({ msg }) => {
  const isUser = msg.type === 'user';
  const time = msg.time || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 4 }}>
      {/* Zaman damgası */}
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', paddingLeft: isUser ? 0 : 36, paddingRight: isUser ? 4 : 0 }}>
        {isUser ? `YOU • ${time}` : `PROMPTGUARD AI • ${time}`}
      </span>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: isUser ? 'row-reverse' : 'row' }}>
        {/* Bot avatar */}
        {!isUser && (
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginBottom: 2,
            background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          }}>
            <BotIcon />
          </div>
        )}

        {/* Balon */}
        <div style={{
          maxWidth: 560,
          minWidth: 0,
          background: isUser
            ? 'linear-gradient(135deg, #7c3aed, #2563eb)'
            : 'rgba(255,255,255,0.05)',
          border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          padding: '11px 15px',
          color: 'white',
          fontSize: 14,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          boxShadow: isUser ? '0 4px 20px rgba(124,58,237,0.25)' : 'none',
        }}>
          {msg.content}
        </div>
      </div>

      {/* PII uyarısı */}
      {msg.piiEntities && msg.piiEntities.length > 0 && (
        <div style={{ width: '100%', maxWidth: '85%', alignSelf: 'flex-end' }}>
          <PiiWarningBox entities={msg.piiEntities} riskScore={msg.riskScore || 0} />
        </div>
      )}

      {/* Warn bandı */}
      {(msg.finalAction === 'warn' || msg.finalAction === 'warn_and_log') && (
        <div style={{ width: '100%', maxWidth: '85%', alignSelf: isUser ? 'flex-end' : 'flex-start' }}>
          <WarnBanner message={msg.userMessage} />
        </div>
      )}

      {/* Block kartı */}
      {msg.finalAction === 'block' && (
        <div style={{ width: '100%', maxWidth: '85%', alignSelf: 'flex-end' }}>
          <BlockCard reason={msg.blockReason} message={msg.userMessage} />
        </div>
      )}
    </div>
  );
};

/* ─── Typing indicator ───────────────────────────────────────── */
const TypingIndicator = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
    <div style={{
      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
      background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
    }}>
      <BotIcon />
    </div>
    <div style={{
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '18px 18px 18px 4px', padding: '14px 18px',
      display: 'flex', gap: 5, alignItems: 'center',
    }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'rgba(167,139,250,0.7)',
          animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  </div>
);

/* ─── Boş durum ──────────────────────────────────────────────── */
const EmptyState = () => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'rgba(255,255,255,0.2)' }}>
    <div style={{
      width: 56, height: 56, borderRadius: 16,
      background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(124,58,237,0.5)',
    }}>
      <ShieldIcon size={28} />
    </div>
    <p style={{ fontSize: 14, fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>Start a conversation</p>
    <p style={{ fontSize: 12, textAlign: 'center', maxWidth: 240, lineHeight: 1.6 }}>
      PromptGuard will analyze your messages for privacy and ethical compliance before sending.
    </p>
  </div>
);

/* ─── Ana Bileşen ─────────────────────────────────────────────── */
const Chat = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => 's' + Math.random().toString(36).slice(2, 8));
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const userMode = user?.mode || 'individual';
  const userName = user?.email?.split('@')[0] || 'User';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Textarea auto-resize
  const handleTextareaChange = (e) => {
    setPrompt(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!prompt.trim() || loading) return;

    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { type: 'user', content: prompt, time: now };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setPrompt('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      // Gerçek API çağrısı (backend hazır olduğunda aktif edilecek):
      /*
      const response = await api.post('/send', {
        prompt: prompt,
        session_id: sessionId,
      });
      const { llm_response, final_action, user_message, final_risk_score, block_reason } = response.data;
      // pii_result ve entities için /analyze sonucunu da işleyebilirsin
      */

      // Mock response — final_action değerini değiştirerek farklı durumları test edebilirsin:
      await new Promise(r => setTimeout(r, 1000));

      const mockFinalAction = 'mask_and_allow'; // 'allow' | 'warn' | 'warn_and_log' | 'mask_and_allow' | 'block'

      const mockData = {
        llm_response: mockFinalAction === 'block'
          ? null
          : 'I can certainly help you with your inquiry. How can I assist you today while ensuring your data remains protected?',
        final_action: mockFinalAction,
        user_message: mockFinalAction === 'block'
          ? 'This prompt contains financial data and cannot be sent.'
          : mockFinalAction.includes('warn')
          ? 'Activity has been logged due to policy risk.'
          : 'Sensitive data was masked before sending.',
        final_risk_score: 88,
        block_reason: mockFinalAction === 'block' ? 'FINANCIAL_DATA' : null,
        pii_entities: ['[PERSON_1]', '[ID_NUMBER]'],
      };

      const botTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      // Kullanıcı mesajına PII / warn / block bilgilerini ekle
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1
          ? {
              ...m,
              finalAction: mockData.final_action,
              userMessage: mockData.user_message,
              riskScore: mockData.final_risk_score,
              blockReason: mockData.block_reason,
              piiEntities: ['mask_and_allow', 'warn_and_log'].includes(mockData.final_action)
                ? mockData.pii_entities
                : [],
            }
          : m
      ));

      // Bot yanıtını ekle (block değilse)
      if (mockData.final_action !== 'block' && mockData.llm_response) {
        setMessages(prev => [...prev, {
          type: 'bot',
          content: mockData.llm_response,
          time: botTime,
        }]);
      }
    } catch (error) {
      console.error('Mesaj gönderilemedi:', error);
      const errTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'Something went wrong. Please try again.',
        time: errTime,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .chat-root {
          display: flex;
          height: 100vh;
          background: #07070f;
          font-family: 'DM Sans', sans-serif;
          color: white;
          overflow: hidden;
        }

        /* ── Sidebar ── */
        .sidebar {
          width: 260px;
          min-width: 260px;
          background: rgba(255,255,255,0.025);
          border-right: 1px solid rgba(255,255,255,0.07);
          display: flex;
          flex-direction: column;
          padding: 20px 14px;
          gap: 16px;
          overflow: hidden;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 6px;
        }
        .sidebar-logo-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: white;
          box-shadow: 0 4px 16px rgba(124,58,237,0.3);
          flex-shrink: 0;
        }
        .sidebar-logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 16px; font-weight: 800;
          color: white;
        }
        .sidebar-logo-sub {
          font-size: 10px; font-weight: 600;
          letter-spacing: 1px; text-transform: uppercase;
          color: rgba(255,255,255,0.3);
        }

        .new-chat-btn {
          display: flex; align-items: center; justify-content: center;
          gap: 8px;
          width: 100%; padding: 11px;
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          border: none; border-radius: 12px;
          color: white; font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(124,58,237,0.3);
        }
        .new-chat-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(124,58,237,0.4);
        }

        .history-label {
          font-size: 10px; font-weight: 700;
          letter-spacing: 1px; text-transform: uppercase;
          color: rgba(255,255,255,0.25);
          padding: 0 6px;
        }

        .history-list {
          display: flex; flex-direction: column; gap: 2px;
          flex: 1; overflow-y: auto;
        }
        .history-list::-webkit-scrollbar { width: 0; }

        .history-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.15s;
          color: rgba(255,255,255,0.45);
          font-size: 13px;
          border: 1px solid transparent;
        }
        .history-item:hover {
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.7);
        }
        .history-item.active {
          background: rgba(124,58,237,0.12);
          border-color: rgba(124,58,237,0.25);
          color: white;
        }
        .history-item-title {
          flex: 1; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
          font-weight: 500;
        }
        .history-item-time {
          font-size: 10px; color: rgba(255,255,255,0.25);
          flex-shrink: 0;
        }

        .sidebar-user {
          display: flex; align-items: center; gap: 10px;
          padding: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
        }
        .user-avatar {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #7c3aed55, #2563eb55);
          border: 1px solid rgba(124,58,237,0.4);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: #a78bfa;
          flex-shrink: 0; text-transform: uppercase;
        }
        .user-info { flex: 1; min-width: 0; }
        .user-name {
          font-size: 13px; font-weight: 600; color: white;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .user-role {
          font-size: 10px; color: rgba(255,255,255,0.3); text-transform: capitalize;
        }
        .logout-btn {
          background: none; border: none;
          color: rgba(255,255,255,0.3);
          cursor: pointer; padding: 4px;
          border-radius: 6px; display: flex;
          transition: color 0.2s;
        }
        .logout-btn:hover { color: #f87171; }

        /* ── Main area ── */
        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Navbar */
        .navbar {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.015);
          flex-shrink: 0;
        }
        .navbar-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px; font-weight: 700; color: white;
        }
        .mode-badge {
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.8px; text-transform: uppercase;
          padding: 5px 12px;
          background: rgba(124,58,237,0.15);
          border: 1px solid rgba(124,58,237,0.3);
          border-radius: 20px;
          color: #a78bfa;
        }

        /* Mesajlar */
        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 24px 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .messages-area::-webkit-scrollbar { width: 4px; }
        .messages-area::-webkit-scrollbar-track { background: transparent; }
        .messages-area::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
        }

        /* Input alanı */
        .input-area {
          padding: 16px 24px 20px;
          border-top: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.015);
          flex-shrink: 0;
        }
        .input-box {
          display: flex; align-items: flex-end; gap: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 16px;
          padding: 10px 12px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-box:focus-within {
          border-color: rgba(124,58,237,0.5);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
        }
        .input-textarea {
          flex: 1;
          background: none; border: none; outline: none;
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; line-height: 1.5;
          resize: none;
          min-height: 24px; max-height: 120px;
          overflow-y: auto;
        }
        .input-textarea::placeholder { color: rgba(255,255,255,0.25); }
        .input-textarea::-webkit-scrollbar { width: 0; }
        .send-btn {
          width: 36px; height: 36px; flex-shrink: 0;
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          border: none; border-radius: 10px;
          color: white; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 2px 10px rgba(124,58,237,0.3);
        }
        .send-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(124,58,237,0.45);
        }
        .send-btn:disabled {
          opacity: 0.4; cursor: not-allowed; transform: none;
        }
        .input-disclaimer {
          text-align: center;
          font-size: 11px;
          color: rgba(255,255,255,0.2);
          margin-top: 10px;
          line-height: 1.5;
        }

        /* Typing dot animasyonu */
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      <div className="chat-root">

        {/* ── SIDEBAR ───────────────────────────────────── */}
        <div className="sidebar">
          {/* Logo */}
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon"><ShieldIcon size={18} /></div>
            <div>
              <div className="sidebar-logo-text">PromptGuard</div>
              <div className="sidebar-logo-sub">AI Gateway</div>
            </div>
          </div>

          {/* New Chat */}
          <button className="new-chat-btn" onClick={() => setMessages([])}>
            <PlusIcon /> New Chat
          </button>

          {/* Geçmiş */}
          <div className="history-label">Recent History</div>
          <div className="history-list">
            {HISTORY.map(item => (
              <div key={item.id} className={`history-item ${item.active ? 'active' : ''}`}>
                <ChatIcon />
                <span className="history-item-title">{item.title}</span>
                <span className="history-item-time">{item.time}</span>
              </div>
            ))}
          </div>

          {/* Kullanıcı */}
          <div className="sidebar-user">
            <div className="user-avatar">{userName.charAt(0)}</div>
            <div className="user-info">
              <div className="user-name">{userName}</div>
              <div className="user-role">{userMode === 'institutional' ? 'Institutional User' : 'Standard User'}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <LogoutIcon />
            </button>
          </div>
        </div>

        {/* ── MAIN ──────────────────────────────────────── */}
        <div className="main">
          {/* Navbar */}
          <div className="navbar">
            <span className="navbar-title">New Conversation</span>
            <span className="mode-badge">
              {userMode === 'institutional' ? 'Institutional Mode' : 'Individual Mode'}
            </span>
          </div>

          {/* Mesajlar */}
          <div className="messages-area">
            {messages.length === 0 && <EmptyState />}
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="input-area">
            <div className="input-box">
              <textarea
                ref={textareaRef}
                className="input-textarea"
                placeholder="Type your message..."
                value={prompt}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={loading || !prompt.trim()}
              >
                <SendIcon />
              </button>
            </div>
            <div className="input-disclaimer">
              PromptGuard analyzes all messages for privacy and ethical compliance.
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default Chat;