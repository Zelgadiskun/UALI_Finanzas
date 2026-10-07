export interface PersonalBudget {
  id: string;
  userId: string;
  name: string;
  group: string;
  planned: number;
  createdAt: string;
}

const STORAGE_KEY = "uali_personal_budgets_v1";

export function getPersonalBudgets(userId: string): PersonalBudget[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePersonalBudget(
  userId: string,
  budget: { name: string; group: string; planned: number },
): PersonalBudget {
  const list = getPersonalBudgets(userId);
  const newBudget: PersonalBudget = {
    id: `personal-budget-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId,
    name: budget.name,
    group: budget.group,
    planned: budget.planned,
    createdAt: new Date().toISOString(),
  };
  list.push(newBudget);
  if (typeof window !== "undefined") {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(list));
  }
  return newBudget;
}

export function updatePersonalBudget(userId: string, id: string, planned: number): void {
  const list = getPersonalBudgets(userId);
  const found = list.find((b) => b.id === id);
  if (found) {
    found.planned = planned;
    if (typeof window !== "undefined") {
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(list));
    }
  }
}

export function deletePersonalBudget(userId: string, id: string): void {
  let list = getPersonalBudgets(userId);
  list = list.filter((b) => b.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(list));
  }
}

export function setPersonalBudgetsBulk(
  userId: string,
  items: { name: string; group: string; planned: number }[],
): PersonalBudget[] {
  const current = getPersonalBudgets(userId);
  const updatedList: PersonalBudget[] = [...current];

  for (const item of items) {
    const existingIndex = updatedList.findIndex(
      (b) => b.name.toLowerCase() === item.name.toLowerCase(),
    );
    if (existingIndex >= 0) {
      updatedList[existingIndex] = {
        ...updatedList[existingIndex],
        planned: item.planned,
        group: item.group,
      };
    } else {
      updatedList.push({
        id: `personal-budget-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId,
        name: item.name,
        group: item.group,
        planned: item.planned,
        createdAt: new Date().toISOString(),
      });
    }
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(updatedList));
  }
  return updatedList;
}
