export type BookCategory =
  | "HTML"
  | "CSS"
  | "JavaScript"
  | "TypeScript"
  | "PHP"
  | "Python"
  | "Java"
  | "C++"
  | "Go"
  | "Rust"
  | "SQL"
  | "React"
  | "Node.js"
  | "Other";

export const BOOK_CATEGORIES: BookCategory[] = [
  "HTML",
  "CSS",
  "JavaScript",
  "TypeScript",
  "PHP",
  "Python",
  "Java",
  "C++",
  "Go",
  "Rust",
  "SQL",
  "React",
  "Node.js",
  "Other",
];

export const COURSE_LANGUAGES = [
  "HTML",
  "CSS",
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C",
  "C++",
  "C#",
  "PHP",
  "Go",
  "Rust",
  "Ruby",
  "Swift",
  "Kotlin",
  "SQL",
  "React",
  "Node.js",
  "Vue",
  "Angular",
  "Flutter",
  "Dart",
] as const;

export type CourseLanguage = (typeof COURSE_LANGUAGES)[number];

export interface CourseItem {
  id: string;
  title: string;
  language: string;
  about: string;
  image: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  createdAt: number;
  createdBy: string;
}

export interface BookItem {
  id: string;
  name: string;
  category: BookCategory | string;
  image: string;
  link: string;
  about: string;
  createdAt: number;
  createdBy: string;
}

export interface ChatMessageDoc {
  id: string;
  chatId: string;
  fromUid: string;
  fromName: string;
  fromPhoto: string | null;
  text: string;
  createdAt: number;
}

export interface DirectChat {
  id: string;
  members: string[];
  memberNames: Record<string, string>;
  memberPhotos: Record<string, string | null>;
  lastMessage: string;
  updatedAt: number;
}

export function chatIdFor(a: string, b: string): string {
  return [a, b].sort().join("__");
}

export const SEED_COURSES: CourseItem[] = [
  {
    id: "c-html",
    title: "HTML Fundamentals",
    language: "HTML",
    about:
      "Learn the structure of the web: elements, forms, semantic HTML, and accessibility basics.",
    image:
      "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600&h=360&fit=crop",
    level: "Beginner",
    duration: "4h",
    createdAt: Date.now() - 86400000 * 10,
    createdBy: "system",
  },
  {
    id: "c-css",
    title: "Modern CSS & Layouts",
    language: "CSS",
    about:
      "Flexbox, Grid, responsive design, animations, and Tailwind-ready CSS skills.",
    image:
      "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=600&h=360&fit=crop",
    level: "Beginner",
    duration: "6h",
    createdAt: Date.now() - 86400000 * 9,
    createdBy: "system",
  },
  {
    id: "c-js",
    title: "JavaScript from Zero",
    language: "JavaScript",
    about:
      "Variables, functions, DOM, async/await, modules, and modern ES features.",
    image:
      "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=600&h=360&fit=crop",
    level: "Beginner",
    duration: "12h",
    createdAt: Date.now() - 86400000 * 8,
    createdBy: "system",
  },
  {
    id: "c-ts",
    title: "TypeScript Essentials",
    language: "TypeScript",
    about:
      "Types, interfaces, generics, and building safer apps with TypeScript.",
    image:
      "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=600&h=360&fit=crop",
    level: "Intermediate",
    duration: "8h",
    createdAt: Date.now() - 86400000 * 7,
    createdBy: "system",
  },
  {
    id: "c-python",
    title: "Python for Developers",
    language: "Python",
    about:
      "Syntax, data structures, OOP, APIs, and practical scripts for real work.",
    image:
      "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&h=360&fit=crop",
    level: "Beginner",
    duration: "10h",
    createdAt: Date.now() - 86400000 * 6,
    createdBy: "system",
  },
  {
    id: "c-php",
    title: "PHP & Backend Basics",
    language: "PHP",
    about:
      "Server-side PHP, forms, sessions, MySQL, and building simple APIs.",
    image:
      "https://images.unsplash.com/photo-1599507593499-a3f7d7d97667?w=600&h=360&fit=crop",
    level: "Intermediate",
    duration: "9h",
    createdAt: Date.now() - 86400000 * 5,
    createdBy: "system",
  },
  {
    id: "c-java",
    title: "Java Programming",
    language: "Java",
    about: "OOP, collections, exceptions, and building console & backend apps.",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=360&fit=crop",
    level: "Intermediate",
    duration: "14h",
    createdAt: Date.now() - 86400000 * 4,
    createdBy: "system",
  },
  {
    id: "c-react",
    title: "React — The Complete Guide",
    language: "React",
    about:
      "Components, hooks, state, routing, and building modern SPA dashboards.",
    image:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=360&fit=crop",
    level: "Intermediate",
    duration: "16h",
    createdAt: Date.now() - 86400000 * 3,
    createdBy: "system",
  },
  {
    id: "c-node",
    title: "Node.js & Express",
    language: "Node.js",
    about: "APIs, middleware, auth, MongoDB, and deploying Node backends.",
    image:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=360&fit=crop",
    level: "Intermediate",
    duration: "12h",
    createdAt: Date.now() - 86400000 * 2,
    createdBy: "system",
  },
  {
    id: "c-sql",
    title: "SQL & Databases",
    language: "SQL",
    about: "Queries, joins, indexes, and designing relational data models.",
    image:
      "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&h=360&fit=crop",
    level: "Beginner",
    duration: "7h",
    createdAt: Date.now() - 86400000,
    createdBy: "system",
  },
];

export const SEED_BOOKS: BookItem[] = [
  {
    id: "b-html",
    name: "HTML5 Pocket Guide",
    category: "HTML",
    image:
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=500&fit=crop",
    link: "https://developer.mozilla.org/en-US/docs/Web/HTML",
    about: "Quick HTML reference for tags, forms, and semantics.",
    createdAt: Date.now() - 86400000 * 5,
    createdBy: "system",
  },
  {
    id: "b-css",
    name: "CSS Secrets",
    category: "CSS",
    image:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=500&fit=crop",
    link: "https://developer.mozilla.org/en-US/docs/Web/CSS",
    about: "Modern layouts, selectors, and visual design with CSS.",
    createdAt: Date.now() - 86400000 * 4,
    createdBy: "system",
  },
  {
    id: "b-js",
    name: "Eloquent JavaScript",
    category: "JavaScript",
    image:
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=500&fit=crop",
    link: "https://eloquentjavascript.net/",
    about: "Deep dive into JavaScript language and programming ideas.",
    createdAt: Date.now() - 86400000 * 3,
    createdBy: "system",
  },
  {
    id: "b-php",
    name: "PHP: The Right Way",
    category: "PHP",
    image:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=500&fit=crop",
    link: "https://phptherightway.com/",
    about: "Best practices for modern PHP development.",
    createdAt: Date.now() - 86400000 * 2,
    createdBy: "system",
  },
  {
    id: "b-python",
    name: "Automate the Boring Stuff",
    category: "Python",
    image:
      "https://images.unsplash.com/photo-14565130808af05256ee5b94?w=400&h=500&fit=crop",
    link: "https://automatetheboringstuff.com/",
    about: "Practical Python for everyday automation tasks.",
    createdAt: Date.now() - 86400000,
    createdBy: "system",
  },
];
