import {
  ReactElement,
  ReactNode,
  useState,
  DependencyList,
  useCallback,
} from "react";
import { cn } from "@/lib/utils";

// Tab Selector Component
interface TabSelectorProps {
  children: ReactElement[];
  className?: string;
}
export const TabSelector = ({ children, className }: TabSelectorProps) => {
  return (
    <div className={cn(`flex border-b border-gray-200 ${className}`)}>
      {children}
    </div>
  );
};

// Tab Trigger Component
interface TabTriggerProps {
  children: ReactNode;
  value: string;
  actionHandler?: {
    fn: () => void;
    dependencies?: DependencyList;
  };
  className?: string;
}
export const TabTrigger = ({
  children,
  value,
  actionHandler,
  className,
}: TabTriggerProps) => {
  const handleClick = useCallback(() => {
    actionHandler?.fn();
  }, [actionHandler]);

  return (
    <button
      className={cn(
        `px-4 py-2 font-medium text-sm transition-all duration-200 ${className}`,
      )}
      onClick={handleClick}
      value={value}
    >
      {children}
    </button>
  );
};

// Tab Content Component
interface TabContentsProps {
  value: string;
  children: ReactNode;
  className?: string;
}
export const TabContents = ({ children, className }: TabContentsProps) => {
  return <div className={cn(`py-4 ${className}`)}>{children}</div>;
};

// Main Tabs Container Component
interface TabsProps {
  children: ReactElement[];
  className?: string;
  defaultValue?: string;
}

// Type guards to help TypeScript
const isTabTrigger = (
  child: ReactElement,
): child is ReactElement<TabTriggerProps> => {
  return child.type === TabTrigger;
};

const isTabContents = (
  child: ReactElement,
): child is ReactElement<TabContentsProps> => {
  return child.type === TabContents;
};

const Tabs = ({ children, className, defaultValue }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultValue || "");

  // Filter with type guards
  const tabTriggers = children.filter(isTabTrigger);
  const tabContents = children.filter(isTabContents);

  // Enhance TabTrigger elements with click handlers
  const enhancedTriggers = tabTriggers.map((trigger) => ({
    ...trigger,
    props: {
      ...trigger.props,
      actionHandler: {
        fn: () => setActiveTab(trigger.props.value),
        dependencies: [trigger.props.value],
      },
      className: cn(
        trigger.props.className,
        activeTab === trigger.props.value
          ? "text-blue-600 border-b-2 border-blue-600"
          : "text-gray-500 hover:text-gray-700 hover:border-gray-300",
      ),
    },
  }));

  // Find active content with type safety
  const activeContent = tabContents.find(
    (content) => content.props.value === activeTab,
  );

  return (
    <div className={cn(`overflow-auto h-full ${className}`)}>
      <TabSelector>{enhancedTriggers}</TabSelector>
      <div className="tab-content-container">{activeContent}</div>
    </div>
  );
};

export default Tabs;
