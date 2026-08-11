---
title: "Getting Started with the SO-ARM101: What Nobody Tells You"
date: 2026-07-26
featured: true
description: |
  I thought setting up a robot arm and LeRobot would be a weekend project. It took about a month —
  and almost none of that time was actually about robotics.
tags:
  - LeRobot
  - SO-ARM101
  - beginner
  - lessons-learned
---

I'm new to robotics, and I wanted to write down what getting started with the [SO-ARM101](https://github.com/TheRobotStudio/SO-ARM100) and [LeRobot](https://huggingface.co/docs/lerobot) actually looked like—not the polished version, but the real one.

This was the task I wanted to train my robot to do, seems simple right? 
<img src="/videos/success-first-task.gif" alt="Robot successfully completing the place-yellow-rectangle task after training" />

## Why I Picked the SO-ARM101

I wanted something that would let me experience the entire robotics learning cycle end-to-end.

The SO-ARM101 is designed to be a low-cost robot arm that's relatively easy to get started with while still exposing the full robotics pipeline. It integrates tightly with Hugging Face's LeRobot framework, which provides utilities for robot calibration, teleoperation, dataset recording, policy training, evaluation, deployment, and publishing datasets and models to the Hugging Face Hub.

I'd spent months reading robotics papers. I understood the theory behind imitation learning, behavior cloning, and transformer policies. But there were still questions that papers don't really answer:

- What does "training a policy" actually look like in practice?
- How are demonstrations collected through teleoperation?
- How much effort goes into collecting good training data?
- What are the annoying engineering problems that everyone silently solves before writing the paper?

Of course, it would be cool to start with a humanoid or a robot dog, but I intentionally chose the robot arm. It fits on a desk, costs a fraction as much, and still lets you experience almost the exact same machine learning workflow. If I couldn't make a single arm reliably pick up a block, I certainly wasn't ready for a humanoid.

I'll be fairly opinionated throughout this article because I ran into quite a few rough edges that aren't obvious from reading tutorials.

I assumed this would be a fun weekend project.

This was where I was completely wrong.

It took me about a month before I had something working end-to-end: collecting demonstrations, training a policy, uploading it to Hugging Face, and deploying it back onto the robot.

Surprisingly, almost none of that month was spent learning robotics.

Instead, I spent most of my time debugging USB ports, PyTorch versions, CUDA drivers, operating systems, cameras, calibration files, and physical desk layout.

This post is the guide I wish I had before starting. Hopefully it helps someone avoid a few of the same rabbit holes.

# 1. Your Desk Is Part of the Robot

The first thing nobody tells you is that your desk is a critical part of your robot setup.

I ended up rearranging my workspace multiple times, moving my existing workspace completely off to a new desk, and thinking far more about USB cable length/orientation and port availability than I ever expected.

Unlike software projects where everything lives inside your laptop, your robot lives in a physical development environment. This is where your robot sits, where your cameras are mounted, where the USB cables reach, and even where your laptop is located all end up mattering.

## Cables and physical port management
The SO-ARM101 comes with two robot arms:

- **Leader arm** — the arm you manipulate by hand. Think of this as the remote control.
- **Follower arm** — the actual robot that performs the task and collects training data.

You'll also likely have:

- an overhead camera
- a wrist camera mounted on the follower arm
- USB for the leader arm
- USB for the follower arm

That's already four USB devices before you plug in your keyboard or anything else.

One lesson I learned the hard way: don't underestimate cable management.

I originally tried using a USB docking station because my Macbook didn't have enough USB ports. In my setup, this caused intermittent issues where cameras and serial devices weren't always detected correctly. Sometimes devices simply wouldn't appear, and when I ran `lerobot-find-port`, I wouldn't see all of the robot arms I expected.

