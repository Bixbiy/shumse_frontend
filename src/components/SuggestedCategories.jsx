import React from "react";

const categories = ["Technology", "Health", "Business", "Lifestyle", "Travel"];

const SuggestedCategories = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Suggested Categories</h2>
      <div className="flex flex-wrap gap-3">
        {categories.map((category, index) => (
          <span key={index} className="px-4 py-2 bg-gray-200 text-sm rounded-full">
            {category}
          </span>``
        ))}
      </div>
    </div>
  );
};

export default SuggestedCategories;
