import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
