import React, { useRef, useEffect } from "react";

interface OTPInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export default function OTPInput({ value, onChange, disabled = false }: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first empty box or the first box on mount
  useEffect(() => {
    const firstEmptyIdx = value.findIndex((digit) => !digit);
    const targetIdx = firstEmptyIdx !== -1 ? firstEmptyIdx : 0;
    if (inputRefs.current[targetIdx]) {
      inputRefs.current[targetIdx]?.focus();
    }
  }, []);

  const handleChange = (val: string, idx: number) => {
    // Only allow numeric input
    if (val && isNaN(Number(val))) return;

    const newOtp = [...value];
    // Restrict to max 1 digit per box
    newOtp[idx] = val.slice(-1);
    onChange(newOtp);

    // Auto-focus next input box if a digit is entered
    if (val && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace") {
      const newOtp = [...value];
      newOtp[idx] = "";
      onChange(newOtp);

      // Auto-focus previous box
      if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").trim();
    if (data.length === 6 && !isNaN(Number(data))) {
      onChange(data.split(""));
      // Focus the last input box
      inputRefs.current[5]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-between gap-2" data-testid="otp-input-container">
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputRefs.current[idx] = el;
          }}
          type="text"
          maxLength={1}
          pattern="[0-9]"
          inputMode="numeric"
          value={value[idx] || ""}
          onChange={(e) => handleChange(e.target.value, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          disabled={disabled}
          data-testid={`otp-box-${idx}`}
          className="w-[52px] h-[60px] bg-mahogany-surface border border-border rounded-md text-cream focus:border-spice focus:text-turmeric text-center font-mono text-2xl font-bold focus:outline-none transition-all shadow-inner disabled:opacity-50"
        />
      ))}
    </div>
  );
}
