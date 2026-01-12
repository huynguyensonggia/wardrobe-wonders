import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];

  return (
    <Link 
      to={`/products/${product.id}`}
      className="group block"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-secondary mb-4">
        <img 
          src={primaryImage?.url} 
          alt={product.name}
          className="w-full h-full object-cover image-zoom"
        />
        {product.status !== 'AVAILABLE' && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Badge variant="secondary" className="text-sm">
              {product.status === 'RENTED' ? 'Currently Rented' : 'Unavailable'}
            </Badge>
          </div>
        )}
        {product.featured && (
          <Badge className="absolute top-3 left-3 bg-gold text-gold-foreground">
            Featured
          </Badge>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {product.category.name}
        </p>
        <h3 className="font-display text-lg font-medium group-hover:text-accent transition-colors">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">
            ${product.pricePerDay}/day
          </span>
          <span className="text-xs text-muted-foreground">
            ${product.deposit} deposit
          </span>
        </div>
      </div>
    </Link>
  );
}
