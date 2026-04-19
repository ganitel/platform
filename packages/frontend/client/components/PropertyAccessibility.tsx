export function PropertyAccessibility() {
  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-4">
      <h2 className="text-ganitel-text-title text-lg font-bold leading-[18px]">
        For your accessibility and convenience
      </h2>
      
      <div className="flex flex-col gap-4">
        {/* Airport */}
        <div className="flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="5.3335" y="2.66663" width="5.33333" height="6" rx="2.66667" stroke="#74706D" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7.99984 1.33337V2.66671" stroke="#74706D" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7.5 4.99996H8.5" stroke="#74706D" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14.6665 5.99996H10.6665" stroke="#74706D" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1.3335 5.99996H5.3335" stroke="#74706D" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.6668 7V6" stroke="#74706D" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.33333 7V6" stroke="#74706D" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.6667 14L12 9.33337" stroke="#74706D" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.3335 14L4.00016 9.33337" stroke="#74706D" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7.1665 11.6666L8.83317 13.3333" stroke="#74706D" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.83317 11.6666L7.1665 13.3333" stroke="#74706D" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-ganitel-text-label text-base font-normal leading-4 tracking-[-0.32px]">
            About <span className="font-medium">10 minutes</span> drive to the airport
          </span>
        </div>

        {/* Mainroad */}
        <div className="flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8.94971 1.33337C10.3304 1.33337 11.4497 2.45271 11.4497 3.83337" stroke="#74706D" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2.66683 8.67334L1.3335 8.66667" stroke="#74706D" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9.3335 8.67334L10.6668 8.66667" stroke="#74706D" strokeLinecap="round" strokeLinejoin="round"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M7.33366 14.6667H4.66699C3.56233 14.6667 2.66699 13.7714 2.66699 12.6667V4.66671C2.66699 3.93004 3.26366 3.33337 4.00033 3.33337H8.00033C8.73699 3.33337 9.33366 3.93004 9.33366 4.66671V12.6667C9.33366 13.7714 8.43833 14.6667 7.33366 14.6667Z" stroke="#74706D" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-ganitel-text-label text-base font-normal leading-4 tracking-[-0.32px]">
            About <span className="font-medium">10 minutes</span> drive to the mainroad
          </span>
        </div>

        {/* Gym */}
        <div className="flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4.6665 3.33333H11.3332" stroke="#74706D" strokeLinecap="round" strokeLinejoin="round"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M13.3335 14.6667H12.0002C11.6335 14.6667 11.3335 14.3667 11.3335 14.0001V11.3334C11.3335 10.9667 11.6335 10.6667 12.0002 10.6667H13.3335C13.7002 10.6667 14.0002 10.9667 14.0002 11.3334V14.0001C14.0002 14.3667 13.7002 14.6667 13.3335 14.6667Z" stroke="#74706D" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4.6665 12.6667H11.3332" stroke="#74706D" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.1998 10L9.1998 8H6.7998L7.7998 6" stroke="#74706D" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-ganitel-text-label text-base font-normal leading-4 tracking-[-0.32px]">
            About <span className="font-medium">10 minutes</span> drive to the gym
          </span>
        </div>
      </div>
    </div>
  );
}
