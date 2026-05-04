from opcodes import OPCODES, NO_OPERAND

def pass1(lines):
    """
    Scan through lines and record the address of every label.
    Returns a dictionary: { "LABEL_NAME": address }
    """
    symbol_table = {}
    address = 0
    line_no = 0

    for line in lines:
        # Remove comments and strip whitespace
        line = line.split("/")[0].strip()

        # Skip empty lines
        if not line:
            line_no+=1
            continue

        # Check if line has a label (e.g. "LOOP, LOAD X")
        if "," in line:
            label = line.split(",")[0].strip().upper()
            if label in symbol_table:
                raise ValueError(f"Line {line_no+1}: Duplicate label '{label}'")
            symbol_table[label] = address


        address += 1
        line_no+=1

    return symbol_table


def pass2(lines, symbol_table):
    """
    Translate each instruction into 16-bit binary and hex.
    Returns a list of tuples: [ (binary, hex) ]
    """
    machine_code = []
    address = 0

    for line in lines:
        # Remove comments and strip whitespace
        line = line.split("/")[0].strip()

        # Skip empty lines
        if not line:
            continue

        # Remove label if present
        if "," in line:
            line = line.split(",")[1].strip()

        # Split into parts (e.g. ["LOAD", "X"] or ["HALT"])
        parts = line.upper().split()
        instruction = parts[0]

        if instruction not in OPCODES:

            if instruction == "DEC":
                value = int(parts[1])
                # handle negative numbers (16-bit two's complement)
                if value < 0:
                    value = value % 65536
                parts = ["HEX", format(value, "04X")]
                instruction = "HEX"

            # Handle HEX directive (store raw value)
            if instruction == "HEX":
                value = int(parts[1], 16)
                binary = format(value, "016b")
                hex_code = format(value, "04X")
                machine_code.append((binary, hex_code))
                address += 1
                continue
            raise ValueError(f"Unknown instruction '{instruction}' at address {address}")
            

        opcode = OPCODES[instruction]

        # Instructions with no operand (INPUT, OUTPUT, HALT)
        if instruction in NO_OPERAND:
            operand_bits = "0" * 12

        # SKIPCOND uses a fixed code (not an address)
        elif instruction == "SKIPCOND":
            code = parts[1]  # e.g. "000", "400", "800"
            operand_bits = format(int(code, 16), "012b")

        # All other instructions use a label or numeric address
        else:
            operand = parts[1]
            if operand in symbol_table:
                operand_address = symbol_table[operand]
            else:
                operand_address = int(operand, 16)

            operand_bits = format(operand_address, "012b")

        binary = opcode + operand_bits
        hex_code = format(int(binary, 2), "04X")
        machine_code.append((binary, hex_code))
        address += 1

    return machine_code



