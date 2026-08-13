import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import ActionMenu from '../../components/admin/ActionMenu';
import MetricCard from '../../components/admin/MetricCard';
import { fetchAllOrders, updateOrderStatus } from '../../redux/slices/orderSlice';
import { ShoppingBag, DollarSign, Users, Package, AlertTriangle, Calendar, Layers, Eye, ChevronRight, BarChart2 } from 'lucide-react';

const OrdersManagement = () => {
  const dispatch = useDispatch();
  const { orders = [], loading = false, error = null } = useSelector((state) => state.orders || {});
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  // Analytics & Insights State
  const [period, setPeriod] = useState('all'); // 'all' | 'today' | 'month' | 'year'
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showProductInsights, setShowProductInsights] = useState(false);

  const [insightsData, setInsightsData] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchAllOrders());
  }, [dispatch]);

  const fetchInsights = async () => {
    setInsightsLoading(true);
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const adminToken = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/api/analytics/order-insights?period=${period}&year=${selectedYear}&month=${selectedMonth}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        setInsightsData(data);
      }
    } catch (err) {
      console.error('Error fetching order insights:', err);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [period, selectedYear, selectedMonth]);

  const handleStatusChange = async (orderId, newStatus) => {
    setStatusUpdateLoading(true);
    try {
      await dispatch(updateOrderStatus({ orderId, status: newStatus })).unwrap();
      dispatch(fetchAllOrders());
      fetchInsights();
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

  // Filter orders for data table based on period
  const displayOrders = (insightsData && insightsData.orders) ? insightsData.orders : orders;

  const columns = [
    {
      header: 'Order Reference',
      accessor: (row) => row.orderNumber || (row._id || row.id || '').slice(-6).toUpperCase(),
      render: (row) => (
        <span style={{ fontWeight: '600', color: 'var(--admin-gold)', cursor: 'pointer' }} onClick={() => openDrawer(row)}>
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
          <span style={{ fontWeight: '500', color: 'var(--admin-text-primary)' }}>
            {row.user?.firstName ? `${row.user.firstName} ${row.user.lastName || ''}` : row.shippingAddress?.fullName || 'Customer'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--admin-text-secondary)' }}>
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
        <span style={{ fontWeight: '600', fontFamily: "var(--font-serif, 'Playfair Display', serif)", color: 'var(--admin-gold)' }}>
          ₹{Math.round(row.totalAmount || 0).toLocaleString('en-IN')}
        </span>
      ),
      sortable: true
    },
    {
      header: 'Fulfillment',
      accessor: 'orderStatus',
      align: 'center',
      render: (row) => <StatusBadge status={row.orderStatus || row.status || 'pending'} />
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

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <AdminLayout title="Fulfillment Center">
      <PageHeader
        title="Orders Management & Analytics"
        subtitle="Track, aggregate, and fulfill customer orders with product insights across custom date ranges"
        breadcrumbs={[{ label: 'Orders' }]}
        actions={
          <button
            onClick={() => setShowProductInsights(prev => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: showProductInsights ? 'var(--admin-gold)' : 'var(--admin-card-bg)',
              color: showProductInsights ? '#1A1412' : 'var(--admin-gold)',
              border: '1px solid var(--admin-border-gold)',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <BarChart2 size={16} />
            {showProductInsights ? 'View All Orders List' : 'Product Order Insights'}
          </button>
        }
      />

      {error && (
        <div style={styles.errorNotice}>
          <span>{error}</span>
        </div>
      )}

      {/* Filter Navigation Bar */}
      <div style={styles.filterBarCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={styles.filterBarLabel}>Period:</span>
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'month', label: 'This Month' },
            { id: 'year', label: 'Year View' }
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              style={styles.filterPill(period === p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period === 'month' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              style={styles.selectInput}
            >
              {monthNames.map((m, idx) => (
                <option key={idx} value={idx}>{m} {selectedYear}</option>
              ))}
            </select>
          </div>
        )}

        {period === 'year' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              style={styles.selectInput}
            >
              <option value={2026}>2026 Fiscal Cycle</option>
              <option value={2025}>2025 Fiscal Cycle</option>
            </select>
          </div>
        )}
      </div>

      {/* VIEW 1: Product Order Insights View */}
      {showProductInsights ? (
        <div style={styles.cardSection}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Product-Level Order Insights ({period.toUpperCase()})</h3>
            <p style={styles.sectionSub}>Breakdown of distinct order counts and total units sold per product SKU</p>
          </div>

          {insightsLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-gold)' }}>Loading product insights...</div>
          ) : !insightsData?.productInsights || insightsData.productInsights.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>No product orders recorded for this period.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Product Name</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Distinct Orders Count</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Total Units Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {insightsData.productInsights.map((p, idx) => (
                    <tr key={p.id || idx} style={styles.tr}>
                      <td style={styles.tdName}>{p.name}</td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={styles.badgeGold}>{p.ordersCount} order(s)</span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right', fontWeight: '700', color: 'var(--admin-gold)' }}>
                        {p.unitsSold} unit(s)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : period === 'year' ? (
        /* VIEW 2: Year View Monthly Aggregation Table */
        <div style={styles.cardSection}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>{selectedYear} Monthly Aggregation Breakdown</h3>
            <p style={styles.sectionSub}>Monthly performance summary (Jan – Dec). Click any month to drill into order details.</p>
          </div>

          {insightsLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-gold)' }}>Loading monthly aggregation...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Month</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Total Orders</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Revenue (₹)</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Units Sold</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Cancelled</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(insightsData?.monthlyAggregation || []).map((m) => (
                    <tr key={m.monthIndex} style={styles.tr}>
                      <td style={styles.tdName}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={15} color="var(--admin-gold)" />
                          <span>{m.month} {selectedYear}</span>
                        </div>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>{m.orders}</td>
                      <td style={{ ...styles.td, textAlign: 'right', fontWeight: '600', color: 'var(--admin-gold)' }}>
                        ₹{m.revenue.toLocaleString('en-IN')}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>{m.unitsSold}</td>
                      <td style={{ ...styles.td, textAlign: 'center', color: m.cancelled > 0 ? 'var(--admin-danger)' : 'var(--admin-text-secondary)' }}>
                        {m.cancelled}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setSelectedMonth(m.monthIndex);
                            setPeriod('month');
                          }}
                          style={styles.drillBtn}
                        >
                          View Month Orders <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* VIEW 3: Standard Orders Data Table for Filtered Period */
        <DataTable
          columns={columns}
          data={displayOrders}
          loading={loading || insightsLoading}
          searchPlaceholder="Search by order reference, customer name, email..."
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
          emptyDescription={`No orders found for the selected period (${period.toUpperCase()}).`}
        />
      )}

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
              <button style={styles.drawerClose} onClick={() => setDrawerOpen(false)}>×</button>
            </div>

            <div style={styles.drawerBody}>
              {/* Customer info */}
              <div style={styles.infoSection}>
                <h4 style={styles.sectionHeading}>Client Information</h4>
                <div style={styles.infoRow}>
                  <span>Name:</span>
                  <strong>{selectedOrder.user?.firstName ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName || ''}` : selectedOrder.shippingAddress?.fullName || 'Customer'}</strong>
                </div>
                <div style={styles.infoRow}>
                  <span>Email:</span>
                  <span>{selectedOrder.user?.email || selectedOrder.shippingAddress?.email || 'N/A'}</span>
                </div>
                <div style={styles.infoRow}>
                  <span>Phone:</span>
                  <span>{selectedOrder.shippingAddress?.phone || 'N/A'}</span>
                </div>
              </div>

              {/* Shipping address */}
              <div style={styles.infoSection}>
                <h4 style={styles.sectionHeading}>Delivery Address (Snapshot)</h4>
                <p style={styles.addressText}>
                  {selectedOrder.shippingAddress && (selectedOrder.shippingAddress.address || selectedOrder.shippingAddress.line1) ? (
                    <>
                      {selectedOrder.shippingAddress.address || selectedOrder.shippingAddress.line1}<br />
                      {selectedOrder.shippingAddress.city ? `${selectedOrder.shippingAddress.city}, ` : ''}
                      {selectedOrder.shippingAddress.state || ''} {selectedOrder.shippingAddress.postalCode ? `- ${selectedOrder.shippingAddress.postalCode}` : ''}
                    </>
                  ) : (
                    <span style={{ color: 'var(--admin-text-secondary)', fontStyle: 'italic' }}>Shipping address unavailable</span>
                  )}
                </p>
              </div>

              {/* Financial summary */}
              <div style={styles.infoSection}>
                <h4 style={styles.sectionHeading}>Financial Breakdown</h4>
                <div style={styles.infoRow}><span>Subtotal:</span><span>₹{Math.round(selectedOrder.subtotal || selectedOrder.totalAmount || 0).toLocaleString('en-IN')}</span></div>
                {selectedOrder.discount > 0 && <div style={styles.infoRow}><span>Discount:</span><span style={{ color: '#4CAF50' }}>-₹{Math.round(selectedOrder.discount).toLocaleString('en-IN')}</span></div>}
                <div style={styles.infoRow}><span>Tax (10%):</span><span>₹{Math.round(selectedOrder.tax || 0).toLocaleString('en-IN')}</span></div>
                <div style={styles.infoRowTotal}><span>Final Amount:</span><strong>₹{Math.round(selectedOrder.finalAmount || selectedOrder.totalAmount || 0).toLocaleString('en-IN')}</strong></div>
                {selectedOrder.paymentMethod && (
                  <div style={{ ...styles.infoRow, marginTop: '8px' }}>
                    <span>Payment Method:</span>
                    <span style={{ textTransform: 'capitalize' }}>{(selectedOrder.paymentMethod || '').replace(/_/g, ' ')}</span>
                  </div>
                )}
                {selectedOrder.transactionId && (
                  <div style={styles.infoRow}>
                    <span>Transaction Ref:</span>
                    <span style={{ fontFamily: 'monospace' }}>{selectedOrder.transactionId}</span>
                  </div>
                )}
              </div>

              {/* Order items */}
              <div style={styles.infoSection}>
                <h4 style={styles.sectionHeading}>Order Items ({selectedOrder.items?.length || 0})</h4>
                <div style={styles.itemsList}>
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div key={idx} style={styles.itemRow}>
                      <span style={{ fontWeight: '600' }}>{item.name || 'Luxury Product'} × {item.quantity || 1}</span>
                      <span style={{ color: 'var(--admin-gold)' }}>₹{Math.round((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
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
    padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid #EF4444', borderRadius: '8px', color: '#EF4444',
    fontSize: '13px', marginBottom: '16px'
  },
  filterBarCard: {
    padding: '14px 20px', backgroundColor: 'var(--admin-card-bg)',
    border: '1px solid var(--admin-border-gold)', borderRadius: '12px',
    marginBottom: '20px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
  },
  filterBarLabel: { fontSize: '12px', fontWeight: '700', color: 'var(--admin-gold)', textTransform: 'uppercase' },
  filterPill: (active) => ({
    padding: '6px 14px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '600',
    border: '1px solid var(--admin-border-gold)',
    backgroundColor: active ? 'var(--admin-gold)' : 'transparent',
    color: active ? '#1A1412' : 'var(--admin-gold)',
    cursor: 'pointer', transition: 'all 0.2s ease'
  }),
  selectInput: {
    padding: '6px 12px', borderRadius: '8px', backgroundColor: 'var(--admin-bg-dark)',
    border: '1px solid var(--admin-border-gold)', color: 'var(--admin-gold)',
    fontSize: '12px', fontWeight: '600', outline: 'none'
  },
  metricsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px', marginBottom: '24px'
  },
  cardSection: {
    backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-border-gold)',
    borderRadius: '14px', padding: '24px', marginBottom: '24px'
  },
  sectionHeader: { marginBottom: '18px' },
  sectionTitle: { fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '18px', fontWeight: '700', color: 'var(--admin-text-primary)', margin: 0 },
  sectionSub: { fontSize: '12px', color: 'var(--admin-text-secondary)', margin: '4px 0 0 0' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--admin-gold)', textTransform: 'uppercase', borderBottom: '1px solid var(--admin-border-gold)' },
  tr: { borderBottom: '1px solid var(--admin-border-subtle)' },
  td: { padding: '12px 16px', fontSize: '13px', color: 'var(--admin-text-primary)' },
  tdName: { padding: '12px 16px', fontSize: '13.5px', fontWeight: '600', color: 'var(--admin-text-primary)' },
  badgeGold: { padding: '4px 10px', backgroundColor: 'var(--admin-gold-muted)', border: '1px solid var(--admin-border-gold)', borderRadius: '12px', color: 'var(--admin-gold)', fontSize: '11px', fontWeight: '700' },
  drillBtn: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 12px', backgroundColor: 'transparent', border: '1px solid var(--admin-border-gold)', borderRadius: '6px', color: 'var(--admin-gold)', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer' },
  drawerOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 9999, display: 'flex', justifyContent: 'flex-end' },
  drawerContent: { width: '420px', maxWidth: '90vw', height: '100%', backgroundColor: 'var(--admin-card-bg)', borderLeft: '1px solid var(--admin-border-gold)', display: 'flex', flexDirection: 'column' },
  drawerHeader: { padding: '20px', borderBottom: '1px solid var(--admin-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  drawerMeta: { fontSize: '10px', fontWeight: '700', color: 'var(--admin-gold)', textTransform: 'uppercase' },
  drawerTitle: { fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '20px', fontWeight: '700', color: 'var(--admin-text-primary)', margin: '4px 0 0 0' },
  drawerClose: { background: 'none', border: 'none', color: 'var(--admin-text-muted)', fontSize: '24px', cursor: 'pointer' },
  drawerBody: { padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' },
  infoSection: { backgroundColor: 'var(--admin-bg-dark)', padding: '16px', borderRadius: '10px', border: '1px solid var(--admin-border-subtle)' },
  sectionHeading: { fontSize: '12px', fontWeight: '700', color: 'var(--admin-gold)', textTransform: 'uppercase', margin: '0 0 10px 0' },
  infoRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--admin-text-secondary)', marginBottom: '6px' },
  infoRowTotal: { display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: 'var(--admin-text-primary)', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--admin-border-subtle)' },
  addressText: { fontSize: '13px', color: 'var(--admin-text-primary)', margin: 0, lineHeight: '1.5' },
  itemsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  itemRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '1px dashed var(--admin-border-subtle)' }
};

export default OrdersManagement;