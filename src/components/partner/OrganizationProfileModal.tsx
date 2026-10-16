import React from 'react';
import { Community, Organization, OrganizationTeamMember, Language } from '../../types';
import { PartnerOrganizationProfile } from './PartnerOrganizationProfile';

interface OrganizationProfileModalProps {
  isOpen: boolean;
  organization: Organization | null;
  communities: Community[];
  language?: Language;
  onSelectLanguage?: (lang: Language) => void;
  onClose: () => void;
  onSelectCommunity?: (communityId: string) => void;
  onContactTeamMember?: (member: OrganizationTeamMember) => void;
}

export const OrganizationProfileModal: React.FC<OrganizationProfileModalProps> = ({
  isOpen,
  organization,
  communities,
  language,
  onSelectLanguage,
  onClose,
  onSelectCommunity,
  onContactTeamMember,
}) => {
  if (!isOpen || !organization) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-y-auto p-3 sm:p-6 flex justify-center">
      <div className="max-w-4xl w-full my-auto animate-in fade-in zoom-in-95 duration-200">
        <PartnerOrganizationProfile
          organization={organization}
          communities={communities}
          isPartnerAdminView={false}
          language={language}
          onSelectLanguage={onSelectLanguage}
          onClose={onClose}
          onSelectCommunity={(commId) => {
            onClose();
            if (onSelectCommunity) onSelectCommunity(commId);
          }}
          onContactTeamMember={onContactTeamMember}
        />
      </div>
    </div>
  );
};
