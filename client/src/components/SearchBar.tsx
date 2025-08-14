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
    <div className={cn("px-4 py-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            autoComplete="off"
            onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
            aria-label={placeholder}
            className="text-white placeholder:text-[#bab59c] bg-[#383629] border-[#544f3b] focus:border-[#f2c40c] focus:ring-[#f2c40c] focus:ring-1 pr-10"
          />
          {value && (
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => onChange("")} 
              aria-label="Clear search"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-[#bab59c] hover:text-[#f2c40c] hover:bg-[#544f3b]"
            >
              <X size={14} />
            </Button>
          )}
        </div>
        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange("")}
            className="text-sm border-[#f2c40c] text-[#f2c40c] bg-transparent hover:bg-[#f2c40c] hover:text-[#161611] transition-colors shrink-0"
          >Clear Search</Button>
        )}
      </div>
    </div>
  );
}