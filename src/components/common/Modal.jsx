/**
 * Modal Component
 * Accessible modal dialog
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'medium', // 'small' | 'medium' | 'large' | 'fullscreen'
  closeOnBackdrop = true,
  closeOnEscape = true,
  className,
  headerStyle = 'default', // 'default' | 'nhs-blue'
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="modal-backdrop"
      onClick={closeOnBackdrop ? onClose : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 'var(--z-modal-backdrop)',
        padding: 'var(--space-16)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        className={clsx('modal-content', className)}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: size === 'fullscreen' ? '0' : 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          maxWidth: size === 'small' ? '400px' : size === 'large' ? '900px' : size === 'fullscreen' ? '100vw' : '600px',
          width: '100%',
          maxHeight: size === 'fullscreen' ? '100vh' : '90vh',
          height: size === 'fullscreen' ? '100vh' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalSlideIn 0.3s ease',
        }}
      >
        <div
          className="modal-header"
          style={{
            padding: 'var(--space-24)',
            borderBottom: '2px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: headerStyle === 'nhs-blue' ? 'var(--nhs-blue)' : 'transparent',
            color: headerStyle === 'nhs-blue' ? 'white' : 'inherit',
          }}
        >
          <h3 id="modal-title" style={{ margin: 0, color: headerStyle === 'nhs-blue' ? 'white' : 'var(--nhs-blue)' }}>{title}</h3>
          <button
            onClick={onClose}
            className="modal-close"
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: headerStyle === 'nhs-blue' ? 'white' : 'var(--color-text-secondary)',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity var(--transition-base)',
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.7'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            ×
          </button>
        </div>

        <div
          className="modal-body"
          style={{
            padding: 'var(--space-24)',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {children}
        </div>

        {footer && (
          <div
            className="modal-footer"
            style={{
              padding: 'var(--space-24)',
              borderTop: '2px solid var(--color-border)',
              display: 'flex',
              gap: 'var(--space-12)',
              justifyContent: 'flex-end',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
