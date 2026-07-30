import type { NavigateFunction } from 'react-router-dom';
import type { BeamBackLink } from '@betty/beam';

/**
 * Builds a BeamPageHeader `back` link for a router page — one line at the call
 * site. Encodes the base-vs-path split once (same split RouterIdentityLink
 * handles): `href` carries the full Pages-based path for real-anchor semantics,
 * `onClick` navigates via the router with the plain in-app path.
 */
export function backTo(navigate: NavigateFunction, path: string, label: string): BeamBackLink {
  return {
    label,
    href: `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`,
    onClick: () => navigate(path),
  };
}
