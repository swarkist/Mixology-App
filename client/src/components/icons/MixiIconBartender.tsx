export default function MixiIconBartender({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 24c0-4.4 5.6-8 12-8s12 3.6 12 8" />
      <path d="M14 26h36" />
      <circle cx="14" cy="36" r="4" />
      <circle cx="50" cy="36" r="4" />
      <rect x="20" y="28" width="24" height="20" rx="10" />
      <circle cx="28" cy="38" r="3" />
      <circle cx="36" cy="38" r="3" />
      <path d="M30 44h8" />
      <path d="M20 52c2-4 6-6 12-6s10 2 12 6" />
      <path d="M28 48l-6 3v-6l6 3Z" fill="currentColor" />
      <path d="M36 48l6 3v-6l-6 3Z" fill="currentColor" />
      <circle cx="32" cy="48" r="1" fill="currentColor" />
    </svg>
  );
}
