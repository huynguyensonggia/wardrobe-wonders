import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockProducts } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  ChevronLeft, 
  Heart, 
  Share2, 
  Calendar as CalendarIcon,
  Sparkles,
  Truck,
  Shield,
  ArrowRight
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ProductDetailPage() {
  const { id } = useParams();
  const product = mockProducts.find(p => p.id === id);
  
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [selectedImage, setSelectedImage] = useState(0);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl mb-4">Product not found</h1>
          <Button asChild>
            <Link to="/products">Back to Collection</Link>
          </Button>
        </div>
      </div>
    );
  }

  const rentalDays = dateRange.from && dateRange.to 
    ? differenceInDays(dateRange.to, dateRange.from) + 1 
    : 0;
  const totalPrice = rentalDays * product.pricePerDay;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            to="/products" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Collection
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[3/4] overflow-hidden rounded-lg bg-secondary">
              <img 
                src={product.images[selectedImage]?.url} 
                alt={product.images[selectedImage]?.alt}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      "w-20 h-24 rounded-md overflow-hidden border-2 transition-colors",
                      selectedImage === i ? "border-accent" : "border-transparent"
                    )}
                  >
                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:py-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
                  {product.category.name}
                </p>
                <h1 className="font-display text-3xl md:text-4xl font-semibold">
                  {product.name}
                </h1>
              </div>
              <div className="flex gap-2">
                <Button variant="icon" size="icon">
                  <Heart className="w-5 h-5" />
                </Button>
                <Button variant="icon" size="icon">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-2xl font-medium">${product.pricePerDay}/day</span>
              <span className="text-muted-foreground">${product.deposit} deposit</span>
            </div>

            {product.status !== 'AVAILABLE' && (
              <Badge variant="secondary" className="mb-4">
                Currently Unavailable
              </Badge>
            )}

            <p className="text-muted-foreground mb-8 leading-relaxed">
              {product.description}
            </p>

            {/* Size Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Select Size</label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "w-12 h-12 rounded-md border text-sm font-medium transition-all",
                      selectedSize === size 
                        ? "border-primary bg-primary text-primary-foreground" 
                        : "border-border hover:border-accent"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            {product.colors.length > 1 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Select Color</label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "px-4 py-2 rounded-md border text-sm transition-all",
                        selectedColor === color 
                          ? "border-primary bg-primary text-primary-foreground" 
                          : "border-border hover:border-accent"
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Date Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium mb-3">Rental Period</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
                        </>
                      ) : (
                        format(dateRange.from, 'MMM d, yyyy')
                      )
                    ) : (
                      "Select dates"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    disabled={{ before: new Date() }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Price Summary */}
            {rentalDays > 0 && (
              <div className="bg-secondary rounded-lg p-4 mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>${product.pricePerDay} × {rentalDays} days</span>
                  <span>${totalPrice}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Refundable deposit</span>
                  <span>${product.deposit}</span>
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between font-medium">
                    <span>Total due today</span>
                    <span>${totalPrice + product.deposit}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                variant="hero" 
                size="xl" 
                className="w-full"
                disabled={product.status !== 'AVAILABLE' || !selectedSize || rentalDays === 0}
              >
                Rent Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button variant="hero-outline" size="lg" className="w-full" asChild>
                <Link to={`/try-on?product=${product.id}`}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Try On Virtually
                </Link>
              </Button>
            </div>

            {/* Features */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm">
                <Truck className="w-5 h-5 text-accent" />
                <span>Free shipping over $100</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-5 h-5 text-accent" />
                <span>Damage protection included</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
