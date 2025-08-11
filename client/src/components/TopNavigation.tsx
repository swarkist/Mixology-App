import React, { useState } from "react";
import { Search as SearchIcon, Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Cocktails", href: "/cocktails" },
  { label: "Ingredients", href: "/ingredients" },
  { label: "Preferred Brands", href: "/preferred-brands" },
  { label: "My Bar", href: "/my-bar" },
  { label: "Import Recipe", href: "/import" },
];

const TopNavigation = (): JSX.Element => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();

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
                  Mixology
                </h1>
              </Link>
            </div>
          </div>

          {/* Navigation links */}
          <div className="flex items-center gap-9">
            {navItems.map((item, index) => (
              <Link key={index} href={item.href}>
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
            <Link href="/add-cocktail">
              <Button className="h-10 px-4 font-bold text-sm bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90 [font-family:'Plus_Jakarta_Sans',Helvetica]">
                Add Recipe
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[#e5e8ea] w-full bg-[#161611]">
        {/* Logo */}
        <Link href="/">
          <h1 className="font-bold text-white text-lg [font-family:'Plus_Jakarta_Sans',Helvetica]">
            Mixology
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
            {navItems.map((item, index) => (
              <Link key={index} href={item.href}>
                <div 
                  className="block font-medium text-white text-base py-2 [font-family:'Plus_Jakarta_Sans',Helvetica] hover:text-[#f2c40c] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </div>
              </Link>
            ))}
            
            {/* Add Recipe button */}
            <Link href="/add-cocktail">
              <Button 
                className="w-full mt-4 h-10 font-bold text-sm bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90 [font-family:'Plus_Jakarta_Sans',Helvetica]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Add Recipe
              </Button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default TopNavigation;