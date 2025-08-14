import { Button } from "@/components/ui/button";

type Props = {
  term: string;
  onClear: () => void;
  message?: string; // optional override
  isFilterResult?: boolean; // true when showing filter results (not search)
  onClearFilters?: () => void; // function to clear filters
};

export default function EmptyState({ term, onClear, message, isFilterResult, onClearFilters }: Props) {
  // Determine if this is a filter-only scenario (no search term but filters active)
  const isFilterOnly = isFilterResult && !term.trim();
  
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 gap-3">
      <div className="text-xl font-semibold text-white">
        {isFilterOnly ? "No results" : `No results${term ? ` for "${term}"` : ""}`}
      </div>
      <p className="text-sm text-[#bab59b]">
        {isFilterOnly 
          ? "Try a different filter, or clear your filters to see everything."
          : (message ?? "Try a different keyword or clear your search to see everything.")
        }
      </p>
      {isFilterOnly && onClearFilters ? (
        <Button 
          type="button" 
          onClick={onClearFilters} 
          className="mt-2 bg-[#f2c40c] text-[#161611] hover:bg-[#e6b00a]" 
          aria-label="Clear filters"
        >
          Clear filters
        </Button>
      ) : (
        <Button 
          type="button" 
          onClick={onClear} 
          className="mt-2 bg-[#f2c40c] text-[#161611] hover:bg-[#e6b00a]" 
          aria-label="Clear search"
        >
          Clear search
        </Button>
      )}
    </div>
  );
}