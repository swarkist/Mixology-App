import React, { useState } from "react";
import { Search as SearchIcon, Plus, Filter, Grid, List } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TopNavigation } from "@/components/TopNavigation";
import { Navigation } from "@/components/Navigation";
import { useQuery } from "@tanstack/react-query";
import type { Ingredient } from "@shared/schema";
import { INGREDIENT_CATEGORIES } from "@shared/schema";
import noPhotoImage from "@assets/no-photo_1753579606993.png";

export const MyBar = (): JSX.Element => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch ingredients that are in my bar
  const { data: myBarIngredients, isLoading } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients?inMyBar=true"],
  });

  // Filter ingredients based on search and category
  const filteredIngredients = myBarIngredients?.filter((ingredient) => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ingredient.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ingredient.preferredBrand?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || ingredient.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  }) || [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#161611]">
      <TopNavigation />
      
      <main className="flex-1 px-4 md:px-8 lg:px-10 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-white mb-2 [font-family:'Plus_Jakarta_Sans',Helvetica]">
                My Bar
              </h1>
              <p className="text-[#bab59b] [font-family:'Plus_Jakarta_Sans',Helvetica]">
                Manage your personal ingredient collection
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/add-ingredient">
                <Button className="bg-[#f2c40c] text-[#161611] hover:bg-[#e0b40a] font-medium">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ingredient
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-[#383629] border-[#544f3b]">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#f2c40c] mb-1">
                    {myBarIngredients?.length || 0}
                  </div>
                  <div className="text-sm text-[#bab59b]">Total Ingredients</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#383629] border-[#544f3b]">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#f2c40c] mb-1">
                    {new Set(myBarIngredients?.map(i => i.category)).size || 0}
                  </div>
                  <div className="text-sm text-[#bab59b]">Categories</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#383629] border-[#544f3b]">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#f2c40c] mb-1">
                    {myBarIngredients?.filter(i => i.category === 'spirits').length || 0}
                  </div>
                  <div className="text-sm text-[#bab59b]">Spirits</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#bab59b]" />
                <Input
                  type="text"
                  placeholder="Search ingredients..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10 bg-[#383629] border-[#544f3b] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
                />
              </div>
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-48 bg-[#383629] border-[#544f3b] text-white">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-[#383629] border-[#544f3b]">
                <SelectItem value="all" className="text-white hover:bg-[#544f3b]">
                  All Categories
                </SelectItem>
                {INGREDIENT_CATEGORIES.map((category) => (
                  <SelectItem 
                    key={category} 
                    value={category}
                    className="text-white hover:bg-[#544f3b] capitalize"
                  >
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#383629] rounded-lg border border-[#544f3b] p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`h-8 px-3 ${viewMode === "grid" ? "bg-[#f2c40c] text-[#161611]" : "text-[#bab59b] hover:text-white"}`}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={`h-8 px-3 ${viewMode === "list" ? "bg-[#f2c40c] text-[#161611]" : "text-[#bab59b] hover:text-white"}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4">
            <p className="text-sm text-[#bab59b]">
              {isLoading ? "Loading..." : `${filteredIngredients.length} ingredient${filteredIngredients.length !== 1 ? 's' : ''} in your bar`}
            </p>
          </div>

          {/* Ingredients Grid/List */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-[#bab59b]">Loading your bar...</p>
            </div>
          ) : filteredIngredients.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-[#383629] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-8 w-8 text-[#bab59b]" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {myBarIngredients?.length === 0 ? "Your bar is empty" : "No ingredients found"}
                </h3>
                <p className="text-[#bab59b] mb-6">
                  {myBarIngredients?.length === 0 
                    ? "Start building your personal ingredient collection"
                    : "Try adjusting your search or filter criteria"}
                </p>
                {myBarIngredients?.length === 0 && (
                  <Link href="/ingredients">
                    <Button className="bg-[#f2c40c] text-[#161611] hover:bg-[#e0b40a]">
                      Browse Ingredients
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-4"
            }>
              {filteredIngredients.map((ingredient) => (
                <Card 
                  key={ingredient.id} 
                  className={`bg-[#383629] border-[#544f3b] hover:border-[#f2c40c] transition-colors cursor-pointer ${
                    viewMode === "list" ? "flex" : ""
                  }`}
                >
                  <CardContent className={`p-4 ${viewMode === "list" ? "flex items-center space-x-4 w-full" : "space-y-4"}`}>
                    {/* Image */}
                    <div className={`${viewMode === "list" ? "w-16 h-16" : "w-full h-48"} rounded-lg bg-cover bg-center flex-shrink-0`}
                         style={{ backgroundImage: `url(${ingredient.imageUrl || noPhotoImage})` }}>
                    </div>
                    
                    {/* Content */}
                    <div className={`${viewMode === "list" ? "flex-1 min-w-0" : ""}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-white text-lg truncate">
                          {ingredient.name}
                        </h3>
                        <span className="text-xs bg-[#544f3b] text-[#bab59b] px-2 py-1 rounded capitalize flex-shrink-0 ml-2">
                          {ingredient.category}
                        </span>
                      </div>
                      
                      {ingredient.preferredBrand && (
                        <p className="text-sm text-[#f2c40c] mb-1">
                          {ingredient.preferredBrand}
                        </p>
                      )}
                      
                      {ingredient.description && (
                        <p className="text-sm text-[#bab59b] line-clamp-2 mb-2">
                          {ingredient.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        {ingredient.abv && (
                          <span className="text-sm font-medium text-[#f2c40c]">
                            {ingredient.abv}% ABV
                          </span>
                        )}
                        
                        <Link href={`/edit-ingredient/${ingredient.id}`}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-[#bab59b] hover:text-[#f2c40c] hover:bg-[#544f3b]"
                          >
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Navigation */}
      <Navigation />
    </div>
  );
};