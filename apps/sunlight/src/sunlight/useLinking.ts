import { useCallback, useMemo, useState } from 'react';
import { ROLE_BY_ID } from './userDetail';

/**
 * Bidirectional role ↔ permission linking (detail-page §5), the NextGemPanel
 * pattern scaled up. Shared page-level state; hover OR keyboard focus sets the
 * active element, and everything not related to it dims.
 *
 * Dim is computed in React (a handful of roles, ~20 rows — cheap) and applied
 * as opacity; the elements also carry data-role-id / data-permission-id for
 * identification. No exotic CSS.
 */

export type LinkActive = { kind: 'role'; id: string } | { kind: 'permission'; id: string } | null;

export interface Linking {
  active: LinkActive;
  /** Handlers for a role element — hover and focus both link. */
  roleProps: (roleId: string) => LinkElementProps;
  /** Handlers for a permission row — provenance = the roles granting it. */
  permissionProps: (permId: string, grantedBy: string[]) => LinkElementProps;
  /** True when something is active and this role is not part of it. */
  roleDimmed: (roleId: string) => boolean;
  /** True when something is active and this permission is not part of it. */
  permissionDimmed: (permId: string, grantedBy: string[]) => boolean;
}

interface LinkElementProps {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

export function useLinking(): Linking {
  const [active, setActive] = useState<LinkActive>(null);

  const clear = useCallback(() => setActive(null), []);

  const roleProps = useCallback(
    (roleId: string): LinkElementProps => ({
      onMouseEnter: () => setActive({ kind: 'role', id: roleId }),
      onMouseLeave: clear,
      onFocus: () => setActive({ kind: 'role', id: roleId }),
      onBlur: clear,
    }),
    [clear]
  );

  const permissionProps = useCallback(
    (permId: string): LinkElementProps => ({
      onMouseEnter: () => setActive({ kind: 'permission', id: permId }),
      onMouseLeave: clear,
      onFocus: () => setActive({ kind: 'permission', id: permId }),
      onBlur: clear,
    }),
    [clear]
  );

  const roleDimmed = useCallback(
    (roleId: string): boolean => {
      if (!active) return false;
      if (active.kind === 'role') return active.id !== roleId;
      // A permission is active: highlight the roles that grant it.
      const role = ROLE_BY_ID.get(roleId);
      return !role?.grants.includes(active.id);
    },
    [active]
  );

  const permissionDimmed = useCallback(
    (permId: string, grantedBy: string[]): boolean => {
      if (!active) return false;
      if (active.kind === 'permission') return active.id !== permId;
      // A role is active: highlight the permissions it grants.
      return !grantedBy.includes(active.id);
    },
    [active]
  );

  return useMemo(
    () => ({ active, roleProps, permissionProps, roleDimmed, permissionDimmed }),
    [active, roleProps, permissionProps, roleDimmed, permissionDimmed]
  );
}
