<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sean Lirazan</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
    }
  </style>
</head>
<body class="bg-gray-50 text-gray-900">

  <!-- Navbar -->
  <nav class="bg-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
      <div class="text-2xl font-bold">Sean Lirazan</div>
      <div class="flex space-x-6">
        <a href="#" class="hover:underline">Home</a>
        <a href="#" class="hover:underline">Posts</a>
        <a href="#" class="hover:underline">Resume</a>
        <a href="#" class="hover:underline">About</a>
        <a href="https://www.linkedin.com" class="hover:underline" target="_blank">LinkedIn</a>
        <a href="https://github.com" class="hover:underline" target="_blank">GitHub</a>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="text-center py-16">
    <h1 class="text-4xl font-bold mb-4">Sean Lirazan</h1>
    <h2 class="text-2xl text-gray-600 mb-6">Mechanical Engineer</h2>
    <p class="max-w-2xl mx-auto text-gray-700">
      I am currently a mechanical engineering undergraduate at Iowa State University. I enjoy working on personal projects involving motors, robotics, and contributing to the PRISUM Solar Car Club.
    </p>
  </section>

  <!-- Work Experience -->
  <section class="max-w-5xl mx-auto py-16 px-4">
    <h2 class="text-3xl font-bold mb-8">Work Experience</h2>
    <div class="space-y-8">
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-xl font-semibold">Responsible Engineer</h3>
        <p class="text-gray-600 mt-2">Developed Dragon latch qualification test increasing latch capability for AMS mission, saving $560k/year.</p>
        <p class="text-sm text-gray-400 mt-1">May 2024 - Aug 2024</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-xl font-semibold">Product Design Engineer</h3>
        <p class="text-gray-600 mt-2">Engineered SolidWorks fixtures for plasma chambers.</p>
        <p class="text-sm text-gray-400 mt-1">May 2023 - Aug 2023</p>
      </div>
      <!-- Add more entries similarly -->
    </div>
  </section>

  <!-- Featured Projects -->
  <section class="bg-gray-100 py-16">
    <div class="max-w-6xl mx-auto px-4">
      <h2 class="text-3xl font-bold mb-8 text-center">Featured Projects</h2>
      <div class="grid md:grid-cols-2 gap-8">
        
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <img src="https://source.unsplash.com/600x400/?robotics" alt="SCARA Robotic Arm" class="w-full">
          <div class="p-6">
            <h3 class="text-2xl font-semibold mb-2">SCARA Robotic Arm</h3>
            <p class="text-gray-700 mb-4">Building a robotic arm to closely mimic commercial SCARA arms' kinematics and mechanics.</p>
            <a href="#" class="text-blue-500 hover:underline">Read more</a>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <img src="https://source.unsplash.com/600x400/?gearbox" alt="Dual Cycloidal Actuator" class="w-full">
          <div class="p-6">
            <h3 class="text-2xl font-semibold mb-2">Dual Cycloidal Actuator</h3>
            <p class="text-gray-700 mb-4">A project enhancing axial flux motors with a cycloidal gearbox for improved torque.</p>
            <a href="#" class="text-blue-500 hover:underline">Read more</a>
          </div>
        </div>

        <!-- Add more project cards similarly -->

      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="text-center py-8 text-gray-500 text-sm">
    © 2025 Caden Kraft
  </footer>

</body>
</html>
