import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'start';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  icon,
  className = '',
  disabled,
  ...props 
}) => {
  const gdsClasses = {
    primary: 'govuk-button',
    secondary: 'govuk-button govuk-button--secondary',
    danger: 'govuk-button govuk-button--warning',
    start: 'govuk-button govuk-button--start',
    ghost: 'govuk-button govuk-button--secondary'
  };

  return (
    <button 
      className={`${gdsClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="govuk-!-margin-right-2">
          <svg className="animate-spin h-4 w-4 inline" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </span>
      ) : variant === 'start' ? (
        <>
          {children}
          <svg className="govuk-button__start-icon" xmlns="http://www.w3.org/2000/svg" width="17.5" height="19" viewBox="0 0 33 40" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M0 0h13l20 20-20 20H0l20-20z" />
          </svg>
        </>
      ) : icon ? (
        <span className="govuk-!-margin-right-2 inline-flex items-center align-middle" style={{ marginTop: '-2px' }}>
          {icon}
        </span>
      ) : null}
      
      {variant !== 'start' && children}
    </button>
  );
};