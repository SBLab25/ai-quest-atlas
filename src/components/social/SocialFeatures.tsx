import React from 'react';
import { SimpleSocial } from './SimpleSocial';

interface SocialFeaturesProps {
  targetId: string;
  targetType: 'quest' | 'submission';
}

export const SocialFeatures: React.FC<SocialFeaturesProps> = ({ targetId, targetType }) => {
  return <SimpleSocial targetId={targetId} targetType={targetType} />;
};

// Simplified Follow Button for now
interface FollowButtonProps {
  targetUserId: string;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ targetUserId }) => {
  return null; // Will be implemented when types are updated
};