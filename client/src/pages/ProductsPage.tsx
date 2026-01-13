import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '@/components/products/ProductCard';
import { mockProducts, mockCategories } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { ProductStatus } from '@/types';

const ALL_VALUE = 'all';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    size: '',
    color: '',
    status: '' as ProductStatus | '',
  });

  const allSizes = [...new Set(mockProducts.flatMap(p => p.sizes))].sort();
  const allColors = [...new Set(mockProducts.flatMap(p => p.colors))].sort();

  const filteredProducts = useMemo(() => {
    return mockProducts.filter(product => {
      if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.category && product.category.slug !== filters.category) {
        return false;
      }
      if (filters.size && !product.sizes.includes(filters.size)) {
        return false;
      }
      if (filters.color && !product.colors.includes(filters.color)) {
        return false;
      }
      if (filters.status && product.status !== filters.status) {
        return false;
      }
      return true;
    });
  }, [filters]);

  const updateFilter = (key: keyof typeof filters, value: string) => {
    // Treat "all" as clearing the filter
    const actualValue = value === ALL_VALUE ? '' : value;
    setFilters(prev => ({ ...prev, [key]: actualValue }));
    if (actualValue) {
      searchParams.set(key, actualValue);
    } else {
      searchParams.delete(key);
    }
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      size: '',
      color: '',
      status: '',
    });
    setSearchParams({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  // Helper to get select value (convert empty string to "all" for display)
  const getSelectValue = (value: string) => value || ALL_VALUE;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">
            Our Collection
          </h1>
          <p className="text-muted-foreground">
            {filteredProducts.length} pieces available
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
            
            {/* Desktop Filters */}
            <div className="hidden lg:flex gap-2">
              <Select 
                value={getSelectValue(filters.category)} 
                onValueChange={(v) => updateFilter('category', v)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Categories</SelectItem>
                  {mockCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={getSelectValue(filters.size)} 
                onValueChange={(v) => updateFilter('size', v)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Sizes</SelectItem>
                  {allSizes.map(size => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={getSelectValue(filters.color)} 
                onValueChange={(v) => updateFilter('color', v)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Colors</SelectItem>
                  {allColors.map(color => (
                    <SelectItem key={color} value={color}>{color}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={getSelectValue(filters.status)} 
                onValueChange={(v) => updateFilter('status', v as ProductStatus | '')}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Status</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="RENTED">Rented</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="lg:hidden mb-8 p-4 bg-secondary rounded-lg animate-slide-down">
            <div className="grid grid-cols-2 gap-3">
              <Select 
                value={getSelectValue(filters.category)} 
                onValueChange={(v) => updateFilter('category', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Categories</SelectItem>
                  {mockCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={getSelectValue(filters.size)} 
                onValueChange={(v) => updateFilter('size', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Sizes</SelectItem>
                  {allSizes.map(size => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={getSelectValue(filters.color)} 
                onValueChange={(v) => updateFilter('color', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Colors</SelectItem>
                  {allColors.map(color => (
                    <SelectItem key={color} value={color}>{color}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={getSelectValue(filters.status)} 
                onValueChange={(v) => updateFilter('status', v as ProductStatus | '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Status</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="RENTED">Rented</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {filteredProducts.map((product, i) => (
              <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground mb-4">No products found</p>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
