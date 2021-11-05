import React from "react";

const Error = ({ errors }) => (
  <pre>
    {errors.map((error, i) => (
      <div key={i}>{error.message}</div>
    ))}
  </pre>
);

export default Error;
