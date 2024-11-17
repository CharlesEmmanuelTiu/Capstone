import socket

# Set the IP and port to listen on
UDP_IP = '0.0.0.0'  # Listen on all available interfaces
UDP_PORT = 12345     # Port to listen on (must match the client code)

# Create a UDP socket
udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# Bind the socket to the IP and port
udp_socket.bind((UDP_IP, UDP_PORT))

print(f"Listening for UDP packets on {UDP_IP}:{UDP_PORT}...")

# Continuously listen for incoming UDP packets
while True:
    # Receive data from the Arduino client
    data, addr = udp_socket.recvfrom(1024)  # Buffer size is 1024 bytes
    print(f"Received data: {data.decode('utf-8')}")  # Decode and print the received message
