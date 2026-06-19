import React, { forwardRef } from 'react';

const Section = ({ title, children, accent, border }) => (
  <section className="mb-5">
    <h2 className={`text-xs font-bold uppercase tracking-[0.15em] mb-2 pb-1 border-b ${accent} ${border}`}>{title}</h2>
    {children}
  </section>
);

const ResumePreview = forwardRef(({ data, template = 'modern' }, ref) => {
  const {
    phone, address, linkedin, github, portfolio, summary,
    education_details = [], skills = [], projects = [], experiences = [],
    certifications = [], achievements = [], languages = [],
    student_name, student_email
  } = data;

  // ─── Template configs ─────────────────────────────────────────────────────
  const configs = {
    modern: {
      wrap: 'bg-white font-sans text-slate-800',
      header: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-7',
      nameStyle: 'text-3xl font-black tracking-tight',
      body: 'px-8 py-6',
      accent: 'text-indigo-600',
      border: 'border-indigo-200',
      muted: 'text-slate-500',
      tag: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    },
    professional: {
      wrap: 'bg-white font-serif text-gray-800',
      header: 'border-b-4 border-gray-800 px-8 py-7 text-center',
      nameStyle: 'text-4xl font-black uppercase tracking-widest text-gray-900',
      body: 'px-8 py-6',
      accent: 'text-gray-800',
      border: 'border-gray-400',
      muted: 'text-gray-600',
      tag: 'bg-gray-100 text-gray-700 border border-gray-300',
    },
    developer: {
      wrap: 'bg-gray-950 font-mono text-gray-200',
      header: 'border-b border-emerald-500/30 px-8 py-7',
      nameStyle: 'text-3xl font-black text-emerald-400 tracking-tight',
      body: 'px-8 py-6',
      accent: 'text-emerald-400',
      border: 'border-emerald-800',
      muted: 'text-gray-400',
      tag: 'bg-emerald-950 text-emerald-400 border border-emerald-800',
    },
    executive: {
      wrap: 'bg-slate-50 font-sans text-slate-900',
      header: 'bg-slate-900 text-white px-8 py-8',
      nameStyle: 'text-3xl font-black tracking-tight',
      body: 'px-8 py-6',
      accent: 'text-slate-700',
      border: 'border-slate-300',
      muted: 'text-slate-500',
      tag: 'bg-slate-200 text-slate-700 border border-slate-300',
    },
    minimal: {
      wrap: 'bg-white font-sans text-gray-900',
      header: 'px-8 pt-8 pb-4',
      nameStyle: 'text-4xl font-light tracking-tight text-gray-900',
      body: 'px-8 py-4',
      accent: 'text-gray-400',
      border: 'border-gray-200',
      muted: 'text-gray-500',
      tag: 'bg-gray-50 text-gray-600 border border-gray-200',
    },
  };

  const c = configs[template] || configs.modern;
  const isDark = template === 'developer' || template === 'executive';

  const contactColor = isDark ? 'text-gray-300' : c.muted;
  

  const links = [linkedin && { label: 'LinkedIn', url: linkedin }, github && { label: 'GitHub', url: github }, portfolio && { label: 'Portfolio', url: portfolio }].filter(Boolean);
  const techSkills = skills.filter(s => s.skill_type === 'Technical').map(s => s.skill_name);
  const softSkills = skills.filter(s => s.skill_type === 'Soft').map(s => s.skill_name);

  return (
    <div ref={ref} className={`w-full max-w-[800px] min-h-[1100px] mx-auto shadow-2xl ${c.wrap} box-border overflow-hidden break-words`}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className={c.header}>
        <h1 className={`${c.nameStyle} mb-1`}>{student_name || 'Your Name'}</h1>
        <div className={`flex flex-wrap gap-x-4 gap-y-1 text-sm mt-2 ${contactColor}`}>
          {student_email && <span className="break-all">{student_email}</span>}
          {phone && <span>• {phone}</span>}
          {address && <span>• {address}</span>}
          {links.map(l => (
            <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
              className={`underline underline-offset-2 ${template === 'developer' ? 'text-emerald-400' : template === 'modern' ? 'text-indigo-200' : ''}`}>
              {l.label}
            </a>
          ))}
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className={c.body}>

        {summary && (
          <Section title="Professional Summary" accent={c.accent} border={c.border}>
            <p className={`text-sm leading-relaxed ${c.muted}`}>{summary}</p>
          </Section>
        )}

        {experiences.length > 0 && (
          <Section title="Experience" accent={c.accent} border={c.border}>
            {experiences.map((exp, i) => (
              <div key={i} className="mb-4">
                <div className="flex justify-between items-baseline flex-wrap gap-1">
                  <span className="font-bold text-sm">{exp.role}</span>
                  <span className={`text-xs font-semibold ${c.muted}`}>{exp.duration}</span>
                </div>
                <div className={`text-xs font-semibold mb-1 ${c.accent}`}>{exp.company}</div>
                <p className={`text-xs leading-relaxed whitespace-pre-wrap ${c.muted}`}>{exp.description}</p>
              </div>
            ))}
          </Section>
        )}

        {projects.length > 0 && (
          <Section title="Projects" accent={c.accent} border={c.border}>
            {projects.map((proj, i) => (
              <div key={i} className="mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm">{proj.title}</span>
                  {proj.github_link && <a href={proj.github_link} className={`text-xs underline ${c.accent}`}>GitHub</a>}
                  {proj.live_link && <a href={proj.live_link} className={`text-xs underline ${c.accent}`}>Live</a>}
                </div>
                {proj.technologies && <div className={`text-xs font-medium mb-1 ${c.muted}`}>{proj.technologies}</div>}
                <p className={`text-xs leading-relaxed whitespace-pre-wrap ${c.muted}`}>{proj.description}</p>
              </div>
            ))}
          </Section>
        )}

        {education_details.length > 0 && (
          <Section title="Education" accent={c.accent} border={c.border}>
            {education_details.map((edu, i) => (
              <div key={i} className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold text-sm">{edu.degree}</div>
                  <div className={`text-xs ${c.muted}`}>{edu.college}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-semibold ${c.muted}`}>{edu.year}</div>
                  {edu.percentage && <div className={`text-xs ${c.accent}`}>{edu.percentage}</div>}
                </div>
              </div>
            ))}
          </Section>
        )}

        {skills.length > 0 && (
          <Section title="Skills" accent={c.accent} border={c.border}>
            {techSkills.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-bold mr-2">Technical:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {techSkills.map((s, i) => (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded ${c.tag}`}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {softSkills.length > 0 && (
              <div>
                <span className="text-xs font-bold mr-2">Soft Skills:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {softSkills.map((s, i) => (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded ${c.tag}`}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {certifications.length > 0 && (
          <Section title="Certifications" accent={c.accent} border={c.border}>
            {certifications.map((cert, i) => (
              <div key={i} className="flex justify-between mb-1.5">
                <div>
                  <span className="font-semibold text-sm">{cert.name}</span>
                  {cert.issuer && <span className={`text-xs ml-2 ${c.muted}`}>— {cert.issuer}</span>}
                  {cert.link && <a href={cert.link} className={`ml-2 text-xs underline ${c.accent}`}>View</a>}
                </div>
                <span className={`text-xs ${c.muted}`}>{cert.date}</span>
              </div>
            ))}
          </Section>
        )}

        {achievements.length > 0 && (
          <Section title="Achievements" accent={c.accent} border={c.border}>
            {achievements.map((a, i) => (
              <div key={i} className="mb-2">
                <div className="font-semibold text-sm">{a.title}</div>
                <p className={`text-xs leading-relaxed ${c.muted}`}>{a.description}</p>
              </div>
            ))}
          </Section>
        )}

        {languages.length > 0 && (
          <Section title="Languages" accent={c.accent} border={c.border}>
            <p className={`text-sm ${c.muted}`}>{languages.map(l => `${l.name} (${l.proficiency})`).join(' • ')}</p>
          </Section>
        )}

      </div>
    </div>
  );
});

export default ResumePreview;
