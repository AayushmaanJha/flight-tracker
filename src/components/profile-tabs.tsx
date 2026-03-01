"use client";

import { Profile } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProfileTabsProps {
  profiles: Profile[];
  activeProfileId: string | null;
  onSelect: (id: string) => void;
}

export function ProfileTabs({
  profiles,
  activeProfileId,
  onSelect,
}: ProfileTabsProps) {
  if (profiles.length === 0) return null;

  return (
    <Tabs
      value={activeProfileId || undefined}
      onValueChange={onSelect}
    >
      <TabsList>
        {profiles.map((p) => (
          <TabsTrigger key={p.id} value={p.id}>
            {p.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
