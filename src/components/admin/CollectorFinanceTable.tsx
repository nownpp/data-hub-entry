import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Banknote } from "lucide-react";

interface Collector {
  id: string;
  name: string;
  is_active: boolean;
}

interface Submission {
  id: string;
  collector_name: string | null;
  is_delivered: boolean;
}

interface CollectorFinanceTableProps {
  collectors: Collector[];
  submissions: Submission[];
  servicePrice: number;
  commissionAmount: number;
}

const CollectorFinanceTable = ({
  collectors,
  submissions,
  servicePrice,
  commissionAmount,
}: CollectorFinanceTableProps) => {
  const netPerSubmission = servicePrice - commissionAmount;

  const collectorFinances = collectors.map((c) => {
    const collectorSubs = submissions.filter((s) => s.collector_name === c.name);
    const total = collectorSubs.length;
    const delivered = collectorSubs.filter((s) => s.is_delivered).length;
    const pending = total - delivered;

    return {
      name: c.name,
      isActive: c.is_active,
      total,
      commission: total * commissionAmount,
      totalCollected: total * servicePrice,
      toDeliver: total * netPerSubmission,
      delivered: delivered * netPerSubmission,
      pending: pending * netPerSubmission,
      pendingCount: pending,
    };
  }).sort((a, b) => b.total - a.total);

  if (collectorFinances.length === 0) return null;

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Banknote className="w-5 h-5 text-primary" />
          الملخص المالي للمُدخلين
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-semibold">المُدخل</TableHead>
                <TableHead className="text-right font-semibold">التسجيلات</TableHead>
                <TableHead className="text-right font-semibold">العمولة المستحقة</TableHead>
                <TableHead className="text-right font-semibold">إجمالي المحصّل</TableHead>
                <TableHead className="text-right font-semibold">المطلوب توريده</TableHead>
                <TableHead className="text-right font-semibold">تم توريده</TableHead>
                <TableHead className="text-right font-semibold">معلّق</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collectorFinances.map((cf) => (
                <TableRow key={cf.name} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">
                    {cf.name}
                    {!cf.isActive && (
                      <span className="mr-2 text-xs text-destructive">(معطّل)</span>
                    )}
                  </TableCell>
                  <TableCell className="font-bold text-primary">{cf.total}</TableCell>
                  <TableCell className="text-success font-semibold">{cf.commission}</TableCell>
                  <TableCell>{cf.totalCollected}</TableCell>
                  <TableCell className="font-semibold">{cf.toDeliver}</TableCell>
                  <TableCell className="text-success">{cf.delivered}</TableCell>
                  <TableCell>
                    {cf.pendingCount > 0 ? (
                      <span className="text-destructive font-semibold">{cf.pending}</span>
                    ) : (
                      <span className="text-success">✓</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CollectorFinanceTable;
