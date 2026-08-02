import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import ActionMenu from '../../components/admin/ActionMenu';
import ConfirmationModal from '../../components/admin/ConfirmationModal';
import { vipAPI } from '../../utils/api';
import { Download, Crown } from 'lucide-react';

const VipSubscribersManagement = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const data = await vipAPI.getAll();
      if (data.success && Array.isArray(data.subscribers)) {
        setSubscribers(data.subscribers);
      }
    } catch (err) {
      console.error('Error fetching VIP subscribers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!selectedSubscriber) return;
    setDeleteLoading(true);
    try {
      await vipAPI.delete(selectedSubscriber._id || selectedSubscriber.id);
      fetchSubscribers();
    } catch (err) {
      console.error('Error removing VIP subscriber:', err);
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
      setSelectedSubscriber(null);
    }
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) return;
    const headers = ['Email', 'Subscription Date', 'Status', 'Notes'];
    const rows = subscribers.map(s => [
      s.email,
      new Date(s.subscriptionDate || s.createdAt).toISOString(),
      s.status || 'active',
      `"${s.notes || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VIP_Subscribers_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      header: 'Subscriber Email',
      accessor: 'email',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={styles.crownIcon}>
            <Crown size={15} color="#D4AF37" />
          </div>
          <span style={{ fontWeight: '600', color: '#F9F6F0' }}>{row.email}</span>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Subscription Date',
      accessor: 'subscriptionDate',
      render: (row) => new Date(row.subscriptionDate || row.createdAt || Date.now()).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      sortable: true
    },
    {
      header: 'Privé Status',
      accessor: 'status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status || 'active'} customLabel="VIP Member" />
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <ActionMenu
          items={[
            { 
              label: 'Remove VIP Subscriber', 
              danger: true, 
              onClick: () => { setSelectedSubscriber(row); setDeleteModalOpen(true); } 
            }
          ]}
        />
      )
    }
  ];

  return (
    <AdminLayout title="VIP Subscribers">
      <PageHeader
        title="Club Privé VIP Members"
        subtitle="Manage private newsletter subscribers, export email rosters, and track membership status"
        breadcrumbs={[{ label: 'VIP Privé' }]}
        actions={
          <button onClick={handleExportCSV} style={styles.exportBtn} disabled={subscribers.length === 0}>
            <Download size={15} /> Export CSV
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={subscribers}
        loading={loading}
        searchPlaceholder="Search subscribers by email..."
        filterKey="status"
        filterOptions={[
          { label: 'All Subscribers', value: 'ALL' }
        ]}
        emptyTitle="No VIP Subscribers"
        emptyDescription="Subscribers from Landing Page Club Privé will appear here."
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove VIP Subscriber"
        message={`Are you sure you want to remove subscriber "${selectedSubscriber?.email}" from Club Privé?`}
        confirmText="Remove Member"
        danger={true}
        loading={deleteLoading}
      />
    </AdminLayout>
  );
};

const styles = {
  exportBtn: {
    padding: '9px 16px',
    backgroundColor: '#141419',
    border: '1px solid rgba(212, 175, 55, 0.4)',
    color: '#D4AF37',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  },
  crownIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};

export default VipSubscribersManagement;
