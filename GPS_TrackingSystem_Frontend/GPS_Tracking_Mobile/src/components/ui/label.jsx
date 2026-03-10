import React from 'react';

export const Label = React.forwardRef(({ 
  className = '', 
  ...props 
}, ref) => (
  <label
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    ref={ref}
    {...props}
  />
));

Label.displayName = 'Label';
