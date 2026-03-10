import React, { useState } from 'react';
import { Button } from './button';

export const Select = ({ value, onValueChange, children, ...props }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-10 px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground text-left flex items-center justify-between"
      >
        <span>{value || 'Select...'}</span>
        <span className="opacity-50">▼</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 min-w-full border border-input rounded-md bg-card shadow-md mt-1">
          {children}
        </div>
      )}
    </div>
  );
};

export const SelectTrigger = React.forwardRef((props, ref) => (
  <div ref={ref} {...props} />
));

SelectTrigger.displayName = 'SelectTrigger';

export const SelectValue = ({ placeholder }) => (
  <span>{placeholder}</span>
);

export const SelectContent = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export const SelectItem = ({ value, children, onClick, ...props }) => (
  <div
    className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
    onClick={() => {
      if (onClick) onClick({ currentTarget: { textContent: children } });
    }}
    {...props}
  >
    {children}
  </div>
);
