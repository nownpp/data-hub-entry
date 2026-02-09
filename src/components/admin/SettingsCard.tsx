import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Settings, Save } from "lucide-react";

interface SettingsCardProps {
  servicePrice: number;
  commissionAmount: number;
  onSettingsUpdated: () => void;
}

const SettingsCard = ({ servicePrice, commissionAmount, onSettingsUpdated }: SettingsCardProps) => {
  const [editPrice, setEditPrice] = useState(servicePrice.toString());
  const [editCommission, setEditCommission] = useState(commissionAmount.toString());
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const price = parseFloat(editPrice);
    const commission = parseFloat(editCommission);

    if (isNaN(price) || price <= 0) {
      toast.error("سعر الخدمة يجب أن يكون رقماً موجباً");
      return;
    }
    if (isNaN(commission) || commission < 0) {
      toast.error("العمولة يجب أن تكون رقماً صحيحاً");
      return;
    }
    if (commission >= price) {
      toast.error("العمولة يجب أن تكون أقل من سعر الخدمة");
      return;
    }

    setIsSaving(true);

    const { error: e1 } = await supabase
      .from("system_settings")
      .update({ value: price.toString(), updated_at: new Date().toISOString() })
      .eq("key", "service_price");

    const { error: e2 } = await supabase
      .from("system_settings")
      .update({ value: commission.toString(), updated_at: new Date().toISOString() })
      .eq("key", "commission_amount");

    setIsSaving(false);

    if (e1 || e2) {
      toast.error("حدث خطأ أثناء حفظ الإعدادات");
      return;
    }

    toast.success("تم حفظ الإعدادات بنجاح");
    onSettingsUpdated();
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          إعدادات الأسعار والعمولات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium text-foreground">سعر الخدمة (لكل طالب)</label>
            <Input
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              className="text-right"
              dir="ltr"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium text-foreground">عمولة المُدخل (لكل طالب)</label>
            <Input
              value={editCommission}
              onChange={(e) => setEditCommission(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              className="text-right"
              dir="ltr"
            />
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 shrink-0">
            <Save className="w-4 h-4" />
            {isSaving ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>المبلغ المطلوب توريده لكل طالب: <strong className="text-foreground">{(parseFloat(editPrice) - parseFloat(editCommission)) || 0}</strong></span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsCard;
