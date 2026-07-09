export type FileNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  language?: string;
  content?: string;
  children?: FileNode[];
};

export const languageOptions = [
  { id: "javascript", label: "JavaScript", ext: "js", monaco: "javascript" },
  { id: "typescript", label: "TypeScript", ext: "ts", monaco: "typescript" },
  { id: "python", label: "Python", ext: "py", monaco: "python" },
  { id: "java", label: "Java", ext: "java", monaco: "java" },
  { id: "cpp", label: "C++", ext: "cpp", monaco: "cpp" },
  { id: "c", label: "C", ext: "c", monaco: "c" },
  { id: "csharp", label: "C#", ext: "cs", monaco: "csharp" },
  { id: "go", label: "Go", ext: "go", monaco: "go" },
  { id: "rust", label: "Rust", ext: "rs", monaco: "rust" },
  { id: "php", label: "PHP", ext: "php", monaco: "php" },
  { id: "ruby", label: "Ruby", ext: "rb", monaco: "ruby" },
  { id: "swift", label: "Swift", ext: "swift", monaco: "swift" },
  { id: "kotlin", label: "Kotlin", ext: "kt", monaco: "kotlin" },
  { id: "html", label: "HTML", ext: "html", monaco: "html" },
  { id: "css", label: "CSS", ext: "css", monaco: "css" },
  { id: "json", label: "JSON", ext: "json", monaco: "json" },
  { id: "sql", label: "SQL", ext: "sql", monaco: "sql" },
  { id: "shell", label: "Shell", ext: "sh", monaco: "shell" },
  { id: "markdown", label: "Markdown", ext: "md", monaco: "markdown" },
  { id: "yaml", label: "YAML", ext: "yml", monaco: "yaml" },
] as const;

