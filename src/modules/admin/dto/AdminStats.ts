export type AdminStats = {
  totalProducts: number;
  activeRentals: number;
  revenue: number;
  totalUsers: number;
  weeklyRentals: { label: string; value: number }[]; // chart
  monthlyRevenue: { label: string; value: number }[]; // chart
};
