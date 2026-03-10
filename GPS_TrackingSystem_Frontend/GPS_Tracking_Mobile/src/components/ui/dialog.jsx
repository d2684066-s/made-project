import React, { useState } from 'react';

export const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border border-border bg-card p-6 shadow-lg rounded-lg">
        {children}
      </div>
    </>
  );
};

export const DialogContent = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export const DialogHeader = ({ children }) => (
  <div className="flex flex-col space-y-1.5">{children}</div>
);

export const DialogTitle = ({ children, className = '' }) => (
  <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h2>
);

export const DialogDescription = ({ children }) => (
  <p className="text-sm text-muted-foreground">{children}</p>
);
