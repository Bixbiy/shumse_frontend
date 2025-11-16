import React from 'react';
import no_data from "../imgs/no-data.png";

const NoData = ({ isSearchPage = false, pageType = 'post', }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full p-8 mt-10">
      <img
        src={no_data}
        alt="No Data"
        className="w-52 h-52 opacity-90 drop-shadow-lg"
      />

      {isSearchPage ? (
        <p className="text-gray-700 text-xl font-semibold mt-6">
          No results found. Try searching something different or try again later.
        </p>
      ) : (
        <>
          <p className="text-gray-700 text-xl font-semibold mt-6">
            {pageType === 'story' ? "😔 Oops! No story found." : "😔 Oops! No post found."}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {pageType === 'story'
              ? "Maybe check back later or try exploring different stories."
              : "Try exploring different categories or check back later."}
          </p>

        </>
      )}
    </div>
  );
};

export default NoData;
