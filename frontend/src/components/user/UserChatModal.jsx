import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, ShieldCheck, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function UserChatModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const messagesEndRef = useRef(null);

  const customerId = user?._id || user?.id || (user?.email ? `guest_${user.email}` : 'demo_user_123');
  const customerName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Valued Client';

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      fetchMessages();
      markAsRead();
    };

    window.addEventListener('openUserChat', handleOpen);
    return () => window.removeEventListener('openUserChat', handleOpen);
  }, [customerId]);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 8000);
      return () => clearInterval(interval);
    }
  }, [isOpen, customerId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

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
      console.error('Error clearing chat:', err);
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
    if (!inputMsg.trim() || loading) return;

    setLoading(true);
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
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Subtle backdrop overlay */}
      <div style={styles.backdrop} onClick={() => setIsOpen(false)} />

      {/* Right-Side Chat Drawer / Slider */}
      <div style={styles.drawerCard}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.avatar}>
              <ShieldCheck size={18} color="#DE7356" />
            </div>
            <div>
              <h3 style={styles.title}>Atelier Concierge</h3>
              <p style={styles.subtitle}>24/7 Bespoke Client Assistance</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {messages.length > 0 && (
              <button 
                onClick={handleClearChat} 
                disabled={clearing}
                style={styles.clearBtn}
                title="Clear Chat History"
              >
                <Trash2 size={14} color="#7A6F68" />
                <span style={{ fontSize: '11px', color: '#7A6F68' }}>Clear</span>
              </button>
            )}
            <button style={styles.closeBtn} onClick={() => setIsOpen(false)} title="Close Chat">
              <X size={18} color="#2C221E" />
            </button>
          </div>
        </div>

        {/* Body Messages List */}
        <div style={styles.body}>
          {messages.length === 0 ? (
            <div style={styles.emptyState}>
              <MessageSquare size={36} color="#DE7356" style={{ marginBottom: 10 }} />
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#2C221E', margin: '0 0 4px 0', fontFamily: "'Playfair Display', serif" }}>
                Welcome to Atelier Concierge
              </h4>
              <p style={{ fontSize: '12.5px', color: '#7A6F68', margin: 0, maxWidth: '240px', lineHeight: '1.4' }}>
                No messages yet. Send a message to speak directly with our client advisory team.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender === 'customer';
              const msgId = msg._id || msg.id;
              return (
                <div key={msgId} style={isUser ? styles.userRow : styles.adminRow}>
                  <div style={isUser ? styles.userBubble : styles.adminBubble}>
                    {!isUser && (
                      <div style={styles.adminSenderLabel}>
                        {msg.senderName || 'Atelier Concierge'}
                      </div>
                    )}
                    <div style={styles.msgContentRow}>
                      <span style={styles.msgText}>{msg.message}</span>
                      <span style={isUser ? styles.userTimeText : styles.adminTimeText}>
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

        {/* Input Composer Footer */}
        <form onSubmit={handleSendMessage} style={styles.footer}>
          <textarea
            placeholder="Type a message..."
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            onKeyDown={handleKeyDown}
            style={styles.textarea}
            rows={1}
          />
          <button 
            type="submit" 
            disabled={loading || !inputMsg.trim()} 
            style={{
              ...styles.sendBtn,
              opacity: (loading || !inputMsg.trim()) ? 0.5 : 1,
              cursor: (loading || !inputMsg.trim()) ? 'not-allowed' : 'pointer'
            }}
          >
            <Send size={15} color="#FFF" />
          </button>
        </form>
      </div>
    </>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(28, 22, 20, 0.45)',
    backdropFilter: 'blur(2px)',
    zIndex: 9998
  },
  drawerCard: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '400px',
    maxWidth: '100vw',
    backgroundColor: '#FAF4F0',
    borderLeft: '1.5px solid #EFE7DF',
    boxShadow: '-10px 0 40px rgba(0,0,0,0.15)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxSizing: 'border-box'
  },
  header: {
    padding: '16px 20px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #EFE7DF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#FDEEE9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  title: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#2C221E',
    margin: 0,
    fontFamily: "'Playfair Display', Georgia, serif"
  },
  subtitle: {
    fontSize: '11px',
    color: '#DE7356',
    margin: 0,
    fontWeight: '600'
  },
  clearBtn: {
    background: 'none',
    border: '1px solid #EFE7DF',
    borderRadius: '14px',
    padding: '4px 10px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  body: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    backgroundColor: '#FAF4F0'
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '40px 20px'
  },
  userRow: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  adminRow: {
    display: 'flex',
    justifyContent: 'flex-start'
  },
  userBubble: {
    backgroundColor: '#DE7356',
    color: '#FFFFFF',
    borderRadius: '14px 14px 2px 14px',
    padding: '7px 12px',
    maxWidth: '82%',
    boxShadow: '0 1px 4px rgba(222, 115, 86, 0.18)'
  },
  adminBubble: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #EFE7DF',
    color: '#2C221E',
    borderRadius: '14px 14px 14px 2px',
    padding: '7px 12px',
    maxWidth: '82%',
    boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
  },
  adminSenderLabel: {
    fontSize: '9.5px',
    fontWeight: '700',
    color: '#DE7356',
    marginBottom: '3px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  msgContentRow: {
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'space-between'
  },
  msgText: {
    fontSize: '13px',
    lineHeight: '1.4',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    flex: 1
  },
  userTimeText: {
    fontSize: '9.5px',
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 'auto',
    flexShrink: 0
  },
  adminTimeText: {
    fontSize: '9.5px',
    color: '#9E928A',
    marginLeft: 'auto',
    flexShrink: 0
  },
  footer: {
    padding: '12px 16px',
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #EFE7DF',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0
  },
  textarea: {
    flex: 1,
    height: '42px',
    minHeight: '42px',
    maxHeight: '80px',
    borderRadius: '12px',
    border: '1.5px solid #EFE7DF',
    backgroundColor: '#FAF4F0',
    color: '#2C221E',
    padding: '10px 14px',
    fontSize: '12.5px',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
    lineHeight: '1.4',
    boxSizing: 'border-box'
  },
  sendBtn: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: '#DE7356',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  }
};
