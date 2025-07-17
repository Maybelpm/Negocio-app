
import React from 'react';
import Icon from './Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 transform transition-all animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <Icon name="x" className="h-6 w-6" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
