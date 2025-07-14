import { ArrowLeft, Clock, Users, Star, Heart, Share } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const CocktailRecipe = (): JSX.Element => {
  // Sample recipe data - you can replace this with actual data from your backend
  const recipe = {
    name: "Classic Martini",
    description: "A timeless cocktail with a sophisticated taste and perfect balance of gin and vermouth.",
    image: "/figmaAssets/depth-7--frame-0-3.png",
    difficulty: "Easy",
    prepTime: "2 minutes",
    servings: 1,
    rating: 4.8,
    category: "Classic",
    ingredients: [
      { amount: "2.5 oz", ingredient: "Gin" },
      { amount: "0.5 oz", ingredient: "Dry Vermouth" },
      { amount: "1", ingredient: "Lemon twist or olive for garnish" },
      { amount: "Ice", ingredient: "For stirring" }
    ],
    instructions: [
      "Fill a mixing glass with ice cubes.",
      "Add gin and dry vermouth to the mixing glass.",
      "Stir the mixture gently for about 30 seconds to chill and dilute.",
      "Strain the cocktail into a chilled martini glass.",
      "Garnish with a lemon twist or olive.",
      "Serve immediately and enjoy!"
    ],
    tips: [
      "Always use a chilled glass for the best experience",
      "The ratio can be adjusted to taste - some prefer a drier martini with less vermouth",
      "Quality gin makes a significant difference in the final taste"
    ]
  };

  return (
    <div className="min-h-screen bg-[#161611] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#161611]/90 backdrop-blur-sm border-b border-[#2a2920]">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-[#2a2920]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Recipes
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-white hover:bg-[#2a2920]">
              <Heart className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-[#2a2920]">
              <Share className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Hero Section */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div
            className="w-full h-[400px] rounded-lg bg-cover bg-center"
            style={{ backgroundImage: `url(${recipe.image})` }}
          />
          
          <div className="space-y-4">
            <div>
              <Badge className="mb-2 bg-[#f2c40c] text-[#161611] hover:bg-[#e0b40a]">
                {recipe.category}
              </Badge>
              <h1 className="text-3xl font-bold text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                {recipe.name}
              </h1>
              <p className="text-[#bab59b] mt-2 [font-family:'Plus_Jakarta_Sans',Helvetica]">
                {recipe.description}
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm text-[#bab59b]">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-[#f2c40c] text-[#f2c40c]" />
                <span>{recipe.rating}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{recipe.prepTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{recipe.servings} serving</span>
              </div>
            </div>

            <div className="p-4 bg-[#2a2920] rounded-lg">
              <h3 className="font-semibold text-white mb-2">Difficulty Level</h3>
              <Badge variant="outline" className="border-[#4a4735] text-white">
                {recipe.difficulty}
              </Badge>
            </div>
          </div>
        </div>

        {/* Ingredients Section */}
        <Card className="bg-[#2a2920] border-[#4a4735]">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-white mb-4 [font-family:'Plus_Jakarta_Sans',Helvetica]">
              Ingredients
            </h2>
            <div className="grid gap-3">
              {recipe.ingredients.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-[#383528] rounded-lg">
                  <span className="text-white font-medium">{item.ingredient}</span>
                  <span className="text-[#f2c40c] font-semibold">{item.amount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instructions Section */}
        <Card className="bg-[#2a2920] border-[#4a4735]">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-white mb-4 [font-family:'Plus_Jakarta_Sans',Helvetica]">
              Instructions
            </h2>
            <div className="space-y-4">
              {recipe.instructions.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#f2c40c] text-[#161611] rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <p className="text-[#bab59b] [font-family:'Plus_Jakarta_Sans',Helvetica] pt-1">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tips Section */}
        <Card className="bg-[#2a2920] border-[#4a4735]">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-white mb-4 [font-family:'Plus_Jakarta_Sans',Helvetica]">
              Pro Tips
            </h2>
            <div className="space-y-3">
              {recipe.tips.map((tip, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-2 h-2 bg-[#f2c40c] rounded-full mt-2 flex-shrink-0" />
                  <p className="text-[#bab59b] [font-family:'Plus_Jakarta_Sans',Helvetica]">
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 pb-6">
          <Button className="flex-1 bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611] font-bold">
            Start Making This Cocktail
          </Button>
          <Button variant="outline" className="border-[#4a4735] text-white hover:bg-[#2a2920]">
            Save Recipe
          </Button>
        </div>
      </div>
    </div>
  );
};