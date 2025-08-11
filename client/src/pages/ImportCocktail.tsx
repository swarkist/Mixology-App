import { ArrowLeft, Link as LinkIcon, Youtube, Loader2, FileText, Wand2, Save, AlertCircle, CheckCircle, ClipboardPaste } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isYouTubeURL, extractYouTubeTranscript } from "@/lib/extractYouTubeTranscript";
import { scrapeWebContent } from "@/lib/scrapeURL";
import { callOpenRouter } from "@/lib/aiRequest";
import { getModelForTask } from "@/lib/modelRouter";
import { cocktailFormSchema, insertCocktailSchema } from "@shared/schema";
import { formatIngredientMeasurement } from "@/lib/fractionUtils";
import type { Ingredient, Tag } from "@shared/schema";

interface ParsedRecipe {
  name: string;
  description: string;
  instructions: string[];
  ingredients: Array<{
    name: string;
    amount: string;
    unit?: string;
  }>;
  tags: string[];
}

interface IngredientWithCategory {
  name: string;
  amount: string;
  unit?: string;
  category?: string;
  subCategory?: string;
  isNew?: boolean;
}

const importFormSchema = z.object({
  url: z.string().url("Please enter a valid URL")
});

type ImportFormData = z.infer<typeof importFormSchema>;

