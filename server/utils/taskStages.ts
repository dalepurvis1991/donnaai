export type TaskStage = {
  stage: string;
  completed: boolean;
  completedAt?: Date;
  emailId?: number;
  order?: number;
};

const defaultStageLabels = ["Planned", "In progress", "Review", "Complete"];

export const createDefaultStages = (): TaskStage[] =>
  defaultStageLabels.map((stage, index) => ({
    stage,
    completed: false,
    order: index,
  }));

export const normalizeStages = (stages?: TaskStage[] | null): TaskStage[] => {
  if (!stages || stages.length === 0) return [];
  const withOrder = stages.map((stage, index) => ({
    ...stage,
    order: stage.order ?? index,
  }));
  const sorted = [...withOrder].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return sorted.map((stage, index) => ({
    ...stage,
    order: index,
  }));
};

export const applyStageOrder = (
  existingStages: TaskStage[] | undefined | null,
  incomingStages: TaskStage[]
): TaskStage[] => {
  const orderMap = new Map<string, number>();

  normalizeStages(existingStages).forEach((stage) => {
    if (stage.order !== undefined) {
      orderMap.set(stage.stage, stage.order);
    }
  });

  const withOrder = incomingStages.map((stage, index) => ({
    ...stage,
    order: stage.order ?? orderMap.get(stage.stage) ?? index,
  }));

  return normalizeStages(withOrder);
};
