const fs = require('fs');
const path = require('path');

const fileReplacements = [
  {
    file: 'src/components/CourseCard.jsx',
    replacements: [
      { search: /const \{\} = useTheme\(\);/g, replace: 'useTheme();' }
    ]
  },
  {
    file: 'src/components/Navbar.jsx',
    replacements: [
      { search: /const \{\} = useTheme\(\);/g, replace: 'useTheme();' }
    ]
  },
  {
    file: 'src/pages/AddAdmin.jsx',
    replacements: [
      { search: /const \{\} = useTheme\(\);/g, replace: 'useTheme();' }
    ]
  },
  {
    file: 'src/pages/Dashboard.jsx',
    replacements: [
      { search: /const \{\} = useTheme\(\);/g, replace: 'useTheme();' }
    ]
  },
  {
    file: 'src/pages/EnrollAll.jsx',
    replacements: [
      { search: /const \{\} = useTheme\(\);/g, replace: 'useTheme();' }
    ]
  },
  {
    file: 'src/pages/IntellMeetDashboard.jsx',
    replacements: [
      { search: /const \{\} = useTheme\(\);/g, replace: 'useTheme();' }
    ]
  },
  {
    file: 'src/pages/Students.jsx',
    replacements: [
      { search: /const \{\} = useTheme\(\);/g, replace: 'useTheme();' }
    ]
  },
  {
    file: 'src/pages/Trainers.jsx',
    replacements: [
      { search: /const \{\} = useTheme\(\);/g, replace: 'useTheme();' }
    ]
  },
  {
    file: 'src/pages/Certificates/index.jsx',
    replacements: [
      { search: /Filter,\s*/g, replace: '' }
    ]
  },
  {
    file: 'src/pages/FeeManagement/FeeDashboard.jsx',
    replacements: [
      { search: /Legend,\s*/g, replace: '' }
    ]
  },
  {
    file: 'src/pages/MeetingRoom.jsx',
    replacements: [
      { search: /const \[JoiningScreen, setJoiningScreen\] = useState\(null\);/g, replace: '' },
      { search: /const JoiningScreen = .*/g, replace: '' }
    ]
  },
  {
    file: 'src/pages/Resume/ResumePreview.jsx',
    replacements: [
      { search: /const textMain =.*/g, replace: '' }
    ]
  },
  {
    file: 'src/pages/StudentHome.jsx',
    replacements: [
      { search: /const \[showNotifications, setShowNotifications\] = useState\(false\);\n?/g, replace: '' },
      { search: /const handleMarkAllRead = \(\) => \{\n\s*setNotifications\(prev => prev.map\(n => \(\{ \.\.\.n, read: true \}\)\)\);\n\s*\};\n?/g, replace: '' },
      { search: /const unreadCount = notifications.filter\(n => !n.read\).length;\n?/g, replace: '' }
    ]
  }
];

const basePath = path.join(__dirname);

fileReplacements.forEach(({ file, replacements }) => {
  const filePath = path.join(basePath, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    replacements.forEach(({ search, replace }) => {
      content = content.replace(search, replace);
    });
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});
