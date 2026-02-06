/**
 * Loading Skeleton Component
 * UX-01: Provides visual feedback during data loading
 * Reduces perceived wait time on slower NHS network connections
 */

import './LoadingSkeleton.css';

const LoadingSkeleton = ({
  variant = 'text',
  width = '100%',
  height,
  count = 1,
  style = {}
}) => {
  const skeletons = Array.from({ length: count }, (_, index) => {
    let className = 'skeleton';
    let defaultHeight = '1em';

    switch (variant) {
      case 'text':
        className = 'skeleton skeleton-text';
        defaultHeight = '1em';
        break;
      case 'title':
        className = 'skeleton skeleton-title';
        defaultHeight = '2em';
        break;
      case 'rect':
      case 'rectangular':
        className = 'skeleton skeleton-rect';
        defaultHeight = '200px';
        break;
      case 'circle':
      case 'circular':
        className = 'skeleton skeleton-circle';
        defaultHeight = width; // Make it square
        break;
      case 'button':
        className = 'skeleton skeleton-button';
        defaultHeight = '40px';
        break;
      default:
        className = 'skeleton';
        defaultHeight = '1em';
    }

    return (
      <div
        key={index}
        className={className}
        style={{
          width,
          height: height || defaultHeight,
          ...style,
        }}
      />
    );
  });

  return <>{skeletons}</>;
};

/**
 * Form Skeleton - Pre-built skeleton for form sections
 */
export const FormSkeleton = () => (
  <div className="form-skeleton">
    <LoadingSkeleton variant="title" width="60%" style={{ marginBottom: '1em' }} />
    <LoadingSkeleton variant="text" count={2} style={{ marginBottom: '0.5em' }} />
    <LoadingSkeleton variant="rect" height="120px" style={{ marginTop: '1.5em', marginBottom: '1em' }} />
    <LoadingSkeleton variant="button" width="150px" />
  </div>
);

/**
 * Table Skeleton - Pre-built skeleton for tables/lists
 */
export const TableSkeleton = ({ rows = 5 }) => (
  <div className="table-skeleton">
    <LoadingSkeleton variant="rect" height="40px" style={{ marginBottom: '0.5em' }} />
    {Array.from({ length: rows }).map((_, index) => (
      <LoadingSkeleton
        key={index}
        variant="rect"
        height="60px"
        style={{ marginBottom: '0.5em' }}
      />
    ))}
  </div>
);

/**
 * Card Skeleton - Pre-built skeleton for card layouts
 */
export const CardSkeleton = () => (
  <div className="card-skeleton" style={{ padding: '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1em' }}>
      <LoadingSkeleton variant="circle" width="50px" style={{ marginRight: '1em' }} />
      <div style={{ flex: 1 }}>
        <LoadingSkeleton variant="title" width="70%" style={{ marginBottom: '0.5em' }} />
        <LoadingSkeleton variant="text" width="50%" />
      </div>
    </div>
    <LoadingSkeleton variant="text" count={3} style={{ marginBottom: '0.5em' }} />
    <LoadingSkeleton variant="button" width="120px" style={{ marginTop: '1em' }} />
  </div>
);

export default LoadingSkeleton;
