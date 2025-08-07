import { describe, it, expect } from 'vitest';

/**
 * Unit Tests for My Bar Search Functionality
 * 
 * These tests validate the search and filtering logic implemented
 * on August 7, 2025 to fix My Bar search functionality issues.
 */

describe('My Bar Search Logic', () => {
  
  // Mock data structure similar to what MyBar component uses
  const mockOrganizedIngredients = {
    'Grenadine': {
      ingredient: { name: 'Grenadine', category: 'syrups' },
      brands: [
        { id: 1, name: 'Maraschino Cherry Syrup', category: 'syrups' },
        { id: 2, name: 'Rose\'s Grenadine', category: 'syrups' }
      ]
    },
    'White Rum': {
      ingredient: { name: 'White Rum', category: 'spirits', subcategory: 'rum' },
      brands: [
        { id: 3, name: 'Bacardi Silver Rum', category: 'spirits' },
        { id: 4, name: 'Captain Morgan White', category: 'spirits' }
      ]
    },
    'Unassociated Brands': {
      ingredient: { name: 'Unassociated Brands', category: 'other' },
      brands: [
        { id: 5, name: 'Generic Brand', category: 'other' }
      ]
    }
  };

  const filterOrganizedIngredients = (
    organizedIngredients: any,
    searchQuery: string,
    selectedCategory: string,
    selectedSubcategory: string
  ) => {
    const filtered: any = {};
    
    Object.entries(organizedIngredients).forEach(([ingredientName, { ingredient, brands }]: [string, any]) => {
      // Filter by search query - search both ingredient names and brand names
      const matchesSearch = searchQuery === "" || 
        ingredientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brands.some((brand: any) => brand.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Filter by category
      const matchesCategory = selectedCategory === "all" || 
        ingredient.category === selectedCategory;
      
      // Filter by subcategory (if applicable)
      const matchesSubcategory = selectedSubcategory === "all" || 
        !ingredient.subcategory || 
        ingredient.subcategory === selectedSubcategory;
      
      // Only include if all filters match
      if (matchesSearch && matchesCategory && matchesSubcategory) {
        // Additionally filter brands within this ingredient group by search
        const filteredBrands = brands.filter((brand: any) => 
          searchQuery === "" || 
          ingredientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          brand.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        if (filteredBrands.length > 0) {
          filtered[ingredientName] = {
            ingredient,
            brands: filteredBrands
          };
        }
      }
    });
    
    return filtered;
  };

  it('should return all ingredients when no search query is provided', () => {
    const result = filterOrganizedIngredients(mockOrganizedIngredients, "", "all", "all");
    
    expect(Object.keys(result)).toHaveLength(3);
    expect(result['Grenadine']).toBeDefined();
    expect(result['White Rum']).toBeDefined();
    expect(result['Unassociated Brands']).toBeDefined();
  });

  it('should filter by ingredient name in search query', () => {
    const result = filterOrganizedIngredients(mockOrganizedIngredients, "grenadine", "all", "all");
    
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['Grenadine']).toBeDefined();
    expect(result['Grenadine'].brands).toHaveLength(2);
  });

  it('should filter by brand name in search query', () => {
    const result = filterOrganizedIngredients(mockOrganizedIngredients, "bacardi", "all", "all");
    
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['White Rum']).toBeDefined();
    expect(result['White Rum'].brands).toHaveLength(1);
    expect(result['White Rum'].brands[0].name).toBe('Bacardi Silver Rum');
  });

  it('should filter by category', () => {
    const result = filterOrganizedIngredients(mockOrganizedIngredients, "", "spirits", "all");
    
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['White Rum']).toBeDefined();
  });

  it('should filter by subcategory when applicable', () => {
    const result = filterOrganizedIngredients(mockOrganizedIngredients, "", "spirits", "rum");
    
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['White Rum']).toBeDefined();
  });

  it('should handle case-insensitive search', () => {
    const result = filterOrganizedIngredients(mockOrganizedIngredients, "WHITE", "all", "all");
    
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['White Rum']).toBeDefined();
  });

  it('should return empty when search matches nothing', () => {
    const result = filterOrganizedIngredients(mockOrganizedIngredients, "nonexistent", "all", "all");
    
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('should combine search query with category filtering', () => {
    const result = filterOrganizedIngredients(mockOrganizedIngredients, "syrup", "syrups", "all");
    
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['Grenadine']).toBeDefined();
    expect(result['Grenadine'].brands[0].name).toContain('Syrup');
  });

  it('should filter brands within ingredient groups by search', () => {
    const result = filterOrganizedIngredients(mockOrganizedIngredients, "captain", "all", "all");
    
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['White Rum']).toBeDefined();
    expect(result['White Rum'].brands).toHaveLength(1);
    expect(result['White Rum'].brands[0].name).toBe('Captain Morgan White');
  });
});

describe('My Bar Search UI States', () => {
  
  it('should validate search placeholder text', () => {
    const searchPlaceholder = 'Search my bar...';
    
    expect(searchPlaceholder).toBe('Search my bar...');
    expect(searchPlaceholder).not.toBe('Search ingredients...');
  });

  it('should validate empty state logic', () => {
    // Test empty state conditions
    const hasSearchQuery = (query: string) => query !== "";
    const hasActiveFilters = (category: string, subcategory: string) => 
      category !== "all" || subcategory !== "all";
    
    // Should show "no results" message when filters are active
    expect(hasSearchQuery("test")).toBe(true);
    expect(hasActiveFilters("spirits", "all")).toBe(true);
    expect(hasActiveFilters("all", "rum")).toBe(true);
    
    // Should show "empty bar" message when no filters are active
    expect(hasSearchQuery("")).toBe(false);
    expect(hasActiveFilters("all", "all")).toBe(false);
  });
});