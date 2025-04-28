<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Caden Kraft</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '#6366F1',
          }
        }
      }
    }
  </script>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      transition: background 0.5s, color 0.5s;
    }
    .glass {
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
  </style>
</head>

<body class="bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900 dark:from-gray-900 dark:to-gray-800 dark:text-gray-100">

  <!-- Navbar -->
  <nav class="glass fixed w-full z-50 backdrop-blur-md bg-white/30 dark:bg-gray-900/30">
    <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
      <div class="text-2xl font-bold hover:text-primary transition">Caden Kraft</div>
      <div class="flex space-x-6">
        <a href="#" class="hover:text-primary transition">Home</a>
        <a href="#" class="hover:text-primary transition">Posts</a>
        <a href="#" class="hover:text-primary transition">Resume</a>
        <a href="#" class="hover:text-primary transition">About</a>
        <a href="https://www.linkedin.com" target="_blank" class="hover:text-primary transition">LinkedIn</a>
        <a href="https://github.com" target="_blank" class="hover:text-primary transition">GitHub</a>
        <button id="darkToggle" class="ml-4 p-2 rounded hover:bg-primary hover:text-white transition">🌙</button>
      </div>
    </div>
  </nav>

  <div class="pt-24"></div>

  <!-- Hero Section -->
  <section class="text-center py-20">
    <h1 class="text-5xl font-extrabold mb-4 animate-fade-in">Caden Kraft</h1>
    <h2 class="text-2xl text-primary mb-6 animate-fade-in-delay">Mechanical Engineer</h2>
    <p class="max-w-2xl mx-auto text-gray-700 dark:text-gray-300 animate-fade-in-delay">
      Mechanical engineering undergraduate passionate about motors, robotics, and solar vehicles.
    </p>
  </section>

  <!-- Work Experience -->
  <section class="max-w-6xl mx-auto py-16 px-4 space-y-12">
    <h2 class="text-4xl font-bold mb-12 text-center animate-fade-in">Work Experience</h2>
    <div class="grid md:grid-cols-2 gap-8">
      <div class="glass p-8 rounded-xl shadow-lg hover:scale-105 transition">
        <h3 class="text-2xl font-semibold mb-2">Responsible Engineer</h3>
        <p class="text-gray-600 dark:text-gray-400">Qualification testing, mission reliability improvements, $560k/year savings.</p>
        <p class="text-sm text-gray-400 mt-2">May 2024 - Aug 2024</p>
      </div>
      <div class="glass p-8 rounded-xl shadow-lg hover:scale-105 transition">
        <h3 class="text-2xl font-semibold mb-2">Product Design Engineer</h3>
        <p class="text-gray-600 dark:text-gray-400">SolidWorks fixtures for plasma chambers at Lam Research.</p>
        <p class="text-sm text-gray-400 mt-2">May 2023 - Aug 2023</p>
      </div>
    </div>
  </section>

  <!-- Featured Projects -->
  <section class="py-20 bg-gradient-to-tr from-primary/10 to-gray-100 dark:from-primary/20 dark:to-gray-900">
    <div class="max-w-7xl mx-auto px-4">
      <h2 class="text-4xl font-bold text-center mb-12">Featured Projects</h2>
      <div class="grid md:grid-cols-2 gap-10">
        
        <div class="rounded-2xl overflow-hidden shadow-xl hover:scale-105 transition">
          <img src="https://source.unsplash.com/600x400/?robotics" class="w-full h-60 object-cover" alt="SCARA Robotic Arm">
          <div class="p-6 bg-white dark:bg-gray-800">
            <h3 class="text-2xl font-semibold mb-2">SCARA Robotic Arm</h3>
            <p class="text-gray-700 dark:text-gray-300">Designing and building a custom SCARA robotic arm with industrial specs.</p>
            <a href="#" class="inline-block mt-4 text-primary hover:underline">View Project →</a>
          </div>
        </div>

        <div class="rounded-2xl overflow-hidden shadow-xl hover:scale-105 transition">
          <img src="https://source.unsplash.com/600x400/?gearbox" class="w-full h-60 object-cover" alt="Dual Cycloidal Actuator">
          <div class="p-6 bg-white dark:bg-gray-800">
            <h3 class="text-2xl font-semibold mb-2">Dual Cycloidal Actuator</h3>
            <p class="text-gray-700 dark:text-gray-300">A unique gearbox solution combining axial flux motors with cycloidal reduction.</p>
            <a href="#" class="inline-block mt-4 text-primary hover:underline">View Project →</a>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
    © 2025 Caden Kraft — Built with ❤️
  </footer>

  <!-- Animation Styles -->
  <style>
    @keyframes fade-in {
      from {opacity: 0; transform: translateY(20px);}
      to {opacity: 1; transform: translateY(0);}
    }
    .animate-fade-in {
      animation: fade-in 1s ease-out forwards;
    }
    .animate-fade-in-delay {
      animation: fade-in 1.5s ease-out forwards;
    }
  </style>

  <!-- Dark Mode Script -->
  <script>
    const toggle = document.getElementById('darkToggle');
    toggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
    });
  </script>

</body>
</html>
