'use client';

import React from 'react';
import classNames from 'classnames';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  withHover?: boolean;
  withBorder?: boolean;
  withShadow?: boolean;
}

const Card: React.FC<CardProps> = ({
  className,
  children,
  withHover = false,
  withBorder = true,
  withShadow = true,
}) => {
  return (
    <div
      className={classNames(
        'bg-white rounded-lg p-4',
        withBorder && 'border border-slate-200',
        withShadow && 'shadow-sm',
        withHover && 'transition-all duration-200 hover:shadow-md',
        className
      )}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

const CardHeader: React.FC<CardHeaderProps> = ({ className, children }) => {
  return (
    <div className={classNames('mb-4 pb-4 border-b border-slate-100', className)}>
      {children}
    </div>
  );
};

interface CardTitleProps {
  className?: string;
  children: React.ReactNode;
}

const CardTitle: React.FC<CardTitleProps> = ({ className, children }) => {
  return (
    <h3 className={classNames('text-lg font-semibold text-slate-900', className)}>
      {children}
    </h3>
  );
};

interface CardDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

const CardDescription: React.FC<CardDescriptionProps> = ({ className, children }) => {
  return (
    <p className={classNames('text-sm text-slate-500 mt-1', className)}>
      {children}
    </p>
  );
};

interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

const CardContent: React.FC<CardContentProps> = ({ className, children }) => {
  return <div className={className}>{children}</div>;
};

interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

const CardFooter: React.FC<CardFooterProps> = ({ className, children }) => {
  return (
    <div className={classNames('mt-4 pt-4 border-t border-slate-100', className)}>
      {children}
    </div>
  );
};

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }; 