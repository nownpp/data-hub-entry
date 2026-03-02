import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus, Banknote, TrendingUp, Truck } from "lucide-react";

interface FinancialStatsCardsProps {
  totalSubmissions: number;
  collectorsCount: number;
  totalRevenue: number;
  totalCommissions: number;
  deliveredAmount: number;
  pendingAmount: number;
}

const FinancialStatsCards = ({
  totalSubmissions,
  collectorsCount,
  totalRevenue,
  totalCommissions,
  deliveredAmount,
  pendingAmount,
}: FinancialStatsCardsProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 animate-fade-up">
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <Users className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground truncate">التسجيلات</p>
              <p className="text-xl font-bold text-foreground">{totalSubmissions}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <UserPlus className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground truncate">المُدخلين</p>
              <p className="text-xl font-bold text-foreground">{collectorsCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <Banknote className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground truncate">إجمالي الإيرادات</p>
              <p className="text-xl font-bold text-foreground">{totalRevenue}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
              <Truck className="w-4.5 h-4.5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground truncate">تم توريده</p>
              <p className="text-xl font-bold text-success">{deliveredAmount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4.5 h-4.5 text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground truncate">لم يتم تسليمه</p>
              <p className="text-xl font-bold text-destructive">{pendingAmount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialStatsCards;