The reason this matters is that LeRobot needs to know **exactly** which physical device corresponds to which port. Unlike a mouse or keyboard, where the operating system only cares that the device is connected, a robotics application needs to distinguish between the leader arm, follower arm, and cameras. If those devices aren't enumerated consistently, the software has no way to know what port it should be talking to.

For example, a typical teleoperation command explicitly maps each device to its corresponding COM port:

```bash
lerobot-teleoperate \
  --robot.type=so101_follower \
  --robot.port=COM5 \
  --robot.id=my_awesome_follower_arm \
  --teleop.type=so101_leader \
  --teleop.port=COM6 \
  --teleop.id=my_awesome_leader_arm \
  --robot.cameras="{
    front: {type: opencv, index_or_path: 2, width: 640, height: 480, fps: 30},
    overhead: {type: opencv, index_or_path: 0, width: 1920, height: 1080, fps: 30}
  }"
```

In my experience, plugging everything directly into dedicated USB ports was much more reliable than going through a dock. That also meant that I could not use my MacBook and had to move to using my iMac to have enough physical ports. I also got a longer USB cable for the follower arm so I could reach my laptop without relying on a hub. 

All things combined these seem like tiny details, but it easily cost me several days of reconfiguration.

## Relative position of leader and follower arm
One misconception I had early on was thinking the leader and follower arms should sit next to each other.

In reality, you should think of your leader arm as remote control. It doesn't matter where you put the remote control, but what you are controling should stay fixed.

The cameras should only see the follower arm in your workspace. It should never have your teleoperating setup (your hands, the leader arm) in the view. During deployment, the leader arm disappears entirely, so including it in your training images would leak information that won't exist at inference time.

Once I realized this, my setup became much simpler.

I optimized the follower arm, cameras, and lighting as one permanent workstation that I tried very hard not to disturb.

The leader arm became something I could move around whenever it was convenient, since it only needed a USB connection to the computer. If I had limited desk space, I could easily unclamp it and use the space for my keyboard and mouse.
## Build a Consistent Workspace

One upgrade that ended up being far more valuable than I expected was building a dedicated workspace.

<img src="/images/desk_setup_annotated.png" alt="Full Desk Setup" />