export const languageTemplates: Record<string, string> = {
  javascript: `// Welcome to DevSpace IDE
// JavaScript

function greet(name) {
  return \`Hello, \${name}! Welcome to DevSpace Pro.\`;
}

const developer = "Iradukunda Dev";
console.log(greet(developer));

// Try editing this file and running the code
const projects = ["E-commerce", "Portfolio", "AI Chatbot"];
projects.forEach((p, i) => console.log(\`\${i + 1}. \${p}\`));
`,
  typescript: `// Welcome to DevSpace IDE
// TypeScript

interface Developer {
  name: string;
  role: string;
  skills: string[];
}

const me: Developer = {
  name: "Iradukunda Dev",
  role: "Full Stack Developer",
  skills: ["React", "Node.js", "TypeScript", "Python"],
};

function introduce(dev: Developer): string {
  return \`\${dev.name} is a \${dev.role} skilled in \${dev.skills.join(", ")}\`;
}

console.log(introduce(me));
`,
  python: `# Welcome to DevSpace IDE
# Python

def greet(name: str) -> str:
    return f"Hello, {name}! Welcome to DevSpace Pro."

developer = "Iradukunda Dev"
print(greet(developer))

# List comprehension example
projects = ["E-commerce", "Portfolio", "AI Chatbot"]
for i, project in enumerate(projects, 1):
    print(f"{i}. {project}")

# Simple class
class Developer:
    def __init__(self, name, role):
        self.name = name
        self.role = role

    def introduce(self):
        return f"{self.name} — {self.role}"

dev = Developer("Iradukunda", "Full Stack Developer")
print(dev.introduce())
`,
  java: `// Welcome to DevSpace IDE
// Java

public class Main {
    public static void main(String[] args) {
        String developer = "Iradukunda Dev";
        System.out.println(greet(developer));

        String[] projects = {"E-commerce", "Portfolio", "AI Chatbot"};
        for (int i = 0; i < projects.length; i++) {
            System.out.println((i + 1) + ". " + projects[i]);
        }
    }

    public static String greet(String name) {
        return "Hello, " + name + "! Welcome to DevSpace Pro.";
    }
}
`,
  cpp: `// Welcome to DevSpace IDE
// C++

#include <iostream>
#include <string>
#include <vector>

using namespace std;

string greet(const string& name) {
    return "Hello, " + name + "! Welcome to DevSpace Pro.";
}

int main() {
    string developer = "Iradukunda Dev";
    cout << greet(developer) << endl;

    vector<string> projects = {"E-commerce", "Portfolio", "AI Chatbot"};
    for (size_t i = 0; i < projects.size(); i++) {
        cout << (i + 1) << ". " << projects[i] << endl;
    }

    return 0;
}
`,
  c: `// Welcome to DevSpace IDE
// C

#include <stdio.h>

void greet(const char* name) {
    printf("Hello, %s! Welcome to DevSpace Pro.\\n", name);
}

int main() {
    const char* developer = "Iradukunda Dev";
    greet(developer);

    const char* projects[] = {"E-commerce", "Portfolio", "AI Chatbot"};
    for (int i = 0; i < 3; i++) {
        printf("%d. %s\\n", i + 1, projects[i]);
    }

    return 0;
}
`,
  csharp: `// Welcome to DevSpace IDE
// C#

using System;

class Program {
    static string Greet(string name) {
        return $"Hello, {name}! Welcome to DevSpace Pro.";
    }

    static void Main() {
        string developer = "Iradukunda Dev";
        Console.WriteLine(Greet(developer));

        string[] projects = { "E-commerce", "Portfolio", "AI Chatbot" };
        for (int i = 0; i < projects.Length; i++) {
            Console.WriteLine($"{i + 1}. {projects[i]}");
        }
    }
}
`,
  go: `// Welcome to DevSpace IDE
// Go

package main

import "fmt"

func greet(name string) string {
	return fmt.Sprintf("Hello, %s! Welcome to DevSpace Pro.", name)
}

func main() {
	developer := "Iradukunda Dev"
	fmt.Println(greet(developer))

	projects := []string{"E-commerce", "Portfolio", "AI Chatbot"}
	for i, p := range projects {
		fmt.Printf("%d. %s\\n", i+1, p)
	}
}
`,
  rust: `// Welcome to DevSpace IDE
// Rust

fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to DevSpace Pro.", name)
}

fn main() {
    let developer = "Iradukunda Dev";
    println!("{}", greet(developer));

    let projects = ["E-commerce", "Portfolio", "AI Chatbot"];
    for (i, project) in projects.iter().enumerate() {
        println!("{}. {}", i + 1, project);
    }
}
`,
  php: `<?php
// Welcome to DevSpace IDE
// PHP

function greet($name) {
    return "Hello, $name! Welcome to DevSpace Pro.";
}

$developer = "Iradukunda Dev";
echo greet($developer) . "\\n";

$projects = ["E-commerce", "Portfolio", "AI Chatbot"];
foreach ($projects as $i => $project) {
    echo ($i + 1) . ". $project\\n";
}
`,
  ruby: `# Welcome to DevSpace IDE
# Ruby

def greet(name)
  "Hello, #{name}! Welcome to DevSpace Pro."
end

developer = "Iradukunda Dev"
puts greet(developer)

projects = ["E-commerce", "Portfolio", "AI Chatbot"]
projects.each_with_index do |project, i|
  puts "#{i + 1}. #{project}"
end
`,
  swift: `// Welcome to DevSpace IDE
// Swift

func greet(name: String) -> String {
    return "Hello, \\(name)! Welcome to DevSpace Pro."
}

let developer = "Iradukunda Dev"
print(greet(name: developer))

let projects = ["E-commerce", "Portfolio", "AI Chatbot"]
for (i, project) in projects.enumerated() {
    print("\\(i + 1). \\(project)")
}
`,
  kotlin: `// Welcome to DevSpace IDE
// Kotlin

fun greet(name: String): String {
    return "Hello, $name! Welcome to DevSpace Pro."
}

fun main() {
    val developer = "Iradukunda Dev"
    println(greet(developer))

    val projects = listOf("E-commerce", "Portfolio", "AI Chatbot")
    projects.forEachIndexed { i, project ->
        println("\${i + 1}. $project")
    }
}
`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DevSpace Pro</title>
  <style>
    body {
      font-family: Inter, system-ui, sans-serif;
      background: #f0fdf4;
      color: #14532d;
      display: grid;
      place-items: center;
      min-height: 100vh;
      margin: 0;
    }
    .card {
      background: white;
      padding: 2rem 3rem;
      border-radius: 1rem;
      box-shadow: 0 8px 30px rgba(22, 163, 74, 0.15);
      text-align: center;
    }
    h1 { color: #16a34a; margin: 0 0 0.5rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>DevSpace Pro</h1>
    <p>Hello, Iradukunda Dev! Start building something amazing.</p>
  </div>
</body>
</html>
`,
  css: `/* Welcome to DevSpace IDE — CSS */

:root {
  --brand: #16a34a;
  --brand-dark: #15803d;
  --surface: #ffffff;
  --bg: #f0fdf4;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Inter, system-ui, sans-serif;
  background: var(--bg);
  color: #0f172a;
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.btn-primary {
  background: var(--brand);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-primary:hover {
  background: var(--brand-dark);
}
`,
  json: `{
  "name": "devspace-pro",
  "version": "1.0.0",
  "description": "Premium developer ecosystem platform",
  "author": "Iradukunda Dev",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "keywords": ["developer", "ide", "learning", "community"]
}
`,
  sql: `-- Welcome to DevSpace IDE
-- SQL

CREATE TABLE developers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100),
  skills TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO developers (name, role, skills) VALUES
  ('Iradukunda Dev', 'Full Stack Developer', ARRAY['React', 'Node.js', 'Python']),
  ('Alice Johnson', 'Frontend Engineer', ARRAY['React', 'TailwindCSS']),
  ('Marcus Chen', 'Backend Engineer', ARRAY['Go', 'PostgreSQL']);

SELECT name, role, array_length(skills, 1) AS skill_count
FROM developers
ORDER BY created_at DESC;
`,
  shell: `#!/bin/bash
# Welcome to DevSpace IDE
# Shell Script

echo "Hello, Iradukunda Dev! Welcome to DevSpace Pro."

projects=("E-commerce" "Portfolio" "AI Chatbot")

for i in "\${!projects[@]}"; do
  echo "$((i + 1)). \${projects[$i]}"
done

echo ""
echo "System info:"
echo "  User: $(whoami)"
echo "  Date: $(date)"
echo "  Shell: $SHELL"
`,
  markdown: `# DevSpace Pro IDE

Welcome, **Iradukunda Dev**! 👋

## Features

- Multi-language support (20+ languages)
- VS Code–like experience
- File explorer & tabs
- Integrated terminal
- Syntax highlighting

## Getting Started

1. Open a file from the explorer
2. Edit your code
3. Run with the play button
4. Check output in the terminal

\`\`\`javascript
console.log("Happy coding!");
\`\`\`

---

Built with ❤️ for developers.
`,
  yaml: `# Welcome to DevSpace IDE
# YAML

app:
  name: DevSpace Pro
  version: 1.0.0
  author: Iradukunda Dev

features:
  - ide
  - courses
  - community
  - ai-assistant

database:
  host: localhost
  port: 5432
  name: devspace

services:
  api:
    port: 3000
    env: production
  web:
    port: 5173
    env: development
`,
};

export function getLanguageFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    java: "java",
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    c: "c",
    h: "c",
    cs: "csharp",
    go: "go",
    rs: "rust",
    php: "php",
    rb: "ruby",
    swift: "swift",
    kt: "kotlin",
    html: "html",
    htm: "html",
    css: "css",
    scss: "css",
    json: "json",
    sql: "sql",
    sh: "shell",
    bash: "shell",
    md: "markdown",
    yml: "yaml",
    yaml: "yaml",
  };
  return map[ext] ?? "plaintext";
}

