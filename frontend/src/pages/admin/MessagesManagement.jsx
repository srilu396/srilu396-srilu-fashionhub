import React, { useState, useEffect, useMemo, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import ActionMenu from '../../components/admin/ActionMenu';
import ConfirmationModal from '../../components/admin/ConfirmationModal';
import { Eye, Trash2, MessageSquare, Clock, User } from 'lucide-react';
import { useToast } from '../../components/common/Toast/useToast';
import { messageAPI } from '../../utils/api';

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Recently';
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const MessagesManagement = () => {
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected conversation thread for view modal
  const [selectedThread, setSelectedThread] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Deletion modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'thread' | 'message', target: obj }
  const [deleteLoading, setDeleteLoading] = useState(false);



  const fetchMessages = async () => {
    setLoading(true);
    try {
      const data = await messageAPI.getAll();
      if (data && data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
      } else if (Array.isArray(data)) {
        setMessages(data);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Memoized conversation grouping logic
  const conversationThreads = useMemo(() => {
    if (!Array.isArray(messages) || messages.length === 0) return [];

    const map = new Map();

    messages.forEach((msg) => {
      // Group by threadId/conversationId if exists, otherwise fallback to normalized email
      const key = msg.threadId || msg.conversationId || (msg.email ? msg.email.toLowerCase().trim() : 'anonymous');
      
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(msg);
    });

    const threads = [];

    map.forEach((rawMsgs, key) => {
      // Sort messages newest first for summary, oldest first for chronological conversation thread
      const sortedDesc = [...rawMsgs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      const sortedAsc = [...rawMsgs].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

      const latestMsg = sortedDesc[0];

      threads.push({
        id: key,
        email: latestMsg.email || 'N/A',
        latestName: latestMsg.name || 'Anonymous Customer',
        totalMessages: rawMsgs.length,
        latestMessage: latestMsg.message || '',
        latestSubject: latestMsg.subject || 'Customer Inquiry',
        latestTimestamp: latestMsg.createdAt || Date.now(),
        lastActivityText: formatRelativeTime(latestMsg.createdAt),
        chronologicalMessages: sortedAsc,
        rawMessages: rawMsgs
      });
    });

    // Sort threads by latest activity timestamp descending
    return threads.sort((a, b) => new Date(b.latestTimestamp) - new Date(a.latestTimestamp));
  }, [messages]);

  // Keep selectedThread in sync if messages update while modal is open
  useEffect(() => {
    if (selectedThread && modalOpen) {
      const updated = conversationThreads.find(t => t.id === selectedThread.id);
      if (updated) {
        setSelectedThread(updated);
      } else {
        setModalOpen(false);
      }
    }
  }, [conversationThreads, modalOpen, selectedThread]);

  // Handle single message or whole thread deletion
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    try {
      if (itemToDelete.type === 'message') {
        const msgId = itemToDelete.target._id || itemToDelete.target.id;
        await messageAPI.delete(msgId);
        toast.success('Message deleted successfully', 'Deleted');
      } else if (itemToDelete.type === 'thread') {
        const msgs = itemToDelete.target.rawMessages || [];
        await Promise.all(msgs.map(m => messageAPI.delete(m._id || m.id)));
        toast.success('Conversation thread deleted', 'Deleted');
      }

      await fetchMessages();
    } catch (err) {
      console.error('Error deleting message(s):', err);
      toast.error('Error deleting message');
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };



  // Reply state
  const [adminReplyText, setAdminReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const adminMessagesEndRef = useRef(null);

  const scrollToAdminBottom = () => {
    setTimeout(() => {
      adminMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
  };

  useEffect(() => {
    if (modalOpen && selectedThread) {
      scrollToAdminBottom();
    }
  }, [modalOpen, selectedThread]);

  const handleOpenThread = async (thread) => {
    setSelectedThread(thread);
    setModalOpen(true);

    // Mark as read for admin
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const cId = thread.id;
      await fetch(`${API_BASE}/api/chat/read/${cId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reader: 'admin' })
      });
    } catch (err) {
      console.error('Error marking thread read by admin:', err);
    }
  };

  const handleAdminReplyKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendAdminReply(e);
    }
  };

  const handleSendAdminReply = async (e) => {
    if (e) e.preventDefault();
    if (!adminReplyText.trim() || !selectedThread || sendingReply) return;

    setSendingReply(true);
    const replyText = adminReplyText.trim();
    setAdminReplyText('');

    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const cId = selectedThread.id;
      const res = await fetch(`${API_BASE}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: cId,
          sender: 'admin',
          senderName: 'Atelier Concierge',
          message: replyText
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Reply sent to ${selectedThread.latestName}`, 'Message Sent');
        // Fetch updated messages for thread
        const msgRes = await fetch(`${API_BASE}/api/chat/messages/${cId}`);
        const msgData = await msgRes.json();
        if (msgData.success && Array.isArray(msgData.messages)) {
          setSelectedThread(prev => ({
            ...prev,
            chronologicalMessages: msgData.messages,
            totalMessages: msgData.messages.length
          }));
          scrollToAdminBottom();
        }
      }
    } catch (err) {
      console.error('Error sending admin reply:', err);
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const columns = [
    {
      header: 'Customer',
      accessor: 'email',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: '600', color: 'var(--admin-text-primary)' }}>{row.latestName}</span>
          <span style={{ fontSize: '11px', color: 'var(--admin-text-secondary)' }}>{row.email}</span>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Activity & Messages',
      accessor: 'totalMessages',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            padding: '4px 8px',
            backgroundColor: 'var(--admin-gold-muted)',
            border: '1px solid var(--admin-border-gold)',
            borderRadius: '12px',
            color: 'var(--admin-gold)',
            fontSize: '11px',
            fontWeight: '700',
            fontFamily: 'monospace'
          }}>
            {row.totalMessages} {row.totalMessages === 1 ? 'Message' : 'Messages'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} color="var(--admin-text-secondary)" />
            {row.lastActivityText}
          </span>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Latest Subject & Preview',
      accessor: 'latestSubject',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '320px' }}>
          <span style={{ fontWeight: '600', color: 'var(--admin-gold)', fontSize: '13px' }}>{row.latestSubject}</span>
          <span style={{
            fontSize: '12px',
            color: 'var(--admin-text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {row.latestMessage}
          </span>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <ActionMenu
          items={[
            {
              label: 'View Conversation',
              icon: <Eye size={14} color="var(--admin-gold)" />,
              onClick: () => handleOpenThread(row)
            },
            {
              label: 'Clear Conversation',
              icon: <Trash2 size={14} color="var(--admin-gold)" />,
              onClick: async () => {
                try {
                  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
                  const res = await fetch(`${API_BASE}/api/chat/clear/${row.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requester: 'admin' })
                  });
                  const data = await res.json();
                  if (data.success) {
                    toast.success('Conversation thread cleared for Admin', 'Cleared');
                    await fetchMessages();
                  }
                } catch (err) {
                  console.error('Error clearing conversation:', err);
                }
              }
            },
            {
              label: 'Delete Conversation',
              icon: <Trash2 size={14} color="var(--admin-danger)" />,
              danger: true,
              onClick: () => {
                setItemToDelete({ type: 'thread', target: row });
                setDeleteModalOpen(true);
              }
            }
          ]}
        />
      )
    }
  ];

  return (
    <AdminLayout title="Customer Inquiries">
      <PageHeader
        title="Customer Messages"
        subtitle="Review contact inquiries, customer conversations, and support messages grouped by client"
        breadcrumbs={[{ label: 'Messages' }]}
      />

      {/* Grouped Messages Data Table */}
      <DataTable
        columns={columns}
        data={conversationThreads}
        loading={loading}
        onRowClick={(row) => { setSelectedThread(row); setModalOpen(true); }}
        searchPlaceholder="Search conversations by customer name, email, or subject..."
        emptyTitle="No Messages Found"
        emptyDescription="Customer contact submissions will be displayed here as conversation threads."
      />

      {/* Conversation Thread History Drawer / Modal */}
      {modalOpen && selectedThread && (
        <div style={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={styles.avatarCircle}>
                  <User size={18} color="#D4AF37" />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>{selectedThread.latestName}</h3>
                  <span style={styles.modalEmail}>{selectedThread.email}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={styles.countBadge}>
                  {selectedThread.totalMessages} {selectedThread.totalMessages === 1 ? 'Message' : 'Messages'}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
                      const cId = selectedThread.id;
                      const res = await fetch(`${API_BASE}/api/chat/clear/${cId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ requester: 'admin' })
                      });
                      const data = await res.json();
                      if (data.success) {
                        toast.success('Conversation thread cleared for Admin', 'Cleared');
                        setModalOpen(false);
                        await fetchMessages();
                      }
                    } catch (err) {
                      console.error('Error clearing conversation:', err);
                    }
                  }}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--admin-border-gold)',
                    borderRadius: '12px',
                    color: 'var(--admin-gold)',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Trash2 size={12} /> Clear Chat
                </button>
                <button onClick={() => setModalOpen(false)} style={styles.modalClose}>×</button>
              </div>
            </div>

            {/* Conversation Messages Thread Body */}
            <div style={styles.modalBody}>
              <div style={styles.threadHeaderInfo}>
                <span>Conversation History ({selectedThread.chronologicalMessages.length})</span>
                <span>Chronological Order</span>
              </div>

              {/* Fixed Height Scrollable Messages Card Box */}
              <div style={styles.messagesScrollList} className="custom-gold-scrollbar">
                {selectedThread.chronologicalMessages.map((msg, idx) => (
                  <div key={msg._id || msg.id || idx} style={styles.messageCard}>
                    <div style={styles.msgCardHeader}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={styles.msgSender}>
                          {msg.name || selectedThread.latestName}
                        </span>
                        <span style={styles.msgDate}>
                          {new Date(msg.createdAt || Date.now()).toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setItemToDelete({ type: 'message', target: msg });
                          setDeleteModalOpen(true);
                        }}
                        style={styles.singleDeleteBtn}
                        title="Delete this message"
                      >
                        <Trash2 size={13} color="#EF4444" />
                      </button>
                    </div>

                    {msg.subject && (
                      <div style={styles.msgSubject}>
                        Subject: <strong>{msg.subject}</strong>
                      </div>
                    )}

                    <p style={styles.msgText}>{msg.message}</p>
                  </div>
                ))}
                <div ref={adminMessagesEndRef} />
              </div>

              {/* Modal Footer Reply Box & Actions */}
              <div style={styles.modalFooter}>
                <form onSubmit={handleSendAdminReply} style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="Type a reply..."
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    onKeyDown={handleAdminReplyKeyDown}
                    style={{
                      flex: 1,
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--admin-bg-dark)',
                      border: '1px solid var(--admin-border-gold)',
                      color: 'var(--admin-text-primary)',
                      fontSize: '12.5px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !adminReplyText.trim()}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--admin-gold)',
                      color: '#1A1412',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {sendingReply ? 'Sending...' : 'Send Reply'}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setItemToDelete({ type: 'thread', target: selectedThread });
                    setDeleteModalOpen(true);
                  }}
                  style={styles.dangerBtn}
                >
                  Delete Entire Conversation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Delete Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={itemToDelete?.type === 'thread' ? "Delete Customer Conversation" : "Delete Customer Message"}
        message={
          itemToDelete?.type === 'thread'
            ? `Are you sure you want to delete the entire conversation (${itemToDelete.target?.totalMessages} messages) from "${itemToDelete.target?.latestName}"?`
            : `Are you sure you want to delete this message from "${itemToDelete?.target?.name || selectedThread?.latestName}"?`
        }
        confirmText={itemToDelete?.type === 'thread' ? "Delete Conversation" : "Delete Message"}
        danger={true}
        loading={deleteLoading}
      />

      <style>{`
        .custom-gold-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-gold-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-gold-scrollbar::-webkit-scrollbar-thumb {
          background: #FFFFFF;
          border-radius: 4px;
          box-shadow: 0 0 6px rgba(255, 255, 255, 0.3);
        }
        .custom-gold-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #F0F0F0;
        }
      `}</style>
    </AdminLayout>
  );
};

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 'var(--z-modal, 9999)',
    padding: '20px'
  },
  modalContent: {
    backgroundColor: 'var(--admin-modal-bg)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '14px',
    width: '100%',
    maxWidth: '640px',
    height: '620px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: 'var(--admin-shadow-lg)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid var(--admin-border-subtle)',
    backgroundColor: 'var(--admin-card-bg)',
    flexShrink: 0
  },
  avatarCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--admin-gold-muted)',
    border: '1px solid var(--admin-border-gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  modalTitle: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--admin-text-primary)',
    margin: 0
  },
  modalEmail: {
    fontSize: '12px',
    color: 'var(--admin-text-secondary)'
  },
  countBadge: {
    padding: '4px 10px',
    backgroundColor: 'var(--admin-gold-muted)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '12px',
    color: 'var(--admin-gold)',
    fontSize: '11px',
    fontWeight: '700'
  },
  modalClose: {
    background: 'none',
    border: 'none',
    color: 'var(--admin-text-muted)',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: '1'
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
    padding: '20px 24px'
  },
  threadHeaderInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--admin-text-secondary)',
    marginBottom: '12px',
    fontWeight: '600',
    flexShrink: 0
  },
  messagesScrollList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    overflowY: 'auto',
    flex: 1,
    height: '380px',
    maxHeight: '380px',
    paddingRight: '6px'
  },
  messageCard: {
    backgroundColor: 'var(--admin-card-bg)',
    border: '1px solid var(--admin-border-subtle)',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  msgCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  msgSender: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--admin-text-primary)'
  },
  msgDate: {
    fontSize: '11px',
    color: 'var(--admin-text-secondary)'
  },
  singleDeleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    opacity: 0.7,
    transition: 'opacity 0.2s ease'
  },
  msgSubject: {
    fontSize: '12px',
    color: 'var(--admin-gold)'
  },
  msgText: {
    fontSize: '13px',
    color: 'var(--admin-text-primary)',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
    margin: 0
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid var(--admin-border-subtle)',
    flexShrink: 0
  },
  primaryBtn: {
    padding: '10px 20px',
    backgroundColor: 'var(--admin-gold)',
    color: 'var(--active-pill-text)',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  },
  dangerBtn: {
    padding: '9px 16px',
    backgroundColor: 'var(--admin-danger-bg)',
    color: 'var(--admin-danger)',
    border: '1px solid var(--admin-danger)',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default MessagesManagement;
