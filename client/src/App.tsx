import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Frame } from "@/pages/Frame";
import { CocktailRecipe } from "@/pages/CocktailRecipe";
import { CocktailList } from "@/pages/CocktailList";
import { Ingredients } from "@/pages/Ingredients";
import { AddCocktail } from "@/pages/AddCocktail";
import { AddIngredient } from "@/pages/AddIngredient";
import { EditIngredient } from "@/pages/EditIngredient";
import { BulkUpload } from "@/pages/BulkUpload";
import { MyBar } from "@/pages/MyBar";

function Router() {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={Frame} />
      <Route path="/cocktails" component={CocktailList} />
      <Route path="/add-cocktail" component={AddCocktail} />
      <Route path="/edit-cocktail/:id?" component={AddCocktail} />
      <Route path="/ingredients" component={Ingredients} />
      <Route path="/my-bar" component={MyBar} />
      <Route path="/add-ingredient" component={AddIngredient} />
      <Route path="/edit-ingredient/:id" component={EditIngredient} />
      <Route path="/bulk-upload" component={BulkUpload} />
      <Route path="/recipe/:id?" component={CocktailRecipe} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