export function createInitialTree(): FileNode[] {
  return [
    {
      id: "folder-src",
      name: "src",
      type: "folder",
      children: [
        {
          id: "file-main-js",
          name: "main.js",
          type: "file",
          language: "javascript",
          content: languageTemplates.javascript,
        },
        {
          id: "file-app-ts",
          name: "app.ts",
          type: "file",
          language: "typescript",
          content: languageTemplates.typescript,
        },
        {
          id: "file-server-py",
          name: "server.py",
          type: "file",
          language: "python",
          content: languageTemplates.python,
        },
        {
          id: "file-main-java",
          name: "Main.java",
          type: "file",
          language: "java",
          content: languageTemplates.java,
        },
        {
          id: "file-main-cpp",
          name: "main.cpp",
          type: "file",
          language: "cpp",
          content: languageTemplates.cpp,
        },
        {
          id: "file-main-go",
          name: "main.go",
          type: "file",
          language: "go",
          content: languageTemplates.go,
        },
        {
          id: "file-lib-rs",
          name: "lib.rs",
          type: "file",
          language: "rust",
          content: languageTemplates.rust,
        },
      ],
    },
    {
      id: "folder-public",
      name: "public",
      type: "folder",
      children: [
        {
          id: "file-index-html",
          name: "index.html",
          type: "file",
          language: "html",
          content: languageTemplates.html,
        },
        {
          id: "file-styles-css",
          name: "styles.css",
          type: "file",
          language: "css",
          content: languageTemplates.css,
        },
      ],
    },
    {
      id: "file-package-json",
      name: "package.json",
      type: "file",
      language: "json",
      content: languageTemplates.json,
    },
    {
      id: "file-readme",
      name: "README.md",
      type: "file",
      language: "markdown",
      content: languageTemplates.markdown,
    },
    {
      id: "file-query-sql",
      name: "query.sql",
      type: "file",
      language: "sql",
      content: languageTemplates.sql,
    },
    {
      id: "file-config-yml",
      name: "config.yml",
      type: "file",
      language: "yaml",
      content: languageTemplates.yaml,
    },
  ];
}

export function findFileById(
  nodes: FileNode[],
  id: string
): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findFileById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function updateFileContent(
  nodes: FileNode[],
  id: string,
  content: string
): FileNode[] {
  return nodes.map((node) => {
    if (node.id === id) return { ...node, content };
    if (node.children) {
      return {
        ...node,
        children: updateFileContent(node.children, id, content),
      };
    }
    return node;
  });
}

export function addFileToTree(
  nodes: FileNode[],
  parentId: string | null,
  file: FileNode
): FileNode[] {
  if (!parentId) return [...nodes, file];
  return nodes.map((node) => {
    if (node.id === parentId && node.type === "folder") {
      return {
        ...node,
        children: [...(node.children ?? []), file],
      };
    }
    if (node.children) {
      return {
        ...node,
        children: addFileToTree(node.children, parentId, file),
      };
    }
    return node;
  });
}

export function deleteFromTree(nodes: FileNode[], id: string): FileNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) =>
      node.children
        ? { ...node, children: deleteFromTree(node.children, id) }
        : node
    );
}
