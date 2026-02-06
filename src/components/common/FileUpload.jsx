/**
 * FileUpload Component
 * Drag-and-drop file upload with validation
 */

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';
import { XIcon } from './Icons';

const FileUpload = ({
  label,
  name,
  accept = ['.pdf'], // Default to PDF-only
  acceptedTypes = null, // MIME types: ['application/pdf'] or ['image/png', 'image/jpeg']
  acceptedExtensions = null, // Extensions: ['.pdf'] or ['.png', '.jpg', '.jpeg']
  maxSize = 3 * 1024 * 1024, // 3MB default
  errorMessage = null, // Custom error message
  onUpload,
  onRemove,
  currentFile,
  error,
  required = false,
  disabled = false,
  className,
  uploadType = 'document', // 'document' (PDF) or 'image' (PNG/JPEG)
  ...props
}) => {
  const [uploadError, setUploadError] = React.useState(null);
  // UI-02: Upload progress tracking
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  // Use new props if provided, otherwise fall back to accept
  const finalExtensions = acceptedExtensions || accept;
  const finalMimeTypes = acceptedTypes;

  // Convert file to base64 for persistent storage
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }

      const reader = new FileReader();

      // UI-02: Track upload progress
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      reader.readAsDataURL(file);

      reader.onload = () => {
        if (reader.result) {
          setUploadProgress(100); // Ensure 100% on completion
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onerror = () => {
        setUploadProgress(0);
        reject(new Error('FileReader error occurred'));
      };
    });
  };

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    setUploadError(null);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      let errorMsg = errorMessage || 'File upload failed';

      if (rejection.errors[0]?.code === 'file-too-large') {
        errorMsg = `File size must be less than ${maxSize / 1024 / 1024}MB`;
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        errorMsg = errorMessage || `File type not accepted. Allowed: ${finalExtensions.join(', ')}`;
      }

      setUploadError(errorMsg);
      console.error('File rejected:', errorMsg);
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];

      try {
        // UI-02: Show upload progress
        setIsUploading(true);
        setUploadProgress(0);

        // Convert file to base64 for storage in localStorage
        const base64Data = await convertToBase64(file);

        onUpload({
          name: file.name,
          size: file.size,
          type: file.type,
          file: file, // Keep original file object for immediate use
          base64: base64Data, // Add base64 data for persistence
        });

        // UI-02: Small delay to show 100% completion before hiding progress
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      } catch (error) {
        console.error('Error converting file to base64:', error);
        setUploadError('Failed to process file. Please try again.');
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  }, [onUpload, maxSize, finalExtensions, errorMessage]);

  // Build accept object for dropzone
  const buildAcceptObject = () => {
    if (finalMimeTypes) {
      // Use provided MIME types
      const acceptObj = {};
      finalMimeTypes.forEach(mime => {
        acceptObj[mime] = finalExtensions;
      });
      return acceptObj;
    }

    // Fallback to extension mapping
    return finalExtensions.reduce((acc, ext) => {
      const mimeTypes = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
      };
      const mime = mimeTypes[ext];
      if (mime) acc[mime] = [ext];
      return acc;
    }, {});
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: buildAcceptObject(),
    maxSize,
    multiple: false,
    disabled,
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={clsx('form-group', className)}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}

      {/* UI-02: Upload progress indicator */}
      {isUploading && (
        <div
          style={{
            marginTop: 'var(--space-12)',
            padding: 'var(--space-12)',
            backgroundColor: 'var(--color-background)',
            borderRadius: 'var(--radius-base)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
              Uploading...
            </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--nhs-blue)' }}>
              {uploadProgress}%
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
            role="progressbar"
            aria-valuenow={uploadProgress}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="File upload progress"
          >
            <div
              style={{
                width: `${uploadProgress}%`,
                height: '100%',
                backgroundColor: 'var(--nhs-blue)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {!currentFile ? (
        <div
          {...getRootProps()}
          className={clsx(
            'upload-area',
            isDragActive && 'drag-over',
            disabled && 'disabled',
            error && 'error'
          )}
        >
          <input {...getInputProps()} name={name} {...props} />
          <div className="upload-icon">
            {uploadType === 'image' ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#005EB8" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 5,21" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#005EB8" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
            )}
          </div>
          <p>
            {isDragActive
              ? 'Drop file here'
              : 'Click to upload or drag and drop'}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
            Accepted: {finalExtensions.join(', ')} (Max {maxSize / 1024 / 1024}MB)
          </p>
        </div>
      ) : (
        <div className="uploaded-file">
          {/* UI-02: Show image thumbnail for image uploads */}
          {uploadType === 'image' && (currentFile.base64 || currentFile.file) ? (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '6px',
                overflow: 'hidden',
                flexShrink: 0,
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--color-border)',
              }}
            >
              <img
                src={currentFile.base64 || (currentFile.file ? URL.createObjectURL(currentFile.file) : '')}
                alt={`Preview of ${currentFile.name}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  // Fallback to icon if image fails to load
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span style="font-size: 24px;">🖼️</span>';
                }}
              />
            </div>
          ) : (
            <span className="file-icon">
              {uploadType === 'image' ? '🖼️' : '[PDF]'}
            </span>
          )}
          <div className="file-info">
            <div className="file-name">{currentFile.name}</div>
            <div className="file-size">{formatFileSize(currentFile.size)}</div>
          </div>
          {!disabled && (
            <button
              type="button"
              className="file-remove"
              onClick={onRemove}
              aria-label="Remove file"
            >
              <XIcon size={14} color="currentColor" />
            </button>
          )}
        </div>
      )}

      {(error || uploadError) && (
        <span id={`${name}-error`} className="error-message" role="alert">
          {error || uploadError}
        </span>
      )}
    </div>
  );
};

export default FileUpload;
