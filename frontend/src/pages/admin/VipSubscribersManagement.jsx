import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import ActionMenu from '../../components/admin/ActionMenu';
import ConfirmationModal from '../../components/admin/ConfirmationModal';
import Button from '../../components/admin/Button';
import { vipAPI } from '../../utils/api';
import { useToast } from '../../components/common/Toast/useToast';
import { Download, Crown, Trash2 } from 'lucide-react';

const VipSubscribersManagement = () => {
  const toast = useToast();
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
      toast.error('Failed to load VIP subscribers list');
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
      toast.success(`Removed "${selectedSubscriber.email}" from Club Privé roster.`, 'Member Removed');
      fetchSubscribers();
    } catch (err) {
      console.error('Error removing VIP subscriber:', err);
      toast.error('Failed to remove VIP subscriber');
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
    toast.info('VIP Subscribers roster exported to CSV.', 'Export Complete');
  };

  const columns = [
    {
      header: 'Subscriber Email',
      accessor: 'email',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={styles.crownIcon}>
            <Crown size={15} color="var(--admin-gold, #D4AF37)" />
          </div>
          <span style={{ fontWeight: '600', color: 'var(--admin-text-primary)' }}>{row.email}</span>
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
              icon: <Trash2 size={15} color="#EF4444" />,
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
          <Button
            onClick={handleExportCSV}
            variant="primary"
            icon={<Download size={15} />}
            disabled={subscribers.length === 0}
          >
            Export CSV
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={subscribers}
        loading={loading}
        searchPlaceholder="Search subscribers by email..."
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
  crownIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--admin-gold-muted, rgba(212, 175, 55, 0.12))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};

export default VipSubscribersManagement;
