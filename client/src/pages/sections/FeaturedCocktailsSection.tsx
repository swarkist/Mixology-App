import { SearchIcon } from "lucide-react";
import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const FeaturedCocktailsSection = (): JSX.Element => {
  // Navigation menu items
  const navItems = [
    { label: "Recipes", href: "/cocktails" },
    { label: "Ingredients", href: "/ingredients" },
    { label: "Bulk Upload", href: "/bulk-upload" },
    { label: "About", href: "#" },
  ];

  return (
    <nav className="flex items-center justify-between px-10 py-3 border-b border-[#e5e8ea] w-full bg-[#161611]">
      {/* Left side: Logo and navigation */}
      <div className="flex items-center gap-8">
        {/* Logo/Brand */}
        <div className="flex items-center gap-4">
          {/* Logo placeholder - empty in original */}
          <div className="relative flex-[0_0_auto]"></div>

          {/* Brand name */}
          <div className="flex flex-col items-start">
            <h1 className="font-bold text-white text-lg leading-[23px] [font-family:'Plus_Jakarta_Sans',Helvetica]">
              Mixology
            </h1>
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex items-center gap-9">
          {navItems.map((item, index) => (
            item.href.startsWith('/') ? (
              <Link key={index} href={item.href}>
                <span className="font-medium text-white text-sm leading-[21px] [font-family:'Plus_Jakarta_Sans',Helvetica] hover:text-[#f2c40c] transition-colors cursor-pointer">
                  {item.label}
                </span>
              </Link>
            ) : (
              <a
                key={index}
                href={item.href}
                className="font-medium text-white text-sm leading-[21px] [font-family:'Plus_Jakarta_Sans',Helvetica] hover:text-[#f2c40c] transition-colors"
              >
                {item.label}
              </a>
            )
          ))}
        </div>
      </div>

      {/* Right side: SearchIcon and buttons */}
      <div className="flex items-center justify-end gap-8">
        {/* SearchIcon bar */}
        <div className="min-w-40 max-w-64 relative">
          <div className="flex items-center h-10 rounded-lg bg-[#383528] overflow-hidden">
            <div className="pl-4 flex items-center">
              <SearchIcon className="h-5 w-5 text-[#bab59b]" />
            </div>
            <Input
              type="text"
              placeholder="Search"
              className="border-0 bg-transparent h-full text-[#bab59b] placeholder:text-[#bab59b] focus-visible:ring-0 focus-visible:ring-offset-0 [font-family:'Plus_Jakarta_Sans',Helvetica]"
            />
          </div>
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-2">
          <Button className="h-10 px-4 font-bold text-sm bg-[#f2c40c] text-[#161611] hover:bg-[#f2c40c]/90 [font-family:'Plus_Jakarta_Sans',Helvetica]">
            Sign Up
          </Button>

          <Button
            variant="outline"
            className="h-10 px-4 font-bold text-sm bg-[#383528] text-white border-0 hover:bg-[#383528]/90 hover:text-white [font-family:'Plus_Jakarta_Sans',Helvetica]"
          >
            Log In
          </Button>
        </div>
      </div>
    </nav>
  );
};
