from flask import Flask, request, jsonify, render_template
from assembler import pass1, pass2
 
app = Flask(__name__)
 
@app.route("/")
def index():
    return render_template("index.html")
 
@app.route("/assemble", methods=["POST"])
def assemble():
    data = request.get_json()
    source_code = data.get("code", "")
 
    if not source_code.strip():
        return jsonify({"error": "No code provided"}), 400
 
    lines = source_code.splitlines()
 
    try:
        symbol_table = pass1(lines)
        machine_code = pass2(lines, symbol_table)
 
        # Build output rows
        results = []
        addr = 0
        for binary, hex_code in machine_code:
            results.append({
                "address": format(addr, "03X"),
                "binary":  binary,
                "hex":     hex_code
            })
            addr += 1
 
        return jsonify({
            "success":      True,
            "symbol_table": symbol_table,
            "output":       results
        })
 
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Unexpected error: {str(e)}"}), 500
 
if __name__ == "__main__":
    app.run(debug=True)