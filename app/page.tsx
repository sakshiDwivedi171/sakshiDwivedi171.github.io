"use client"
import { useEffect, useRef, useState } from "react"

interface GitHubStats {
  public_repos: number
  followers: number
  following: number
  bio: string | null
  avatar_url: string
  html_url: string
  created_at: string
}

interface GitHubAdditionalStats {
  totalContributions: number
  currentStreak: number
  totalStars: number
  totalForks: number
}

const roles = [
  "QA Automation Engineer",
  "SDET",
  "Test Automation Engineer",
  "Quality Assurance Engineer",
  "Software Developer in Test",
]

export default function Home() {
  const [isDark, setIsDark] = useState(true)
  const [activeSection, setActiveSection] = useState("about")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [githubStats, setGithubStats] = useState<GitHubStats | null>(null)
  const [additionalStats, setAdditionalStats] = useState<GitHubAdditionalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const sectionsRef = useRef<(HTMLElement | null)[]>([])
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  useEffect(() => {
    const currentRole = roles[currentRoleIndex]
    let timeout: NodeJS.Timeout
    if (!isDeleting && currentText.length < currentRole.length) {
      timeout = setTimeout(() => setCurrentText(currentRole.slice(0, currentText.length + 1)), 100)
    } else if (!isDeleting && currentText.length === currentRole.length) {
      timeout = setTimeout(() => setIsDeleting(true), 1000)
    } else if (isDeleting && currentText.length > 0) {
      timeout = setTimeout(() => setCurrentText(currentRole.slice(0, currentText.length - 1)), 50)
    } else if (isDeleting && currentText.length === 0) {
      setIsDeleting(false)
      setCurrentRoleIndex((prev) => (prev + 1) % roles.length)
    }
    return () => clearTimeout(timeout)
  }, [currentText, currentRoleIndex, isDeleting])

  useEffect(() => {
    const fetchGitHubData = async () => {
      try {
        const userResponse = await fetch("https://api.github.com/users/sakshiDwivedi171")
        const userData = await userResponse.json()
        setGithubStats(userData)

        let allRepos: any[] = []
        let page = 1
        let hasMore = true
        while (hasMore && page <= 10) {
          try {
            const reposResponse = await fetch(
              `https://api.github.com/users/sakshiDwivedi171/repos?per_page=100&page=${page}&sort=updated`
            )
            if (!reposResponse.ok) break
            const reposData = await reposResponse.json()
            if (reposData.message || !Array.isArray(reposData) || reposData.length === 0) {
              hasMore = false
            } else {
              allRepos = [...allRepos, ...reposData]
              page++
              if (reposData.length < 100) hasMore = false
            }
          } catch {
            break
          }
        }

        let totalStars = 0
        let totalForks = 0
        for (const repo of allRepos) {
          if (repo?.stargazers_count != null) totalStars += repo.stargazers_count
          if (repo?.forks_count != null) totalForks += repo.forks_count
        }

        let totalContributions = 0
        let currentStreak = 0
        try {
          const totalsResponse = await fetch("https://github-contributions-api.jogruber.de/v4/sakshiDwivedi171")
          if (totalsResponse.ok) {
            const totalsData = await totalsResponse.json()
            if (totalsData.total) {
              totalContributions = Object.values(totalsData.total).reduce(
                (sum: number, yearTotal: unknown) => sum + (Number(yearTotal) || 0),
                0
              ) as number
            }
          }
          const contributionsResponse = await fetch("https://github-contributions-api.jogruber.de/v4/sakshiDwivedi171?y=last")
          if (contributionsResponse.ok) {
            const contributionsData = await contributionsResponse.json()
            if (contributionsData.contributions?.length) {
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              for (let i = 0; i < 365; i++) {
                const checkDate = new Date(today)
                checkDate.setDate(checkDate.getDate() - i)
                const dateStr = checkDate.toISOString().split("T")[0]
                const day = contributionsData.contributions.find((d: { date: string }) => d.date === dateStr)
                if (day?.count > 0) currentStreak++
                else if (i > 0) break
              }
            }
          }
        } catch {
          // leave as 0
        }

        setAdditionalStats({ totalContributions, currentStreak, totalStars, totalForks })
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchGitHubData()
  }, [])

  useEffect(() => {
    const checkAndAnimateSection = (section: HTMLElement) => {
      const rect = section.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const isVisible = rect.top < windowHeight * 0.8 && rect.bottom > windowHeight * 0.2
      if (isVisible && !section.classList.contains("animate-fade-in-up")) {
        section.classList.add("animate-fade-in-up")
        setActiveSection(section.id)
      }
    }
    const hash = window.location.hash.slice(1)
    if (hash) {
      const target = sectionsRef.current.find((s) => s?.id === hash)
      if (target) setTimeout(() => { target.classList.add("animate-fade-in-up"); setActiveSection(hash) }, 300)
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up")
            setActiveSection(entry.target.id)
          }
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" }
    )
    sectionsRef.current.forEach((section) => {
      if (section) {
        checkAndAnimateSection(section)
        observer.observe(section)
      }
    })
    const handleScroll = () => {
      sectionsRef.current.forEach((section) => {
        if (section && !section.classList.contains("animate-fade-in-up")) checkAndAnimateSection(section)
      })
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
      setTimeout(() => {
        if (!el.classList.contains("animate-fade-in-up")) el.classList.add("animate-fade-in-up")
        setActiveSection(id)
      }, 500)
    }
    setMobileMenuOpen(false)
  }

  const navigationItems = ["about", "experience", "projects", "skills", "education", "github-contributions", "connect"]

  const experience = [
    {
      id: 1,
      role: "Deputy Assistant Manager – Quality Assurance",
      company: "NJ Group India",
      period: "Mar 2024 — Present",
      description:
        "Worked in a high-pressure fintech environment supporting mutual fund distribution and wealth management platforms with over 2 lakh crore AUM. Owned end-to-end QA for critical financial transaction modules (Purchase, SIP, SWP, STP, Switch). Designed, reviewed, and executed 800+ test cases across Black Box, Functional, Regression, and Database Testing with 95%+ functional coverage. Implemented API automation using BlazeMeter, reducing manual regression by 40–50%. Mentored QA interns and maintained defect closure rate above 90%.",
      tech: ["Java", "Cucumber", "JUnit", "Postman", "BlazeMeter", "SQL", "Jenkins", "Grafana"],
    },
    {
      id: 2,
      role: "Software Developer Quality Assurance",
      company: "Prospecta Software, Gurugram",
      period: "Jun 2023 — Nov 2023",
      description:
        "Developed and maintained Master Data Management (MDM) systems for 50,000+ records, improving data accuracy by 15%. Designed automation frameworks for data processing and validation, increasing operational efficiency by 20%. Built and executed automated test scripts achieving 95% test coverage and reducing manual testing by 30%. Ensured 99% uptime and collaborated with cross-functional teams on root cause analysis.",
      tech: ["Java", "TestNG", "Selenium", "SQL", "MDM"],
    },
    {
      id: 3,
      role: "Backend Developer",
      company: "Growder Technovations Pvt. Ltd., Surat",
      period: "Mar 2023 — Jun 2024",
      description:
        "Developed backend modules for OTP-based SMS and email verification, cart and wishlist for B2B platform. Built secure authentication with JWT, session handling, and RBAC. Designed reusable APIs for SMS/email vendors and payment gateways. Automated inventory sync, order verification, and dispatch triggers. Used Java, Spring Boot, PostgreSQL/MySQL, Redis, and AWS.",
      tech: ["Java", "Spring Boot", "PostgreSQL", "MySQL", "Redis", "AWS", "JWT"],
    },
  ]

  const projects = [
    {
      id: 1,
      name: "NJ E-Wealth (EWA) – Mutual Fund / MARS",
      tag: "Automation, API & Security Testing",
      points: [
        "Created BDD feature files and automated test cases using Java, Cucumber, JUnit in IntelliJ IDEA.",
        "Performed API testing using Postman; conducted security testing with Burp Suite and VA scans.",
        "Integrated automated execution with Jenkins and monitored test metrics using Grafana.",
        "Worked on 15+ modules including NSE, BSE, and MARS data.",
      ],
    },
    {
      id: 2,
      name: "Partner Desk / Partner Employee Desk",
      tag: "Functional, API & Performance Testing",
      points: [
        "Automated functional workflows using BDD with Java, Cucumber, JUnit. Validated APIs with Postman.",
        "Performed security testing with Burp Suite. Executed performance testing with DP Tool (50,000+ records).",
        "Integrated test suites into Jenkins CI/CD pipelines.",
      ],
    },
    {
      id: 3,
      name: "Trading Account",
      tag: "API, Security & Performance Testing",
      points: [
        "Automated end-to-end workflows using Java, Cucumber, JUnit (BDD). API testing with Postman.",
        "Security testing with Burp Suite; performance validation with DP Tool (50,000+ client data).",
        "Integrated automated execution with Jenkins.",
      ],
    },
    {
      id: 4,
      name: "DDSD",
      tag: "Automation, API & Security Testing",
      points: [
        "Designed and executed BDD feature files using Java, Cucumber, JUnit. Automated API test cases with Postman.",
        "Performed security testing with Burp Suite and VA scans. Jenkins integration and Grafana monitoring.",
        "Used DP Tool for performance validation with 50,000+ records per client.",
      ],
    },
  ]

  const skills = {
    "Programming Languages": ["Java", "SQL", "JSON", "XML"],
    "Frameworks & Libraries": [
      "Spring Boot",
      "Spring Framework",
      "Hibernate",
      "JUnit",
      "TestNG",
      "Selenium WebDriver",
      "Cucumber (BDD)",
      "REST Assured",
    ],
    "API & Performance Tools": ["Postman", "Swagger", "JMeter", "SOAP UI", "BlazeMeter"],
    "CI/CD & DevOps": ["Jenkins", "Git", "GitHub", "GitLab", "CI/CD Pipelines"],
    "Monitoring & Logging": ["Grafana", "Prometheus", "New Relic", "ELK Stack"],
    "Security Testing": ["VA Scan", "OWASP ZAP", "Burp Suite"],
    "Databases & Data Tools": ["MySQL", "PostgreSQL", "Oracle", "Redis", "RabbitMQ", "Kafka", "Elasticsearch"],
    "Test Management & Agile": ["Jira", "Confluence", "Zephyr", "Agile", "Scrum"],
    "Automation Frameworks": ["Page Object Model (POM)", "Data-Driven", "Keyword-Driven", "Hybrid"],
    "Testing Expertise": [
      "Functional Testing",
      "Regression Testing",
      "Integration Testing",
      "System Testing",
      "Database Testing",
    ],
  }

  const education = [
    { id: 1, degree: "Bachelor of Technology (B.Tech)", institution: "United Institute of Technology, Naini, Prayagraj", year: "2013 – 2017" },
    { id: 2, degree: "Senior Secondary (Science – PCM)", institution: "Air Force School, Bamrauli, Prayagraj", year: "2012 – 2013" },
    { id: 3, degree: "Certification – Full Stack Web Development", institution: "Masai School, Bengaluru", year: "2023" },
  ]

  return (
    <div className={`${isDark ? "dark" : ""} min-h-screen bg-background text-foreground transition-colors duration-300`}>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-6">
          <h1 className="text-xl sm:text-2xl font-medium shrink-0">Sakshi Dwivedi</h1>
          <nav className="hidden md:flex gap-8 ml-8">
            {navigationItems.map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className={`text-sm font-light transition-colors capitalize ${
                  activeSection === item ? "text-accent font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.replace("-", " ")}
              </button>
            ))}
          </nav>
          <div className="flex md:hidden items-center gap-4">
            <button onClick={() => setIsDark(!isDark)} className="p-2 hover:bg-muted rounded">
              {isDark ? "☀️" : "🌙"}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 hover:bg-muted rounded">
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
          <button onClick={() => setIsDark(!isDark)} className="hidden md:flex p-2 hover:bg-muted rounded">
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border bg-background/95 backdrop-blur">
            <div className="max-w-4xl mx-auto px-4 py-4 space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item)}
                  className="block w-full text-left px-4 py-2 rounded hover:bg-muted text-sm capitalize"
                >
                  {item.replace("-", " ")}
                </button>
              ))}
            </div>
          </nav>
        )}
      </header>

      <nav className="fixed left-10 top-1/2 -translate-y-1/2 z-40 hidden lg:block">
        <div className="flex flex-col gap-8">
          {navigationItems.map((item) => {
            const isActive = activeSection === item
            return (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className="group relative flex items-center gap-3"
                aria-label={`Navigate to ${item}`}
              >
                <div
                  className={`rounded-full transition-all duration-200 flex-shrink-0 ${
                    isActive ? "bg-accent w-3 h-3" : "bg-muted-foreground w-2 h-2 group-hover:bg-accent/50"
                  }`}
                />
                <span
                  className={`text-xs font-medium capitalize transition-opacity whitespace-nowrap ${
                    isActive ? "text-accent opacity-100" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {item.replace("-", " ")}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24">
        <section
          id="about"
          ref={(el) => { sectionsRef.current[0] = el }}
          className="min-h-screen flex items-center py-20 opacity-0"
        >
          <div className="space-y-8 w-full">
            <div className="space-y-4">
              <p className="text-lg text-accent font-semibold uppercase tracking-widest h-[1.75rem] flex items-center">
                <span className="inline-block">{currentText || "\u00A0"}</span>
                <span className="inline-block w-0.5 h-5 bg-accent ml-1 animate-blink flex-shrink-0" />
              </p>
              <h2 className="text-5xl sm:text-7xl font-light leading-tight">
                Delivering quality,
                <br />
                through automation
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed pt-4">
                QA Automation Engineer / SDET with 3+ years of experience developing and executing automated test
                frameworks for web and API applications. Proficient in Java, Selenium WebDriver, TestNG, RestAssured,
                Postman, and CI/CD tools. Designed 50+ automated test suites, reducing manual testing by 40% and
                accelerating release cycles.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm pt-8">
              <a href="tel:+918127503641" className="text-muted-foreground hover:text-accent transition-colors">
                +91 8127503641
              </a>
              <a
                href="mailto:sakshidwivedi171@gmail.com"
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                sakshidwivedi171@gmail.com
              </a>
              <span className="text-muted-foreground">Bengaluru, Karnataka</span>
            </div>
            <div className="flex gap-4 pt-4">
              <a
                href="https://github.com/sakshiDwivedi171"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-colors text-sm"
              >
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/sakshi-dwivedi-0a277b233/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-colors text-sm"
              >
                LinkedIn
              </a>
            </div>
            <a
              href="https://www.linkedin.com/in/sakshi-dwivedi-0a277b233/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-8 px-6 py-3 bg-accent text-accent-foreground rounded hover:opacity-90 transition-opacity text-sm font-medium"
            >
              Connect on LinkedIn
            </a>
          </div>
        </section>

        <section
          id="experience"
          ref={(el) => { sectionsRef.current[1] = el }}
          className="min-h-screen py-20 sm:py-32 opacity-0"
        >
          <div className="space-y-16">
            <div className="border-b border-border pb-8">
              <h2 className="text-4xl sm:text-5xl font-light">Work Experience</h2>
              <p className="text-muted-foreground mt-4 max-w-2xl text-sm">
                QA and backend experience across fintech, MDM, and B2B platforms
              </p>
            </div>
            <div className="space-y-12">
              {experience.map((job) => (
                <article key={job.id} className="pb-12 border-b border-border/50 last:border-0 last:pb-0 space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs text-accent font-semibold uppercase tracking-widest">{job.period}</p>
                    <h3 className="text-2xl sm:text-3xl font-semibold">{job.role}</h3>
                    <p className="text-muted-foreground">{job.company}</p>
                  </div>
                  <p className="text-muted-foreground leading-relaxed pt-2 max-w-3xl text-sm sm:text-base">
                    {job.description}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-4">
                    {job.tech.map((tech) => (
                      <span key={tech} className="px-3 py-1 text-xs bg-muted rounded-full text-muted-foreground">
                        {tech}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="projects" ref={(el) => { sectionsRef.current[2] = el }} className="py-20 sm:py-32 opacity-0">
          <div className="space-y-16">
            <div className="border-b border-border pb-8">
              <h2 className="text-4xl sm:text-5xl font-light">Projects</h2>
              <p className="text-muted-foreground mt-4 max-w-2xl text-sm">
                Automation, API, security, and performance testing across financial and trading systems
              </p>
            </div>
            <div className="space-y-12">
              {projects.map((proj) => (
                <article key={proj.id} className="pb-12 border-b border-border/50 last:border-0 last:pb-0 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-2xl sm:text-3xl font-semibold">{proj.name}</h3>
                    <p className="text-xs text-accent font-semibold uppercase tracking-widest">{proj.tag}</p>
                  </div>
                  <ul className="space-y-2 text-muted-foreground text-sm">
                    {proj.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="skills" ref={(el) => { sectionsRef.current[3] = el }} className="py-20 sm:py-32 opacity-0">
          <div className="space-y-16">
            <div className="border-b border-border pb-8">
              <h2 className="text-4xl sm:text-5xl font-light">Skills & Expertise</h2>
              <p className="text-muted-foreground mt-4 max-w-2xl text-sm">
                Test automation, API and performance testing, CI/CD, and quality assurance
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
              {Object.entries(skills).map(([category, items]) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">{category}</h3>
                  <ul className="space-y-2">
                    {items.map((skill) => (
                      <li key={skill} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="education" ref={(el) => { sectionsRef.current[4] = el }} className="py-20 sm:py-32 opacity-0">
          <div className="space-y-16">
            <div className="border-b border-border pb-8">
              <h2 className="text-4xl sm:text-5xl font-light">Education</h2>
              <p className="text-muted-foreground mt-4 max-w-2xl text-sm">
                B.Tech and certifications in technology and web development
              </p>
            </div>
            <div className="space-y-12">
              {education.map((edu) => (
                <article key={edu.id} className="pb-12 border-b border-border/50 last:border-0 last:pb-0 space-y-3">
                  <div className="space-y-2">
                    <p className="text-xs text-accent font-semibold uppercase tracking-widest">{edu.year}</p>
                    <h3 className="text-2xl sm:text-3xl font-semibold">{edu.degree}</h3>
                    <p className="text-muted-foreground text-sm">{edu.institution}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="github-contributions"
          ref={(el) => { sectionsRef.current[5] = el }}
          className="py-20 sm:py-32 opacity-0"
        >
          <div className="space-y-16">
            <div className="border-b border-border pb-8">
              <h2 className="text-4xl sm:text-5xl font-light">GitHub Contributions</h2>
              <p className="text-muted-foreground mt-4 max-w-2xl text-sm">
                Active on GitHub with focus on test automation and quality assurance
              </p>
            </div>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading GitHub stats...</p>
              </div>
            ) : githubStats ? (
              <div className="space-y-12">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-6 border border-border rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Total Contributions</p>
                    <p className="text-3xl font-semibold text-accent">
                      {additionalStats?.totalContributions?.toLocaleString() ?? "—"}
                    </p>
                  </div>
                  <div className="p-6 border border-border rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Current Streak</p>
                    <p className="text-3xl font-semibold text-accent">
                      {additionalStats?.currentStreak ? `${additionalStats.currentStreak} days` : "—"}
                    </p>
                  </div>
                  <div className="p-6 border border-border rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Public Repositories</p>
                    <p className="text-3xl font-semibold text-accent">{githubStats.public_repos}</p>
                  </div>
                  <div className="p-6 border border-border rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Total Stars</p>
                    <p className="text-3xl font-semibold text-accent">
                      {additionalStats?.totalStars?.toLocaleString() ?? "—"}
                    </p>
                  </div>
                  <div className="p-6 border border-border rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Total Forks</p>
                    <p className="text-3xl font-semibold text-accent">
                      {additionalStats?.totalForks?.toLocaleString() ?? "—"}
                    </p>
                  </div>
                  <div className="p-6 border border-border rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Followers</p>
                    <p className="text-3xl font-semibold text-accent">{githubStats.followers}</p>
                  </div>
                  <div className="p-6 border border-border rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Following</p>
                    <p className="text-3xl font-semibold text-accent">{githubStats.following}</p>
                  </div>
                  <div className="p-6 border border-border rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Member Since</p>
                    <p className="text-lg font-semibold text-accent">
                      {githubStats.created_at ? new Date(githubStats.created_at).getFullYear() : "—"}
                    </p>
                  </div>
                </div>
                <div className="border border-border rounded-lg p-4 bg-muted/20 overflow-hidden">
                  <img
                    src={`https://github-readme-activity-graph.vercel.app/graph?username=sakshiDwivedi171&theme=${isDark ? "github-dark" : "minimal"}&hide_border=true&bg_color=transparent&area=true&color=${isDark ? "#a855f7" : "#7c3aed"}&line=${isDark ? "#c084fc" : "#6d28d9"}&point=${isDark ? "#d8b4fe" : "#5b21b6"}`}
                    alt="GitHub Contribution Graph"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Unable to load GitHub stats</p>
              </div>
            )}
          </div>
        </section>

        <section id="connect" ref={(el) => { sectionsRef.current[6] = el }} className="py-20 sm:py-32 opacity-0">
          <div className="grid lg:grid-cols-2 gap-12 sm:gap-16">
            <div className="space-y-8">
              <h2 className="text-4xl sm:text-5xl font-light">Let&apos;s Connect</h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
                Open to conversations about QA automation, test strategy, and quality engineering. Reach out for
                collaboration or opportunities.
              </p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Email</p>
                  <a
                    href="mailto:sakshidwivedi171@gmail.com"
                    className="text-foreground hover:text-accent transition-colors"
                  >
                    sakshidwivedi171@gmail.com
                  </a>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Phone</p>
                  <a href="tel:+918127503641" className="text-foreground hover:text-accent transition-colors">
                    +91 8127503641
                  </a>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Location</p>
                  <p className="text-foreground">Bengaluru, Karnataka</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Social & Professional</p>
              <div className="flex flex-col gap-3">
                <a
                  href="https://github.com/sakshiDwivedi171"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-accent transition-colors text-sm"
                >
                  → GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/sakshi-dwivedi-0a277b233/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-accent transition-colors text-sm"
                >
                  → LinkedIn
                </a>
              </div>
              <div className="pt-8 border-t border-border">
                <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Sakshi Dwivedi. All rights reserved.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
