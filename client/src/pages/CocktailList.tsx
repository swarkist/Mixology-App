import { Search, Filter, ArrowLeft, Grid, List, Plus } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const CocktailList = (): JSX.Element => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");

  // Sample cocktail data - in real app this would come from backend
  const cocktails = [
    {
      id: 1,
      name: "Classic Martini",
      description: "A timeless cocktail with a sophisticated taste",
      image: "/figmaAssets/depth-7--frame-0-3.png",
      difficulty: "Easy",
      time: "2 min",
      rating: 4.8,
      ingredients: ["Gin", "Dry Vermouth", "Lemon Twist"],
      category: "Classic"
    },
    {
      id: 2,
      name: "Mojito",
      description: "A Cuban classic with refreshing mint and lime",
      image: "/figmaAssets/depth-7--frame-0-4.png",
      difficulty: "Easy",
      time: "3 min",
      rating: 4.6,
      ingredients: ["White Rum", "Mint", "Lime", "Sugar"],
      category: "Refreshing"
    },
    {
      id: 3,
      name: "Old Fashioned",
      description: "A rich and complex whiskey-based cocktail",
      image: "/figmaAssets/depth-7--frame-0-5.png",
      difficulty: "Medium",
      time: "4 min",
      rating: 4.7,
      ingredients: ["Whiskey", "Sugar", "Bitters", "Orange"],
      category: "Classic"
    },
    {
      id: 4,
      name: "Margarita",
      description: "A zesty and tangy tequila cocktail",
      image: "/figmaAssets/depth-7--frame-0-6.png",
      difficulty: "Easy",
      time: "2 min",
      rating: 4.5,
      ingredients: ["Tequila", "Lime Juice", "Triple Sec", "Salt"],
      category: "Refreshing"
    },
    {
      id: 5,
      name: "Cosmopolitan",
      description: "A vibrant and fruity vodka cocktail",
      image: "/figmaAssets/depth-7--frame-0-7.png",
      difficulty: "Medium",
      time: "3 min",
      rating: 4.4,
      ingredients: ["Vodka", "Cranberry Juice", "Lime", "Triple Sec"],
      category: "Fruity"
    },
    {
      id: 6,
      name: "Daiquiri",
      description: "A simple and refreshing rum cocktail",
      image: "/figmaAssets/depth-7--frame-0-8.png",
      difficulty: "Easy",
      time: "2 min",
      rating: 4.3,
      ingredients: ["White Rum", "Lime Juice", "Simple Syrup"],
      category: "Classic"
    }
  ];

  const filteredCocktails = cocktails.filter(cocktail =>
    cocktail.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cocktail.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cocktail.ingredients.some(ingredient => 
      ingredient.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const categories = ["All", "Classic", "Refreshing", "Fruity"];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categoryFilteredCocktails = selectedCategory === "All" 
    ? filteredCocktails 
    : filteredCocktails.filter(cocktail => cocktail.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#161611] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#161611]/90 backdrop-blur-sm border-b border-[#2a2920]">
        <div className="flex items-center justify-between p-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white hover:bg-[#2a2920]">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold [font-family:'Plus_Jakarta_Sans',Helvetica]">
              All Cocktails
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-[#f2c40c] text-[#161611]" : "text-white hover:bg-[#2a2920]"}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-[#f2c40c] text-[#161611]" : "text-white hover:bg-[#2a2920]"}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Search and Filter */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#bab59b]" />
              <Input
                placeholder="Search cocktails, ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-[#f2c40c] focus-visible:border-[#f2c40c]"
              />
            </div>
            <Button variant="outline" className="border-[#544f3a] text-white hover:bg-[#2a2920]">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button className="bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611]">
              <Plus className="w-4 h-4 mr-2" />
              Add Cocktail
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`cursor-pointer ${
                  selectedCategory === category
                    ? "bg-[#f2c40c] text-[#161611] hover:bg-[#e0b40a]"
                    : "border-[#544f3a] text-white hover:bg-[#2a2920]"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="text-[#bab59b] text-sm">
          {categoryFilteredCocktails.length} cocktails found
        </div>

        {/* Cocktail Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categoryFilteredCocktails.map((cocktail) => (
              <Link key={cocktail.id} href={`/recipe/${cocktail.id}`}>
                <Card className="bg-[#2a2920] border-[#4a4735] hover:border-[#f2c40c] transition-colors cursor-pointer group">
                  <CardContent className="p-0">
                    <div
                      className="w-full h-48 bg-cover bg-center rounded-t-lg"
                      style={{ backgroundImage: `url(${cocktail.image})` }}
                    />
                    <div className="p-4 space-y-3">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-white group-hover:text-[#f2c40c] transition-colors [font-family:'Plus_Jakarta_Sans',Helvetica]">
                          {cocktail.name}
                        </h3>
                        <p className="text-[#bab59b] text-sm line-clamp-2">
                          {cocktail.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#bab59b]">
                        <span>{cocktail.time}</span>
                        <span>{cocktail.difficulty}</span>
                        <span>★ {cocktail.rating}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {cocktail.ingredients.slice(0, 3).map((ingredient, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-[#544f3a] text-[#bab59b]">
                            {ingredient}
                          </Badge>
                        ))}
                        {cocktail.ingredients.length > 3 && (
                          <Badge variant="outline" className="text-xs border-[#544f3a] text-[#bab59b]">
                            +{cocktail.ingredients.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {categoryFilteredCocktails.map((cocktail) => (
              <Link key={cocktail.id} href={`/recipe/${cocktail.id}`}>
                <Card className="bg-[#2a2920] border-[#4a4735] hover:border-[#f2c40c] transition-colors cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div
                        className="w-24 h-24 bg-cover bg-center rounded-lg flex-shrink-0"
                        style={{ backgroundImage: `url(${cocktail.image})` }}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-white group-hover:text-[#f2c40c] transition-colors [font-family:'Plus_Jakarta_Sans',Helvetica]">
                              {cocktail.name}
                            </h3>
                            <p className="text-[#bab59b] text-sm">
                              {cocktail.description}
                            </p>
                          </div>
                          <div className="text-right text-xs text-[#bab59b]">
                            <div>★ {cocktail.rating}</div>
                            <div>{cocktail.time}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs border-[#544f3a] text-[#bab59b]">
                            {cocktail.difficulty}
                          </Badge>
                          <div className="flex flex-wrap gap-1">
                            {cocktail.ingredients.slice(0, 4).map((ingredient, index) => (
                              <span key={index} className="text-xs text-[#bab59b]">
                                {ingredient}{index < Math.min(3, cocktail.ingredients.length - 1) && ", "}
                              </span>
                            ))}
                            {cocktail.ingredients.length > 4 && (
                              <span className="text-xs text-[#bab59b]">
                                +{cocktail.ingredients.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Empty state */}
        {categoryFilteredCocktails.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#bab59b] text-lg mb-2">No cocktails found</p>
            <p className="text-[#bab59b] text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};