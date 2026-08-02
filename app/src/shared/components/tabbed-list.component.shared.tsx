import type { ReactNode } from "react"; // ✅ fixed: was missing
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Tab {
  value: string;
  label: string;
  content: ReactNode;
}

export function TabbedList({ tabs }: { tabs: Tab[] }) {
  return (
    <div className="w-full rounded-xl bg-white shadow-sm border border-border">
      <Tabs defaultValue={tabs[0].value}>
        <div className="flex items-center justify-between px-4">
          <TabsList className="h-auto gap-0 rounded-none bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none border-b-[3px] border-transparent px-4 py-3 text-sm font-medium shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="py-3 px-4">
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-0">
              {tab.content}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
