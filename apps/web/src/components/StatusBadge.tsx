import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  let dotColor = 'bg-slate-400';
  let textColor = 'text-slate-700 bg-slate-100 border-slate-200';
  let label = status.replace(/_/g, ' ');

  switch (status) {
    case 'COMPLIANT':
    case 'RESOLVED':
    case 'CLOSED':
      dotColor = 'bg-emerald-500';
      textColor = 'text-emerald-800 bg-emerald-50/80 border-emerald-200/60';
      label = status === 'COMPLIANT' ? 'All Good' : status === 'RESOLVED' ? 'Resolved' : 'Closed';
      break;

    case 'POTENTIAL_NON_COMPLIANCE':
      dotColor = 'bg-amber-500';
      textColor = 'text-amber-800 bg-amber-50/80 border-amber-200/60';
      label = 'Flagged';
      break;

    case 'MANUAL_REVIEW_RECOMMENDED':
    case 'UNDER_GOVERNMENT_REVIEW':
      dotColor = 'bg-blue-500';
      textColor = 'text-blue-800 bg-blue-50/80 border-blue-200/60';
      label = status === 'MANUAL_REVIEW_RECOMMENDED' ? 'Needs Check' : 'In Review';
      break;

    case 'VERIFIED_VIOLATION':
    case 'VERIFIED':
      dotColor = 'bg-rose-500';
      textColor = 'text-rose-800 bg-rose-50/80 border-rose-200/60 font-semibold';
      label = 'Issue Confirmed';
      break;

    case 'ESCALATED':
      dotColor = 'bg-purple-500';
      textColor = 'text-purple-800 bg-purple-50/80 border-purple-200/60';
      label = 'Escalated';
      break;

    case 'UNDER_COMPANY_REVIEW':
      dotColor = 'bg-amber-500';
      textColor = 'text-amber-800 bg-amber-50/80 border-amber-200/60';
      label = 'Needs Reply';
      break;

    case 'COMPANY_RESPONDED':
      dotColor = 'bg-indigo-500';
      textColor = 'text-indigo-800 bg-indigo-50/80 border-indigo-200/60';
      label = 'Replied';
      break;

    case 'REJECTED':
      dotColor = 'bg-slate-400';
      textColor = 'text-slate-600 bg-slate-100 border-slate-200';
      label = 'Dismissed';
      break;

    case 'SUBMITTED':
      dotColor = 'bg-sky-500';
      textColor = 'text-sky-800 bg-sky-50/80 border-sky-200/60';
      label = 'New';
      break;
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-xs sm:text-sm px-3 py-1 gap-2 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${textColor} ${sizeClasses[size]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`}></span>
      <span>{label}</span>
    </span>
  );
};
