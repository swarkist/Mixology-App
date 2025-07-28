import { SearchIcon, Star, TrendingUp } from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Cocktail } from "@shared/schema";

export const FeaturedCocktailsSection = (): JSX.Element => {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Navigation menu items
  const navItems = [
    { label: "Recipes", href: "/cocktails" },
    { label: "Ingredients", href: "/ingredients" },
    { label: "My Bar", href: "/ingredients?mybar=true" },
  ];

  // Fetch featured cocktails
  const { data: featuredCocktails, isLoading: featuredLoading } = useQuery<Cocktail[]>({
    queryKey: ["/api/cocktails?featured=true"],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/cocktails?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="w-full bg-[#161611]">
      {/* Navigation Header */}
      <nav className="flex items-center justify-between px-10 py-3 border-b border-[#e5e8ea] w-full">
        {/* Left side: Logo and navigation */}
        <div className="flex items-center gap-8">
          {/* Logo/Brand */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-start">
              <Link href="/">
                <h1 className="font-bold text-white text-lg leading-[23px] [font-family:'Plus_Jakarta_Sans',Helvetica] hover:text-[#f2c40c] transition-colors cursor-pointer">
                  Mixology
                </h1>
              </Link>
            </div>
          </div>

          {/* Navigation links */}
          <div className="flex items-center gap-9">
            {navItems.map((item, index) => (
              <Link key={index} href={item.href}>
                <span className="font-medium text-white text-sm leading-[21px] [font-family:'Plus_Jakarta_Sans',Helvetica] hover:text-[#f2c40c] transition-colors cursor-pointer">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Right side: Search and buttons */}
        <div className="flex items-center justify-end gap-8">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="min-w-40 max-w-64 relative">
            <div className="flex items-center h-10 rounded-lg bg-[#383528] overflow-hidden">
              <div className="pl-4 flex items-center">
                <SearchIcon className="h-5 w-5 text-[#bab59b]" />
              </div>
              <Input
                type="text"
                placeholder="Search cocktails..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="border-0 bg-transparent h-full text-[#bab59b] placeholder:text-[#bab59b] focus-visible:ring-0 focus-visible:ring-offset-0 [font-family:'Plus_Jakarta_Sans',Helvetica]"
              />
            </div>
          </form>

          {/* Auth buttons */}
          <div className="flex items-center gap-2">
            <Link href="/add-cocktail">
              <Button className="h-10 px-4 font-bold text-sm bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90 [font-family:'Plus_Jakarta_Sans',Helvetica]">
                Add Recipe
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Featured Cocktails Section */}
      <div className="px-10 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <Star className="h-6 w-6 text-[#f2c40c]" />
          <h3 className="text-2xl font-bold text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
            Featured Cocktails
          </h3>
        </div>

        {featuredLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-[#383629] border-[#544f3b] animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-[#544f3b] rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-[#544f3b] rounded w-full mb-1"></div>
                  <div className="h-3 bg-[#544f3b] rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : featuredCocktails && featuredCocktails.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCocktails.map((cocktail: Cocktail) => (
              <Link key={cocktail.id} href={`/recipe/${cocktail.id}`}>
                <Card className="bg-[#383629] border-[#544f3b] hover:border-[#f2c40c] transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-[#f2c40c] text-[#161611] font-bold">
                        Featured
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
                      <p className="text-[#bab59b] text-sm [font-family:'Plus_Jakarta_Sans',Helvetica]">
                        {cocktail.description}
                      </p>
                    )}
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
  );
};