import { useNavigate } from 'react-router-dom';
import { Link } from '@betty/beam';
import type { BeamIdentityLinkProps } from '@betty/beam';

/**
 * The identity link for BeamDataTable, router-aware: keeps a real `href`
 * (middle-click, new-tab, copy-address all work) but intercepts a plain
 * left-click for smooth in-app navigation. `href` is the full path incl. the
 * Pages base; the router `to` is that path minus the base.
 */
export function RouterIdentityLink({ href, onClick, children }: BeamIdentityLinkProps) {
  const navigate = useNavigate();
  const to = '/' + href.slice(import.meta.env.BASE_URL.length);

  return (
    <Link
      href={href}
      underline="hover"
      color="primary"
      sx={{ fontWeight: 500 }}
      onClick={(e) => {
        onClick?.(e); // Beam's stopPropagation (don't also trigger row-click)
        if (e.defaultPrevented) return;
        // Let the browser handle modified clicks (new tab, etc.) natively.
        if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          navigate(to);
        }
      }}
    >
      {children}
    </Link>
  );
}
