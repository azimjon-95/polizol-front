import { Input } from "antd";
import { useState } from "react";

const formatNumber = (value) => {
  if (!value) return "";
  const cleaned = value.replace(/\s/g, "").replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return parts.join(".");
};

const FormattedInput = ({ value, onChange, ...rest }) => {
  const [displayValue, setDisplayValue] = useState(
    formatNumber(String(value || ""))
  );

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\s/g, "");
    if (!/^\d*\.?\d*$/.test(raw)) return;
    setDisplayValue(formatNumber(raw));
    if (onChange) {
      onChange(raw); // formaga toza qiymat yuboriladi
    }
  };

  return (
    <Input type="text" value={displayValue} onChange={handleChange} {...rest} />
  );
};

export default FormattedInput;
