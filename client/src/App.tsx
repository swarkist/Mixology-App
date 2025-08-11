import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import MyBar from "@/pages/MyBar";
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
      {/* Admin-only routes */}
      <Route path="/add-cocktail">
        {() => (
          <ProtectedRoute requireRole="admin">
            <AddCocktail />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/edit-cocktail/:id?">
        {() => (
          <ProtectedRoute requireRole="admin">
            <AddCocktail />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/add-ingredient">
        {() => (
          <ProtectedRoute requireRole="admin">
            <AddIngredient />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/edit-ingredient/:id">
        {() => (
          <ProtectedRoute requireRole="admin">
            <EditIngredient />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/import">
        {() => (
          <ProtectedRoute requireRole="admin">
            <ImportCocktail />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/cocktails/import">
        {() => (
          <ProtectedRoute requireRole="admin">
            <ImportCocktail />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin">
        {() => (
          <ProtectedRoute requireRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        )}
      </Route>
      
      {/* User-specific routes (handle auth internally) */}
      <Route path="/add-preferred-brand">
        {() => (
          <ProtectedRoute>
            <AddPreferredBrand />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/edit-preferred-brand/:id">
        {() => (
          <ProtectedRoute>
            <EditPreferredBrand />
          </ProtectedRoute>
        )}
      </Route>
      
      {/* Public routes */}
      <Route path="/ingredients" component={Ingredients} />
      <Route path="/preferred-brands" component={PreferredBrands} />
      <Route path="/my-bar" component={MyBar} />
      <Route path="/recipe/:id?" component={CocktailRecipe} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
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
