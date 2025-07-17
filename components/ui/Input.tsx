
import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, containerClassName = '', ...props }, ref) => {
    return (
      <div className={containerClassName}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
