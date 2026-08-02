import React from 'react';
import { Link } from 'react-router-dom';

const PageHeader = ({ title, subtitle, breadcrumbs = [], actions }) => {
  return (
    <div style={styles.container}>
      <div style={styles.titleSection}>
        {breadcrumbs.length > 0 && (
          <nav style={styles.breadcrumbNav} aria-label="Breadcrumb">
            <ol style={styles.breadcrumbList}>
              <li style={styles.breadcrumbItem}>
                <Link to="/admin/dashboard" style={styles.breadcrumbLink}>Admin</Link>
              </li>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <li style={styles.breadcrumbSeparator}>/</li>
                  <li style={styles.breadcrumbItem}>
                    {crumb.path ? (
                      <Link to={crumb.path} style={styles.breadcrumbLink}>{crumb.label}</Link>
                    ) : (
                      <span style={styles.breadcrumbCurrent}>{crumb.label}</span>
                    )}
                  </li>
                </React.Fragment>
              ))}
            </ol>
          </nav>
        )}

        <div style={styles.headingRow}>
          <h1 style={styles.heading}>{title}</h1>
          {subtitle && <p style={styles.subtext}>{subtitle}</p>}
        </div>
      </div>

      {actions && <div style={styles.actionGroup}>{actions}</div>}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--admin-border-gold, rgba(212, 175, 55, 0.2))',
    flexWrap: 'wrap',
    gap: '12px',
    minHeight: '48px'
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  breadcrumbNav: {
    marginBottom: '2px'
  },
  breadcrumbList: {
    display: 'flex',
    alignItems: 'center',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--admin-text-muted)',
    fontWeight: '600'
  },
  breadcrumbItem: {
    display: 'flex',
    alignItems: 'center'
  },
  breadcrumbLink: {
    color: 'var(--admin-text-muted)',
    textDecoration: 'none',
    transition: 'color 0.15s ease'
  },
  breadcrumbSeparator: {
    margin: '0 6px',
    color: 'var(--admin-border-gold)'
  },
  breadcrumbCurrent: {
    color: 'var(--admin-gold)',
    fontWeight: '600'
  },
  headingRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '14px',
    flexWrap: 'wrap'
  },
  heading: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontSize: '1.45rem',
    fontWeight: '700',
    color: 'var(--admin-text-primary)',
    margin: 0,
    letterSpacing: '-0.3px'
  },
  subtext: {
    fontSize: '0.82rem',
    color: 'var(--admin-text-secondary)',
    margin: 0,
    fontWeight: '400'
  },
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  }
};

export default PageHeader;
