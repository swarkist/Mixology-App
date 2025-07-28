import { Star, TrendingUp } from "lucide-react";
import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import noPhotoImage from "@assets/no-photo_1753579606993.png";
import { useQuery } from "@tanstack/react-query";
import TopNavigation from "@/components/TopNavigation";
import type { Cocktail } from "@shared/schema";

export const FeaturedCocktailsSection = (): JSX.Element => {
  // Fetch featured cocktails
  const { data: featuredCocktails, isLoading: featuredLoading } = useQuery<Cocktail[]>({
    queryKey: ["/api/cocktails?featured=true"],
  });

  return (
    <div className="w-full bg-[#161611]">
      {/* Top Navigation */}
      <TopNavigation />

      {/* Featured Cocktails Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <h2 className="font-bold text-white text-[22px] [font-family:'Plus_Jakarta_Sans',Helvetica]">
            Featured Cocktails
          </h2>
          <Link href="/cocktails">
            <Button variant="outline" size="sm" className="border-[#544f3a] text-white hover:bg-[#2a2920] hover:text-[#f2c40c]">
              View All
            </Button>
          </Link>
        </div>
        <div className="p-4">

        {featuredLoading ? (
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="flex-1 min-w-60 bg-transparent border-0 animate-pulse">
                <CardContent className="p-0 space-y-4">
                  <div className="w-full h-[330px] rounded-lg bg-[#544f3b]" />
                  <div className="space-y-1">
                    <div className="h-4 bg-[#544f3b] rounded w-3/4"></div>
                    <div className="h-3 bg-[#544f3b] rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : featuredCocktails && featuredCocktails.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {featuredCocktails.map((cocktail: Cocktail) => (
              <Link key={cocktail.id} href={`/recipe/${cocktail.id}`}>
                <Card className="flex-1 min-w-60 bg-transparent border-0 cursor-pointer hover:transform hover:scale-105 transition-transform">
                  <CardContent className="p-0 space-y-4">
                    <div
                      className="w-full h-[330px] rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url(${cocktail.imageUrl || noPhotoImage})` }}
                    />
                    <div className="space-y-1">
                      <h3 className="font-medium text-white text-base [font-family:'Plus_Jakarta_Sans',Helvetica]">
                        {cocktail.name}
                      </h3>
                      <p className="font-normal text-[#bab59b] text-sm [font-family:'Plus_Jakarta_Sans',Helvetica]">
                        {cocktail.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="bg-[#383629] border-[#544f3b]">
            <CardContent className="p-8 text-center">
              <Star className="h-12 w-12 text-[#544f3b] mx-auto mb-4" />
              <p className="text-[#bab59b] [font-family:'Plus_Jakarta_Sans',Helvetica]">
                No featured cocktails yet. Mark some cocktails as featured to see them here!
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
      </div>
    </div>
  );
};