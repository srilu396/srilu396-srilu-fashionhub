import React, { useState, useMemo } from 'react';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState from './EmptyState';
import SearchBar from './SearchBar';
import FilterDropdown from './FilterDropdown';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  searchPlaceholder = 'Search by name, email, or ID...',
  filterOptions = [],
  filterKey,
  filterLabel = 'All Status',
  secondaryFilterOptions = [],
  secondaryFilterKey,
  secondaryFilterLabel = 'Select Roles',
  onRowClick,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no items matching your request.',
  onEmptyAction,
  emptyActionLabel
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [selectedSecondaryFilter, setSelectedSecondaryFilter] = useState('ALL');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Pagination State (Matching Image 2)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    let result = [...data];

    // Primary Filter
    if (selectedFilter !== 'ALL' && filterKey) {
      result = result.filter(item => {
        const itemVal = item[filterKey];
        if (itemVal === undefined || itemVal === null) return false;
        const strVal = String(itemVal).toLowerCase();
        const selVal = String(selectedFilter).toLowerCase();
        if (selVal === 'true' || selVal === 'enabled') {
          return strVal === 'true' || strVal === 'enabled' || strVal === 'active';
        }
        if (selVal === 'false' || selVal === 'disabled') {
          return strVal === 'false' || strVal === 'disabled' || strVal === 'inactive';
        }
        return strVal === selVal;
      });
    }

    // Secondary Filter (e.g., Role)
    if (selectedSecondaryFilter !== 'ALL' && secondaryFilterKey) {
      result = result.filter(item => {
        const val = String(item[secondaryFilterKey] || '').toUpperCase();
        return val === String(selectedSecondaryFilter).toUpperCase();
      });
    }

    // Global Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => {
        return columns.some(col => {
          if (!col.accessor) return false;
          const val = typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor];
          return String(val || '').toLowerCase().includes(q);
        });
      });
    }

    // Sorting
    if (sortColumn) {
      result.sort((a, b) => {
        let aVal = typeof sortColumn.accessor === 'function' ? sortColumn.accessor(a) : a[sortColumn.accessor];
        let bVal = typeof sortColumn.accessor === 'function' ? sortColumn.accessor(b) : b[sortColumn.accessor];

        if (aVal === undefined || aVal === null) aVal = '';
        if (bVal === undefined || bVal === null) bVal = '';

        if (typeof aVal === 'string') {
          return sortDirection === 'asc' 
            ? aVal.localeCompare(bVal) 
            : bVal.localeCompare(aVal);
        }

        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    return result;
  }, [data, searchQuery, selectedFilter, filterKey, selectedSecondaryFilter, secondaryFilterKey, sortColumn, sortDirection, columns]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredData.length);

  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, startIndex, pageSize]);

  const handleSort = (col) => {
    if (!col.sortable) return;
    if (sortColumn?.header === col.header) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  const pageNumbers = useMemo(() => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }, [totalPages]);

  return (
    <div style={styles.container}>
      {/* Control Bar: Search & Filters */}
      <div style={styles.controlBar}>
        <SearchBar
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          placeholder={searchPlaceholder}
          width="480px"
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {secondaryFilterOptions.length > 0 && (
            <FilterDropdown
              options={secondaryFilterOptions}
              value={selectedSecondaryFilter}
              onChange={(val) => { setSelectedSecondaryFilter(val); setCurrentPage(1); }}
              placeholder={secondaryFilterLabel}
              width="180px"
            />
          )}

          {filterOptions.length > 0 && (
            <FilterDropdown
              options={filterOptions}
              value={selectedFilter}
              onChange={(val) => { setSelectedFilter(val); setCurrentPage(1); }}
              placeholder={filterLabel}
              width="180px"
            />
          )}
        </div>
      </div>

      {/* Table Container */}
      <div style={styles.tableScrollWrapper}>
        {loading ? (
          <div style={{ padding: '20px' }}>
            <LoadingSkeleton rows={6} />
          </div>
        ) : paginatedData.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
          />
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.headRow}>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    onClick={() => handleSort(col)}
                    style={{
                      ...styles.th,
                      cursor: col.sortable ? 'pointer' : 'default',
                      textAlign: col.align || 'left',
                      width: col.width || 'auto',
                      ...(col.align === 'right' ? { paddingRight: 'var(--spacing-xl, 28px)' } : {})
                    }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span style={{ color: sortColumn?.header === col.header ? 'var(--gold-champagne, #C5A059)' : 'var(--text-muted, #94A3B8)' }}>
                          {sortColumn?.header === col.header ? (
                            sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                          ) : (
                            <ArrowUpDown size={13} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, rowIdx) => (
                <tr
                  key={row.id || row._id || rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{
                    ...styles.bodyRow,
                    cursor: onRowClick ? 'pointer' : 'default'
                  }}
                  className="data-table-row"
                >
                  {columns.map((col, colIdx) => (
                    <td 
                      key={colIdx} 
                      style={{ 
                        ...styles.td, 
                        textAlign: col.align || 'left',
                        ...(col.align === 'right' ? { paddingRight: 'var(--spacing-xl, 28px)' } : {})
                      }}
                    >
                      {col.render ? col.render(row) : (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer (Matching Image 2) */}
      {!loading && filteredData.length > 0 && (
        <div style={styles.paginationFooter}>
          {/* Left Side: Rows per page & range counter */}
          <div style={styles.rowsPerPageContainer}>
            <span style={styles.metaLabel}>Rows per page:</span>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={styles.rowsSelect}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <ChevronDown size={13} style={styles.rowsSelectIcon} />
            </div>
            <span style={styles.rangeText}>
              {startIndex + 1}-{endIndex} of {filteredData.length}
            </span>
          </div>

          {/* Right Side: Page Number Pills, Previous & Next */}
          <div style={styles.pageNavContainer}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                ...styles.navBtn,
                opacity: currentPage === 1 ? 0.4 : 1,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>

            {/* Page Number Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {pageNumbers.map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    ...styles.pagePill,
                    backgroundColor: page === currentPage 
                      ? 'var(--active-pill-bg, #2563EB)' 
                      : 'transparent',
                    color: page === currentPage 
                      ? '#FFFFFF' 
                      : 'var(--text-secondary, #64748B)',
                    fontWeight: page === currentPage ? '700' : '500'
                  }}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                ...styles.navBtn,
                opacity: currentPage === totalPages ? 0.4 : 1,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: 'var(--card-bg, #141418)',
    border: '1px solid var(--border-color, rgba(212, 175, 55, 0.2))',
    borderRadius: '16px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
  },
  controlBar: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '14px',
    backgroundColor: 'var(--header-bg, rgba(255, 255, 255, 0.015))'
  },
  tableScrollWrapper: {
    overflowX: 'auto',
    width: '100%',
    maxHeight: '620px'
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    fontSize: '13px'
  },
  headRow: {
    backgroundColor: 'var(--th-bg, #0D0D10)',
    position: 'sticky',
    top: 0,
    zIndex: 10
  },
  th: {
    padding: '14px 20px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--text-muted, #94A3B8)',
    borderBottom: '1px solid var(--border-color, rgba(212, 175, 55, 0.2))',
    whiteSpace: 'nowrap',
    userSelect: 'none'
  },
  bodyRow: {
    borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.04))',
    transition: 'background-color 0.2s ease'
  },
  td: {
    padding: '16px 20px',
    color: 'var(--text-primary, #F9F6F0)',
    verticalAlign: 'middle',
    borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.04))'
  },
  paginationFooter: {
    padding: '14px 20px',
    borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
    backgroundColor: 'var(--header-bg, rgba(255, 255, 255, 0.015))'
  },
  rowsPerPageContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  metaLabel: {
    fontSize: '13px',
    color: 'var(--text-secondary, #64748B)',
    fontWeight: '500'
  },
  rowsSelect: {
    appearance: 'none',
    backgroundColor: 'var(--input-bg, rgba(255, 255, 255, 0.05))',
    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
    borderRadius: '8px',
    padding: '6px 28px 6px 12px',
    color: 'var(--text-primary, #1E293B)',
    fontSize: '13px',
    fontWeight: '600',
    outline: 'none',
    cursor: 'pointer'
  },
  rowsSelectIcon: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-secondary, #64748B)',
    pointerEvents: 'none'
  },
  rangeText: {
    fontSize: '13px',
    color: 'var(--text-secondary, #64748B)',
    fontWeight: '500'
  },
  pageNavContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  navBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary, #64748B)',
    fontSize: '13px',
    fontWeight: '600',
    padding: '6px 12px',
    transition: 'color 0.2s ease'
  },
  pagePill: {
    minWidth: '32px',
    height: '32px',
    padding: '0 8px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

export default DataTable;
