import pandas as pd

# Load the CSV file
file_path = 'cpu_monitoring_log.csv'  # Replace with the path to your CSV file
data = pd.read_csv(file_path)

# Remove '%' from the "Humidity (%)" column and convert it to a float
data['Humidity (%)'] = data['Humidity (%)'].str.rstrip('%').astype(float)

# Save the updated CSV back to a file if needed
output_path = 'cleaned_file.csv'  # Replace with the desired output file path
data.to_csv(output_path, index=False)

print("Updated column:")
print(data['Humidity (%)'])
