# File paths
input_csv = 'cpu_monitoring_log.csv'
output_csv = 'cpu_monitoring_log_cleaned.csv'

# Open the input file, process it line by line, and write to a new file
with open(input_csv, 'r') as infile, open(output_csv, 'w') as outfile:
    for line in infile:
        # Strip any whitespace and remove trailing commas
        clean_line = line.rstrip().rstrip(',')
        outfile.write(clean_line + '\n')

print(f"Trailing commas removed. Cleaned file saved as {output_csv}.")
