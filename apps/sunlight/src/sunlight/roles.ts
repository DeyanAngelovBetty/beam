/** Mock roles for the Roles admin list. */

export interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  created: string;
}

export const ROLES: Role[] = [
  { id: 'r1', name: 'Admin', description: 'Full back-office access', userCount: 12, created: '03-Jan-2024' },
  { id: 'r2', name: 'CSR', description: 'Customer support representative', userCount: 88, created: '14-Feb-2024' },
  { id: 'r3', name: 'Player Operations', description: 'Manage players, loyalty, and rewards', userCount: 41, created: '22-Mar-2024' },
  { id: 'r4', name: 'team-LiveOps', description: 'Promotions and live campaign operations', userCount: 9, created: '07-May-2025' },
  { id: 'r5', name: 'Technical & Escalations Expert', description: 'Tier-3 escalations and internal tooling', userCount: 5, created: '19-Aug-2025' },
  { id: 'r6', name: 'Compliance', description: 'KYC checks and regulatory review', userCount: 17, created: '02-Nov-2025' },
];
