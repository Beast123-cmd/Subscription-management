export type AuthenticatedRequest = {
  auth?: {
    userId: string;
    activeOrganizationId?: string;
  };
  organizationId?: string;
  headers: Record<string, string | string[] | undefined>;
};
