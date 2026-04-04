// Narration steps for the guided portfolio tour
export interface NarrationStep {
  id: string;
  /** Building ID that triggers this step (null = intro/outro) */
  buildingId: string | null;
  text: string;
  /** Shorter display text for the HUD subtitle */
  subtitle: string;
}

export const NARRATION_STEPS: NarrationStep[] = [
  {
    id: "intro",
    buildingId: null,
    text: "Hey! Welcome to my portfolio city. I'm Kshitij Prasad, a Robotics and Autonomous Systems Engineer based in Ingolstadt. Drive west along the main street and discover my story. Let's go!",
    subtitle: "Welcome! Drive west to explore.",
  },
  {
    id: "about",
    buildingId: "about",
    text: "This is about me. I build autonomous systems, from precision drone landing to self-driving cars. Most of my work starts in simulation and ends on real hardware. That gap is what I find most interesting.",
    subtitle: "About Me - Robotics & Autonomous Systems",
  },
  {
    id: "skills",
    buildingId: "skills",
    text: "My technical toolkit. C plus plus, ROS 2, reinforcement learning, Gazebo, CARLA, Isaac Sim and more. From low-level hardware control all the way to full-stack web development.",
    subtitle: "Technical Skills & Toolkit",
  },
  {
    id: "experience",
    buildingId: "experience",
    text: "My work experience at Akkodis. Two years, four progressive roles. From service robot navigation to autonomous driving testing to my thesis on deep reinforcement learning for drone landing.",
    subtitle: "Work Experience - AKKODIS",
  },
  {
    id: "education",
    buildingId: "education",
    text: "Technische Hochschule Ingolstadt. Dual degree in Autonomous Vehicle Engineering and AI Engineering. Also competed in Formula Student with Schanzer Racing driverless.",
    subtitle: "Education - THI Ingolstadt",
  },
  {
    id: "projects",
    buildingId: "projects",
    text: "My projects. The award-winning AV Mobility Orchestrator, VR accident reconstruction with DEKRA, a custom Pixhawk drone, and more. Each one pushed my engineering further.",
    subtitle: "Projects & Builds",
  },
  {
    id: "achievements",
    buildingId: "achievements",
    text: "First place at PAVE Europe 2025 in Brussels. An RL-powered platform that could reduce vehicles by 56 percent while serving 20 percent more riders. A proud milestone.",
    subtitle: "Awards - PAVE Europe 2025 Winner",
  },
  {
    id: "thesis",
    buildingId: "thesis",
    text: "My master's thesis. Deep reinforcement learning for multirotor UAV precision landing. Trained PPO, SAC and TD3 in Isaac Sim, validated in Gazebo with PX4, and tested on a real Pixhawk drone. Grade: 1.0.",
    subtitle: "Master's Thesis - Deep RL Drone Landing",
  },
  {
    id: "contact",
    buildingId: "contact",
    text: "Thanks for exploring my portfolio city! If you're interested in working together, feel free to reach out. I'm currently open to roles in robotics, autonomous systems, and AI engineering.",
    subtitle: "Get In Touch - Let's Build Together",
  },
];
