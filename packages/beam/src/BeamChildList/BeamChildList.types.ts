import type { ComponentType, ReactNode } from 'react';
import type { BeamIdentityLinkProps } from '../BeamDataTable/BeamDataTable.types';

/**
 * BeamChildList — the child-list SUMMARY organism (drill-down flows, detail-page-grammar). A
 * view-only summary of a parent's CHILD records: an identity-link column (the drill affordance) +
 * a few vital-sign columns, rendered as a light table in a card. NO CRUD affordances — children are
 * edited on their own pages (the child-sections ruling); this is the summary + the way in.
 *
 * Deliberately NOT BeamDataTable: no pagination, filters, kebab, or bulk — those machinery would
 * fight the view-only summary intent. First consumer: the Token Campaign detail's Wall Stages; it
 * recurs across Gaspar / Prize Wall siblings (a scheduled recurrence, hence a real organism now).
 */
export interface BeamChildColumn<Row> {
  key: string;
  header: string;
  /** Cell renderer — Beam owns the markup (pass a BeamBool, a formatted string, etc.). */
  render: (row: Row) => ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
}

export interface BeamChildListProps<Row> {
  'aria-label': string;
  /** Optional card title (the section name, e.g. "Wall stages"). */
  title?: string;
  rows: Row[];
  getRowId: (row: Row) => string;

  // ── Identity column = the drill affordance (first column, a link to the child's page) ──
  identityHeader: string;
  getIdentityLabel: (row: Row) => ReactNode;
  /** The child record's canonical route — the drill target. */
  getHref: (row: Row) => string;
  /** Router adapter for the identity link (same contract as BeamDataTable). Default: a real `<a>`. */
  LinkComponent?: ComponentType<BeamIdentityLinkProps>;

  /** The vital-sign columns, after the identity column. */
  columns: BeamChildColumn<Row>[];

  emptyMessage?: string;
}
