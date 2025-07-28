import React, { useState } from "react";
import { TrendingUp, Filter, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Cocktail } from "@shared/schema";
import { SPIRIT_SUBCATEGORIES } from "@shared/schema";

export const PopularRecipesSection = (): JSX.Element => {
  const [spiritFilter, setSpiritFilter] = useState<string>("all");

  // Fetch popular cocktails
  const { data: popularCocktails, isLoading: popularLoading } = useQuery<Cocktail[]>({
    queryKey: ["/api/cocktails?popular=true"],
  });

  // Filter cocktails by spirit if a filter is selected and only show cocktails with popularityCount > 0
  // Note: This is a simple implementation. In a real app, you'd filter by ingredients on the backend
  const filteredCocktails = popularCocktails?.filter(cocktail => cocktail.popularityCount > 0).slice(0, 6) || [];

  return (
    <div className="px-10 py-8 bg-[#161611]">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-[#f2c40c]" />
          <h3 className="text-2xl font-bold text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
            Popular Recipes
          </h3>
        </div>
        
        {/* Spirit Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#bab59b]" />
            <span className="text-sm text-[#bab59b] [font-family:'Plus_Jakarta_Sans',Helvetica]">
              Filter by Spirit:
            </span>
          </div>
          <Select value={spiritFilter} onValueChange={setSpiritFilter}>
            <SelectTrigger className="w-40 bg-[#383629] border-[#544f3b] text-white">
              <SelectValue placeholder="All Spirits" />
            </SelectTrigger>
            <SelectContent className="bg-[#383629] border-[#544f3b]">
              <SelectItem value="all" className="text-white hover:bg-[#544f3b]">
                All Spirits
              </SelectItem>
              {SPIRIT_SUBCATEGORIES.map((spirit) => (
                <SelectItem 
                  key={spirit} 
                  value={spirit}
                  className="text-white hover:bg-[#544f3b] capitalize"
                >
                  {spirit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Popular Cocktails Grid */}
      {popularLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-[#383629] border-[#544f3b] animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-[#544f3b] rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-[#544f3b] rounded w-full mb-1"></div>
                <div className="h-3 bg-[#544f3b] rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCocktails.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredCocktails.map((cocktail: Cocktail, index: number) => (
              <Link key={cocktail.id} href={`/recipe/${cocktail.id}`}>
                <Card className="bg-[#383629] border-[#544f3b] hover:border-[#f2c40c] transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge 
                        variant="outline" 
                        className="border-[#f2c40c] text-[#f2c40c] font-bold"
                      >
                        #{index + 1} Popular
                      </Badge>
                      <div className="flex items-center gap-1 text-[#bab59b] text-sm">
                        <TrendingUp className="h-4 w-4" />
                        <span>{cocktail.popularityCount} crafted</span>
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2 [font-family:'Plus_Jakarta_Sans',Helvetica]">
                      {cocktail.name}
                    </h4>
                    {cocktail.description && (
                      <p className="text-[#bab59b] text-sm [font-family:'Plus_Jakarta_Sans',Helvetica] line-clamp-2">
                        {cocktail.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
          {/* View All Button */}
          <div className="text-center">
            <Link href="/cocktails?popular=true">
              <Button className="bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90 font-bold">
                View All Popular Recipes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <Card className="bg-[#383629] border-[#544f3b] mb-8">
          <CardContent className="p-8 text-center">
            <TrendingUp className="h-12 w-12 text-[#544f3b] mx-auto mb-4" />
            <p className="text-[#bab59b] [font-family:'Plus_Jakarta_Sans',Helvetica]">
              No popular recipes yet. Cocktails become popular when users click "Start Making This Cocktail"!
            </p>
            <Link href="/cocktails">
              <Button className="mt-4 bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90">
                Browse All Cocktails
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
};