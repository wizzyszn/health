import React from "react";

const OnlineIndicator = React.memo(
  ({ height, status }: { height: number; status: boolean }) => {
    return (
      <div
        className={`text-xs w-full fixed bottom-0 text-white text-center ${status ? "bg-green-600" : "bg-red-500"} transition-all ease-in-out duration-150`}
        style={{
          height: `${height}rem`,
        }}
      >
        {status ? "You are back online" : "No internet connection."}
      </div>
    );
  },
);

export default OnlineIndicator;
