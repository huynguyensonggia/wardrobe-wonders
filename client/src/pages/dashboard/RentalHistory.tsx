import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { mockProducts } from '@/data/mockData';
import { History } from 'lucide-react';

// Mock rental history
const mockRentalHistory = [
  {
    id: '3',
    product: mockProducts[2],
    startDate: '2025-12-20',
    endDate: '2025-12-27',
    status: 'RETURNED' as const,
    totalPrice: 280,
  },
  {
    id: '4',
    product: mockProducts[3],
    startDate: '2025-11-15',
    endDate: '2025-11-22',
    status: 'RETURNED' as const,
    totalPrice: 525,
  },
];

export default function RentalHistory() {
  if (mockRentalHistory.length === 0) {
    return (
      <div className="text-center py-16">
        <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="font-display text-xl font-medium mb-2">No rental history</h2>
        <p className="text-muted-foreground">
          Your past rentals will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-medium">Rental History</h2>

      <div className="space-y-4">
        {mockRentalHistory.map((rental) => (
          <Card key={rental.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-20 rounded overflow-hidden flex-shrink-0">
                  <img 
                    src={rental.product.images[0].url} 
                    alt={rental.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{rental.product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {rental.startDate} — {rental.endDate}
                  </p>
                </div>

                <div className="text-right">
                  <Badge variant="secondary">{rental.status}</Badge>
                  <p className="text-sm font-medium mt-1">${rental.totalPrice}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
