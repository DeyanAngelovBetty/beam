import { useCallback, useMemo, useState } from 'react';

/**
 * Unidirectional role → permission linking (detail-page §5). Hover or keyboard-
 * focus a role in the rail → its granted permissions highlight, everything else
 * dims. Permissions are dimming TARGETS only, never triggers: permission → role
 * ("why does he have this") is provenance — the static answer (parked ticks),
 * not a hover.
 *
 * Dim is computed in React (a handful of roles, ~20 rows — cheap) and applied
 * as opacity; permission rows keep data-permission-id for identification.
 */

export interface Linking {
  activeRole: string | null;
  /** Handlers for a role element — hover/focus makes it the active role. */
  roleProps: (roleId: string) => LinkHandlers;
  /** True when a role is active and this role isn't it. */
  roleDimmed: (roleId: string) => boolean;
  /** True when a role is active and it does not grant this permission. */
  permissionDimmed: (grantedBy: string[]) => boolean;
}

interface LinkHandlers {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

export function useLinking(): Linking {
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const clear = useCallback(() => setActiveRole(null), []);

  const roleProps = useCallback(
    (roleId: string): LinkHandlers => ({
      onMouseEnter: () => setActiveRole(roleId),
      onMouseLeave: clear,
      onFocus: () => setActiveRole(roleId),
      onBlur: clear,
    }),
    [clear]
  );

  const roleDimmed = useCallback(
    (roleId: string): boolean => activeRole !== null && activeRole !== roleId,
    [activeRole]
  );

  const permissionDimmed = useCallback(
    (grantedBy: string[]): boolean => activeRole !== null && !grantedBy.includes(activeRole),
    [activeRole]
  );

  return useMemo(
    () => ({ activeRole, roleProps, roleDimmed, permissionDimmed }),
    [activeRole, roleProps, roleDimmed, permissionDimmed]
  );
}
