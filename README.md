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
*FILLSAFE Dashboard*
![Image](https://github.com/user-attachments/assets/cd2a3806-0494-400d-9e92-0d0f8567c69c)
*Detecting Fire*
![Image](https://github.com/user-attachments/assets/1154cd1a-20ae-44fc-b5ce-3a67e7d16942)
*Queue Detection of Vehicles*
![Image](https://github.com/user-attachments/assets/99850e20-41f2-4cc7-a6b1-60a6697717cb)
*Number Plate Detection*
![Image](https://github.com/user-attachments/assets/6e86b3cf-246b-4881-84f3-ce93c94da20a)

Acknowledgments
Special thanks to the team members: Sai Rahul, Suthish, Soham, and Dhruba.
