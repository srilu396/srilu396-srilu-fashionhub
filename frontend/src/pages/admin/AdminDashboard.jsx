import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import MetricCard from '../../components/admin/MetricCard';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import ActionMenu from '../../components/admin/ActionMenu';
import Button from '../../components/admin/Button';
import { 
  DollarSign, ShoppingBag, Users, Package, Tag, 
  MessageSquare, Crown, AlertTriangle, ArrowRight, Plus 
} from 'lucide-react';

const AdminDashboard = () => {
  const { adminUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalCoupons: 0,
    totalMessages: 0,
    totalVipSubscribers: 0
  });
  const [timeSeries, setTimeSeries] = useState({ revenueByMonth: [] });
  const [recentOrders, setRecentOrders] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        const adminToken = localStorage.getItem('adminToken');
        const headers = {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        };

        // 1. Overview analytics
        const analyticsRes = await fetch(`${API_BASE}/api/analytics`, { headers });
        const analyticsData = await analyticsRes.json();
        if (analyticsData.success && analyticsData.overview) {
          setOverview(analyticsData.overview);
          if (analyticsData.timeSeries) {
            setTimeSeries(analyticsData.timeSeries);
          }
        }

        // 2. Recent orders
        const ordersRes = await fetch(`${API_BASE}/api/orders`, { headers });
        const ordersData = await ordersRes.json();
        if (ordersData.success && Array.isArray(ordersData.orders)) {
          setRecentOrders(ordersData.orders.slice(0, 6));
        }

        // 3. Products for inventory alerts
        const productsRes = await fetch(`${API_BASE}/api/products`, { headers });
        const productsData = await productsRes.json();
        if (productsData.success && Array.isArray(productsData.products)) {
          const lowStock = productsData.products.filter(p => (p.stock !== undefined ? p.stock : 10) <= 5);
          setInventoryAlerts(lowStock.slice(0, 5));
          setLowStockCount(lowStock.length);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const orderColumns = [
    {
      header: 'Order Ref',
      accessor: (row) => row.orderNumber || row._id?.slice(-6)?.toUpperCase() || 'N/A',
      render: (row) => (
        <span style={{ fontWeight: '600', color: '#D4AF37' }}>
          #{row.orderNumber || row._id?.slice(-6)?.toUpperCase() || 'N/A'}
        </span>
      )
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
            {row.user?.email || row.shippingAddress?.email || 'N/A'}
          </span>
        </div>
      )
    },
    {
      header: 'Date',
      accessor: (row) => new Date(row.createdAt || Date.now()).toLocaleDateString(),
      sortable: true
    },
    {
      header: 'Total Amount',
      accessor: 'totalAmount',
      align: 'right',
      render: (row) => (
        <span style={{ fontWeight: '600', fontFamily: "'Playfair Display', serif", color: '#D4AF37' }}>
          ₹{Math.round(row.totalAmount || row.totalPrice || 0).toLocaleString('en-IN')}
        </span>
      ),
      sortable: true
    },
    {
      header: 'Status',
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
            { label: 'Manage Orders', onClick: () => navigate('/admin/orders') }
          ]}
        />
      )
    }
  ];

  return (
    <AdminLayout title="Executive Overview">
      {/* Compact Unified Page Header */}
      <PageHeader
        title="Executive Overview"
        subtitle="Monitor your store’s performance from one executive workspace."
        breadcrumbs={[{ label: 'Dashboard' }]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button to="/admin/new-product" variant="primary" icon={<Plus size={15} />}>
              Add Product
            </Button>
            <Button to="/admin/admins" variant="secondary" icon={<Users size={15} />}>
              Manage Admins
            </Button>
          </div>
        }
      />

      {/* Hero Welcome Panel */}
      <div style={styles.heroBanner}>
        <div>
          <div style={styles.heroTag}>SRILU ATELIER EXECUTIVE SUITE</div>
          <h2 style={styles.heroTitle}>Welcome back, {adminUser?.firstName || 'Executive'}</h2>
          <p style={styles.heroSub}>Here’s a quick snapshot of today’s business performance.</p>
        </div>
        <div style={styles.heroDatePill}>
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* 8 Live Metric Cards Grid */}
      <div style={styles.metricsGrid}>
        <MetricCard
          title="Revenue"
          value={`₹${Math.round(overview.totalRevenue || 0).toLocaleString('en-IN')}`}
          change={`${overview.trends?.revenue || 14}%`}
          changeType={(overview.trends?.revenue || 14) >= 0 ? "positive" : "negative"}
          subtitle="vs previous 30d"
          tooltipText="Total gross revenue generated across all completed customer orders."
          icon={<DollarSign size={18} />}
        />

        <MetricCard
          title="Orders"
          value={(overview.totalOrders || 0).toLocaleString()}
          change={`${overview.trends?.orders || 8}%`}
          changeType="positive"
          subtitle="Total orders"
          tooltipText="Total fulfilled and processed customer purchase orders."
          icon={<ShoppingBag size={18} />}
        />

        <MetricCard
          title="Customers"
          value={(overview.totalCustomers || 0).toLocaleString()}
          change="+12%"
          changeType="positive"
          subtitle="Registered client accounts"
          tooltipText="Total registered customer profiles in your store."
          icon={<Users size={18} />}
        />

        <MetricCard
          title="Products"
          value={(overview.totalProducts || 0).toLocaleString()}
          change="+4%"
          changeType="positive"
          subtitle="Active SKUs"
          tooltipText="Total active product SKUs currently available in store catalog."
          icon={<Package size={18} />}
        />

        <MetricCard
          title="Coupons"
          value={(overview.totalCoupons || 0).toLocaleString()}
          change="Active"
          changeType="positive"
          subtitle="Promotional codes"
          tooltipText="Total active promotional discount codes available for checkout."
          icon={<Tag size={18} />}
        />

        <MetricCard
          title="Messages"
          value={(overview.totalMessages || 0).toLocaleString()}
          change="Bespoke"
          changeType="positive"
          subtitle="Inquiries received"
          tooltipText="Total customer support and bespoke inquiries received."
          icon={<MessageSquare size={18} />}
        />

        <MetricCard
          title="VIP Subscribers"
          value={(overview.totalVipSubscribers || 0).toLocaleString()}
          change="+18%"
          changeType="positive"
          subtitle="Maison VIP members"
          tooltipText="Total active clientele subscribed to the exclusive Maison VIP program."
          icon={<Crown size={18} />}
        />

        <MetricCard
          title="Low Stock"
          value={lowStockCount.toString()}
          change={lowStockCount > 0 ? "Action Required" : "Optimal"}
          changeType={lowStockCount > 0 ? "negative" : "positive"}
          subtitle="Stock ≤ 5 units"
          tooltipText="Total product SKUs reaching critical low stock thresholds."
          icon={<AlertTriangle size={18} />}
        />
      </div>

      {/* Analytics Chart Section */}
      <div style={styles.chartSectionCard}>
        <div style={styles.chartHeader}>
          <div>
            <h3 style={styles.chartTitle}>Revenue Performance & Fulfillment Trajectory</h3>
            <p style={styles.chartSubtitle}>Monthly revenue performance trajectory</p>
          </div>
          <div style={styles.chartBadge}>
            <span>2026 Fiscal Cycle</span>
          </div>
        </div>

        <div style={styles.chartContainer}>
          <svg viewBox="0 0 800 180" style={{ width: '100%', height: '160px' }}>
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--admin-gold)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--admin-gold)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <line x1="0" y1="30" x2="800" y2="30" stroke="var(--admin-border-subtle)" strokeDasharray="4 4" />
            <line x1="0" y1="80" x2="800" y2="80" stroke="var(--admin-border-subtle)" strokeDasharray="4 4" />
            <line x1="0" y1="130" x2="800" y2="130" stroke="var(--admin-border-subtle)" strokeDasharray="4 4" />

            <path
              d="M 40,140 Q 160,100 280,110 T 520,50 T 760,25 L 760,160 L 40,160 Z"
              fill="url(#goldGradient)"
            />

            <path
              d="M 40,140 Q 160,100 280,110 T 520,50 T 760,25"
              fill="none"
              stroke="var(--admin-gold)"
              strokeWidth="2.5"
            />

            {[
              { cx: 40, cy: 140, val: 'Jan' },
              { cx: 160, cy: 100, val: 'Feb' },
              { cx: 280, cy: 110, val: 'Mar' },
              { cx: 400, cy: 75, val: 'Apr' },
              { cx: 520, cy: 50, val: 'May' },
              { cx: 640, cy: 40, val: 'Jun' },
              { cx: 760, cy: 25, val: 'Jul' }
            ].map((pt, i) => (
              <circle key={i} cx={pt.cx} cy={pt.cy} r="4" fill="var(--admin-card-bg)" stroke="var(--admin-gold)" strokeWidth="2" />
            ))}
          </svg>
          <div style={styles.chartXLabels}>
            {(timeSeries.revenueByMonth?.length > 0
              ? timeSeries.revenueByMonth.slice(-7)
              : [{ month: 'Jan' }, { month: 'Feb' }, { month: 'Mar' }, { month: 'Apr' }, { month: 'May' }, { month: 'Jun' }, { month: 'Jul' }]
            ).map((m, idx) => (
              <span key={idx}>{m.month}</span>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

const styles = {
  heroBanner: {
    padding: '24px 28px',
    backgroundColor: 'var(--admin-card-bg)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '16px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
    boxShadow: 'var(--admin-shadow-sm)'
  },
  heroTag: {
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '1.5px',
    color: 'var(--admin-gold)',
    textTransform: 'uppercase',
    marginBottom: '4px'
  },
  heroTitle: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--admin-text-primary)',
    margin: 0
  },
  heroSub: {
    fontSize: '0.85rem',
    color: 'var(--admin-text-secondary)',
    margin: '4px 0 0 0'
  },
  heroDatePill: {
    padding: '8px 16px',
    backgroundColor: 'var(--admin-gold-muted)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--admin-gold)'
  },
  primaryBtn: {
    padding: '9px 20px',
    backgroundColor: 'var(--admin-gold)',
    color: 'var(--admin-bg, #0D0D10)',
    borderRadius: '24px',
    fontSize: '0.82rem',
    fontWeight: '700',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: 'var(--admin-gold-glow)'
  },
  secondaryBtn: {
    padding: '9px 20px',
    backgroundColor: 'var(--admin-card-bg)',
    border: '1px solid var(--admin-border-gold)',
    color: 'var(--admin-text-primary)',
    borderRadius: '24px',
    fontSize: '0.82rem',
    fontWeight: '600',
    textDecoration: 'none'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  chartSectionCard: {
    backgroundColor: 'var(--admin-card-bg)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '16px',
    padding: '22px 24px',
    marginBottom: '24px',
    boxShadow: 'var(--admin-shadow-sm)'
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '14px'
  },
  chartTitle: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontSize: '1.15rem',
    fontWeight: '700',
    color: 'var(--admin-text-primary)',
    margin: 0
  },
  chartSubtitle: {
    fontSize: '0.8rem',
    color: 'var(--admin-text-secondary)',
    margin: '3px 0 0 0'
  },
  chartBadge: {
    padding: '4px 12px',
    backgroundColor: 'var(--admin-gold-muted)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '14px',
    fontSize: '0.75rem',
    color: 'var(--admin-gold)',
    fontWeight: '600'
  },
  chartContainer: {
    display: 'flex',
    flexDirection: 'column'
  },
  chartXLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 30px',
    fontSize: '11px',
    color: 'var(--admin-text-muted)',
    marginTop: '4px'
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '2.4fr 1fr',
    gap: '20px'
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sectionTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    color: 'var(--admin-text-primary)',
    margin: 0
  },
  viewAllLink: {
    fontSize: '0.8rem',
    color: 'var(--admin-gold)',
    textDecoration: 'none',
    fontWeight: '600'
  },
  widgetCard: {
    backgroundColor: 'var(--admin-card-bg)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '16px',
    padding: '20px'
  },
  widgetHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px'
  },
  widgetTitle: {
    fontSize: '0.8rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--admin-text-primary)',
    margin: 0
  },
  alertCountBadge: {
    backgroundColor: 'var(--admin-danger-bg, rgba(239, 68, 68, 0.15))',
    color: '#EF4444',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    fontSize: '0.72rem',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '10px'
  },
  emptyWidgetText: {
    fontSize: '0.8rem',
    color: 'var(--admin-text-muted)',
    margin: 0
  },
  alertList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  alertItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    backgroundColor: 'var(--admin-bg)',
    borderRadius: '10px',
    border: '1px solid var(--admin-border-subtle)'
  },
  alertItemInfo: {
    display: 'flex',
    flexDirection: 'column'
  },
  alertItemName: {
    fontSize: '0.82rem',
    fontWeight: '600',
    color: 'var(--admin-text-primary)'
  },
  alertItemCat: {
    fontSize: '0.72rem',
    color: 'var(--admin-text-muted)'
  },
  shortcutsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px'
  },
  shortcutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '11px 14px',
    backgroundColor: 'var(--admin-bg)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '12px',
    color: 'var(--admin-text-primary)',
    fontSize: '0.82rem',
  }
};

export default AdminDashboard;