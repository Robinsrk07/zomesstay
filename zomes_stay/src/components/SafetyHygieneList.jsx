export default function SafetyHygieneList({ items }) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
        {items.map((a, i) => (
          <div key={i} className="flex items-center gap-3">
            <img src={a.icon} alt="" className="h-5 w-5" />
            <span className="text-gray-500">{a.title}</span>
          </div>
        ))}
      </div>
    );
  }
  