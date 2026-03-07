import { memo } from "react";
import type { InputHTMLAttributes } from "react";
import "./Input.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = memo(function Input({ className = "", ...rest }: InputProps) {
  return <input className={`input ${className}`} {...rest} />;
});
