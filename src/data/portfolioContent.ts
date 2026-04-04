// Rich portfolio content for each building zone, sourced from kshitij-portfolio

export interface MediaItem {
  type: "image" | "video";
  src: string;
  alt: string;
}

export interface PortfolioEntry {
  title: string;
  subtitle?: string;
  period?: string;
  description: string;
  bullets?: string[];
  technologies?: string[];
  links?: { label: string; url: string }[];
  media?: MediaItem[];
}

/** Keyed by building zone id from cityLayout.ts */
export const PORTFOLIO_CONTENT: Record<string, PortfolioEntry> = {
  about: {
    title: "About Me",
    subtitle: "Kshitij Prasad - Robotics & Autonomous Systems Engineer",
    description:
      "Based in Ingolstadt, Germany. 1.35 million lives are lost and 70 billion hours wasted in traffic annually - autonomous systems can change that. Most of my work starts in simulation and ends on real hardware. Closing that gap is what I find most interesting.",
    bullets: [
      "B.Eng. Autonomous Vehicle Engineering + M.Sc. AI Engineering of Autonomous Systems at TH Ingolstadt",
      "Master's thesis: RL-based precision drone landing - Grade 1.0 (excellent)",
      "Strong in modern C++, ROS 2, and real-time control loops",
      "Passionate about open-source tooling and democratizing industrial robotics",
      "Currently open to work - Ingolstadt, Germany",
      "Languages: English (native), German (B2/C1)",
    ],
    media: [
      { type: "image", src: "/media/headshot.jpg", alt: "Kshitij Prasad" },
      { type: "image", src: "/media/kshitij speaking.jpg", alt: "Speaking at conference" },
      { type: "image", src: "/media/kshitij speaking 2.jpg", alt: "Panel discussion" },
    ],
    links: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/kshitijp21/" },
      { label: "Email", url: "mailto:kshitijp21@gmail.com" },
      { label: "Book a Call", url: "https://calendly.com/kshitijp21/30min" },
    ],
  },

  skills: {
    title: "Technical Skills",
    subtitle: "Core competencies across robotics, autonomy, and engineering",
    description:
      "Full-stack robotics engineer with expertise spanning low-level hardware control to high-level AI/ML and web development.",
    bullets: [
      "Robotics & Autonomy: ROS 2, Nav2, Control Theory, Sensor Fusion, SLAM",
      "Programming: C++ (modern, hard real-time), Python, TypeScript, MATLAB, Bash",
      "Reinforcement Learning: PPO, SAC, TD3, Gym environments, reward shaping",
      "Simulation: CARLA, Isaac Sim, Gazebo, IPG CarMaker, MATLAB Simulink",
      "Sensors & Protocols: PX4, MAVLink, Intel RealSense, LiDAR, IMU, YOLO",
      "Hardware: NVIDIA Jetson, Raspberry Pi, Pixhawk, TurtleBot3",
      "Web / Full-Stack: Next.js, React, Supabase, Tailwind, Three.js",
      "Tooling: Docker, Git, CI/CD, JIRA, colcon, Ubuntu Linux",
    ],
    technologies: [
      "C++", "Python", "ROS 2", "CARLA", "Isaac Sim", "Gazebo",
      "PX4", "Docker", "TypeScript", "Next.js", "Three.js",
    ],
    media: [
      { type: "image", src: "/media/rviz_turtlebot.png", alt: "RViz TurtleBot Navigation Stack" },
      { type: "video", src: "/media/tb3_demo.mp4", alt: "TurtleBot3 Autonomous Navigation" },
      { type: "image", src: "/media/tensorboard_screenshot.png", alt: "Tensorboard Training Dashboard" },
      { type: "image", src: "/media/pixhawk_drone.jpg", alt: "Custom Pixhawk Drone Platform" },
    ],
  },

  education: {
    title: "Education",
    subtitle: "Technische Hochschule Ingolstadt",
    period: "Oct 2022 – Mar 2026",
    description:
      "Dual degree in Autonomous Vehicle Engineering (B.Eng.) and AI Engineering of Autonomous Systems (M.Sc.) at Technische Hochschule Ingolstadt.",
    bullets: [
      "M.Sc. AI Engineering of Autonomous Systems (graduated Mar 2026)",
      "B.Eng. Autonomous Vehicle Engineering (graduated Mar 2026)",
      "Master's thesis: Deep RL for Multirotor UAV Precision Landing - Grade 1.0",
      "Focus: Robotics, Machine Learning, Signal Processing, Control Theory, Sensor Fusion",
      "Winner, PAVE Europe 2025 Next Gen Challenge (Brussels)",
      "Formula Student - Schanzer Racing e.V. Driverless Department",
    ],
    technologies: [
      "Robotics", "Machine Learning", "Control Theory",
      "Sensor Fusion", "Signal Processing",
    ],
    media: [
      { type: "video", src: "/media/schanzer_racing.mp4", alt: "Schanzer Racing Formula Student" },
      { type: "image", src: "/media/schanzer_racing.jpeg", alt: "Racing team" },
      { type: "image", src: "/media/schanzer_racing2.jpeg", alt: "Racing event" },
      { type: "image", src: "/media/schanzer_racing3.jpeg", alt: "Formula Student car" },
    ],
    links: [
      { label: "Schanzer Racing", url: "https://schanzer-racing.de/" },
    ],
  },

  experience: {
    title: "Work Experience",
    subtitle: "AKKODIS - Robotics & Autonomous Systems",
    period: "Mar 2024 – Mar 2026 · Ingolstadt, Bavaria",
    description:
      "Four progressive roles at AKKODIS Germany spanning autonomous driving testing, sensor fusion, service robot integration, and a master's thesis on Deep RL for UAV precision landing.",
    bullets: [
      "Thesis: Autonomous Aerial Systems (Oct 2025–Mar 2026) - Trained PPO, SAC & TD3 for multirotor UAV precision landing on moving targets. Isaac Sim domain randomization + Gazebo w/ PX4 SITL. Grade: 1.0.",
      "AD Testing (Mar–Oct 2025) - Generated & optimized CARLA simulation scenarios for evaluating automated driving stacks. Python diagnostic pipelines for ADAS parameterization.",
      "Sensor Fusion & Navigation (Oct 2024–Mar 2025) - Integrated ROS 2 service robot with Nav2, Intel RealSense + YOLO perception. Reduced system downtime by 15%.",
      "Service Robot Integration (Apr–Oct 2024) - Autonomous navigation with ROS 2 + Nav2 + RealSense. Improved exploration & path planning. Supported business pitches.",
    ],
    technologies: [
      "Deep RL", "PX4 SITL", "Isaac Sim", "Gazebo", "CARLA",
      "ROS 2", "Nav2", "C++", "Python", "Docker", "YOLO", "RealSense",
    ],
    media: [
      { type: "video", src: "/media/ppo_landing_demo.mp4", alt: "PPO Landing Demo" },
      { type: "video", src: "/media/tb3_demo.mp4", alt: "TurtleBot3 Service Robot Demo" },
      { type: "image", src: "/media/rviz_turtlebot.png", alt: "RViz TurtleBot Navigation" },
      { type: "image", src: "/media/pixhawk_drone.jpg", alt: "Pixhawk Drone Platform" },
      { type: "video", src: "/media/pixhawk_drone.mp4", alt: "Pixhawk Drone Flight" },
      { type: "image", src: "/media/turtlebot_demo.jpg", alt: "TurtleBot3 Demo Setup" },
    ],
  },

  projects: {
    title: "Projects",
    subtitle: "Competitions, research & side projects",
    description:
      "A collection of engineering projects spanning fleet optimization, VR reconstruction, campus tools, drones, and aerospace innovation.",
    bullets: [
      "AV Mobility Orchestrator - PAVE Europe 2025 Winner. RL-powered city-scale AV fleet optimization: 56% fewer vehicles, +20% riders, €840M savings.",
      "VR Accident Reconstruction (DEKRA) - Bridged dashcam footage + FARO 3D scans with IPG CarMaker & CARLA for forensic VR reconstruction.",
      "Pixhawk Drone Platform - Custom UAV for thesis RL landing research. PX4 flight controller, sim-to-real transfer with PPO/SAC.",
      "Campus Help - Tutor-student marketplace for THI. Next.js + Supabase with live calendar & role-switching.",
      "Pixel Park - LiDAR-based smart parking detection. 24-hour hackathon project.",
      "Airbus Fly Your Ideas - Global aerospace innovation challenge by Airbus & UNESCO.",
    ],
    technologies: [
      "Next.js", "TypeScript", "Python", "PPO RL",
      "Supabase", "IPG CarMaker", "CARLA", "LiDAR", "PX4", "VR",
    ],
    media: [
      { type: "image", src: "/media/av_orchestrator_map.jpg", alt: "AV Orchestrator Dashboard" },
      { type: "image", src: "/media/pave_speaking.jpg", alt: "PAVE Europe presentation" },
      { type: "video", src: "/dekra/dekra-video-1.mp4", alt: "DEKRA VR Reconstruction" },
      { type: "image", src: "/dekra/dekra-2.jpg", alt: "DEKRA 3D scan" },
      { type: "video", src: "/media/pixel_park.mp4", alt: "Pixel Park Hackathon" },
      { type: "image", src: "/dekra/vr-dekra-1.jpg", alt: "VR Accident Reconstruction" },
    ],
    links: [
      { label: "PAVE AV Demo", url: "https://pave-av.vercel.app/" },
      { label: "Campus Help", url: "https://campus-help-lime.vercel.app/" },
      { label: "Airbus Challenge", url: "https://www.airbus.com/en/airbus-fly-your-ideas" },
      { label: "Aero XRL MVP", url: "https://aero-xrl.vercel.app/" },
    ],
  },

  achievements: {
    title: "Awards & Recognition",
    subtitle: "PAVE Europe 2025 - 1st Place Winner",
    description:
      "Won the PAVE Europe 2025 Student Competition in Brussels with an RL-powered city-scale autonomous vehicle fleet optimization platform.",
    bullets: [
      "1st Place - PAVE Europe 2025 Next Gen Student Competition, Brussels",
      "Lead presenter - keynote and panel discussions at Brussels conference",
      "Platform: Real corridor congestion from TomTom APIs, PPO-based fleet optimizer",
      "Impact: 56% fewer vehicles, +20% more riders, 30% less distance, €840M savings over 10 years",
      "Recommendation: Prof. Dr.-Ing. Michael Mecking, Dean of Faculty EI, THI",
    ],
    media: [
      { type: "image", src: "/media/kshitij winning award PAVE.jpg", alt: "Winning PAVE Europe 2025" },
      { type: "image", src: "/media/pave_speaking.jpg", alt: "Presenting at PAVE" },
      { type: "image", src: "/media/pave_speakers.jpg", alt: "PAVE panel speakers" },
      { type: "image", src: "/media/kshitij speaking.jpg", alt: "Keynote presentation" },
    ],
    links: [
      { label: "Live Demo", url: "https://pave-av.vercel.app/" },
    ],
  },

  thesis: {
    title: "Master's Thesis",
    subtitle: "Deep RL for Multirotor UAV Precision Landing",
    period: "Oct 2025 – Mar 2026",
    description:
      "Trained PPO, SAC and TD3 agents to land a multirotor UAV on a moving platform with sub-10cm accuracy. Developed in Isaac Sim with domain randomization, validated in Gazebo with PX4 SITL, and tested on a real Pixhawk drone.",
    bullets: [
      "Grade: 1.0 (excellent) - top mark in the German grading system",
      "Algorithms: PPO, SAC, TD3 with custom reward shaping and curriculum learning",
      "Sim-to-Real: Isaac Sim → Gazebo → Real Pixhawk drone transfer pipeline",
      "Domain Randomization: Wind, sensor noise, lighting, platform motion",
      "Landing Accuracy: Sub-10cm on moving platform at varying speeds",
      "Published internal report at AKKODIS / CARISSMA research lab",
    ],
    technologies: [
      "PPO", "SAC", "TD3", "Isaac Sim", "Gazebo",
      "PX4 SITL", "MAVLink", "ROS 2", "Python", "PyTorch",
    ],
    media: [
      { type: "video", src: "/media/ppo_landing_demo.mp4", alt: "PPO Drone Landing Demo" },
      { type: "video", src: "/media/SAC XY .webm", alt: "SAC Training XY Trajectory" },
      { type: "image", src: "/media/tensorboard_screenshot.png", alt: "Tensorboard Training Curves" },
      { type: "video", src: "/media/pixhawk_drone.mp4", alt: "Real Pixhawk Drone Test" },
      { type: "image", src: "/media/pixhawk_drone.jpg", alt: "Pixhawk Drone Platform" },
    ],
    links: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/kshitijp21/" },
    ],
  },

  contact: {
    title: "Get In Touch",
    subtitle: "Let's build something together",
    description:
      "I'm currently open to full-time opportunities in robotics, autonomous systems, and AI engineering in the Ingolstadt / Munich area or remote. Feel free to reach out - I'd love to hear from you.",
    bullets: [
      "Email: kshitijp21@gmail.com",
      "Location: Ingolstadt, Bavaria, Germany",
      "Open to: Full-time roles, research collaborations, consulting",
      "Specialties: ROS 2, RL, Autonomous Driving, Drone Systems, Sim-to-Real",
      "Languages: English (native), German (B2/C1)",
    ],
    media: [
      { type: "image", src: "/media/headshot.jpg", alt: "Kshitij Prasad" },
      { type: "image", src: "/media/Professor mecking recommendation.jpg", alt: "Recommendation from Prof. Mecking" },
    ],
    links: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/kshitijp21/" },
      { label: "Email", url: "mailto:kshitijp21@gmail.com" },
      { label: "Book a Call", url: "https://calendly.com/kshitijp21/30min" },
      { label: "GitHub", url: "https://github.com/kshitijprasad" },
    ],
  },
};
