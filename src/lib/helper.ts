//THE UPDATED ONE BECAUSE OF THE FILTERS ->  Take Note ->
import { IssueStatus } from '@/api/issue/types';
import { baseURL } from './base-url';

export const getProfileImageUrl = (path: string | null | undefined) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const normalizedPath = path
    .replace("/api/v1/user/profile-picture-file/", "/api/v1/pm-user/profile-picture-file/")
    .replace("/user/profile-picture-file/", "/pm-user/profile-picture-file/");
  const host = baseURL.replace("/api/v1", "");
  const cleanPath = normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
  return `${host}${cleanPath}`;
};

export const transformOptions = (
  options: string[],
  iconMap?: Record<string, React.ComponentType<{ className?: string }>>
) =>
  options.map((value) => ({
    label: value
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase()), // display-friendly
    value: value.toLowerCase(), // send lowercase to backend
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

export const mapColumnToStatus = (columnName: string): IssueStatus => {
  const normalizeStr = (s: string) => s.toLowerCase().trim().replace(/[\s-_]+/g, '');
  const name = normalizeStr(columnName);

  if (name === 'todo' || name === 'open' || name === 'new') return 'to-do';
  if (name === 'inprogress' || name === 'progress') return 'in-progress';
  if (name === 'inreview' || name === 'review') return 'in-review';
  if (name === 'blocked') return 'blocked';
  if (name === 'done' || name === 'completed') return 'done';
  if (name === 'closed') return 'closed';
  if (name === 'backlog') return 'to-do';

  // Fallbacks based on inclusion
  if (name.includes('review')) return 'in-review';
  if (name.includes('progress')) return 'in-progress';
  if (name.includes('done')) return 'done';
  if (name.includes('todo')) return 'to-do';
  if (name.includes('blocked')) return 'blocked';
  if (name.includes('closed')) return 'closed';

  return columnName; // Return original column name for custom columns
};

/**
 * Formats duration in minutes to human readable string (e.g. 1h 30m 15s)
 * @param minutesInput Duration in minutes (can be float)
 */
export const formatDuration = (minutesInput: number): string => {
  if (!minutesInput && minutesInput !== 0) return '0h 0m 0s';
  
  const totalSeconds = Math.round(minutesInput * 60);
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
};
