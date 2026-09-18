import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

function Icon(props: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export const CheckIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M5 12l4.5 4.5L19 7" />
  </Icon>
);

export const DashboardIcon = (p: Props) => (
  <Icon {...p}>
    <rect x="3" y="3" width="8" height="8" rx="2" />
    <rect x="13" y="3" width="8" height="8" rx="2" />
    <rect x="3" y="13" width="8" height="8" rx="2" />
    <rect x="13" y="13" width="8" height="8" rx="2" />
  </Icon>
);

export const CalendarIcon = (p: Props) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Icon>
);

export const BookIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
    <path d="M4 19a2 2 0 0 1 2-2h13" />
  </Icon>
);

export const PeopleIcon = (p: Props) => (
  <Icon {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M2 20a7 7 0 0 1 14 0M15 15a5 5 0 0 1 7 5" />
  </Icon>
);

export const SparklesIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
    <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />
  </Icon>
);

export const ChatIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.4A8 8 0 1 1 21 12z" />
  </Icon>
);

export const SlidersIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M4 7h9M18 7h2M4 12h3M11 12h9M4 17h11M20 17h0" />
    <circle cx="15.5" cy="7" r="2" />
    <circle cx="9" cy="12" r="2" />
    <circle cx="17" cy="17" r="2" />
  </Icon>
);

export const GlobeIcon = (p: Props) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </Icon>
);

export const SearchIcon = (p: Props) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </Icon>
);

export const BellIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </Icon>
);

export const RefreshIcon = (p: Props) => (
  <Icon strokeWidth="2" {...p}>
    <path d="M20 12a8 8 0 1 1-2.3-5.7" />
    <path d="M20 4v5h-5" />
  </Icon>
);
