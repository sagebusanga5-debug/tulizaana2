import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-800/70 rounded ${className}`} />
);

export const SearchResultSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-800/60 bg-[#111827]/60">
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

export const PostCardSkeleton: React.FC = () => (
  <div className="rounded-3xl border border-slate-800/60 bg-[#182231]/60 p-4 sm:p-5 space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-32 rounded" />
        <Skeleton className="h-2 w-24 rounded" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-5/6 rounded" />
      <Skeleton className="h-3 w-4/6 rounded" />
    </div>
    <Skeleton className="h-40 w-full rounded-2xl" />
    <div className="flex items-center gap-3">
      <Skeleton className="h-8 w-16 rounded-lg" />
      <Skeleton className="h-8 w-16 rounded-lg" />
      <Skeleton className="h-8 w-16 rounded-lg" />
    </div>
  </div>
);

export const StorySkeleton: React.FC = () => (
  <div className="flex flex-col items-center gap-2">
    <Skeleton className="h-16 w-16 rounded-full" />
    <Skeleton className="h-2 w-12 rounded" />
  </div>
);

export const ProfileHeaderSkeleton: React.FC = () => (
  <div className="rounded-3xl border border-slate-800/60 bg-[#182231]/60 overflow-hidden">
    <Skeleton className="h-28 sm:h-36 w-full" />
    <div className="p-4 sm:p-6 -mt-8 sm:-mt-10 flex flex-col sm:flex-row sm:items-end gap-4">
      <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-[#182231]" />
      <div className="flex-1 space-y-2 pb-2">
        <Skeleton className="h-4 w-40 rounded" />
        <Skeleton className="h-3 w-64 rounded" />
      </div>
    </div>
  </div>
);

export const ListItemSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-800/60 bg-[#111827]/60">
    <Skeleton className="h-10 w-10 rounded-xl" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3 w-3/4 rounded" />
      <Skeleton className="h-2 w-1/2 rounded" />
    </div>
  </div>
);
