import os
import sys
import socket
from flask import Flask, render_template, request, jsonify

# Set UTF-8 output encoding for Windows terminal compatibility
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024  # 200 MB max request size

def get_local_ip():
    """Detect local LAN IP for mobile/tablet connection over Wi-Fi"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        # Connect to an arbitrary external address (doesn't send data)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        try:
            return socket.gethostbyname(socket.gethostname())
        except Exception:
            return '127.0.0.1'

@app.route('/')
def index():
    local_ip = get_local_ip()
    return render_template('index.html', host_ip=local_ip, port=5000)

@app.route('/health')
def health():
    return jsonify({"status": "ok", "app": "field-dims-dispatch"})

if __name__ == '__main__':
    port = 5000
    local_ip = get_local_ip()
    
    print("\n" + "=" * 65)
    print("  QIW- FIELD DIMENTION DISPATCHER")
    print("=" * 65)
    print(f"  Local PC Link:       http://localhost:{port}")
    print(f"  Mobile/Tablet Link:  http://{local_ip}:{port} (same Wi-Fi)")
    print("=" * 65 + "\n")
    
    app.run(host='0.0.0.0', port=port, debug=False)
