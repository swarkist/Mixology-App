import { Button } from "@/components/ui/button";

type Props = {
  term: string;
  onClear: () => void;
  message?: string; // optional override
};

export default function EmptyState({ term, onClear, message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 gap-3">
      <div className="text-xl font-semibold text-white">No results{term ? ` for "${term}"` : ""}</div>
      <p className="text-sm text-[#bab59b]">
        {message ?? "Try a different keyword or clear your search to see everything."}
      </p>
      <Button type="button" onClick={onClear} className="mt-2 bg-[#f2c40c] text-[#161611] hover:bg-[#e6b00a]" aria-label="Clear search">
        Clear search
      </Button>
    </div>
  );
}