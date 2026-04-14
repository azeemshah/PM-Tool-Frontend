import React from 'react';
import { ISSUE_TYPES_CONFIG } from './constants';
import { IssueType } from '@/api/issue/types';
import { cn } from '@/lib/utils';

interface IssueTypeIconProps {
  type: IssueType | string;
  className?: string;
  size?: number;
}

export const IssueTypeIcon: React.FC<IssueTypeIconProps> = ({ type, className, size = 16 }) => {
  const normalizedType = String(type).toLowerCase() as IssueType;
  const config = ISSUE_TYPES_CONFIG[normalizedType];

  if (!config) {
    return null;
  }

  const Icon = config.icon;

  return (
    <div className={cn("flex items-center justify-center rounded-md p-1", config.className, className)}>
      <Icon style={{ width: size, height: size }} />
    </div>
  );
};
