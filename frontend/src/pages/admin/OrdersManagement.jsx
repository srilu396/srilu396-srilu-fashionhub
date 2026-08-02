import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import ActionMenu from '../../components/admin/ActionMenu';
import { fetchAllOrders, updateOrderStatus } from '../../redux/slices/orderSlice';

const OrdersManagement = () => {
  const dispatch = useDispatch();
  const { orders = [], loading = false, error = null } = useSelector((state) => state.orders || {});
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchAllOrders());
  }, [dispatch]);

  const handleStatusChange = async (orderId, newStatus) => {
    setStatusUpdateLoading(true);
    try {
      await dispatch(updateOrderStatus({ orderId, status: newStatus })).unwrap();
      dispatch(fetchAllOrders());
      if (selectedOrder && (selectedOrder._id === orderId || selectedOrder.id === orderId)) {
        setSelectedOrder(prev => ({ ...prev, orderStatus: newStatus }));
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const openDrawer = (order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const columns = [
    {
      header: 'Order Reference',
      accessor: (row) => row.orderNumber || (row._id || row.id || '').slice(-6).toUpperCase(),
      render: (row) => (
        <span style={{ fontWeight: '600', color: '#D4AF37', cursor: 'pointer' }} onClick={() => openDrawer(row)}>
          #{row.orderNumber || (row._id || row.id || '').slice(-6).toUpperCase()}
        </span>
      ),
      sortable: true
    },
    {
      header: 'Customer',
      accessor: (row) => row.user ? `${row.user.firstName || ''} ${row.user.lastName || ''}`.trim() : 'Guest',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: '500', color: '#F9F6F0' }}>
            {row.user?.firstName ? `${row.user.firstName} ${row.user.lastName || ''}` : row.shippingAddress?.fullName || 'Customer'}
          </span>
          <span style={{ fontSize: '11px', color: '#A0A0AB' }}>
            {row.user?.email || row.shippingAddress?.email || 'No Email'}
          </span>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Date & Time',
      accessor: 'createdAt',
      render: (row) => new Date(row.createdAt || Date.now()).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      sortable: true
    },
    {
      header: 'Items',
      accessor: (row) => row.items?.length || 0,
      align: 'center',
      render: (row) => `${row.items?.length || 0} item(s)`
    },
    {
      header: 'Total Amount',
      accessor: 'totalAmount',
      align: 'right',
      render: (row) => (
        <span style={{ fontWeight: '600', fontFamily: "'Playfair Display', serif", color: '#F9F6F0' }}>
          ₹{Math.round(row.totalAmount || 0).toLocaleString('en-IN')}
        </span>
      ),
      sortable: true
    },
    {
      header: 'Fulfillment',
      accessor: 'orderStatus',
      align: 'center',
      render: (row) => <StatusBadge status={row.orderStatus || 'pending'} />
    },
    {
      header: 'Action',
      align: 'right',
      render: (row) => (
        <ActionMenu
          items={[
            { label: 'View Order Details', onClick: () => openDrawer(row) },
            { label: 'Mark as Processing', onClick: () => handleStatusChange(row._id || row.id, 'processing') },
            { label: 'Mark as Shipped', onClick: () => handleStatusChange(row._id || row.id, 'shipped') },
            { label: 'Mark as Delivered', onClick: () => handleStatusChange(row._id || row.id, 'delivered') },
            { label: 'Cancel Order', danger: true, onClick: () => handleStatusChange(row._id || row.id, 'cancelled') }
          ]}
        />
      )
    }
  ];

  return (
    <AdminLayout title="Fulfillment Center">
      <PageHeader
        title="Orders Management"
        subtitle="Track, fulfill, and update luxury customer orders across all payment channels"
        breadcrumbs={[{ label: 'Orders' }]}
      />

      {error && (
        <div style={styles.errorNotice}>
          <span>{error}</span>
        </div>
      )}

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        searchPlaceholder="Search by order number, customer name, email..."
        filterKey="orderStatus"
        filterOptions={[
          { label: 'All Orders', value: 'ALL' },
          { label: 'Pending', value: 'pending' },
          { label: 'Processing', value: 'processing' },
          { label: 'Shipped', value: 'shipped' },
          { label: 'Delivered', value: 'delivered' },
          { label: 'Cancelled', value: 'cancelled' }
        ]}
        emptyTitle="No Orders Found"
        emptyDescription="Orders placed by customers will appear here."
      />

      {/* Slide-over Order Details Drawer */}
      {drawerOpen && selectedOrder && (
        <div style={styles.drawerOverlay} onClick={() => setDrawerOpen(false)}>
          <div style={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.drawerHeader}>
              <div>
                <span style={styles.drawerMeta}>Order Summary</span>
                <h3 style={styles.drawerTitle}>
                  #{selectedOrder.orderNumber || (selectedOrder._id || selectedOrder.id || '').slice(-6).toUpperCase()}
                </h3>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={styles.drawerClose}>×</button>
            </div>

            <div style={styles.drawerBody}>
              {/* Status Updater */}
              <div style={styles.sectionCard}>
                <span style={styles.sectionLabel}>Order Status</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                  <StatusBadge status={selectedOrder.orderStatus || 'pending'} />
                  <select
                    value={selectedOrder.orderStatus || 'pending'}
                    onChange={(e) => handleStatusChange(selectedOrder._id || selectedOrder.id, e.target.value)}
                    disabled={statusUpdateLoading}
                    style={styles.statusSelect}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Customer & Shipping Info */}
              <div style={styles.sectionCard}>
                <span style={styles.sectionLabel}>Customer Details</span>
                <p style={styles.detailText}>
                  <strong>Name:</strong> {selectedOrder.user?.firstName ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName || ''}` : selectedOrder.shippingAddress?.fullName || 'N/A'}
                </p>
                <p style={styles.detailText}>
                  <strong>Email:</strong> {selectedOrder.user?.email || selectedOrder.shippingAddress?.email || 'N/A'}
                </p>
                <p style={styles.detailText}>
                  <strong>Shipping Address:</strong> {
                    typeof selectedOrder.shippingAddress === 'string'
                      ? selectedOrder.shippingAddress
                      : `${selectedOrder.shippingAddress?.address || ''}, ${selectedOrder.shippingAddress?.city || ''}, ${selectedOrder.shippingAddress?.country || ''}`
                  }
                </p>
              </div>

              {/* Purchased Items */}
              <div style={styles.sectionCard}>
                <span style={styles.sectionLabel}>Purchased Items ({selectedOrder.items?.length || 0})</span>
                <div style={styles.itemList}>
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div key={idx} style={styles.itemRow}>
                      <img
                        src={item.product?.image || item.image || 'https://via.placeholder.com/50'}
                        alt={item.product?.name || item.name}
                        style={styles.itemThumb}
                      />
                      <div style={styles.itemInfo}>
                        <span style={styles.itemName}>{item.product?.name || item.name || 'Fashion Item'}</span>
                        <span style={styles.itemQty}>Qty: {item.quantity} × ${item.price}</span>
                      </div>
                      <span style={styles.itemSubtotal}>
                        ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total Summary */}
              <div style={styles.totalRow}>
                <span>Total Paid:</span>
                <span style={styles.totalAmount}>
                  ${(selectedOrder.totalAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

const styles = {
  errorNotice: {
    padding: '12px 16px',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#EF4444',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '20px'
  },
  drawerOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'flex-end',
    zIndex: 1000
  },
  drawerContent: {
    backgroundColor: '#16161A',
    borderLeft: '1px solid rgba(212, 175, 55, 0.25)',
    width: '100%',
    maxWidth: '460px',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto'
  },
  drawerHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  drawerMeta: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#A0A0AB'
  },
  drawerTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '20px',
    fontWeight: '700',
    color: '#D4AF37',
    margin: 0
  },
  drawerClose: {
    background: 'none',
    border: 'none',
    color: '#A0A0AB',
    fontSize: '24px',
    cursor: 'pointer'
  },
  drawerBody: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  sectionCard: {
    backgroundColor: '#0D0D0E',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '8px',
    padding: '16px'
  },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: '#D4AF37',
    display: 'block',
    marginBottom: '8px'
  },
  statusSelect: {
    padding: '6px 12px',
    backgroundColor: '#16161A',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '4px',
    color: '#F9F6F0',
    fontSize: '12px',
    outline: 'none',
    cursor: 'pointer'
  },
  detailText: {
    fontSize: '13px',
    color: '#A0A0AB',
    margin: '4px 0',
    lineHeight: '1.4'
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '10px'
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    paddingBottom: '8px'
  },
  itemThumb: {
    width: '40px',
    height: '48px',
    objectFit: 'cover',
    borderRadius: '4px',
    backgroundColor: '#000'
  },
  itemInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  itemName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#F9F6F0'
  },
  itemQty: {
    fontSize: '11px',
    color: '#A0A0AB'
  },
  itemSubtotal: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#D4AF37'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    fontSize: '14px',
    color: '#F9F6F0',
    fontWeight: '600'
  },
  totalAmount: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '22px',
    color: '#D4AF37'
  }
};

export default OrdersManagement;