// SmartKgInput.jsx
import React, { useState } from "react";
import { Input } from "antd";

export default function SmartKgInput({ value, onChange, placeholder = "Miqdor (kg/gramm)" }) {
    const [text, setText] = useState(value ?? "");

    function parseSmart(input) {
        if (!input) return null;

        let s = String(input).trim().toLowerCase();
        s = s.replace(",", ".").replace(/\s+/g, "");

        // gramm
        const gramMatch = s.match(/^(\d+(\.\d+)?)g(r)?$/);
        if (gramMatch) return parseFloat(gramMatch[1]) / 1000;

        // nuqta bo‘lsa oddiy float
        if (s.includes(".")) return parseFloat(s);

        // boshida 0 bo‘lsa va nuqta bo‘lmasa — 05 => 0.5 kg
        if (/^0\d+$/.test(s)) return parseFloat("0." + s.slice(1));

        // oddiy butun son — kg
        if (/^\d+$/.test(s)) return parseInt(s, 10);

        return parseFloat(s);
    }

    const handleChange = (e) => {
        const v = e.target.value;
        setText(v);
        const kgValue = parseSmart(v);
        onChange?.(kgValue); // formaga kg qiymat yuboriladi
    };

    return (
        <Input
            value={text}
            onChange={handleChange}
            placeholder={placeholder}
            className="hdr-input hdr-quantity-field"
            style={{ width: "150px" }}
        />
    );
}
