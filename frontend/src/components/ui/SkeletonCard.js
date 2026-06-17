import React from 'react';

export const SkeletonLine = ({ width = 'w-full', height = 'h-4' }) => (
  <div className={`skeleton rounded-lg ${width} ${height}`} />
);

export const SkeletonCard = ({ lines = 3 }) => (
  <div className="glass-card p-6 space-y-3">
    <SkeletonLine width="w-1/3" height="h-5" />
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonLine key={i} width={i === lines - 1 ? 'w-2/3' : 'w-full'} />
    ))}
  </div>
);

export const SkeletonHospitalCard = () => (
  <div className="glass-card p-6">
    <div className="flex items-start gap-4">
      <div className="skeleton w-14 h-14 rounded-2xl flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <SkeletonLine width="w-1/2" height="h-5" />
        <SkeletonLine width="w-1/3" height="h-3" />
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="glass-card p-12 text-center">
    {Icon && (
      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-slate-500" />
      </div>
    )}
    <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
    <p className="text-slate-400 text-sm mb-6">{description}</p>
    {action}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="glass-card p-8 text-center border-red-500/20">
    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
      <span className="text-red-400 text-xl">⚠</span>
    </div>
    <p className="text-red-400 text-sm mb-4">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-secondary py-2 px-4 text-sm">
        Try Again
      </button>
    )}
  </div>
);
