import { Search, Filter, ArrowLeft, Grid, List, Plus, Minus } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Ingredients = (): JSX.Element => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  // Sample ingredients data - organized by category
  const ingredientCategories = {
    Spirits: [
      { name: "Vodka", description: "Clear, neutral spirit", recipes: 24, image: "/figmaAssets/vodka.png" },
      { name: "Gin", description: "Juniper-flavored spirit", recipes: 18, image: "/figmaAssets/gin.png" },
      { name: "Rum", description: "Sugar cane distilled spirit", recipes: 16, image: "/figmaAssets/rum.png" },
      { name: "Tequila", description: "Agave-based Mexican spirit", recipes: 12, image: "/figmaAssets/tequila.png" },
      { name: "Whiskey", description: "Grain-based aged spirit", recipes: 14, image: "/figmaAssets/whiskey.png" },
      { name: "Brandy", description: "Fruit-based distilled spirit", recipes: 8, image: "/figmaAssets/brandy.png" }
    ],
    Mixers: [
      { name: "Tonic Water", description: "Carbonated bitter mixer", recipes: 15, image: "/figmaAssets/tonic.png" },
      { name: "Soda Water", description: "Plain carbonated water", recipes: 22, image: "/figmaAssets/soda.png" },
      { name: "Ginger Beer", description: "Spicy carbonated mixer", recipes: 10, image: "/figmaAssets/ginger-beer.png" },
      { name: "Club Soda", description: "Mineral-rich carbonated water", recipes: 18, image: "/figmaAssets/club-soda.png" }
    ],
    Juices: [
      { name: "Lime Juice", description: "Fresh citrus juice", recipes: 32, image: "/figmaAssets/lime-juice.png" },
      { name: "Lemon Juice", description: "Bright citrus juice", recipes: 28, image: "/figmaAssets/lemon-juice.png" },
      { name: "Orange Juice", description: "Sweet citrus juice", recipes: 20, image: "/figmaAssets/orange-juice.png" },
      { name: "Cranberry Juice", description: "Tart berry juice", recipes: 12, image: "/figmaAssets/cranberry-juice.png" },
      { name: "Pineapple Juice", description: "Tropical sweet juice", recipes: 14, image: "/figmaAssets/pineapple-juice.png" }
    ],
    Garnishes: [
      { name: "Mint", description: "Fresh herb garnish", recipes: 18, image: "/figmaAssets/mint.png" },
      { name: "Lime Wedge", description: "Citrus garnish", recipes: 25, image: "/figmaAssets/lime-wedge.png" },
      { name: "Orange Peel", description: "Citrus zest garnish", recipes: 16, image: "/figmaAssets/orange-peel.png" },
      { name: "Olives", description: "Briny garnish", recipes: 8, image: "/figmaAssets/olives.png" },
      { name: "Cherries", description: "Sweet garnish", recipes: 10, image: "/figmaAssets/cherries.png" }
    ],
    Syrups: [
      { name: "Simple Syrup", description: "Basic sugar syrup", recipes: 30, image: "/figmaAssets/simple-syrup.png" },
      { name: "Grenadine", description: "Pomegranate syrup", recipes: 12, image: "/figmaAssets/grenadine.png" },
      { name: "Elderflower", description: "Floral liqueur", recipes: 8, image: "/figmaAssets/elderflower.png" },
      { name: "Honey Syrup", description: "Natural sweetener", recipes: 14, image: "/figmaAssets/honey-syrup.png" }
    ]
  };

  const allIngredients = Object.values(ingredientCategories).flat();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = ["All", ...Object.keys(ingredientCategories)];

  const filteredIngredients = selectedCategory === "All" 
    ? allIngredients.filter(ingredient =>
        ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ingredient.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : ingredientCategories[selectedCategory as keyof typeof ingredientCategories]?.filter(ingredient =>
        ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ingredient.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) || [];

  const toggleIngredient = (ingredientName: string) => {
    setSelectedIngredients(prev => 
      prev.includes(ingredientName)
        ? prev.filter(name => name !== ingredientName)
        : [...prev, ingredientName]
    );
  };

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
              Ingredients
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
                placeholder="Search ingredients..."
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
              Add Ingredient
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

          {/* Selected Ingredients Bar */}
          {selectedIngredients.length > 0 && (
            <Card className="bg-[#2a2920] border-[#4a4735]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">Selected Ingredients ({selectedIngredients.length})</h3>
                  <Button 
                    size="sm" 
                    className="bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611]"
                    onClick={() => {/* Navigate to recipes with these ingredients */}}
                  >
                    Find Recipes
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedIngredients.map((ingredient) => (
                    <Badge
                      key={ingredient}
                      className="bg-[#f2c40c] text-[#161611] hover:bg-[#e0b40a] cursor-pointer"
                      onClick={() => toggleIngredient(ingredient)}
                    >
                      {ingredient}
                      <Minus className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results count */}
        <div className="text-[#bab59b] text-sm">
          {filteredIngredients.length} ingredients found
        </div>

        {/* Ingredients Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredIngredients.map((ingredient) => (
              <Card 
                key={ingredient.name} 
                className="bg-[#2a2920] border-[#4a4735] hover:border-[#f2c40c] transition-colors cursor-pointer group"
                onClick={() => toggleIngredient(ingredient.name)}
              >
                <CardContent className="p-0">
                  <div className="relative">
                    <div
                      className="w-full h-48 bg-cover bg-center rounded-t-lg bg-[#383528]"
                      style={{ backgroundImage: `url(${ingredient.image})` }}
                    />
                    <div className="absolute top-2 right-2">
                      <Button
                        size="sm"
                        variant={selectedIngredients.includes(ingredient.name) ? "default" : "outline"}
                        className={selectedIngredients.includes(ingredient.name) 
                          ? "bg-[#f2c40c] text-[#161611] hover:bg-[#e0b40a] w-8 h-8 p-0"
                          : "border-white text-white hover:bg-white hover:text-[#161611] w-8 h-8 p-0"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleIngredient(ingredient.name);
                        }}
                      >
                        {selectedIngredients.includes(ingredient.name) ? 
                          <Minus className="w-4 h-4" /> : 
                          <Plus className="w-4 h-4" />
                        }
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-white group-hover:text-[#f2c40c] transition-colors [font-family:'Plus_Jakarta_Sans',Helvetica]">
                        {ingredient.name}
                      </h3>
                      <p className="text-[#bab59b] text-sm">
                        {ingredient.description}
                      </p>
                    </div>
                    <div className="text-xs text-[#bab59b]">
                      Used in {ingredient.recipes} recipes
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIngredients.map((ingredient) => (
              <Card 
                key={ingredient.name} 
                className="bg-[#2a2920] border-[#4a4735] hover:border-[#f2c40c] transition-colors cursor-pointer group"
                onClick={() => toggleIngredient(ingredient.name)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div
                      className="w-16 h-16 bg-cover bg-center rounded-lg flex-shrink-0 bg-[#383528]"
                      style={{ backgroundImage: `url(${ingredient.image})` }}
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-[#f2c40c] transition-colors [font-family:'Plus_Jakarta_Sans',Helvetica]">
                          {ingredient.name}
                        </h3>
                        <p className="text-[#bab59b] text-sm">
                          {ingredient.description}
                        </p>
                        <div className="text-xs text-[#bab59b] mt-1">
                          Used in {ingredient.recipes} recipes
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={selectedIngredients.includes(ingredient.name) ? "default" : "outline"}
                        className={selectedIngredients.includes(ingredient.name) 
                          ? "bg-[#f2c40c] text-[#161611] hover:bg-[#e0b40a]"
                          : "border-[#544f3a] text-white hover:bg-[#2a2920]"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleIngredient(ingredient.name);
                        }}
                      >
                        {selectedIngredients.includes(ingredient.name) ? 
                          <>
                            <Minus className="w-4 h-4 mr-1" />
                            Remove
                          </> : 
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </>
                        }
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filteredIngredients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#bab59b] text-lg mb-2">No ingredients found</p>
            <p className="text-[#bab59b] text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};