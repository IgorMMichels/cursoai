import { useState } from 'react'
import { modules } from '@/lib/course'

export function CourseOutline() {
  const [expanded, setExpanded] = useState<string | null>(modules[0]?.id ?? null)

  return <div className="course-outline">
    {modules.map((module) => {
      const isOpen = expanded === module.id
      const triggerId = `outline-trigger-${module.id}`
      const panelId = `outline-panel-${module.id}`

      return <div className="outline-module" key={module.id} data-open={isOpen}>
        <h3>
          <button
            type="button"
            id={triggerId}
            className="outline-trigger"
            aria-expanded={isOpen}
            aria-controls={panelId}
            onClick={() => setExpanded(isOpen ? null : module.id)}
          >
            <span className="outline-number">{module.number}</span>
            <span className="outline-title">{module.title}</span>
            <span className="outline-duration">{module.duration}</span>
            <span className="outline-toggle" aria-hidden="true" />
          </button>
        </h3>
        <div id={panelId} role="region" aria-labelledby={triggerId} hidden={!isOpen} className="outline-panel">
          <p>{module.subtitle}</p>
          <ol className="outline-lessons">
            {module.lessons.map((lesson) => <li key={lesson.id}>
              <span>{lesson.title}</span>
              <span className="outline-lesson-duration">{lesson.duration}</span>
            </li>)}
          </ol>
        </div>
      </div>
    })}
  </div>
}