I based mine on the [lightbox design](https://docs.nvidia.com/learning/physical-ai/sim-to-real-so-101/latest/05-building-workspace.html) created by Shane Reetz at NVIDIA. The design is surprisingly simple: it's made from inexpensive foam poster boards held together with either tape or these clever [3D-printed corner joints](https://www.printables.com/model/1652109-foam-board-joints-for-lightbox). In less than an hour, you end up with something that looks remarkably close to a professional vision setup.

I did make one modification. Instead of adding the top foam board, I left the top open because I already had an overhead ring light mounted on a stand. This let me position the overhead camera directly above the workspace while also providing even, diffuse lighting across the entire scene.

<img src="/images/lightbox.jpeg" alt="Lightbox Setup" />


Technically, none of this is required. You can absolutely collect demonstrations on a regular desk.

However, after trying both setups, I found that having a dedicated workspace made the entire process dramatically easier:

- Consistent lighting throughout the day
- A clean, uncluttered background
- Fewer reflections and shadows
- Cameras that never needed to be repositioned
- A workspace that stayed exactly the same between data collection sessions

This consistency matters more than I initially expected. Every demonstration becomes visually similar, allowing the policy to spend its capacity learning **the task** instead of wasting it on changes in lighting, camera angles, or whatever happened to be sitting on your desk that day.

It also had an unexpected psychological benefit: I no longer had to rebuild my setup every time I wanted to collect more data. The robot always had a permanent "home." I could sit down, plug in the USB cables, and immediately start recording demonstrations instead of spending the first 20 minutes adjusting cameras and clearing off my desk.

After all the desk rearranging, cable management, and workspace iterations, this is what my final setup looked like.

[Attach photo here (with labels)]


# 2. Choosing a Computer: OS, CUDA, and PyTorch

Everyone knows GPUs make machine learning faster.

What I didn't appreciate until doing this project was just *how much* robotics depends on having the right GPU software stack.

The robot itself isn't computationally expensive.

Training the vision model is.

I normally use Intel-based Macs, but PyTorch has effectively dropped support for GPU acceleration on Intel Macs. That meant training would be CPU-only, which is painfully slow even for relatively small imitation learning policies like ACT.

So I switched to a Windows gaming laptop that we had lying around the house that had a NVIDIA GeForce RTX 5060 Laptop GPU.

Problem solved?

Not even close.

The RTX 5060 is part of NVIDIA's newer Blackwell generation (`sm_120`). That meant that my GPU is now *too new* for PyTorch and LeRobot. I had to rely on newer PyTorch nightly builds for full support. Unfortunately, the version of LeRobot I was using expected an older PyTorch versions so it led to many dependency conflicts.

I ended up stuck between two incompatible requirements:

- PyTorch new enough to support my GPU.
- PyTorch old enough to satisfy LeRobot's dependency constraints.

I burned well over a week chasing version mismatches between CUDA, PyTorch, Python, drivers, and LeRobot.

Eventually I gave up trying to make everything work natively on Windows and moved training into **Windows Subsystem for Linux (WSL)**, where the ecosystem was much better supported.

Even then, getting CUDA, NVIDIA drivers, and PyTorch all agreeing on compatible versions still took several more days of trial and error.

## My Workflow Ended Up Split Across Two Operating Systems

Because robot serial ports and USB devices were easier to work with in Windows, while training was easier in Linux, I eventually settled on a hybrid workflow:

1. **Windows (Conda):** Robot calibration, teleoperation, and dataset collection.
2. **WSL:** Model training. Latest PyTorch leveraging NVIDIA GPUs.
3. **Hugging Face Hub:** Upload datasets and trained checkpoints.
4. **Windows (Conda):** Run inference back on the robot.

It's not the workflow I would have designed, but once everything was working it was surprisingly smooth.

## HuggingFace Hub Integration Was Excellent

One thing that genuinely impressed me was the HuggingFace integration that came as part of LeRobot's default settings.

LeRobot makes uploading datasets and trained models almost effortless. Once uploaded, the Hugging Face Hub provides a [dataset visualizer](https://huggingface.co/spaces/lerobot/visualize_dataset) where you can inspect every recorded episode, replay demonstrations, and verify that your data actually looks correct before spending hours training.

I also learned to always verify that PyTorch is actually detecting your GPU before launching training. It's surprisingly easy to accidentally install a CPU-only build of PyTorch and not notice until your training job crawls along.

Once everything was finally configured correctly, the experience became almost boring—in the best possible way.

A 5,000-step ACT training run finished in around **17 minutes** on my RTX 5060, with GPU utilization consistently above 90%. Even larger runs of 30,000 steps completed in roughly **4 hours**.

At that point, the machine learning stopped being the bottleneck.

Getting the environment working had been the real challenge all along.

# 3. Your Cameras Placement Define Your Training Dataset Quality

One thing I underestimated was just how important camera placement is.

With the standard SO-ARM101 setup, you'll typically have two cameras:

- **An overhead camera** that sees the entire workspace.
- **A wrist (egocentric) camera** mounted directly on the follower arm.

Coming from computer vision, I knew cameras mattered. What I didn't appreciate was that **the camera setup is effectively part of your dataset**, and therefore part of your model.

Unlike software, where you can usually refactor things later, changing your camera placement often means recollecting your entire dataset (which I learned the hard way).

## Overhead Camera

If you search online, you'll find dozens of SO-ARM101 tutorials, and almost every single one has a slightly different camera setup.

Some people mount the [overhead camera directly above the robot](https://github.com/TheRobotStudio/SO-ARM100/blob/main/Optional/Overhead_Cam_Mount_Webcam/README.md). Others use a diagonal angle. Some zoom in tightly on the workspace, while others capture the entire table.

What the tutorials rarely explain is **why** they chose that particular angle.

I initially started with the overhead camera mounted directly above the robot because it seemed like the most logical setup. A top-down view removes perspective distortion, makes object locations easier to understand, and provides a consistent view of the entire workspace. 

However, after collecting demonstrations, I realized the right camera angle depends on what information your policy needs to complete the task.

For a simple pick-and-place task, the overhead camera needs to provide several pieces of information:

1. **Where are the objects?**  
   The policy needs to know the location of the block, tray, and any other objects on the table.

2. **Where is the robot arm?**  
   The policy needs to understand the current arm position and how the gripper should move relative to the object.

3. **What is the 3D state of the task?**  
   This is where a perfectly top-down view starts to have limitations, since it is missing visual information in the z-direction.

A direct overhead view is excellent for understanding **where things are horizontally**, but it provides very little information about **depth and height**. For example, when the robot raises or lowers its arm, that motion can be difficult to infer from a pure top-down view because the vertical movement happens along the camera's viewing axis.

This became especially noticeable during grasping. The camera could clearly see the block and the gripper moving across the table, but it had a harder time understanding how high the gripper was above the object or how much downward motion was needed to actually make contact.

A slightly angled overhead camera can provide additional depth cues while still capturing the entire workspace.

## Wrist Camera: Egocentric View

Having overhead camera provides global scene context, while the wrist camera provided the robot's local perspective during grasping.

The second camera in the SO-ARM101 setup is the **wrist camera**, sometimes called the **egocentric camera** (labelled as `front` in lerobot). Unlike the overhead camera, which is fixed, the wrist camera moves with the robot and sees the world from the robot's perspective.

Many imitation learning policies—including the default LeRobot examples—use both camera views. The overhead camera provides global context (where objects are on the table), while the wrist camera captures fine-grained details as the robot approaches, grasps, and manipulates objects. Together, they give the policy a much richer understanding of the scene than either view alone.

One thing to note is that **not every SO-ARM101 kit includes a wrist camera**. My kit from SeeedStudio came with one pre-installed, but if you're building your own robot or purchased a version without it, TheRobotStudio provides an official 3D-printable mount for a standard 32×32 UVC camera:

https://github.com/TheRobotStudio/SO-ARM100/tree/main/Optional/Wrist_Cam_Plug_Mount_32x32_UVC_Module

## Wrist Camera: Starting Orientation Matters

The wrist camera is not just about where you mount it. The starting orientation of the wrist itself matters just as much.

The SO-ARM101 wrist camera is mounted on the follower arm, which means the camera view changes as the robot moves. Unlike a fixed overhead camera, the robot is effectively moving its own viewpoint throughout the task.

One mistake I made early on was not paying enough attention to the robot's **initial wrist orientation** before collecting demonstrations.

I assumed that as long as the robot eventually moved toward the object, the camera would capture enough information.

That was wrong.

The beginning of each episode matters. The policy is making its first decision based on the observations available at the start of the demonstration. If the object is not visible in the wrist camera's initial frame, the model has no way of knowing that the object exists from that viewpoint.

For my task, I found that starting with the wrist camera naturally pointed toward the workspace worked best. The gripper could remain in a neutral position while the camera already had visibility into the task area.

This also made teleoperation much more ergonomic. Instead of rotating the wrist into an awkward position before every demonstration, I could start every episode from the same consistent pose.

A good rule of thumb:

> Before collecting demonstrations, position the robot exactly how it will start during deployment, then look through the camera feeds. What does the robot actually see?

One subtle detail that I did not see discussed much in tutorials is the **exact** starting orientation of the wrist camera.

The way the SO-ARM101 is designed, it is very natural to assume that the resting position is with the gripper handle pointing downward. The physical design almost encourages this—it looks like the "neutral" position of the arm.

However, for teleoperation and data collection, I found that this is not actually the best starting pose.

The position that worked best for me was having the wrist camera at the **12 o'clock position** relative to the gripper. In other words, when the follower arm is in its neutral starting pose, the wrist camera should naturally look forward toward the workspace instead of pointing off to the side.

<img src="/images/wristcam_orientation.png" alt="Correct Wrist Camera Orientation" />

The leader arm should also be held in a similar neutral orientation during teleoperation.

This ended up being important for a few reasons.

First, it gives the wrist camera the correct initial view. Before the robot starts moving, the camera can already see the workspace and the object it needs to interact with. This matters because the policy can only make decisions based on the observations available in the video frames. If the object is not visible at the beginning of the episode, the model has no way to know where it is.

<img src="/videos/target-not-visible.gif" alt="Wrist camera episode where the target object is not visible in the initial frame" />

Second, it is much more ergonomic for collecting demonstrations. With the wrist camera positioned correctly, I can hold the leader arm naturally without constantly twisting my wrist to match the follower arm. Since collecting a dataset means repeating the same motion dozens or hundreds of times, small ergonomic issues quickly become painful and can affect the consistency of demonstrations.

One small teleoperation trick that also helped: I used my **other hand to open and close the gripper** during demonstrations.

<img src="/videos/leader-gripper.gif" alt="Orientation and gripper operation of leader arm" />

While it is possible to manipulate everything with one hand, I found it much easier and more natural to use two hands—one hand controlling the leader arm movement and the other hand operating the gripper. This gave me better control and reduced awkward finger movements, especially when collecting many episodes back-to-back.

This is one of those details that seems obvious only after you discover it. The robot's mechanical "resting position" is not necessarily the best data collection position. You need to think about both perspectives: what is comfortable for the human collecting demonstrations and what information is available to the robot at the start of every task.

## Inspect Your Recordings!!!

This is probably the simplest advice I can give, and also the mistake that cost me the most time:

**Always inspect your recordings from both camera views before collecting a large dataset.**

Do not assume your setup is correct just because the robot looks fine while you are teleoperating.

I learned this the hard way.

I collected [80 episodes of demonstrations](https://huggingface.co/spaces/lerobot/visualize_dataset?path=%2Frobododo%2Fplace-yellow-rectangle_20260702_200850%2Fepisode_8), trained a policy, and spent time debugging why the robot was not performing the task correctly. Eventually, I went back and inspected the videos carefully and realized the problem was obvious:

**The wrist camera never saw the object in the first frame of the episode.**

The object was visible to me. It was visible in the overhead camera. But it was not visible from the robot's egocentric view.

At that point, the question became:

*How is the robot supposed to make a decision based only on the information available in its observations?*

The robot does not know what I know. It does not have a human's understanding of the workspace. It only has the pixels provided by its cameras.

This is one of the biggest mindset shifts when moving from software to robotics:

> Think in the robot's shoes. What information does the robot actually have?

Before collecting hundreds of demonstrations, I now check:

- Is the object visible in the initial frame?
- Are the relevant objects visible from at least one camera?
- Is the gripper visible during the important parts of the task?
- Does the camera angle provide enough information about depth and position?
- Is anything accidentally blocking the view?

A few minutes of watching your recordings can save hours of training and debugging.

## A Small Note on Wrist Camera Privacy

One final thing to consider if you are uploading datasets publicly to the [Hugging Face Hub](https://huggingface.co/):

**The wrist camera records everything it sees.**

Because the camera moves with the robot, it can easily capture parts of your room that you did not intend to share. As the wrist rotates, it may point toward you, your monitor, family photos, or other personal items.

Building a lightbox helped tremendously because the robot mostly saw the controlled workspace instead of my office. This is another reason why it is recommended to point the wrist cam downwards as the starting orientation. Rotating the wrist camera downward reduced how much of the surrounding environment appeared in the recordings.

# What Finally Worked (and What I Learned)

About a month after unboxing the robot, everything finally clicked.

Not because I discovered some magical training trick, but because I had finally removed enough variability from the system that the entire pipeline became reproducible.

I had:

- A permanent workstation that stayed assembled
- Stable camera placement
- Consistent lighting
- USB devices that were reliably detected
- A GPU that PyTorch could actually use
- A workflow that allowed me to move between data collection, training, and deployment without constantly fighting my environment

Only then did the actual robotics learning loop start to feel real.

My first successful task was simple: pick up a yellow block and place it into a yellow tray.

By today's standards, this is a tiny robotics task.

But after spending weeks wrestling with operating systems, drivers, cameras, USB ports, hardware setup, and dependency issues, seeing the robot complete that motion for the first time was incredibly rewarding.

Three computers, one new desk, and many debugging sessions later...

This is the final collected dataset after all the changes above — lightbox, fixed camera placement, corrected wrist orientation. It only took **40 episodes** to get enough consistent demonstrations for training: [dataset repo](https://huggingface.co/datasets/robododo/place-yellow-rectangle-lightbox) · [visualizer](https://huggingface.co/spaces/lerobot/visualize_dataset?path=%2Frobododo%2Fplace-yellow-rectangle-lightbox%2Fepisode_0)

And here's the resulting rollout after training — the policy was able to generalize quite well: [dataset repo](https://huggingface.co/datasets/robododo/rollout_place_yellow_rectangle_act_20260718_060210) · [visualizer](https://huggingface.co/spaces/lerobot/visualize_dataset?path=%2Frobododo%2Frollout_place_yellow_rectangle_act_20260718_060210%2Fepisode_0)

<img src="/videos/success-first-task.gif" alt="Robot successfully completing the place-yellow-rectangle task after training" />

The most surprising part was how magical it felt when everything finally worked.

There were many moments where I wondered if I had underestimated this project. I had spent so much time debugging things that weren't even "robotics" yet.

Then suddenly, the robot moved.

It picked up the object.

It completed the task. It even generalized to blocks with slightly different shapes, color, and sizes! More on this in next blogpost...

And for a moment, all of those frustrating details disappeared.

This was the first time I truly understood why robotics is such an exciting field: when the physical world and the software stack finally come together, it feels almost like magic.

But the biggest lesson I took away was that robotics iteration is fundamentally different from software iteration.

Coming from a software background, I am used to fast feedback loops. If something doesn't work, I change a few lines of code, rerun the program, and immediately know whether my idea was correct.

Robotics is different.

Your development environment is not just your laptop. It is your entire physical and digital system:

- Your desk layout
- Camera placement
- Lighting
- USB connections
- Robot calibration
- Operating system
- Drivers
- CUDA + PyTorch
- Training pipeline

Every component has to work together before you can even start improving the model.

Even more importantly, every iteration has a cost.

Change the camera angle? You may need to recollect your dataset.

Change the workspace layout? Your previous demonstrations may no longer match the new environment.

Change the robot starting pose? Your data distribution has changed.

Improve your task? You may need to collect more demonstrations from scratch.

Unlike software, where old test cases often remain reusable, robotics data is tightly coupled to the physical world that generated it. The environment itself becomes part of the training distribution.

This was an incredibly humbling experience.

I came into this project expecting the hard part to be training the policy. Instead, I learned that the hardest part is building a reliable system where the physical world and the software stack can iterate together.

Getting the physical and digital environment working together is a huge part of the challenge. Once the environment stops fighting you, that's when the real fun begins.

In my next post, I'll go deeper into the actual Physical AI workflow: reproducing the block pick-and-place task, collecting and improving demonstrations, training ACT policies with [LeRobot](https://huggingface.co/docs/lerobot), and evaluating what transfers beyond the original setup. I'll share the failures as much as the successes—what generalized surprisingly well, what didn't, and what I learned from iterating with a real robot.