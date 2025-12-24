import React from "react";

type Props = {};

const Loader = (props: Props) => {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <span className="loader four-dots"></span>
    </div>
  );
};

export default Loader;
