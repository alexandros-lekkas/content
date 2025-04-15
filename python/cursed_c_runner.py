import re

memory = {}

def interpret_line(line):
    match = re.match(r'int\s+(\w+)\s*=\s*(-?\d+);', line)
    if match:
        var, val = match.groups()
        memory[var] = int(val)
        return
    
    match = re.match(r'printf\("%d",\s*(\w+)\);', line)

    if match:
        var = match.group(1)
        if var in memory:
            print(memory[var])
        else:
            print("Undefined variable:", var)
        return
    
    print("Invalid line:", {line.strip()})

c_code = """
int a = 5;
int b = 10;
printf("%d", a);
printf("%d", b);
"""

for line in c_code.strip().splitlines():
    interpret_line(line.strip())