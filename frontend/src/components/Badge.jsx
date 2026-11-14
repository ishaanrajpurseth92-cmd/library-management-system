import React from 'react';

export default function Badge({ status, variant, children }) {
  const normalized = (status || variant || '').toString().toUpperCase();

  let className = 'badge-default';

  if (['AVAILABLE', 'ACTIVE', 'RETURNED', 'GOOD'].includes(normalized)) {
    className = 'badge-success';
  } else if (['ON LOAN', 'WARNING', 'CIRCULATING'].includes(normalized)) {
    className = 'badge-warning';
  } else if (['OVERDUE', 'SUSPENDED', 'ERROR', 'CRITICAL'].includes(normalized)) {
    className = 'badge-danger';
  } else if (['INFO', 'REFERENCE', 'SPECIAL'].includes(normalized)) {
    className = 'badge-info';
  }

  return (
    <span className={`status-badge ${className}`}>
      <span className="badge-dot" />
      {children || status}
    </span>
  );
}
