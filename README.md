ThermoGuard – Real-Time Monitoring & Alert System

This system collects real-time temperature and power voltage data from PC hardware and external temperature sensors using an Arduino-based setup.
The system continuously logs and stores incoming data over time, enabling historical analysis and predictive modeling. Based on previously collected data, 
it generates forecasts to anticipate potential temperature spikes and issue early warnings.

This capability helps improve preparedness in data center environments by identifying abnormal temperature trends early, 
reducing the risk of hardware failure, server downtime, and equipment damage.

Hardware Requirements
This project requires external hardware to function fully:
-Arduino microcontroller
-Temperature sensor(s)
-USB connection to host machine

How It Works
The system reads real-time sensor data via Arduino and streams it to the backend application running on the host machine.
Data is then processed, stored, and used for predictive analysis.
