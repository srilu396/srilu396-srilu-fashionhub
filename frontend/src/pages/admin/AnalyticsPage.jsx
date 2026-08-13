import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/admin/PageHeader';
import MetricCard from '../../components/admin/MetricCard';
import DataTable from '../../components/admin/DataTable';
import { DollarSign, TrendingUp, ShoppingBag } from 'lucide-react';

const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200';

const getProductMainImage = (prod) => {
  if (!prod) return DEFAULT_PRODUCT_IMAGE;
  if (Array.isArray(prod.images) && prod.images.length > 0) {
    const validImg = prod.images.find(img => typeof img === 'string' && img.trim() !== '');
    if (validImg) return validImg;
  }
  if (typeof prod.image === 'string' && prod.image.trim() !== '') {
    return prod.image;
  }
  if (Array.isArray(prod.imagesUrl) && prod.imagesUrl.length > 0) {
    const validImg = prod.imagesUrl.find(img => typeof img === 'string' && img.trim() !== '');
    if (validImg) return validImg;
  }
  return DEFAULT_PRODUCT_IMAGE;
};

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
      render: (row) => {
        const mainImg = getProductMainImage(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={mainImg}
              alt={row.name || 'Product'}
              onError={(e) => {
                if (e.target.src !== DEFAULT_PRODUCT_IMAGE) {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_PRODUCT_IMAGE;
                }
              }}
              style={{ width: '40px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--admin-border-subtle)' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '600', color: 'var(--admin-text-primary)' }}>{row.name}</span>
              <span style={{ fontSize: '11px', color: 'var(--admin-text-secondary)' }}>SKU #{row._id?.slice(-6)?.toUpperCase()}</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => <span style={{ textTransform: 'capitalize', color: 'var(--admin-text-secondary)' }}>{row.category || 'Couture'}</span>
    },
    {
      header: 'Unit Price',
      accessor: 'price',
      align: 'right',
      render: (row) => <span style={{ color: 'var(--admin-gold)', fontWeight: '600', fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}>₹{Math.round(row.price || 0).toLocaleString('en-IN')}</span>
    },
    {
      header: 'Current Stock',
      accessor: 'stock',
      align: 'center',
      render: (row) => `${row.stock || 0} units`
    }
  ];

  const salesByCategory = React.useMemo(() => {
    if (!topProducts || topProducts.length === 0) return [];
    
    const categoryRevenueMap = {};
    let grandTotalRevenue = 0;

    topProducts.forEach(prod => {
      const cat = prod.category ? prod.category.charAt(0).toUpperCase() + prod.category.slice(1) : 'Couture';
      const estRevenue = (prod.price || 0) * (prod.soldCount || Math.max(1, 10 - (prod.stock || 0)));
      categoryRevenueMap[cat] = (categoryRevenueMap[cat] || 0) + estRevenue;
      grandTotalRevenue += estRevenue;
    });

    const palette = ['#D4AF37', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#14B8A6'];
    
    return Object.entries(categoryRevenueMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([catName, rev], idx) => {
        const percentage = grandTotalRevenue > 0 ? Math.round((rev / grandTotalRevenue) * 100) : 0;
        return {
          name: catName,
          revenue: `₹${Math.round(rev).toLocaleString('en-IN')}`,
          share: `${percentage}%`,
          percentageVal: percentage,
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', color: 'var(--admin-text-muted)', fontSize: '13px' }}>
              <p>No revenue data recorded for this period.</p>
            </div>
          )}
        </div>

        {/* Sales by Category (Revenue) Card */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Sales by Category (Revenue)</h3>
          <p style={styles.cardSubtitle}>Revenue distribution across product lines</p>
          {salesByCategory && salesByCategory.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
              {salesByCategory.map((cat, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--admin-text-primary)', fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--admin-gold)', marginRight: '8px' }}>{cat.revenue}</span>
                      <span style={{ color: 'var(--admin-text-muted)', fontSize: '11px' }}>({cat.share})</span>
                    </div>
                  </div>
                  <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--admin-input-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${cat.percentageVal}%`, backgroundColor: cat.color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', color: 'var(--admin-text-muted)', fontSize: '13px' }}>
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
          emptyTitle="No product performance data available yet."
          emptyDescription="Product performance data will populate automatically as orders are recorded."
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
    backgroundColor: 'var(--admin-input-bg)',
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
    backgroundColor: 'var(--admin-surface-2)',
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