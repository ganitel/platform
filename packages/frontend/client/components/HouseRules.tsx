export function HouseRules() {
  const sections = [
    {
      title: "House Rules",
      items: ["Check-in : Flexible", "Check-out : Flexible", "Not suitable for infants"]
    },
    {
      title: "Health & Safety",
      items: ["Enhanced cleaning protocol", "Smoke alarm", "Carbon monoxide alarm"]
    },
    {
      title: "Cancellation Policy",
      items: ["Free cancellation for 48 hours", "Review the host's full policy for details."]
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-6">
      {sections.map((section, idx) => (
        <div key={idx} className="flex flex-col gap-2">
          <h2 className="text-ganitel-text-title text-base font-bold">
            {section.title}
          </h2>
          <ul className="flex flex-col gap-1.5">
            {section.items.map((item, i) => (
              <li key={i} className="text-ganitel-text-label text-sm font-medium">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
