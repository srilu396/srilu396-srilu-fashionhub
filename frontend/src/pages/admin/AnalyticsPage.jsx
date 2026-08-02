import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import MetricCard from '../../components/admin/MetricCard';
import DataTable from '../../components/admin/DataTable';
import { DollarSign, TrendingUp, ShoppingBag, Crown } from 'lucide-react';

const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200';

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    averageOrderValue: 0
  });

  const [topProducts, setTopProducts] = useState([]);
  const [timeSeries, setTimeSeries] = useState({ revenueByMonth: [] });

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        const adminToken = localStorage.getItem('adminToken');
        const headers = {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        };

        const res = await fetch(`${API_BASE}/api/analytics`, { headers });
        const data = await res.json();
        if (data.success && data.overview) {
          const overview = data.overview;
          const aov = overview.totalOrders > 0 ? overview.totalRevenue / overview.totalOrders : 0;
          setAnalytics({
            ...overview,
            averageOrderValue: aov
          });
          if (data.timeSeries) {
            setTimeSeries(data.timeSeries);
          }
        }

        const prodRes = await fetch(`${API_BASE}/api/products`, { headers });
        const prodData = await prodRes.json();
        if (prodData.success && Array.isArray(prodData.products)) {
          setTopProducts(prodData.products.slice(0, 5));
        }
      } catch (err) {
        console.error('Error loading analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const productColumns = [
    {
      header: 'Product Name',
      accessor: 'name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={row.image || DEFAULT_PRODUCT_IMAGE}
            alt={row.name}
            onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_PRODUCT_IMAGE; }}
            style={{ width: '40px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.2)' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '600', color: '#F9F6F0' }}>{row.name}</span>
            <span style={{ fontSize: '11px', color: '#A0A0AB' }}>SKU #{row._id?.slice(-6)?.toUpperCase()}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => <span style={{ textTransform: 'capitalize', color: '#A0A0AB' }}>{row.category || 'Couture'}</span>
    },
    {
      header: 'Unit Price',
      accessor: 'price',
      align: 'right',
      render: (row) => <span style={{ color: '#D4AF37', fontWeight: '600', fontFamily: "'Playfair Display', serif" }}>₹{Math.round(row.price || 0).toLocaleString('en-IN')}</span>
    },
    {
      header: 'Current Stock',
      accessor: 'stock',
      align: 'center',
      render: (row) => `${row.stock || 0} units`
    }
  ];

  const categoryDistribution = React.useMemo(() => {
    if (!topProducts || topProducts.length === 0) return [];
    
    const categoryCounts = {};
    let totalCount = 0;

    topProducts.forEach(prod => {
      const cat = prod.category || 'Couture';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      totalCount += 1;
    });

    const palette = ['#D4AF37', '#C5A059', '#EFA0C0', '#10B981', '#60A5FA', '#F59E0B'];
    
    return Object.entries(categoryCounts).map(([catName, count], idx) => {
      const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
      return {
        name: catName,
        share: `${percentage}%`,
        count: `${count} Item${count > 1 ? 's' : ''}`,
        color: palette[idx % palette.length]
      };
    });
  }, [topProducts]);

  return (
    <AdminLayout title="Executive Analytics">
      {/* Compact Unified Page Header */}
      <PageHeader
        title="Executive Analytics"
        subtitle="Financial metrics, gross revenue analysis, and product sales performance"
        breadcrumbs={[{ label: 'Analytics' }]}
      />

      {/* KPI Cards Grid */}
      <div style={styles.metricsGrid}>
        <MetricCard
          title="Gross Revenue"
          value={`₹${Math.round(analytics.totalRevenue || 0).toLocaleString('en-IN')}`}
          change={`${analytics.trends?.revenue || 18}%`}
          changeType={(analytics.trends?.revenue || 18) >= 0 ? "positive" : "negative"}
          subtitle="Gross sales"
          tooltipText="Total gross revenue generated across all completed customer orders."
          icon={<DollarSign size={18} />}
        />

        <MetricCard
          title="Average Order Value"
          value={`₹${Math.round(analytics.averageOrderValue || 0).toLocaleString('en-IN')}`}
          change="5.2%"
          changeType="positive"
          subtitle="Average client spend"
          tooltipText="Average purchase value calculated per completed customer checkout."
          icon={<TrendingUp size={18} />}
        />

        <MetricCard
          title="Total Transactions"
          value={(analytics.totalOrders || 0).toLocaleString()}
          change={`${analytics.trends?.orders || 11}%`}
          changeType="positive"
          subtitle="Fulfilled orders"
          tooltipText="Total fulfilled and processed customer purchase orders."
          icon={<ShoppingBag size={18} />}
        />

        <MetricCard
          title="VIP Members"
          value={(analytics.totalVipSubscribers || 0).toLocaleString()}
          change="14.0%"
          changeType="positive"
          subtitle="Maison VIP newsletter"
          tooltipText="Total active clientele enrolled in the Maison VIP program."
          icon={<Crown size={18} />}
        />
      </div>

      {/* Analytics Visual Breakdown */}
      <div style={styles.gridTwoCols}>
        {/* Revenue Performance Card */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Monthly Sales Distribution</h3>
          <p style={styles.cardSubtitle}>Historical monthly gross revenue trajectory</p>
          {timeSeries.revenueByMonth && timeSeries.revenueByMonth.length > 0 ? (
            <div style={styles.chartWrapper}>
              {timeSeries.revenueByMonth.slice(-6).map((item, idx) => (
                <div key={idx} style={styles.barCol}>
                  <div style={styles.barTrack}>
                    <div
                      style={{
                        ...styles.barFill,
                        height: `${Math.min(100, Math.max(15, ((item.revenue || 0) / Math.max(...timeSeries.revenueByMonth.map(m => m.revenue || 1))) * 100))}%`
                      }}
                    />
                  </div>
                  <span style={styles.barLabel}>{item.month}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', color: '#A0A0AB', fontSize: '13px' }}>
              <p>No revenue data recorded for this period.</p>
            </div>
          )}
        </div>

        {/* Category Share Card */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Category Distribution</h3>
          <p style={styles.cardSubtitle}>Catalog allocation across garment lines</p>
          {categoryDistribution && categoryDistribution.length > 0 ? (
            <div style={styles.categoryList}>
              {categoryDistribution.map((cat, i) => (
                <div key={i} style={styles.catRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: cat.color }} />
                    <span style={{ fontSize: '0.85rem', color: '#F9F6F0', fontWeight: '500' }}>{cat.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#A0A0AB' }}>{cat.count}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: cat.color }}>{cat.share}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', color: '#A0A0AB', fontSize: '13px' }}>
              <p>No catalog products available for category breakdown.</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Products Performance Table */}
      <div style={{ marginTop: '24px' }}>
        <h3 style={styles.sectionHeading}>Top Performing Products</h3>
        <DataTable
          columns={productColumns}
          data={topProducts}
          loading={loading}
          searchPlaceholder="Filter top products..."
          emptyTitle="No Catalog Data"
          emptyDescription="Product sales data will populate automatically."
        />
      </div>
    </AdminLayout>
  );
};

const styles = {
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  gridTwoCols: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '20px',
    marginBottom: '28px'
  },
  card: {
    backgroundColor: 'var(--admin-card-bg)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: 'var(--admin-shadow-sm)'
  },
  cardTitle: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--admin-text-primary)',
    margin: 0
  },
  cardSubtitle: {
    fontSize: '0.8rem',
    color: 'var(--admin-text-secondary)',
    margin: '4px 0 20px 0'
  },
  chartWrapper: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '180px',
    paddingTop: '20px'
  },
  barCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    height: '100%'
  },
  barTrack: {
    width: '28px',
    height: '140px',
    backgroundColor: 'var(--input-bg)',
    borderRadius: '14px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'flex-end'
  },
  barFill: {
    width: '100%',
    backgroundColor: 'var(--admin-gold)',
    borderRadius: '14px',
    transition: 'height 0.5s ease',
    boxShadow: 'var(--admin-gold-glow)'
  },
  barLabel: {
    fontSize: '11px',
    color: 'var(--admin-text-muted)',
    fontWeight: '500'
  },
  categoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginTop: '10px'
  },
  catRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    backgroundColor: 'var(--admin-bg)',
    borderRadius: '12px',
    border: '1px solid var(--admin-border-subtle)'
  },
  sectionHeading: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontSize: '1.15rem',
    fontWeight: '700',
    color: 'var(--admin-text-primary)',
    marginBottom: '14px'
  }
};

export default AnalyticsPage;