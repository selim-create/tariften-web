interface Props {
  className?: string;
}

export default function RejimdeIcon({ className = "w-6 h-6" }: Props) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Rejimde logosu - sağlık/diyet temalı */}
      <path 
        d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" 
        stroke="currentColor" 
        strokeWidth="2"
      />
      <path 
        d="M12 8V12L15 15" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M12 6V7" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
    </svg>
  );
}
