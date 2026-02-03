/**
 * QuestionLabel Component
 * Displays question numbers in format 1.1, 1.2, 2.1, etc.
 */

import React from 'react';
import Tooltip from './Tooltip';

const QuestionLabel = ({ section, question, children, tooltip }) => {
  return (
    <span className="question-label">
      <span className="question-number">
        {section}.{question}
      </span>
      {' '}
      {children}
      {tooltip && <Tooltip content={tooltip} />}
    </span>
  );
};

export default QuestionLabel;
