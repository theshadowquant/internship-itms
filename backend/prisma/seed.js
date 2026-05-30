const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean old records to allow safe re-seeding
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.dailyLog.deleteMany();
  await prisma.application.deleteMany();
  await prisma.internship.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create default admin and student users
  const adminPasswordHash = await bcrypt.hash('Admin@1234', 12);
  const studentPasswordHash = await bcrypt.hash('Test@1234', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@shadowquant.io',
      passwordHash: adminPasswordHash,
      firstName: 'Shadow',
      lastName: 'Admin',
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      phone: '+919999999999',
      bio: 'Lead ITMS Administrator at ShadowQuant Dynamics.',
      isVerified: true,
    },
  });

  const student1 = await prisma.user.create({
    data: {
      email: 'student1@test.com',
      passwordHash: studentPasswordHash,
      firstName: 'Aarav',
      lastName: 'Sharma',
      role: 'STUDENT',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
      phone: '+919876543210',
      bio: 'Enthusiastic computer science student passionate about fullstack web development and quantitative models.',
      isVerified: true,
      studentProfile: {
        create: {
          collegeName: 'Indian Institute of Technology (IIT) Delhi',
          degree: 'Bachelor of Technology',
          branch: 'Computer Science and Engineering',
          graduationYear: 2027,
          gpa: 9.2,
          skills: JSON.stringify(['React', 'Node.js', 'Express', 'JavaScript', 'TypeScript', 'Tailwind CSS', 'SQL']),
          portfolioUrl: 'https://aaravsharma.dev',
          linkedinUrl: 'https://linkedin.com/in/aarav-sharma-iit',
          githubUrl: 'https://github.com/aaravsharma',
          resumeUrl: 'https://aaravsharma.dev/resume.pdf',
          availability: 'IMMEDIATE',
          expectedStipend: 35000,
          profileScore: 90,
        },
      },
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: 'student2@test.com',
      passwordHash: studentPasswordHash,
      firstName: 'Ishita',
      lastName: 'Patel',
      role: 'STUDENT',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      phone: '+919876543211',
      bio: 'Statistics major focusing on financial analysis, UI/UX, and data engineering.',
      isVerified: true,
      studentProfile: {
        create: {
          collegeName: 'BITS Pilani',
          degree: 'M.Sc. Economics & B.E. CSE',
          branch: 'Information Systems',
          graduationYear: 2026,
          gpa: 8.8,
          skills: JSON.stringify(['React', 'Python', 'Pandas', 'Recharts', 'Figma', 'Excel', 'UI/UX']),
          portfolioUrl: 'https://ishitapatel.com',
          linkedinUrl: 'https://linkedin.com/in/ishita-patel',
          githubUrl: 'https://github.com/ishitapatel',
          resumeUrl: 'https://ishitapatel.com/resume.pdf',
          availability: 'ONE_MONTH',
          expectedStipend: 30000,
          profileScore: 85,
        },
      },
    },
  });

  const student3 = await prisma.user.create({
    data: {
      email: 'student3@test.com',
      passwordHash: studentPasswordHash,
      firstName: 'Kabir',
      lastName: 'Mehta',
      role: 'STUDENT',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      phone: '+919876543212',
      bio: 'Aspiring product engineer with experience in cloud deployments and API architectures.',
      isVerified: false,
      studentProfile: {
        create: {
          collegeName: 'Delhi Technological University (DTU)',
          degree: 'B.Tech',
          branch: 'Software Engineering',
          graduationYear: 2027,
          gpa: 7.9,
          skills: JSON.stringify(['Node.js', 'Express', 'SQLite', 'Docker', 'AWS', 'Redis']),
          portfolioUrl: 'https://kabirmehta.io',
          linkedinUrl: 'https://linkedin.com/in/kabir-mehta',
          githubUrl: 'https://github.com/kabirmehta',
          resumeUrl: 'https://kabirmehta.io/resume.pdf',
          availability: 'THREE_MONTHS',
          expectedStipend: 25000,
          profileScore: 70,
        },
      },
    },
  });

  console.log('✅ Users & Student Profiles seeded.');

  // 2. Seed 5 Internships (Posted by Admin)
  const internships = await Promise.all([
    prisma.internship.create({
      data: {
        title: 'Software Development Engineer Intern (SWE)',
        companyName: 'Google India',
        companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&w=150&q=80',
        description: 'Join the Google core software engineering team to design, test, and implement premium scalable search features. You will work alongside world-class mentors.',
        responsibilities: 'Write robust, clean, and tested code. Participate in design meetings and pull request reviews. Optimize low-latency search indexes.',
        requirements: 'Proficient in JavaScript/TypeScript, Java, or C++. Strong understanding of data structures and algorithms. GPA above 8.0 preferred.',
        skillsRequired: JSON.stringify(['TypeScript', 'Node.js', 'SQL', 'React']),
        domain: 'Frontend & Systems Development',
        location: 'Bangalore, Karnataka',
        isRemote: false,
        durationWeeks: 12,
        stipendMin: 50000,
        stipendMax: 60000,
        openings: 3,
        minGpa: 8.0,
        applicationDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15), // 15 days from now
        startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days from now
        status: 'ACTIVE',
        isFeatured: true,
        viewsCount: 142,
        postedById: admin.id,
      },
    }),
    prisma.internship.create({
      data: {
        title: 'SDET Intern (Software Development Engineer in Test)',
        companyName: 'Microsoft India',
        companyLogo: 'https://images.unsplash.com/photo-1625014020993-11db19b080f8?auto=format&fit=crop&w=150&q=80',
        description: 'Design comprehensive testing pipelines, write automated test cases for high-scale enterprise applications, and coordinate deployments.',
        responsibilities: 'Build end-to-end UI testing suites. Perform regression, unit, and pressure test models. Maintain CI/CD pipelines.',
        requirements: 'Knowledge of automation frameworks (Playwright, Selenium). Strong scripting skill. Experience with GitHub Actions.',
        skillsRequired: JSON.stringify(['TypeScript', 'Playwright', 'Node.js', 'Docker']),
        domain: 'Quality Assurance & CI/CD',
        location: 'Hyderabad, Telangana',
        isRemote: true,
        durationWeeks: 16,
        stipendMin: 45000,
        stipendMax: 50000,
        openings: 2,
        minGpa: 7.5,
        applicationDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 8), // 8 days from now
        startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20), // 20 days from now
        status: 'ACTIVE',
        isFeatured: false,
        viewsCount: 98,
        postedById: admin.id,
      },
    }),
    prisma.internship.create({
      data: {
        title: 'Backend Engineering Intern',
        companyName: 'Razorpay',
        companyLogo: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=150&q=80',
        description: 'Work directly on standard-setting payment gateway integrations. Scale backend APIs and optimize database queries under extreme concurrency loads.',
        responsibilities: 'Write robust REST and gRPC services. Implement high-integrity financial ledger tables. Debug production logs.',
        requirements: 'Strong grasp of Node.js, Express, databases, and microservices concepts. High attention to detail.',
        skillsRequired: JSON.stringify(['Node.js', 'Express', 'SQL', 'Redis']),
        domain: 'Backend Engineering',
        location: 'Bangalore, Karnataka',
        isRemote: false,
        durationWeeks: 24,
        stipendMin: 40000,
        stipendMax: 45000,
        openings: 5,
        minGpa: 7.0,
        applicationDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25), // 25 days from now
        startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 40), // 40 days from now
        status: 'ACTIVE',
        isFeatured: true,
        viewsCount: 180,
        postedById: admin.id,
      },
    }),
    prisma.internship.create({
      data: {
        title: 'Data Engineer Intern',
        companyName: 'Flipkart',
        companyLogo: 'https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&w=150&q=80',
        description: 'Build ETL pipelines to ingest big data, and construct business intelligence charts showing core student shopping habits.',
        responsibilities: 'Clean, parse, and process raw system logs. Design structured data tables. Create dashboards.',
        requirements: 'Experience in Python, SQL, and database concepts. Passionate about big data metrics.',
        skillsRequired: JSON.stringify(['Python', 'SQL', 'Pandas', 'AWS']),
        domain: 'Data Science & BI',
        location: 'Mumbai, Maharashtra',
        isRemote: false,
        durationWeeks: 12,
        stipendMin: 35000,
        stipendMax: 40000,
        openings: 4,
        minGpa: 7.5,
        applicationDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
        startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 days from now
        status: 'ACTIVE',
        isFeatured: false,
        viewsCount: 88,
        postedById: admin.id,
      },
    }),
    prisma.internship.create({
      data: {
        title: 'Product Engineering Intern',
        companyName: 'Zerodha',
        companyLogo: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=150&q=80',
        description: 'Design elegant and ultra-fast trading dashboard layouts. Collaborate in cross-functional squads to construct slick UI interfaces.',
        responsibilities: 'Build interactive line, area, and candle charts. Resolve UI lag. Style state variables.',
        requirements: 'Extremely strong CSS and component layout understanding. Experienced with React and Recharts.',
        skillsRequired: JSON.stringify(['React', 'Tailwind CSS', 'TypeScript', 'JavaScript']),
        domain: 'Frontend Engineering',
        location: 'Bangalore, Karnataka',
        isRemote: true,
        durationWeeks: 20,
        stipendMin: 45000,
        stipendMax: 55000,
        openings: 2,
        minGpa: 8.0,
        applicationDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18), // 18 days from now
        startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 28), // 28 days from now
        status: 'ACTIVE',
        isFeatured: true,
        viewsCount: 155,
        postedById: admin.id,
      },
    }),
  ]);

  console.log('✅ Internships seeded.');

  // 3. Seed 3 Applications for student1 (Aarav Sharma)
  // Google SWE (Hired), Microsoft SDET (Shortlisted), Flipkart Data Eng (Applied)
  const appGoogle = await prisma.application.create({
    data: {
      internshipId: internships[0].id, // Google SWE
      userId: student1.id,
      coverLetter: 'I am Aarav Sharma, a CS student from IIT Delhi. I am highly proficient in React, Node, and SQL. I have developed several fullstack tools. I am excited to work on Google Search algorithms and scale real projects.',
      resumeUrl: 'https://aaravsharma.dev/resume.pdf',
      status: 'HIRED',
      matchScore: 100, // 4 out of 4 matching skills
      stageHistory: JSON.stringify([
        { stage: 'APPLIED', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), note: 'Application submitted successfully.' },
        { stage: 'SHORTLISTED', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(), note: 'Resume selected for coding assessment.' },
        { stage: 'INTERVIEW', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), note: 'Technical interview conducted.' },
        { stage: 'OFFER_SENT', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), note: 'Stipend set at ₹60,000/mo. Response requested within 48h.' },
        { stage: 'HIRED', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), note: 'Candidate accepted offer and confirmed start date.' },
      ]),
      offerLetterUrl: 'https://aaravsharma.dev/docs/google_offer.pdf',
    },
  });

  const appMicrosoft = await prisma.application.create({
    data: {
      internshipId: internships[1].id, // Microsoft SDET
      userId: student1.id,
      coverLetter: 'I am deeply interested in QA and automation systems. I have built robust testing suites using automated frameworks.',
      resumeUrl: 'https://aaravsharma.dev/resume.pdf',
      status: 'SHORTLISTED',
      matchScore: 50, // 2 out of 4 skills: ['TypeScript', 'Node.js']
      stageHistory: JSON.stringify([
        { stage: 'APPLIED', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), note: 'Application recorded.' },
        { stage: 'SHORTLISTED', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), note: 'Shortlisted for online quiz.' },
      ]),
    },
  });

  const appFlipkart = await prisma.application.create({
    data: {
      internshipId: internships[3].id, // Flipkart Data Eng
      userId: student1.id,
      coverLetter: 'I love writing SQL queries and parsing unstructured logs. Data analytics is my favorite branch of CSE.',
      resumeUrl: 'https://aaravsharma.dev/resume.pdf',
      status: 'APPLIED',
      matchScore: 25, // 1 out of 4 skills: ['SQL']
      stageHistory: JSON.stringify([
        { stage: 'APPLIED', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), note: 'Initial review pending.' },
      ]),
    },
  });

  console.log('✅ Applications seeded.');

  // 4. Seed 5 Daily Logs for student1 (associated with Google Hired Application)
  const logs = [
    {
      userId: student1.id,
      applicationId: appGoogle.id,
      logDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
      checkIn: '09:00',
      checkOut: '17:00',
      hoursWorked: 8.0,
      workSummary: 'Initial setup of Google Search experimental backend repository. Installed client structures, configured SQLite integration logs, and resolved environment warnings.',
      mood: 'GOOD',
      status: 'APPROVED',
      supervisorNote: 'Solid initial start Aarav. Excellent documentation and clean repo setup.',
    },
    {
      userId: student1.id,
      applicationId: appGoogle.id,
      logDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4 days ago
      checkIn: '09:00',
      checkOut: '18:00',
      hoursWorked: 9.0,
      workSummary: 'Integrated Express router architectures for authentication models. Drafted custom schemas for database collections and executed validations using express-validators.',
      mood: 'GREAT',
      status: 'APPROVED',
      supervisorNote: 'Outstanding work. Appreciate the prompt error bounds configurations.',
    },
    {
      userId: student1.id,
      applicationId: appGoogle.id,
      logDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      checkIn: '09:30',
      checkOut: '18:30',
      hoursWorked: 9.0,
      workSummary: 'Began building profile routes but got stuck on Multer file parsing options.',
      mood: 'DIFFICULT',
      status: 'REJECTED',
      supervisorNote: 'Please provide a more descriptive summary. What was the exact issue faced, and how did you attempt to resolve it? Re-submit with more detail.',
    },
    {
      userId: student1.id,
      applicationId: appGoogle.id,
      logDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      checkIn: '09:00',
      checkOut: '17:00',
      hoursWorked: 8.0,
      workSummary: 'Successfully resolved Multer file buffer upload loops. Implemented static serving of uploaded image paths. Prepared updated API endpoint mappings for avatar uploads.',
      mood: 'GOOD',
      status: 'PENDING',
      supervisorNote: null,
    },
    {
      userId: student1.id,
      applicationId: appGoogle.id,
      logDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
      checkIn: '09:00',
      checkOut: '17:30',
      hoursWorked: 8.5,
      workSummary: 'Drafted full analytics endpoints aggregates. Extracted total application frequencies, hour distributions, and prepared Recharts-compliant dashboard datasets.',
      mood: 'GREAT',
      status: 'PENDING',
      supervisorNote: null,
    },
  ];

  for (const log of logs) {
    await prisma.dailyLog.create({ data: log });
  }

  console.log('✅ Daily Logs seeded.');

  // 5. Seed 3 Notifications for student1
  await prisma.notification.create({
    data: {
      userId: student1.id,
      type: 'application_status',
      title: 'Congratulations! You are Hired 🚀',
      body: 'Your application for Software Development Engineer Intern (SWE) at Google India has been approved! The offer has been accepted.',
      isRead: false,
      actionUrl: '/applications',
    },
  });

  await prisma.notification.create({
    data: {
      userId: student1.id,
      type: 'log_status',
      title: 'Daily Log Rejected ⚠️',
      body: 'Your daily log for 3 days ago was rejected by the supervisor. Reason: Please provide a more descriptive summary.',
      isRead: false,
      actionUrl: '/daily-logs',
    },
  });

  await prisma.notification.create({
    data: {
      userId: student1.id,
      type: 'general',
      title: 'Welcome to ShadowQuant Dynamics ITMS 💼',
      body: 'Start exploring active internships and tracking your progress on the dashboard.',
      isRead: true,
      actionUrl: '/dashboard',
    },
  });

  console.log('✅ Notifications seeded.');
  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
