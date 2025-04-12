# The Code Crafters: AI-Powered Fuel Station Safety System

# Overview
Our project aims to develop an AI-powered system using computer vision to enhance safety and efficiency at fuel stations. The system detects incorrect nozzle insertion, prevents misfuelling, tracks nozzle movement to prevent theft, and monitors attendant behavior for safe fuelling practices.

# Solution Overview
Nozzle Insertion Detection: Ensures proper fuel gun placement to prevent misfuelling.

Fuel Flow Monitoring: Tracks pump flow rate to detect anomalies for secure fueling.

Fuel Theft & Overflow Detection: Detects sudden nozzle removal using movement tracking.

License Plate Detection: Captures license plate if fuel theft occurs.

Attendant Behavior Monitoring: Uses pose detection to flag unsafe actions like phone use, smoking, or unattended fueling.

Vehicle Queue Detection: Ensures efficient waiting times for vehicles.

Voice Assistance: Provides real-time guidance to ensure proper fueling.

# Innovation and Uniqueness
CNN-Powered Nozzle Detection: Utilizes a custom-trained YOLOv8 model to accurately detect fuel guns and fuel tank positions.

Real-Time Fuel Flow Monitoring: Tracks fuel flow rate from the pump to detect irregularities.

Attendant & Driver Safety Monitoring: Uses pose estimation and action recognition to detect distractions.

AI Model Recommendation System: Offers voice assistance for guiding how to fuel up safely.

# Implementation Strategy
Backend & AI Processing Setup: Developed using FastAPI for real-time AI processing.

Fuel Flow Integration: Integrates with fuel pump flow rate data and deploys additional sensors.

Frontend Development: A ReactJS-based dashboard for real-time monitoring, alerts, and reporting.

# Impact and Feasibility
Impact: Enhances customer safety, reduces repair costs, improves efficiency, and reduces improper fuel disposal.

Feasibility: Low setup cost with long-term savings, simple for staff, and meets industry regulations.

# Output

![Image](https://github.com/user-attachments/assets/1154cd1a-20ae-44fc-b5ce-3a67e7d16942)


Getting Started
Clone the repository.

Install required packages.

Run the application.

Contributing
Contributions are welcome! Please submit a pull request with your changes.

License
[Insert License Information]

Acknowledgments
Special thanks to the team members: Sai Rahul, Suthish, Soham, and Dhruba.

Contact Us
For more information or collaboration opportunities, please contact us at [insert contact email or link].
