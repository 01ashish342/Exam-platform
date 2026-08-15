const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { name: "Admin", email: "admin@example.com", password, role: "ADMIN" },
  });

  await prisma.user.upsert({
    where: { email: "student@example.com" },
    update: {},
    create: { name: "Student", email: "student@example.com", password, role: "STUDENT" },
  });

  const exam = await prisma.exam.create({
    data: {
      title: "General Awareness Mock Test 1",
      description: "Sample competitive exam mock test",
      durationMinutes: 10,
      marksPerQ: 2,
      negativeMarks: 0.5,
      isPublished: true,
      totalMarks: 10,
      createdById: admin.id,
    },
  });

  const questionsData = [
    { q: "Capital of India?", opts: ["Mumbai", "New Delhi", "Kolkata", "Chennai"], correct: 1 },
    { q: "2 + 2 * 2 = ?", opts: ["6", "8", "4", "2"], correct: 0 },
    { q: "Largest planet in the solar system?", opts: ["Earth", "Mars", "Jupiter", "Venus"], correct: 2 },
    { q: "Who wrote the Indian National Anthem?", opts: ["Bankim Chandra", "Rabindranath Tagore", "Gandhi", "Nehru"], correct: 1 },
    { q: "River Ganga originates from?", opts: ["Gangotri", "Yamunotri", "Rishikesh", "Haridwar"], correct: 0 },
  ];

  for (let i = 0; i < questionsData.length; i++) {
    const { q, opts, correct } = questionsData[i];
    const question = await prisma.question.create({
      data: {
        examId: exam.id,
        questionText: q,
        order: i,
        section: "General",
        options: { create: opts.map((text) => ({ text })) },
      },
      include: { options: true },
    });
    await prisma.question.update({
      where: { id: question.id },
      data: { correctOptionId: question.options[correct].id },
    });
  }

  console.log("Seed complete.");
  console.log("Admin login:   admin@example.com / password123");
  console.log("Student login: student@example.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });