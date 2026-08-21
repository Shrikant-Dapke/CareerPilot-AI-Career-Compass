/**
 * Demo mode — only used when NEXT_PUBLIC_DEMO_MODE=true.
 * Never mixed with real Lyzr responses in production.
 */
export const demoChatResponse = `## Resume Analysis

**Overall Score:** 78/100
**ATS Score:** 72/100

### Skills
React, Next.js, TypeScript, Node.js, Python, Tailwind CSS

### Experience
- Frontend Developer at Acme (2022–Present)
- Intern at StartupX (2021)

### Strengths
Strong frontend fundamentals, clean project structure.

### Gaps
- Missing system design experience for senior roles
- Limited cloud (AWS) exposure

---

## Recommended Jobs

### 1. Full Stack Developer at NovaTech — Match Score: 88%
**Location:** Remote | **Type:** Full-time
**Matching Skills:** React, Next.js, TypeScript, Node.js
**Missing Skills:** AWS, Docker
**Source:** Demo

### 2. Frontend Engineer at PixelForge — Match Score: 84%
**Location:** Berlin, DE
**Matching Skills:** React, Tailwind, TypeScript
**Missing Skills:** GraphQL

### 3. Software Engineer at DataWorks — Match Score: 79%
**Location:** New York, NY
**Matching Skills:** Python, React
**Missing Skills:** Kubernetes, Go
`;

export const demoJobs = [
  {
    id: "demo-1",
    title: "Full Stack Developer",
    company: "NovaTech",
    location: "Remote",
    matchScore: 88,
    matchingSkills: ["React", "Next.js", "TypeScript"],
    missingSkills: ["AWS", "Docker"],
  },
];
