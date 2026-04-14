import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function BoardTypeSelector() {
  const { watch, setValue } = useFormContext();
  const boardType = watch("boardType");

  const boardTypes = [
    {
      id: "kanban",
      name: "Kanban",
      description: "Visualize workflow with columns and cards. Perfect for continuous flow.",
      icon: "📊",
    },
    {
      id: "scrumboard",
      name: "Scrum Board",
      description: "Sprint-based planning with backlog management. Ideal for Agile teams.",
      icon: "🎯",
    },
  ];

  return (
    <div className="mb-6">
      <label className="dark:text-[#f1f7feb5] text-sm font-semibold mb-3 block">
        Select Board Type
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {boardTypes.map((type) => (
          <Card
            key={type.id}
            className={`p-4 cursor-pointer transition-all border-2 ${
              boardType === type.id
                ? "border-blue-600 bg-blue-50 dark:bg-blue-950"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setValue("boardType", type.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{type.icon}</span>
                  <h3 className="font-semibold text-lg">{type.name}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {type.description}
                </p>
              </div>
              {boardType === type.id && (
                <CheckCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0 ml-2" />
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

