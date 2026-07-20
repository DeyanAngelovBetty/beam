import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Divider from '@mui/material/Divider';
import type { BeamTabsProps } from './BeamTabs.types';

export function BeamTabs({
  items,
  value,
  onChange,
  subValue,
  onSubChange,
  'aria-label': ariaLabel,
}: BeamTabsProps) {
  const active = items.find((item) => item.id === value);
  const subItems = active?.children ?? [];
  const showSub = subItems.length > 0 && subValue !== undefined && onSubChange;

  return (
    <Paper variant="outlined" sx={{ px: 1 }}>
      <Tabs
        value={value}
        onChange={(_, v: string) => onChange(v)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label={ariaLabel}
      >
        {items.map((item) => (
          <Tab key={item.id} value={item.id} label={item.label} icon={item.icon} iconPosition="start" />
        ))}
      </Tabs>

      {showSub && (
        <>
          <Divider />
          <Tabs
            value={subValue}
            onChange={(_, v: string) => onSubChange(v)}
            variant="scrollable"
            scrollButtons="auto"
            aria-label={`${ariaLabel} — ${active!.label} sections`}
            // Sub-level reads quieter than the level above it.
            sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, fontSize: '0.8125rem' } }}
          >
            {subItems.map((item) => (
              <Tab key={item.id} value={item.id} label={item.label} icon={item.icon} iconPosition="start" />
            ))}
          </Tabs>
        </>
      )}
    </Paper>
  );
}
