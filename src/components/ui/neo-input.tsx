
import { cn } from "@/lib/utils";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  placeholder: string;
}

export default function Input({
  className,
  value,
  setValue,
  placeholder,
  ...rest
}: Props) {
  return (
    <input
      className={cn(
        "rounded-base border-2 border-black p-[10px] font-base ring-offset-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 focus-visible:ring-offset-2 outline-none transition-all",
        className
      )}
      name="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
      }}
      aria-label={placeholder}
      {
        ...rest
      }
    />
  );
}
