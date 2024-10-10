import socket
import csv

def receive_cpu_temperature_and_power():
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    server_address = ('127.0.0.1', 5005)  # Replace with the actual server's IP address

    # Send a message to the server to start receiving data
    try:
        client_socket.sendto(b'Client connected', server_address)
    except Exception as e:
        print(f"Failed to send initial message to the server: {e}")
        return

    # Open the CSV file for writing
    with open('cpu_monitoring_log.csv', mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['Timestamp', 'CPU Package Temperature (°C)', 'CPU Power Consumption (W)', 'Humidity (%)'])  # Add humidity column

        while True:
            try:
                # Receive data from the server
                data, _ = client_socket.recvfrom(1024)
                decoded_data = data.decode()

                # Split the data into timestamp, temperature, power, and humidity
                parts = decoded_data.split(',')
                if len(parts) != 4:
                    print(f"Received malformed data: {decoded_data}")
                    continue

                timestamp, temperature, power, humidity = parts
                # Format power to two decimal points
                power = f"{float(power):.2f}"

                print(f"Received data: {timestamp} - Temperature: {temperature} °C, Power: {power} W, Humidity: {humidity}%")

                # Write the received data into the CSV file
                writer.writerow([timestamp, temperature, power, humidity])
                file.flush()  # Ensure the data is written to disk

            except Exception as e:
                print(f"Error receiving data: {e}")
                break

if __name__ == "__main__":
    receive_cpu_temperature_and_power()
