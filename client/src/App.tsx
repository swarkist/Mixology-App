import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";

import { Frame } from "@/pages/Frame";
import { CocktailRecipe } from "@/pages/CocktailRecipe";
import { CocktailList } from "@/pages/CocktailList";
import { Ingredients } from "@/pages/Ingredients";
import { AddCocktail } from "@/pages/AddCocktail";
import { AddIngredient } from "@/pages/AddIngredient";
import { EditIngredient } from "@/pages/EditIngredient";
import PreferredBrands from "@/pages/PreferredBrands";
import AddPreferredBrand from "@/pages/AddPreferredBrand";
import EditPreferredBrand from "@/pages/EditPreferredBrand";
import { ImportCocktail } from "@/pages/ImportCocktail";
import { MyBar } from "@/pages/MyBar";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AdminDashboard from "@/pages/AdminDashboard";
import ForgotPassword from "@/pages/ForgotPassword";

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
      <Route path="/preferred-brands" component={PreferredBrands} />
      <Route path="/add-preferred-brand" component={AddPreferredBrand} />
      <Route path="/edit-preferred-brand/:id" component={EditPreferredBrand} />
      <Route path="/import" component={ImportCocktail} />
      <Route path="/cocktails/import" component={ImportCocktail} />
      <Route path="/recipe/:id?" component={CocktailRecipe} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/admin" component={AdminDashboard} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
