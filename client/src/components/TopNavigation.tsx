import React, { useState } from "react";
import { Search as SearchIcon, Menu, X, LogOut, LogIn, Shield, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  label: string;
  href: string;
}

// Public navigation items (visible to all users)
const publicNavItems: NavItem[] = [
  { label: "Cocktails", href: "/cocktails" },
  { label: "Ingredients", href: "/ingredients" },
  { label: "Preferred Brands", href: "/preferred-brands" },
];

// Authenticated user items (visible to logged-in users)
const userNavItems: NavItem[] = [
  { label: "My Bar", href: "/my-bar" },
];

// Admin-only items (visible to admin users)
const adminNavItems: NavItem[] = [
  { label: "Import Recipe", href: "/import" },
];

const TopNavigation = (): JSX.Element => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, logout, isLoading } = useAuth();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/cocktails?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center justify-between px-10 py-3 border-b border-[#e5e8ea] w-full bg-[#161611]">
        {/* Left side: Logo and navigation */}
        <div className="flex items-center gap-8">
          {/* Logo/Brand */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-start">
              <Link href="/">
                <h1 className="font-bold text-white text-lg leading-[23px] [font-family:'Plus_Jakarta_Sans',Helvetica] hover:text-[#f2c40c] transition-colors cursor-pointer">
                  Mixi Mixology
                </h1>
              </Link>
            </div>
          </div>

          {/* Navigation links */}
          <div className="flex items-center gap-9">
            {/* Public navigation */}
            {publicNavItems.map((item, index) => (
              <Link key={`public-${index}`} href={item.href}>
                <span className="font-medium text-white text-sm leading-[21px] [font-family:'Plus_Jakarta_Sans',Helvetica] hover:text-[#f2c40c] transition-colors cursor-pointer">
                  {item.label}
                </span>
              </Link>
            ))}
            
            {/* User-specific navigation (My Bar etc.) - visible to all but requires login */}
            {userNavItems.map((item, index) => (
              <Link key={`user-${index}`} href={item.href}>
                <span className="font-medium text-white text-sm leading-[21px] [font-family:'Plus_Jakarta_Sans',Helvetica] hover:text-[#f2c40c] transition-colors cursor-pointer">
                  {item.label}
                </span>
              </Link>
            ))}
            
            {/* Admin-only navigation (only show if admin) */}
            {user?.role === 'admin' && adminNavItems.map((item, index) => (
              <Link key={`admin-${index}`} href={item.href}>
                <span className="font-medium text-white text-sm leading-[21px] [font-family:'Plus_Jakarta_Sans',Helvetica] hover:text-[#f2c40c] transition-colors cursor-pointer">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Right side: Search and buttons */}
        <div className="flex items-center justify-end gap-8">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="min-w-40 max-w-64 relative">
            <div className="flex items-center h-10 rounded-lg bg-[#383528] overflow-hidden">
              <div className="pl-4 flex items-center">
                <SearchIcon className="h-5 w-5 text-[#bab59b]" />
              </div>
              <Input
                type="text"
                placeholder="Search cocktails..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="border-0 bg-transparent h-full text-[#bab59b] placeholder:text-[#bab59b] focus-visible:ring-0 focus-visible:ring-offset-0 [font-family:'Plus_Jakarta_Sans',Helvetica]"
              />
            </div>
          </form>

          {/* Auth buttons */}
          <div className="flex items-center gap-2">
            {/* Admin-only Add Recipe button */}
            {user?.role === 'admin' && (
              <Link href="/add-cocktail">
                <Button className="h-10 px-4 font-bold text-sm bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90 [font-family:'Plus_Jakarta_Sans',Helvetica]">
                  Add Recipe
                </Button>
              </Link>
            )}
            
            {/* Authentication UI */}
            {isLoading ? (
              <div className="h-10 w-10 rounded-full bg-[#383528] animate-pulse"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 w-10 rounded-full bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#161611] border-[#383528] text-white">
                  <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#383528]" />
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild className="text-white hover:bg-[#383528]">
                      <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => logout()} 
                    className="text-white hover:bg-[#383528] cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="outline" className="h-10 px-4 border-[#f2c40c] text-[#f2c40c] hover:bg-[#f2c40c] hover:text-[#161611] [font-family:'Plus_Jakarta_Sans',Helvetica]">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[#e5e8ea] w-full bg-[#161611]">
        {/* Logo */}
        <Link href="/">
          <h1 className="font-bold text-white text-lg [font-family:'Plus_Jakarta_Sans',Helvetica]">
            Mixi Mixology
          </h1>
        </Link>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white hover:text-[#f2c40c] hover:bg-transparent"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#161611] border-b border-[#e5e8ea] py-4">
          {/* Search bar */}
          <div className="px-4 py-2">
            <form onSubmit={handleSearch}>
              <div className="flex items-center h-10 rounded-lg bg-[#383528] overflow-hidden">
                <div className="pl-4 flex items-center">
                  <SearchIcon className="h-5 w-5 text-[#bab59b]" />
                </div>
                <Input
                  type="text"
                  placeholder="Search cocktails..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="border-0 bg-transparent h-full text-[#bab59b] placeholder:text-[#bab59b] focus-visible:ring-0 focus-visible:ring-offset-0 [font-family:'Plus_Jakarta_Sans',Helvetica]"
                />
              </div>
            </form>
          </div>

          {/* Navigation links */}
          <div className="px-4 py-2 space-y-3">
            {/* Public navigation */}
            {publicNavItems.map((item, index) => (
              <Link key={`public-${index}`} href={item.href}>
                <div 
                  className="block font-medium text-white text-base py-2 [font-family:'Plus_Jakarta_Sans',Helvetica] hover:text-[#f2c40c] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </div>
              </Link>
            ))}
            
            {/* User-specific navigation (My Bar etc.) - visible to all but requires login */}
            {userNavItems.map((item, index) => (
              <Link key={`user-${index}`} href={item.href}>
                <div 
                  className="block font-medium text-white text-base py-2 [font-family:'Plus_Jakarta_Sans',Helvetica] hover:text-[#f2c40c] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </div>
              </Link>
            ))}
            
            {/* Admin-only navigation (only show if admin) */}
            {user?.role === 'admin' && adminNavItems.map((item, index) => (
              <Link key={`admin-${index}`} href={item.href}>
                <div 
                  className="block font-medium text-white text-base py-2 [font-family:'Plus_Jakarta_Sans',Helvetica] hover:text-[#f2c40c] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </div>
              </Link>
            ))}
            
            {/* Admin-only Add Recipe button */}
            {user?.role === 'admin' && (
              <Link href="/add-cocktail">
                <Button 
                  className="w-full mt-4 h-10 font-bold text-sm bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90 [font-family:'Plus_Jakarta_Sans',Helvetica]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Add Recipe
                </Button>
              </Link>
            )}

            {/* Authentication UI for Mobile */}
            <div className="border-t border-[#383528] pt-4 mt-4">
              {isLoading ? (
                <div className="h-10 rounded bg-[#383528] animate-pulse"></div>
              ) : user ? (
                <>
                  <div className="text-white text-sm mb-2 [font-family:'Plus_Jakarta_Sans',Helvetica]">
                    Signed in as {user.email}
                  </div>
                  {user.role === 'admin' && (
                    <Link href="/admin">
                      <Button 
                        variant="outline" 
                        className="w-full mb-2 h-10 border-[#f2c40c] text-[#f2c40c] hover:bg-[#f2c40c] hover:text-[#161611] [font-family:'Plus_Jakarta_Sans',Helvetica]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full h-10 border-red-500 text-red-500 hover:bg-red-500 hover:text-white [font-family:'Plus_Jakarta_Sans',Helvetica]"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link href="/login">
                  <Button 
                    variant="outline" 
                    className="w-full h-10 border-[#f2c40c] text-[#f2c40c] hover:bg-[#f2c40c] hover:text-[#161611] [font-family:'Plus_Jakarta_Sans',Helvetica]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopNavigation;