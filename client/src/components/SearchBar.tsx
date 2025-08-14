import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormEvent } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
};

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className,
  autoFocus,
}: Props) {
  const stopSubmit = (e: FormEvent) => e.preventDefault();
  
  return (
    <form onSubmit={stopSubmit} className={cn("flex items-center gap-2", className)} role="search">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
        aria-label={placeholder}
      />
      {value && (
        <Button type="button" variant="ghost" onClick={() => onChange("")} aria-label="Clear search">
          <X size={16} />
        </Button>
      )}
    </form>
  );
}