/** Mock operators for the Users admin list — shaped like the Midnight BO. */

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  effectivePermission: string;
  active: boolean;
  created: string;
}

/** Named operators seeded first; the rest fill out to a realistic 274. */
const NAMED = [
  'Vladimir Pavlov',
  'Chavdar Dimitrov',
  'Krasimir Etov',
  'Nikola Iliev',
  'Petar Stoyanov',
  'Ivan Georgiev',
  'Maria Koleva',
  'Elena Dimitrova',
  'Georgi Angelov',
  'Dimitar Kolev',
];

const FIRST = ['Aleksandar', 'Bozhidar', 'Radostina', 'Yavor', 'Tsvetan', 'Desislava', 'Kaloyan', 'Vesela', 'Boyan', 'Rumen', 'Stanimir', 'Gergana'];
const LAST = ['Petrov', 'Ivanov', 'Todorov', 'Marinov', 'Vasilev', 'Hristov', 'Draganov', 'Kirilov', 'Popov', 'Zlatev', 'Nedelchev', 'Boteva'];
const ROLES_POOL = ['Admin', 'CSR', 'Player Operations', 'team-LiveOps', 'Compliance', 'Technical & Escalations Expert'];
const PERMS = ['Full access', 'Manage users', 'Approve payouts', 'View reports', 'Manage content'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The distinct effective-permission values, for the filter select. */
export const PERMISSION_OPTIONS = PERMS;

export const USERS: User[] = Array.from({ length: 274 }, (_, i) => {
  const named = NAMED[i];
  const first = named ? named.split(' ')[0] : FIRST[i % FIRST.length];
  const last = named ? named.split(' ')[1] : LAST[(i * 13 + 3) % LAST.length];
  const name = `${first} ${last}`;
  const day = String(1 + (i % 27)).padStart(2, '0');
  const month = MONTHS[(i * 7) % 12];
  const year = 2024 + (i % 3);
  return {
    id: String(4000 + i),
    name,
    email: `${first}.${last}`.toLowerCase() + '@bettygaming.com',
    role: ROLES_POOL[(i * 3) % ROLES_POOL.length],
    effectivePermission: PERMS[(i * 5) % PERMS.length],
    active: i % 9 !== 4,
    created: `${day}-${month}-${year}`,
  };
});
