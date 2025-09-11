import React, { useState, useEffect, useRef } from "react";

const defaultImages = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80",
];

const FeatureCard = ({
  images = defaultImages,
  name = "The Grand Opulence",
  location = "Wayanad, Kerala"
}) => {
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    timeoutRef.current && clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 2500);
    return () => clearTimeout(timeoutRef.current);
  }, [current, images.length]);

  return (
    <div className="bg-white rounded-xl   flex flex-col gap-4">
      <div className="relative w-72 h-72 ">
        <img
          className="rounded-xl w-full h-[310px] object-cover"
          src={images[current]}
          alt={name}
        />
        <div className="absolute bottom-3 right-4 flex gap-2 z-10">
          {images.map((_, idx) => (
            <span
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`w-2 h-2 rounded-full cursor-pointer border border-white transition-all duration-200 ${
                current === idx ? "bg-gray-900" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="p-4 pb-3">
        <div className="font-semibold text-base mb-1">{name}</div>
        <div className="text-gray-500 text-sm">{location}</div>
      </div>
    </div>
  );
};

export default FeatureCard;
