const fs = require('fs');
const path = require('path');

const fileReplacements = [
  {
    file: 'src/components/CalendarSync.jsx',
    replacements: [
      { search: /Calendar,\s*/g, replace: '' }
    ]
  },
  {
    file: 'src/components/CourseCard.jsx',
    replacements: [
      { search: /const { theme } = useTheme\(\);/g, replace: 'const {} = useTheme();' }
    ]
  },
  {
    file: 'src/components/Navbar.jsx',
    replacements: [
      { search: /const { theme } = useTheme\(\);/g, replace: 'const {} = useTheme();' }
    ]
  },
  {
    file: 'src/components/Sidebar.jsx',
    replacements: [
      { search: /import { useTheme } from '\.\.\/context\/ThemeContext';\n/g, replace: '' },
      { search: /Sun,\s*Moon,\s*/g, replace: '' }
    ]
  },
  {
    file: 'src/pages/AddAdmin.jsx',
    replacements: [
      { search: /const { theme } = useTheme\(\);/g, replace: 'const {} = useTheme();' }
    ]
  },
  {
    file: 'src/pages/Certificates/AdminCertificates.jsx',
    replacements: [
      { search: /Clock,\s*/g, replace: '' }
    ]
  },
  {
    file: 'src/pages/Certificates/CertificateCard.jsx',
    replacements: [
      { search: /ExternalLink,\s*/g, replace: '' }
    ]
  },
  {
    file: 'src/pages/Certificates/CertificatePreview.jsx',
    replacements: [
      { search: /import { motion, AnimatePresence } from 'framer-motion';/g, replace: "import { motion } from 'framer-motion';" },
      { search: /Share2,\s*/g, replace: '' }
    ]
  },
  {
    file: 'src/pages/Certificates/index.jsx',
    replacements: [
      { search: /Filter,\s*/g, replace: '' }
    ]
  },
  {
    file: 'src/pages/Dashboard.jsx',
    replacements: [
      { search: /const { theme } = useTheme\(\);/g, replace: 'const {} = useTheme();' }
    ]
  },
  {
    file: 'src/pages/EnrollAll.jsx',
    replacements: [
      { search: /const { theme } = useTheme\(\);/g, replace: 'const {} = useTheme();' }
    ]
  },
  {
    file: 'src/pages/FeeManagement/FeeDashboard.jsx',
    replacements: [
      { search: /Legend,\s*/g, replace: '' }
    ]
  },
  {
    file: 'src/pages/FeeManagement/PaymentHistory.jsx',
    replacements: [
      { search: /Eye,\s*/g, replace: '' }
    ]
  },
  {
    file: 'src/pages/FeeManagement/StudentFeePortal.jsx',
    replacements: [
      { search: /Clock,\s*/g, replace: '' }
    ]
  },
  {
    file: 'src/pages/FeeManagement/index.jsx',
    replacements: [
      { search: /BarChart2,\s*/g, replace: '' }
    ]
  },
  {
    file: 'src/pages/IntellMeetDashboard.jsx',
    replacements: [
      { search: /const { theme } = useTheme\(\);/g, replace: 'const {} = useTheme();' }
    ]
  },
  {
    file: 'src/pages/Login.jsx',
    replacements: [
      { search: /LogIn,\s*/g, replace: '' }
    ]
  },
  {
    file: 'src/pages/MeetingRoom.jsx',
    replacements: [
      { search: /import JoiningScreen from '\.\/MeetingRoom\/JoiningScreen';\n/g, replace: '' }
    ]
  },
  {
    file: 'src/pages/Resume/ResumeBuilder.jsx',
    replacements: [
      { search: /PartyPopper,\s*/g, replace: '' },
      { search: /ChevronRight,\s*/g, replace: '' }
    ]
  },
  {
    file: 'src/pages/Resume/ResumePreview.jsx',
    replacements: [
      { search: /const textMain = theme === 'dark' \? '#f3f4f6' : '#1f2937';\n/g, replace: '' }
    ]
  },
  {
    file: 'src/pages/StudentHome.jsx',
    replacements: [
      { search: /import { motion, AnimatePresence } from 'framer-motion';/g, replace: "import { motion } from 'framer-motion';" },
      { search: /Bell,\s*/g, replace: '' },
      { search: /MessageSquare,\s*/g, replace: '' },
      { search: /const \[showNotifications, setShowNotifications\] = useState\(false\);\n/g, replace: '' },
      { search: /const handleMarkAllRead = \(\) => {\n\s*setNotifications\(prev => prev.map\(n => \({ \.\.\.n, read: true }\)\)\);\n\s*};\n/g, replace: '' },
      { search: /const unreadCount = notifications.filter\(n => !n.read\).length;\n/g, replace: '' }
    ]
  },
  {
    file: 'src/pages/Students.jsx',
    replacements: [
      { search: /const { theme } = useTheme\(\);/g, replace: 'const {} = useTheme();' }
    ]
  },
  {
    file: 'src/pages/StudyPlanner/StudyPlanner.jsx',
    replacements: [
      { search: /import React, { useState, useEffect } from 'react';/g, replace: "import React, { useState } from 'react';" }
    ]
  },
  {
    file: 'src/pages/TrainerLogin.jsx',
    replacements: [
      { search: /LogIn,\s*/g, replace: '' }
    ]
  },
  {
    file: 'src/pages/Trainers.jsx',
    replacements: [
      { search: /const { theme } = useTheme\(\);/g, replace: 'const {} = useTheme();' }
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
