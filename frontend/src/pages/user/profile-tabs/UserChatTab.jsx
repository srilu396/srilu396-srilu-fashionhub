import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ShieldCheck, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const accent = '#DE7356';

const UserChatTab = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const messagesEndRef = useRef(null);

  const customerId = user?._id || user?.id || (user?.email ? `guest_${user.email}` : 'demo_user_123');
  const customerName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Valued Client';

  useEffect(() => {
    fetchMessages();
    markAsRead();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [customerId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const token = localStorage.getItem('userToken');
      const res = await fetch(`${API_BASE}/api/chat/messages/${customerId}?viewer=customer`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      await fetch(`${API_BASE}/api/chat/read/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reader: 'customer' })
      });
      window.dispatchEvent(new CustomEvent('updateUserChatUnread'));
    } catch (err) {
      console.error('Error marking chat read:', err);
    }
  };

  const handleClearChat = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const res = await fetch(`${API_BASE}/api/chat/clear/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester: 'customer' })
      });
      const data = await res.json();
      if (data.success) {
        setMessages([]);
      }
    } catch (err) {
      console.error('Error clearing user chat:', err);
    } finally {
      setClearing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMsg.trim() || sending) return;

    setSending(true);
    const msgText = inputMsg.trim();
    setInputMsg('');

    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const res = await fetch(`${API_BASE}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          sender: 'customer',
          senderName: customerName,
          message: msgText
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchMessages();
        scrollToBottom();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={S.headerRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={S.headerIcon}>
            <ShieldCheck size={20} color="#DE7356" />
          </div>
          <div>
            <h2 style={S.title}>Atelier Concierge Chat</h2>
            <p style={{ fontSize: 13, color: '#7A6F68', margin: 0 }}>
              Live 24/7 client support & bespoke assistance
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button 
            onClick={handleClearChat} 
            disabled={clearing} 
            style={S.clearBtn}
            title="Clear Chat History"
          >
            <Trash2 size={14} color="#7A6F68" />
            <span style={{ fontSize: 12, color: '#7A6F68' }}>Clear Chat</span>
          </button>
        )}
      </div>

      {/* Messages Box */}
      <div style={S.chatBox}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: accent }}>
            Connecting to Atelier Concierge...
          </div>
        ) : messages.length === 0 ? (
          <div style={S.emptyState}>
            <MessageSquare size={36} color="#DE7356" style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 13, color: '#7A6F68', margin: 0 }}>
              No messages yet. Send a message to speak directly with our concierge team.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'customer';
            const msgId = msg._id || msg.id;
            return (
              <div key={msgId} style={isUser ? S.userRow : S.adminRow}>
                <div style={isUser ? S.userBubble : S.adminBubble}>
                  {!isUser && (
                    <div style={S.adminSenderLabel}>
                      {msg.senderName || 'Atelier Concierge'}
                    </div>
                  )}
                  <div style={S.msgContentRow}>
                    <span style={S.msgText}>{msg.message}</span>
                    <span style={isUser ? S.userTimeText : S.adminTimeText}>
                      {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer Input */}
      <form onSubmit={handleSendMessage} style={S.inputRow}>
        <textarea
          placeholder="Type a message..."
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          style={S.input}
          rows={1}
        />
        <button 
          type="submit" 
          disabled={sending || !inputMsg.trim()} 
          style={{
            ...S.sendBtn,
            opacity: (sending || !inputMsg.trim()) ? 0.5 : 1,
            cursor: (sending || !inputMsg.trim()) ? 'not-allowed' : 'pointer'
          }}
        >
          <Send size={16} color="#FFF" />
        </button>
      </form>
    </div>
  );
};

const S = {
  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerIcon: {
    width: 38, height: 38, borderRadius: '50%', background: '#FDEEE9',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  title: { fontSize: 18, fontWeight: 700, color: '#2C221E', margin: '0 0 2px', fontFamily: "'Playfair Display', Georgia, serif" },
  clearBtn: {
    background: 'none', border: '1px solid #EFE7DF', borderRadius: 8,
    padding: '6px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
  },
  chatBox: {
    height: 340,
    background: '#FAF4F0',
    border: '1.5px solid #EFE7DF',
    borderRadius: 14,
    padding: 16,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 14
  },
  emptyState: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', textAlign: 'center'
  },
  userRow: { display: 'flex', justifyContent: 'flex-end' },
  adminRow: { display: 'flex', justifyContent: 'flex-start' },
  userBubble: {
    background: accent, color: '#FFF',
    borderRadius: '14px 14px 2px 14px',
    padding: '7px 12px', maxWidth: '80%',
    boxShadow: '0 1px 4px rgba(222, 115, 86, 0.18)'
  },
  adminBubble: {
    background: '#FFFFFF', border: '1px solid #EFE7DF',
    color: '#2C221E', borderRadius: '14px 14px 14px 2px',
    padding: '7px 12px', maxWidth: '80%',
    boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
  },
  adminSenderLabel: { fontSize: 10, fontWeight: 700, color: accent, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' },
  msgContentRow: { display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between' },
  msgText: { fontSize: 13, lineHeight: '1.4', whiteSpace: 'pre-wrap', wordBreak: 'break-word', flex: 1 },
  userTimeText: { fontSize: 9.5, color: 'rgba(255,255,255,0.8)', marginLeft: 'auto', flexShrink: 0 },
  adminTimeText: { fontSize: 9.5, color: '#9E928A', marginLeft: 'auto', flexShrink: 0 },
  inputRow: { display: 'flex', gap: 10, alignItems: 'center' },
  input: {
    flex: 1, height: 42, minHeight: 42, maxHeight: 80, border: '1.5px solid #EFE7DF', borderRadius: 10,
    background: '#FFFFFF', padding: '10px 14px', fontSize: 13, outline: 'none', color: '#2C221E', resize: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 10, background: accent,
    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
  }
};

export default UserChatTab;
