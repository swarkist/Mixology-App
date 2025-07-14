import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Frame } from "@/pages/Frame";
import { CocktailRecipe } from "@/pages/CocktailRecipe";

function Router() {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={Frame} />
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
