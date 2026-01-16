//THE UPDATED ONE BECAUSE OF THE FILTERS ->  Take Note ->
export const transformOptions = (
  options: string[],
  iconMap?: Record<string, React.ComponentType<{ className?: string }>>
) =>
  options.map((value) => ({
    label: value
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    value: value,
    icon: iconMap ? iconMap[value] : undefined,
  }));

export const transformStatusEnum = (status: string): string => {
  return status.replace(/_/g, " ");
};

export const formatStatusToEnum = (status: string): string => {
  return status.toUpperCase().replace(/\s+/g, "_");
};

export const getAvatarColor = (initials: string): string => {
  const colors = [
    "bg-red-500 text-white",
    "bg-blue-500 text-white",
    "bg-green-500 text-white",
    "bg-yellow-500 text-black",
    "bg-purple-500 text-white",
    "bg-pink-500 text-white",
    "bg-teal-500 text-white",
    "bg-orange-500 text-black",
    "bg-gray-500 text-white",
  ];

  // Simple hash to map initials to a color index
  const hash = initials
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return colors[hash % colors.length];
};

export const getAvatarFallbackText = (name: string | undefined | null) => {
  if (!name || typeof name !== 'string') return "NA";
  const initials = name
    .split(" ")
    .map((n) => n.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2); // Ensure only two initials
  return initials || "NA";
};

export const mapColumnToStatus = (columnName: string): string => {
  const normalizeStr = (s: string) => s.toLowerCase().trim().replace(/[\s-_]+/g, '');
  const name = normalizeStr(columnName);

  if (name === 'todo' || name === 'open' || name === 'new') return 'todo';
  if (name === 'inprogress' || name === 'progress') return 'in progress';
  if (name === 'inreview' || name === 'review') return 'review';
  if (name === 'done' || name === 'completed') return 'done';
  if (name === 'backlog') return 'backlog';
  if (name === 'blocked') return 'blocked';

  // Fallbacks based on inclusion
  if (name.includes('review')) return 'review';
  if (name.includes('progress')) return 'in progress';
  if (name.includes('done')) return 'done';
  if (name.includes('todo')) return 'todo';

  return 'todo'; // Default
};





