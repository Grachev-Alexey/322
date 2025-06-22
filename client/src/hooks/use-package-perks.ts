import { useQuery } from "@tanstack/react-query";

export interface PackagePerk {
  id: number;
  packageType: string;
  name: string;
  icon: string;
  isActive: boolean;
}

export function usePackagePerks(packageType: string) {
  return useQuery<PackagePerk[]>({
    queryKey: ['/api/packages', packageType, 'perks'],
    enabled: !!packageType
  });
}