import serial
import time
import socket
import threading

# Set the COM ports and baud rate
COM_PORT_1 = 'COM3'  # DHT22 Sensor
COM_PORT_2 = 'COM4'  # Water Sensor
BAUD_RATE = 9600     # Match Arduino baud rate

# Set the UDP server IP and port
UDP_SERVER_IP = '127.0.0.1'  # Update with your server IP
UDP_SERVER_PORT = 12345      # Port to send data to

# Open the serial ports
ser1 = serial.Serial(COM_PORT_1, BAUD_RATE)
ser2 = serial.Serial(COM_PORT_2, BAUD_RATE)
time.sleep(2)  # Allow time for the Arduinos to initialize

# Create a UDP socket
udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

def read_sensor_data(ser):
    """Read data from the Arduino's serial port."""
    if ser.in_waiting > 0:
        data = ser.readline().decode('utf-8').strip()  # Decode and remove whitespace
        return data
    return None

def send_udp_data(data, source):
    """Send the received sensor data over UDP."""
    udp_socket.sendto(data.encode('utf-8'), (UDP_SERVER_IP, UDP_SERVER_PORT))
    print(f"[{source}] Sent data over UDP: {data}")

def process_serial_data(serial_port, source, sensor_type):
    """Thread function to handle serial data from a specific port."""
    print(f"Reading data from {source} ({sensor_type})...")
    while True:
        data = read_sensor_data(serial_port)  # Get sensor data
        if data:
            if sensor_type == "DHT22":
                if "Humidity:" in data and "Temperature:" in data:
                    # Try splitting the data
                    try:
                        # Split based on expected format
                        humidity, temp_str = data.split(' Temperature: ')
                        temp_celsius, temp_fahrenheit = temp_str.split('°C ')

                        humidity = humidity.replace("Humidity: ", "")
                        temp_celsius = temp_celsius.strip()
                        temp_fahrenheit = temp_fahrenheit.replace("°F", "").strip()

                        # Format and send the data
                        sensor_data = f"Humidity: {humidity}% Temp: {temp_celsius}°C {temp_fahrenheit}°F"
                        send_udp_data(sensor_data, source)

                    except ValueError as e:
                        print(f"[{source}] Error processing data: {e}")
                else:
                    print(f"[{source}] Data format not recognized, skipping...")
            elif sensor_type == "Water":
                try:
                    # Remove the label if present and extract the numeric value
                    if "Sensor value:" in data:
                        data = data.replace("Sensor value:", "").strip()
                    
                    # Convert the remaining value to an integer
                    water_level = int(data)
                    sensor_data = f"Water Level: {water_level}"
                    send_udp_data(sensor_data, source)
                except ValueError:
                    print(f"[{source}] Invalid water sensor data: {data}")
        else:
            print(f"[{source}] Waiting for data...")

        time.sleep(2)  # Wait for the next reading

def main():
    # Create threads for each sensor
    thread1 = threading.Thread(target=process_serial_data, args=(ser1, "COM3", "DHT22"))
    thread2 = threading.Thread(target=process_serial_data, args=(ser2, "COM4", "Water"))

    # Start the threads
    thread1.start()
    thread2.start()

    # Wait for threads to finish (they won't, as this runs indefinitely)
    thread1.join()
    thread2.join()

if __name__ == "__main__":
    main()
