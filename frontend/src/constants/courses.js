export const COURSE_CATALOG = [
  {
    id: 1,
    title: 'Django Full Stack',
    image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=60',
    videoUrl: 'https://www.youtube.com/playlist?list=PLsyeobzWxl7r2ukVgTqIQcl-1T0C2mzau',
    description: 'Master full-stack web development with the Django framework.',
    duration: '12 hrs',
    lessons: 45,
  },
  {
    id: 2,
    title: 'React JS Development',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60',
    videoUrl: 'https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt',
    description: 'Build modern, high-performance user interfaces with React.',
    duration: '10 hrs',
    lessons: 38,
  },
  {
    id: 3,
    title: 'Python Programming',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60',
    videoUrl: 'https://www.youtube.com/playlist?list=PLGjplmyvwdl3HtcaYFdh0haTSXMb8vlnT',
    description: 'Complete Python programming from basics to advanced concepts.',
    duration: '8 hrs',
    lessons: 32,
  },
  {
    id: 4,
    title: 'Node.js Backend',
    image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&auto=format&fit=crop&q=60',
    videoUrl: 'https://www.youtube.com/playlist?list=PLinedj3B30sDby4Al-i9ArGWBMNYsE4oL',
    description: 'Scalable server-side JavaScript development with Node.js.',
    duration: '9 hrs',
    lessons: 36,
  },
  {
    id: 5,
    title: 'Flutter Mobile App',
    image: 'https://images.unsplash.com/photo-1617042375876-a13e36734a04?w=800&auto=format&fit=crop&q=60',
    videoUrl: 'https://www.youtube.com/playlist?list=PL4cUxeGkcC9jLYyp2Aoh6hcWuxFDX6PBJ',
    description: 'Create beautiful cross-platform apps with Flutter & Dart.',
    duration: '11 hrs',
    lessons: 42,
  },
  {
    id: 6,
    title: 'AWS Cloud Computing',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
    videoUrl: 'https://www.youtube.com/playlist?list=PLEiEAq2VkUULlNtIFhEQHo8gacvme35rz',
    description: 'Deploy and manage applications on Amazon Web Services.',
    duration: '14 hrs',
    lessons: 52,
  },
  {
    id: 7,
    title: 'UI/UX Design',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop&q=60',
    videoUrl: 'https://www.youtube.com/playlist?list=PLu0W_9lII9aiHL7hGuwWC2mky1AWG7YyE',
    description: 'Principles of modern user interface and experience design.',
    duration: '8 hrs',
    lessons: 25,
  },
  {
    id: 8,
    title: 'Data Science',
    image: 'https://images.unsplash.com/photo-1551288049-bbbda5366fd9?w=800&auto=format&fit=crop&q=60',
    videoUrl: 'https://www.youtube.com/playlist?list=PLu0W_9lII9agK8pojo23OHiNz3Jm6VQzP',
    description: 'Analyze and visualize data using Python and libraries.',
    duration: '15 hrs',
    lessons: 60,
  }
];

export const findEnrolledCourse = (courseName) => {
  if (!courseName) return null;
  const lower = courseName.toLowerCase();
  return COURSE_CATALOG.find(
    (c) =>
      lower.includes(c.title.toLowerCase()) ||
      c.title.toLowerCase().includes(lower.split(' ')[0])
  );
};
