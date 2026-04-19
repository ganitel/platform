export function Neighborhood() {
  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col items-center gap-4">
      <h2 className="text-ganitel-text-title text-lg font-bold leading-[18px]">
        Check out the neighbourhood
      </h2>
      
      {/* Map Placeholder */}
      <div className="w-[275px] h-[281px] bg-ganitel-neutral-3 rounded flex items-center justify-center">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/a27e16d9340ec64b3df7972309d66d37b25d2725?width=550"
          alt="Map of Yaounde"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
