import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type GranularityType = "day" | "week" | "month" | "year";

interface ChartGranularityProps {
  value: GranularityType;
  onChange: (value: GranularityType) => void;
}

export function ChartGranularity({ value, onChange }: ChartGranularityProps) {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500">Granularité:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Jour</SelectItem>
          <SelectItem value="week">Semaine</SelectItem>
          <SelectItem value="month">Mois</SelectItem>
          <SelectItem value="year">Année</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
