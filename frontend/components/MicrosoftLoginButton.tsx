"use client";

interface MicrosoftLoginButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function MicrosoftLoginButton({ onClick, disabled }: MicrosoftLoginButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-[#2F2F2F] hover:bg-[#404040] text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-[#3F3F3F]"
      style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}
    >
      {/* Microsoft Logo SVG */}
      <svg
        width="21"
        height="21"
        viewBox="0 0 21 21"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 0H10V10H0V0Z" fill="#F25022" />
        <path d="M11 0H21V10H11V0Z" fill="#7FBA00" />
        <path d="M0 11H10V21H0V11Z" fill="#00A4EF" />
        <path d="M11 11H21V21H11V11Z" fill="#FFB900" />
      </svg>
      <span>Sign in with Microsoft</span>
    </button>
  );
}

