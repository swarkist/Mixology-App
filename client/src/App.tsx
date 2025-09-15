import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import MixiChat from "@/components/MixiChat";
import NotFound from "@/pages/not-found";
import { FooterSection } from "@/pages/sections/FooterSection";

import { Frame } from "@/pages/Frame";
import { CocktailRecipe } from "@/pages/CocktailRecipe";
import { CocktailList } from "@/pages/CocktailList";
import { Ingredients } from "@/pages/Ingredients";
import { IngredientDetail } from "@/pages/IngredientDetail";
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
import ResetPassword from "@/pages/ResetPassword";
import TermsPage from "@/pages/TermsPage";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import BatchOps from "@/pages/admin/BatchOps";

function Router() {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={Frame} />
      <Route path="/cocktails" component={CocktailList} />
      {/* Admin-only routes */}
      <Route path="/add-cocktail">
        {() => (
          <ProtectedRoute requireRoles={["admin", "reviewer"]}>
            <AddCocktail />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/edit-cocktail/:id?">
        {() => (
          <ProtectedRoute requireRoles={["admin", "reviewer"]}>
            <AddCocktail />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/add-ingredient">
        {() => (
          <ProtectedRoute requireRoles={["admin", "reviewer"]}>
            <AddIngredient />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/edit-ingredient/:id">
        {() => (
          <ProtectedRoute requireRoles={["admin", "reviewer"]}>
            <EditIngredient />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/import">
        {() => (
          <ProtectedRoute requireRoles={["admin", "reviewer"]}>
            <ImportCocktail />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/cocktails/import">
        {() => (
          <ProtectedRoute requireRoles={["admin", "reviewer"]}>
            <ImportCocktail />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin">
        {() => (
          <ProtectedRoute requireRoles={["admin", "reviewer"]}>
            <AdminDashboard />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/admin/batch-ops">
        {() => (
          <ProtectedRoute requireRoles={["admin"]}>
            <BatchOps />
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
      <Route path="/ingredient/:ingredientId" component={IngredientDetail} />
      <Route path="/preferred-brands" component={PreferredBrands} />
      <Route path="/my-bar" component={MyBar} />
      <Route path="/recipe/:id?" component={CocktailRecipe} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset" component={ResetPassword} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPolicy} />
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
          <div className="flex flex-col min-h-screen">
            <div className="flex-1">
              <Toaster />
              <Router />
              <MixiChat />
            </div>
            <FooterSection />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