export const ImportCocktail = (): JSX.Element => {
  const [, setLocation] = useLocation();
  const [rawContent, setRawContent] = useState<string>("");
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [ingredientsWithCategories, setIngredientsWithCategories] = useState<IngredientWithCategory[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractError, setExtractError] = useState<string>("");
  const [parseError, setParseError] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importForm = useForm<ImportFormData>({
    resolver: zodResolver(importFormSchema),
    defaultValues: {
      url: ""
    }
  });

  // Create a custom form schema for AI import that handles raw ingredient data
  const aiImportFormSchema = insertCocktailSchema.extend({
    ingredients: z.array(z.object({
      name: z.string().min(1),
      amount: z.string().min(1),
      unit: z.string().min(1),
    })),
    instructions: z.array(z.string().min(1)),
    tags: z.array(z.string()).optional(),
  });

  const cocktailForm = useForm({
    resolver: zodResolver(aiImportFormSchema),
    defaultValues: {
      name: "",
      description: "",
      instructions: [""],
      ingredients: [{ name: "", amount: "", unit: "" }],
      tags: [],
      servings: 1,
      glassType: "",
      garnish: "",
      imageUrl: null
    }
  });

  // Fetch existing ingredients for checking which ones are new
  const { data: existingIngredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  // Helper function to check if an ingredient is new
  const isIngredientNew = (ingredientName: string): boolean => {
    return !existingIngredients.some(existing => 
      existing.name.toLowerCase().trim() === ingredientName.toLowerCase().trim()
    );
  };

  // Helper function to initialize ingredients with categories
  const processIngredientsWithCategories = (parsedIngredients: ParsedRecipe['ingredients']): IngredientWithCategory[] => {
    return parsedIngredients.map(ing => ({
      ...ing,
      isNew: isIngredientNew(ing.name),
      category: '',
      subCategory: ''
    }));
  };

  // Categories for new ingredient selection
  const categories = [
    'spirits', 'mixers', 'juices', 'syrups', 'bitters', 'garnishes', 'other'
  ];

  const spiritSubcategories = [
    'Tequila', 'Whiskey', 'Rum', 'Vodka', 'Gin', 'Scotch', 'Moonshine', 'Brandy'
  ];

  // Function to update ingredient category
  const updateIngredientCategory = (index: number, category: string, subCategory?: string) => {
    setIngredientsWithCategories(prev => prev.map((ing, idx) => 
      idx === index ? { ...ing, category, subCategory: subCategory || '' } : ing
    ));
  };

  const createCocktailMutation = useMutation({
    mutationFn: async (cocktailData: any) => {
      const response = await fetch("/api/cocktails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof window !== 'undefined' ? {} : { "x-admin-key": process.env.ADMIN_API_KEY || "" })
        },
        body: JSON.stringify(cocktailData)
      });
      if (!response.ok) throw new Error("Failed to create cocktail");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cocktails"] });
      setSaveStatus("success");
      toast({
        title: "Success!",
        description: "Cocktail imported successfully"
      });
      // Navigate back to cocktail list after short delay
      setTimeout(() => {
        setLocation("/cocktails");
      }, 2000);
    },
    onError: (error) => {
      setSaveStatus("error");
      toast({
        title: "Error",
        description: `Failed to save cocktail: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const extractContent = async (data: ImportFormData) => {
    setIsExtracting(true);
    setExtractError("");
    setRawContent("");
    setParsedRecipe(null);
    
    try {
      let content: string;
      
      if (isYouTubeURL(data.url)) {
        content = await extractYouTubeTranscript(data.url);
      } else {
        content = await scrapeWebContent(data.url);
      }
      
      setRawContent(content);
      toast({
        title: "Content extracted!",
        description: "Ready to parse recipe with AI"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to extract content";
      setExtractError(errorMessage);
      toast({
        title: "Extraction failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const parseWithAI = async () => {
    if (!rawContent) return;
    
    setIsParsing(true);
    setParseError("");
    setParsedRecipe(null);
    
    try {
      const systemPrompt = `You are a cocktail recipe extraction expert. Extract and structure cocktail recipe information from the provided text.

Return ONLY a valid JSON object in this exact format:
{
  "name": "Recipe Name",
  "description": "Brief description",
  "instructions": ["Step 1", "Step 2", "Step 3"],
  "ingredients": [
    {"name": "ingredient name", "amount": "2", "unit": "oz"},
    {"name": "ingredient name", "amount": "1", "unit": "dash"}
  ],
  "tags": ["tag1", "tag2"]
}

Rules:
- Extract only ONE main cocktail recipe
- Normalize measurements (use oz for spirits, ml for syrups, dash for bitters)
- For ranges like "2-3 oz", use lower bound "2"
- Use common ingredient names (e.g. "Simple Syrup" not "simple syrup")
- Include relevant tags like drink type, flavor profile, occasion  
- Keep instructions clear and numbered
- If no clear recipe is found, return null for all fields except name

Do not include any explanation or additional text - return only the JSON object.`;

      const response = await callOpenRouter(getModelForTask("parse"), rawContent, systemPrompt);
      
      // Clean and parse the JSON response
      const cleanedResponse = response.trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error("No valid JSON found in AI response");
      }
      
      const parsed = JSON.parse(jsonMatch[0]) as ParsedRecipe;
      
      if (!parsed.name || parsed.name.trim() === "") {
        throw new Error("No valid recipe found in the content");
      }
      
      console.log("Parsed recipe data:", parsed);
      setParsedRecipe(parsed);
      
      // Process ingredients to identify new ones
      const processedIngredients = processIngredientsWithCategories(parsed.ingredients);
      setIngredientsWithCategories(processedIngredients);
      
      // Populate the form with parsed data
      cocktailForm.reset({
        name: parsed.name,
        description: parsed.description,
        instructions: parsed.instructions.length > 0 ? parsed.instructions : [""],
        ingredients: parsed.ingredients.length > 0 ? parsed.ingredients : [{ name: "", amount: "", unit: "" }],
        tags: [],
        servings: 1,
        glassType: "",
        garnish: "",
        imageUrl: null
      });
      
      toast({
        title: "Recipe parsed!",
        description: "AI successfully extracted the recipe"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to parse content";
      setParseError(errorMessage);
      toast({
        title: "Parsing failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsParsing(false);
    }
  };

  const saveCocktail = async (data: any) => {
    setIsSaving(true);
    setSaveStatus("idle");
    
    try {
      // Validate that all new ingredients have categories
      const newIngredients = ingredientsWithCategories.filter(ing => ing.isNew);
      const missingCategories = newIngredients.filter(ing => !ing.category || (ing.category === 'spirits' && !ing.subCategory));
      
      if (missingCategories.length > 0) {
        toast({
          title: "Missing Categories",
          description: `Please select categories for all new ingredients (${missingCategories.length} remaining)`,
          variant: "destructive"
        });
        return;
      }

      // Create ingredients for new ones first
      const createdIngredients: any[] = [];
      for (const ing of newIngredients) {
        const ingredientData = {
          name: ing.name,
          category: ing.category,
          subCategory: ing.subCategory || undefined,
          description: `Imported ingredient: ${ing.name}`,
          abv: ing.category === 'spirits' ? 40 : 0, // Default ABV
          preferredBrand: '',
          imageUrl: null,
          tags: [],
          inMyBar: false
        };

        const response = await fetch("/api/ingredients", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(typeof window !== 'undefined' ? {} : { "x-admin-key": process.env.ADMIN_API_KEY || "" })
          },
          body: JSON.stringify(ingredientData)
        });

        if (!response.ok) {
          throw new Error(`Failed to create ingredient: ${ing.name}`);
        }

        const createdIngredient = await response.json();
        createdIngredients.push(createdIngredient);
      }

      // Invalidate ingredients cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });

      // Now save the cocktail
      await createCocktailMutation.mutateAsync(data);
      
      if (createdIngredients.length > 0) {
        toast({
          title: "Ingredients Created",
          description: `Created ${createdIngredients.length} new ingredient${createdIngredients.length !== 1 ? 's' : ''}`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save cocktail",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#161611] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#161611]/90 backdrop-blur-sm border-b border-[#2a2920]">
        <div className="flex items-center justify-between p-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/cocktails">
              <Button variant="ghost" size="sm" className="text-white hover:bg-[#2a2920]">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold [font-family:'Plus_Jakarta_Sans',Helvetica]">
              AI-Powered Recipe Importer
            </h1>
          </div>
          {parsedRecipe && (
            <Button 
              onClick={cocktailForm.handleSubmit(saveCocktail)}
              disabled={isSaving || saveStatus === "success"}
              className="bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611] disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saveStatus === "success" ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Cocktail
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* URL Input */}
        <Card className="bg-[#2a2920] border-[#4a4735]">
          <CardHeader>
            <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica] flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Import from URL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...importForm}>
              <form onSubmit={importForm.handleSubmit(extractContent)} className="space-y-4">
                <FormField
                  control={importForm.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Website URL</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              placeholder="https://example.com/recipe"
                              className="bg-[#383529] border-[#544f3a] text-white placeholder-[#bab59b] pl-10"
                              {...field}
                            />
                            {isYouTubeURL(field.value) ? (
                              <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
                            ) : (
                              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#bab59b]" />
                            )}
                          </div>
                          <Button
                            type="submit"
                            disabled={isExtracting || !field.value}
                            className="bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611]"
                          >
                            {isExtracting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Extracting...
                              </>
                            ) : (
                              <>
                                <FileText className="w-4 h-4 mr-2" />
                                Extract
                              </>
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>

            {extractError && (
              <Alert className="bg-red-600/20 border-red-600">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-200">
                  {extractError}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Copy/Paste Input - Show when no extracted content from URL */}
        {!rawContent && (
          <Card className="bg-[#2a2920] border-[#4a4735]">
            <CardHeader>
              <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica] flex items-center gap-2">
                <ClipboardPaste className="w-5 h-5" />
                Import from Copy/Paste
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white mb-2 block">Paste Recipe Content</Label>
                <Textarea
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  placeholder="Paste recipe content here...

Example:
SAMPLE RECIPE
1.5 oz. Vodka
3/4 oz. Fresh lemon juice
1/4 oz. Bourbon"
                  className="min-h-[200px] bg-[#383529] border-[#544f3a] text-white placeholder-[#bab59b]"
                />
              </div>
              
              <Button
                onClick={parseWithAI}
                disabled={isParsing || !rawContent.trim()}
                className="w-full bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611] disabled:opacity-50"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Parsing with AI...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Parse with AI
                  </>
                )}
              </Button>

              {parseError && (
                <Alert className="bg-red-600/20 border-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-200">
                    {parseError}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Two Column Layout */}
        {rawContent && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Raw Content */}
            <Card className="bg-[#2a2920] border-[#4a4735]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                    Extracted Content
                  </CardTitle>
                  <Button
                    onClick={parseWithAI}
                    disabled={isParsing || !rawContent}
                    size="sm"
                    className="bg-[#f2c40c] hover:bg-[#e0b40a] text-[#161611]"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Parse with AI
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  placeholder="Extracted content will appear here..."
                  className="min-h-[400px] bg-[#383529] border-[#544f3a] text-white placeholder-[#bab59b]"
                />
                
                {parseError && (
                  <Alert className="bg-red-600/20 border-red-600 mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-200">
                      {parseError}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Right: Parsed Recipe Form */}
            <Card className="bg-[#2a2920] border-[#4a4735]">
              <CardHeader>
                <CardTitle className="text-white [font-family:'Plus_Jakarta_Sans',Helvetica]">
                  Parsed Recipe {parsedRecipe && <Badge className="ml-2 bg-green-600">Ready</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {parsedRecipe ? (
                  <Form {...cocktailForm}>
                    <form onSubmit={cocktailForm.handleSubmit(saveCocktail)} className="space-y-4">
                      <FormField
                        control={cocktailForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-[#383529] border-[#544f3a] text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={cocktailForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Description</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                rows={3}
                                className="bg-[#383529] border-[#544f3a] text-white resize-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />



                      {/* Show parsed ingredients with NEW indicators and category selection */}
                      {ingredientsWithCategories.length > 0 && (
                        <div className="space-y-4">
                          <Label className="text-white">Parsed Ingredients ({ingredientsWithCategories.length})</Label>
                          <div className="space-y-3">
                            {ingredientsWithCategories.map((ing, idx) => (
                              <div key={idx} className="bg-[#383529] border-[#544f3a] rounded p-3">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-white">{ing.name}</span>
                                    {ing.isNew && (
                                      <Badge className="bg-[#f2c40c] text-[#161611] text-xs font-bold">
                                        NEW
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-[#bab59b]">
                                    {formatIngredientMeasurement(ing.amount || '', ing.unit || '')}
                                  </span>
                                </div>
                                
                                {/* Category selection for new ingredients */}
                                {ing.isNew && (
                                  <div className="mt-3 space-y-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      <div>
                                        <Label className="text-white text-xs">Category *</Label>
                                        <Select
                                          value={ing.category}
                                          onValueChange={(value) => {
                                            updateIngredientCategory(idx, value);
                                            if (value !== "spirits") {
                                              updateIngredientCategory(idx, value, "");
                                            }
                                          }}
                                        >
                                          <SelectTrigger className="h-8 bg-[#2a2920] border-[#4a4735] text-white text-xs">
                                            <SelectValue placeholder="Select category" />
                                          </SelectTrigger>
                                          <SelectContent className="bg-[#383629] border-[#544f3b]">
                                            {categories.map((category) => (
                                              <SelectItem 
                                                key={category} 
                                                value={category}
                                                className="text-white capitalize"
                                              >
                                                {category}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      
                                      {/* Sub-category for spirits */}
                                      {ing.category === "spirits" && (
                                        <div>
                                          <Label className="text-white text-xs">Sub-Category *</Label>
                                          <Select
                                            value={ing.subCategory}
                                            onValueChange={(value) => updateIngredientCategory(idx, ing.category, value)}
                                          >
                                            <SelectTrigger className="h-8 bg-[#2a2920] border-[#4a4735] text-white text-xs">
                                              <SelectValue placeholder="Select sub-category" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#383629] border-[#544f3b]">
                                              {spiritSubcategories.map((subcategory) => (
                                                <SelectItem 
                                                  key={subcategory.toLowerCase()} 
                                                  value={subcategory.toLowerCase()}
                                                  className="text-white"
                                                >
                                                  {subcategory}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* Summary of new ingredients requiring categories */}
                          {(() => {
                            const newIngredients = ingredientsWithCategories.filter(ing => ing.isNew);
                            const missingCategories = newIngredients.filter(ing => !ing.category);
                            
                            if (newIngredients.length > 0) {
                              return (
                                <div className="bg-[#2a2920] border border-[#4a4735] rounded p-3">
                                  <div className="text-sm text-[#bab59b]">
                                    <span className="text-[#f2c40c] font-medium">
                                      {newIngredients.length} new ingredient{newIngredients.length !== 1 ? 's' : ''} detected
                                    </span>
                                    {missingCategories.length > 0 && (
                                      <span className="text-red-400 ml-2">
                                        ({missingCategories.length} need{missingCategories.length === 1 ? 's' : ''} category selection)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}

                      {parsedRecipe?.instructions && parsedRecipe.instructions.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-white">Parsed Instructions ({parsedRecipe.instructions.length})</Label>
                          <div className="bg-[#383529] border-[#544f3a] rounded p-3 text-white text-sm space-y-2">
                            {parsedRecipe.instructions.map((step, idx) => (
                              <div key={idx} className="flex gap-2">
                                <span className="text-[#f2c40c] font-bold">{idx + 1}.</span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-[#bab59b]">
                        AI-parsed ingredients and instructions are shown above. 
                        {(() => {
                          const newIngredients = ingredientsWithCategories.filter(ing => ing.isNew);
                          const missingCategories = newIngredients.filter(ing => !ing.category || (ing.category === 'spirits' && !ing.subCategory));
                          
                          if (missingCategories.length > 0) {
                            return (
                              <span className="text-red-400 block mt-1">
                                Please select categories for new ingredients before saving.
                              </span>
                            );
                          }
                          return " Click \"Save Cocktail\" to finalize import.";
                        })()}
                      </div>

                      {saveStatus === "success" && (
                        <Alert className="bg-green-600/20 border-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription className="text-green-200">
                            Recipe imported successfully! Redirecting to cocktail list...
                          </AlertDescription>
                        </Alert>
                      )}

                      {saveStatus === "error" && (
                        <Alert className="bg-red-600/20 border-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-red-200">
                            Failed to save the cocktail. Please try again.
                          </AlertDescription>
                        </Alert>
                      )}
                    </form>
                  </Form>
                ) : (
                  <div className="text-center py-12 text-[#bab59b]">
                    <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Extract content and parse with AI to see the recipe form here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};