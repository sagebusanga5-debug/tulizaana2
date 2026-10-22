import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-800 rounded ${className}`} />
);

export const SearchResultSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-800 bg-[#111827]/80">
    <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4 rounded" />
      <Skeleton className="h-3 w-1/2 rounded" />
    </div>
  </div>
);

export const SearchCategorySkeleton: React.FC = () => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-4 w-24 rounded" />
    </div>
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <SearchResultSkeleton />
      <SearchResultSkeleton />
    </div>
  </div>
);
