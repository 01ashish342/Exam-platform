const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // =========================================================
  // PASSWORD
  // =========================================================

  const password = await bcrypt.hash("password123", 10);

  // =========================================================
  // USERS
  // =========================================================

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@example.com",
    },
    update: {},
    create: {
      name: "Admin",
      email: "admin@example.com",
      password,
      role: "ADMIN",
    },
  });

  const student = await prisma.user.upsert({
    where: {
      email: "student@example.com",
    },
    update: {},
    create: {
      name: "Student",
      email: "student@example.com",
      password,
      role: "STUDENT",
    },
  });

  console.log("Users created.");

  // =========================================================
  // EXAM
  // =========================================================

  const exam = await prisma.exam.create({
    data: {
      title: "General Awareness Mock Test 1",
      description: "Sample competitive exam mock test",

      durationMinutes: 10,

      // 5 questions × 2 marks = 10
      totalMarks: 10,
      marksPerQ: 2,

      // Negative marking
      negativeMarks: 0.5,

      isPublished: true,

      createdById: admin.id,
    },
  });

  console.log("Exam created.");

  // =========================================================
  // QUESTIONS
  // =========================================================

  const questionsData = [
    {
      q: "Capital of India?",
      opts: ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
      correct: 1,
    },

    {
      q: "2 + 2 * 2 = ?",
      opts: ["6", "8", "4", "2"],
      correct: 0,
    },

    {
      q: "Largest planet in the solar system?",
      opts: ["Earth", "Mars", "Jupiter", "Venus"],
      correct: 2,
    },

    {
      q: "Who wrote the Indian National Anthem?",
      opts: [
        "Bankim Chandra",
        "Rabindranath Tagore",
        "Gandhi",
        "Nehru",
      ],
      correct: 1,
    },

    {
      q: "River Ganga originates from?",
      opts: ["Gangotri", "Yamunotri", "Rishikesh", "Haridwar"],
      correct: 0,
    },
  ];

  // =========================================================
  // CREATE QUESTIONS + OPTIONS
  // =========================================================

  for (let i = 0; i < questionsData.length; i++) {
    const { q, opts, correct } = questionsData[i];

    await prisma.question.create({
      data: {
        examId: exam.id,

        questionText: q,

        order: i,

        section: "General",

        // Default is SINGLE_CORRECT,
        // but explicitly setting it makes the seed clear.
        type: "SINGLE_CORRECT",

        options: {
          create: opts.map((text, index) => ({
            text,

            // The correct option gets true
            isCorrect: index === correct,

            order: index,
          })),
        },
      },
    });
  }

  console.log("Questions and options created.");

  // =========================================================
  // DONE
  // =========================================================

  console.log("\n=================================");
  console.log("Seed complete!");
  console.log("=================================");

  console.log("\nAdmin login:");
  console.log("Email:    admin@example.com");
  console.log("Password: password123");

  console.log("\nStudent login:");
  console.log("Email:    student@example.com");
  console.log("Password: password123");

  console.log("\nExam:");
  console.log("General Awareness Mock Test 1");
}

main()
  .catch((error) => {
    console.error("Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });