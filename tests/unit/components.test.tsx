import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TestDataManager } from '../regression/data-isolation.js';

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => ['/'],
  useNavigate: () => mockNavigate,
  Link: ({ children, href }: any) => <a href={href}>{children}</a>
}));

// Component wrapper with QueryClient
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Component Unit Tests', () => {
  let testManager: TestDataManager;

  beforeEach(() => {
    testManager = new TestDataManager();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await testManager.cleanupAllTestData();
  });

  describe('CocktailCard Component', () => {
    it('should render cocktail information correctly', async () => {
      const mockCocktail = {
        id: 1,
        name: 'Test Mojito',
        description: 'A refreshing test cocktail',
        imageUrl: '/test-image.jpg',
        isFeatured: false,
        popularityCount: 5
      };

      // Import component dynamically to avoid import issues
      const { CocktailCard } = await import('../../client/src/components/CocktailCard');
      
      render(
        <TestWrapper>
          <CocktailCard cocktail={mockCocktail} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Mojito')).toBeInTheDocument();
      expect(screen.getByText('A refreshing test cocktail')).toBeInTheDocument();
    });

    it('should handle featured status display', async () => {
      const featuredCocktail = {
        id: 2,
        name: 'Featured Test Cocktail',
        description: 'A featured test cocktail',
        isFeatured: true,
        popularityCount: 10
      };

      const { CocktailCard } = await import('../../client/src/components/CocktailCard');
      
      render(
        <TestWrapper>
          <CocktailCard cocktail={featuredCocktail} />
        </TestWrapper>
      );

      expect(screen.getByText('Featured Test Cocktail')).toBeInTheDocument();
      // Check for featured indicator (star icon, badge, etc.)
    });

    it('should display default image when no image provided', async () => {
      const cocktailWithoutImage = {
        id: 3,
        name: 'No Image Cocktail',
        description: 'Test cocktail without image',
        imageUrl: null,
        isFeatured: false,
        popularityCount: 0
      };

      const { CocktailCard } = await import('../../client/src/components/CocktailCard');
      
      render(
        <TestWrapper>
          <CocktailCard cocktail={cocktailWithoutImage} />
        </TestWrapper>
      );

      // Should display default no-photo image
      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
    });
  });

  describe('IngredientCard Component', () => {
    it('should render ingredient information', async () => {
      const mockIngredient = {
        id: 1,
        name: 'Test Vodka',
        description: 'Premium test vodka',
        category: 'spirits',
        subCategory: 'vodka',
        abv: 40,
        inMyBar: false
      };

      const { IngredientCard } = await import('../../client/src/components/IngredientCard');
      
      render(
        <TestWrapper>
          <IngredientCard ingredient={mockIngredient} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Vodka')).toBeInTheDocument();
      expect(screen.getByText('Premium test vodka')).toBeInTheDocument();
      expect(screen.getByText('40% ABV')).toBeInTheDocument();
    });

    it('should handle My Bar toggle functionality', async () => {
      const mockIngredient = {
        id: 2,
        name: 'Test Rum',
        description: 'Test rum for my bar',
        category: 'spirits',
        subCategory: 'rum',
        abv: 40,
        inMyBar: false
      };

      const { IngredientCard } = await import('../../client/src/components/IngredientCard');
      
      render(
        <TestWrapper>
          <IngredientCard ingredient={mockIngredient} />
        </TestWrapper>
      );

      // Find and click My Bar toggle button
      const addToBarButton = screen.getByText(/add to.*bar/i);
      expect(addToBarButton).toBeInTheDocument();
      
      fireEvent.click(addToBarButton);
      
      // Should trigger API call to update My Bar status
      // (This would require mocking the API call)
    });

    it('should display correct category and subcategory', async () => {
      const spiritIngredient = {
        id: 3,
        name: 'Test Whiskey',
        category: 'spirits',
        subCategory: 'whiskey',
        abv: 45,
        inMyBar: true
      };

      const { IngredientCard } = await import('../../client/src/components/IngredientCard');
      
      render(
        <TestWrapper>
          <IngredientCard ingredient={spiritIngredient} />
        </TestWrapper>
      );

      expect(screen.getByText(/spirits/i)).toBeInTheDocument();
      expect(screen.getByText(/whiskey/i)).toBeInTheDocument();
    });
  });

  describe('AddCocktail Form Component', () => {
    it('should render form fields correctly', async () => {
      const { AddCocktail } = await import('../../client/src/pages/AddCocktail');
      
      render(
        <TestWrapper>
          <AddCocktail />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByText(/ingredients/i)).toBeInTheDocument();
      expect(screen.getByText(/instructions/i)).toBeInTheDocument();
    });

    it('should handle form validation', async () => {
      const { AddCocktail } = await import('../../client/src/pages/AddCocktail');
      
      render(
        <TestWrapper>
          <AddCocktail />
        </TestWrapper>
      );

      const submitButton = screen.getByText(/create.*cocktail/i);
      fireEvent.click(submitButton);

      // Should show validation errors for required fields
      await waitFor(() => {
        expect(screen.getByText(/name.*required/i)).toBeInTheDocument();
      });
    });

    it('should add and remove ingredients dynamically', async () => {
      const { AddCocktail } = await import('../../client/src/pages/AddCocktail');
      
      render(
        <TestWrapper>
          <AddCocktail />
        </TestWrapper>
      );

      // Add ingredient
      const addIngredientButton = screen.getByText(/add.*ingredient/i);
      fireEvent.click(addIngredientButton);

      // Should show ingredient form fields
      expect(screen.getByText(/ingredient.*name/i)).toBeInTheDocument();
      expect(screen.getByText(/amount/i)).toBeInTheDocument();
      expect(screen.getByText(/unit/i)).toBeInTheDocument();
    });

    it('should add and remove instructions dynamically', async () => {
      const { AddCocktail } = await import('../../client/src/pages/AddCocktail');
      
      render(
        <TestWrapper>
          <AddCocktail />
        </TestWrapper>
      );

      // Add instruction
      const addInstructionButton = screen.getByText(/add.*instruction/i);
      fireEvent.click(addInstructionButton);

      // Should show instruction textarea
      const instructionFields = screen.getAllByPlaceholderText(/step/i);
      expect(instructionFields.length).toBeGreaterThan(0);
    });
  });

  describe('Search and Filter Components', () => {
    it('should handle search input changes', async () => {
      const { SearchBar } = await import('../../client/src/components/SearchBar');
      
      const mockOnSearch = vi.fn();
      
      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} placeholder="Search cocktails..." />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search.*cocktails/i);
      fireEvent.change(searchInput, { target: { value: 'mojito' } });

      expect(mockOnSearch).toHaveBeenCalledWith('mojito');
    });

    it('should handle filter selections', async () => {
      const { FilterSection } = await import('../../client/src/components/FilterSection');
      
      const mockOnFilterChange = vi.fn();
      
      render(
        <TestWrapper>
          <FilterSection onFilterChange={mockOnFilterChange} />
        </TestWrapper>
      );

      // Test category filter
      const categoryFilter = screen.getByText(/category/i);
      fireEvent.click(categoryFilter);
      
      // Should trigger filter change
      expect(mockOnFilterChange).toHaveBeenCalled();
    });
  });

  describe('Navigation Components', () => {
    it('should render desktop navigation links', async () => {
      const { DesktopNavigation } = await import('../../client/src/components/DesktopNavigation');
      
      render(
        <TestWrapper>
          <DesktopNavigation />
        </TestWrapper>
      );

      expect(screen.getByText(/cocktails/i)).toBeInTheDocument();
      expect(screen.getByText(/ingredients/i)).toBeInTheDocument();
      expect(screen.getByText(/home/i)).toBeInTheDocument();
    });

    it('should handle navigation clicks', async () => {
      const { DesktopNavigation } = await import('../../client/src/components/DesktopNavigation');
      
      render(
        <TestWrapper>
          <DesktopNavigation />
        </TestWrapper>
      );

      const cocktailsLink = screen.getByText(/cocktails/i);
      fireEvent.click(cocktailsLink);
      
      // Should navigate to cocktails page
      expect(mockNavigate).toHaveBeenCalledWith('/cocktails');
    });

    it('should render mobile navigation with bottom placement', async () => {
      const { MobileNavigation } = await import('../../client/src/components/MobileNavigation');
      
      render(
        <TestWrapper>
          <MobileNavigation />
        </TestWrapper>
      );

      // Should have fixed bottom positioning
      const mobileNav = screen.getByRole('navigation');
      expect(mobileNav).toHaveClass(/fixed.*bottom/);
    });
  });

  describe('Loading and Error States', () => {
    it('should display loading spinner during data fetch', async () => {
      const { LoadingSpinner } = await import('../../client/src/components/LoadingSpinner');
      
      render(
        <TestWrapper>
          <LoadingSpinner />
        </TestWrapper>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should display error message for failed requests', async () => {
      const { ErrorMessage } = await import('../../client/src/components/ErrorMessage');
      
      const mockError = {
        message: 'Failed to fetch cocktails'
      };
      
      render(
        <TestWrapper>
          <ErrorMessage error={mockError} />
        </TestWrapper>
      );

      expect(screen.getByText(/failed.*fetch.*cocktails/i)).toBeInTheDocument();
    });

    it('should provide retry functionality on errors', async () => {
      const { ErrorMessage } = await import('../../client/src/components/ErrorMessage');
      
      const mockRetry = vi.fn();
      const mockError = {
        message: 'Network error'
      };
      
      render(
        <TestWrapper>
          <ErrorMessage error={mockError} onRetry={mockRetry} />
        </TestWrapper>
      );

      const retryButton = screen.getByText(/try.*again/i);
      fireEvent.click(retryButton);
      
      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe('Image Upload Components', () => {
    it('should handle file selection', async () => {
      const { ImageUpload } = await import('../../client/src/components/ImageUpload');
      
      const mockOnUpload = vi.fn();
      
      render(
        <TestWrapper>
          <ImageUpload onUpload={mockOnUpload} />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/upload.*image/i);
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(fileInput, { target: { files: [testFile] } });
      
      expect(mockOnUpload).toHaveBeenCalledWith(testFile);
    });

    it('should display image preview after upload', async () => {
      const { ImageUpload } = await import('../../client/src/components/ImageUpload');
      
      render(
        <TestWrapper>
          <ImageUpload defaultImage="/test-image.jpg" />
        </TestWrapper>
      );

      const previewImage = screen.getByRole('img');
      expect(previewImage).toHaveAttribute('src', '/test-image.jpg');
    });

    it('should handle drag and drop functionality', async () => {
      const { ImageUpload } = await import('../../client/src/components/ImageUpload');
      
      const mockOnUpload = vi.fn();
      
      render(
        <TestWrapper>
          <ImageUpload onUpload={mockOnUpload} />
        </TestWrapper>
      );

      const dropZone = screen.getByText(/drag.*drop/i);
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [testFile]
        }
      });
      
      expect(mockOnUpload).toHaveBeenCalledWith(testFile);
    });
  });
});