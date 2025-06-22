import { useQuery } from "@tanstack/react-query";

export interface Perk {
  id: number;
  name: string;
  description?: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
}

export interface PackagePerkValue {
  id: number;
  packageType: string;
  perkId: number;
  valueType: 'boolean' | 'text' | 'number';
  booleanValue?: boolean;
  textValue?: string;
  numberValue?: number;
  displayValue: string;
  isHighlighted: boolean;
  isActive: boolean;
  perk: Perk;
}

export function usePackagePerks() {
  return useQuery<PackagePerkValue[]>({
    queryKey: ['/api/perks']
  });
}