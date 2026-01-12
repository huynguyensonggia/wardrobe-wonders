import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { mockProducts } from '@/data/mockData';

// Mock current rentals
const mockCurrentRentals = [
  {
    id: '1',
    product: mockProducts[0],
    startDate: '2026-01-10',
    endDate: '2026-01-17',
    status: 'ACTIVE' as const,
    totalPrice: 595,
    depositPaid: 250,
  },
  {
    id: '2',
    product: mockProducts[1],
    startDate: '2026-01-15',
    endDate: '2026-01-20',
    status: 'PENDING' as const,
    totalPrice: 275,
    depositPaid: 150,
  },
];

export default function MyRentals() {
  if (mockCurrentRentals.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="font-display text-xl font-medium mb-2">No active rentals</h2>
        <p className="text-muted-foreground mb-6">
          Start exploring our collection to find your perfect piece
        </p>
        <Button asChild>
          <Link to="/products">
            Browse Collection
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-medium">Current Rentals</h2>
        <Badge variant="secondary">{mockCurrentRentals.length} active</Badge>
      </div>

      <div className="space-y-4">
        {mockCurrentRentals.map((rental) => (
          <Card key={rental.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row">
                {/* Product Image */}
                <div className="sm:w-32 h-40 sm:h-auto">
                  <img 
                    src={rental.product.images[0].url} 
                    alt={rental.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium">{rental.product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {rental.product.category.name}
                      </p>
                    </div>
                    <Badge 
                      variant={rental.status === 'ACTIVE' ? 'default' : 'secondary'}
                    >
                      {rental.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Calendar className="w-4 h-4" />
                    {rental.startDate} — {rental.endDate}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      Total: <span className="font-medium">${rental.totalPrice}</span>
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Extend Rental
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
