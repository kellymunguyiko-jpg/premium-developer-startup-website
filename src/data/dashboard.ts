export const stats = [
  {
    id: "projects",
    label: "Total Projects",
    value: "24",
    change: "+12% this month",
    icon: "code",
  },
  {
    id: "hours",
    label: "Coding Hours",
    value: "132h",
    change: "+18% this month",
    icon: "clock",
  },
  {
    id: "courses",
    label: "Courses Completed",
    value: "16",
    change: "+8% this month",
    icon: "graduation",
  },
  {
    id: "ai",
    label: "AI Uses",
    value: "48",
    change: "+20% this month",
    icon: "bot",
  },
  {
    id: "github",
    label: "GitHub Activity",
    value: "87",
    change: "+15% this month",
    icon: "github",
  },
] as const;

export const projects = [
  {
    id: 1,
    title: "E-commerce Website",
    stack: "React • Node.js • MongoDB",
    updated: "Updated 2 hours ago",
    tech: "react",
  },
  {
    id: 2,
    title: "Portfolio Website",
    stack: "HTML • CSS • JavaScript",
    updated: "Updated 1 day ago",
    tech: "js",
  },
  {
    id: 3,
    title: "AI Chatbot",
    stack: "Python • Flask • OpenAI",
    updated: "Updated 2 days ago",
    tech: "python",
  },
  {
    id: 4,
    title: "Task Manager API",
    stack: "Node.js • Express • MongoDB",
    updated: "Updated 3 days ago",
    tech: "node",
  },
] as const;

export const courses = [
  {
    id: 1,
    title: "React — The Complete Guide",
    progress: 75,
    tech: "react",
  },
  {
    id: 2,
    title: "Node.js & Express — Full Course",
    progress: 60,
    tech: "node",
  },
  {
    id: 3,
    title: "Python for Data Science",
    progress: 40,
    tech: "python",
  },
] as const;

export const tools = [
  { id: 1, name: "JSON Formatter", icon: "braces" },
  { id: 2, name: "API Tester", icon: "cloud" },
  { id: 3, name: "Regex Tester", icon: "regex" },
  { id: 4, name: "Code Formatter", icon: "align" },
  { id: 5, name: "Color Picker", icon: "droplet" },
  { id: 6, name: "Markdown Editor", icon: "markdown" },
  { id: 7, name: "QR Generator", icon: "qr" },
  { id: 8, name: "More Tools", icon: "more" },
] as const;

export const communityFeed = [
  {
    id: 1,
    author: "Alice Johnson",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Alice&backgroundColor=d1fae5",
    action: "shared a project",
    time: "2 hours ago",
    tags: "React, TailwindCSS",
    title: "Beautiful Dashboard UI",
    description:
      "A modern and responsive dashboard built with React and TailwindCSS.",
    preview:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=220&fit=crop",
  },
  {
    id: 2,
    author: "Marcus Chen",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Marcus&backgroundColor=d1fae5",
    action: "asked a question",
    time: "5 hours ago",
    tags: "TypeScript, React",
    title: "Best patterns for shared state?",
    description:
      "Looking for scalable approaches to manage complex client state in large React apps.",
    preview: null,
  },
] as const;

export const events = [
  {
    id: 1,
    month: "MAY",
    day: "25",
    title: "Building with AI Workshop",
    meta: "Live Workshop • 7:00 PM",
  },
  {
    id: 2,
    month: "MAY",
    day: "28",
    title: "DevOps for Developers",
    meta: "Webinar • 6:00 PM",
  },
  {
    id: 3,
    month: "JUN",
    day: "02",
    title: "Open Source Sprint",
    meta: "Community • 4:00 PM",
  },
] as const;

export const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "layout", badge: null },
  { id: "workspace", label: "Workspace", icon: "workspace", badge: null },
  { id: "courses", label: "Courses", icon: "book-open", badge: null },
  { id: "videos", label: "Videos", icon: "play", badge: null },
  { id: "books", label: "Books", icon: "book", badge: null },
  { id: "ai", label: "AI Assistant", icon: "sparkles", badge: "New" },
  { id: "community", label: "Community", icon: "users", badge: null },
  { id: "developers", label: "Developers", icon: "code-2", badge: null },
  { id: "projects", label: "Projects", icon: "folder", badge: null },
  { id: "tools", label: "Tools", icon: "wrench", badge: null },
  { id: "certificates", label: "Certificates", icon: "award", badge: null },
  { id: "messages", label: "Messages", icon: "message", badge: "5" },
  { id: "notifications", label: "Notifications", icon: "bell", badge: "3" },
  { id: "settings", label: "Settings", icon: "settings", badge: null },
  { id: "help", label: "Help & Support", icon: "help", badge: null },
] as const;

export const user = {
  name: "Iradukunda Dev",
  role: "Full Stack Developer",
  avatar:
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Iradukunda&backgroundColor=bbf7d0",
  profileCompletion: 85,
  followers: "1.2K",
  following: "320",
  rank: "Top 5%",
};
