import React from "react";
import FeatureCard from "./FeatureCard";

export default function FeatureCardRow() {
  return (
    <div className="grid grid-cols-1 px-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center sm:px-8">
      {[1, 2,3,4,5,6,7,8].map((_, idx) => (
        <div key={idx} className="w-full">
          <FeatureCard />
        </div>
      ))}
    </div>
  );
}
