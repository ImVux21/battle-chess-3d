import urllib.request

pieceNames = ['king', 'queen', 'bishop', 'knight', 'rook', 'pawn']
colors = ['w', 'b']

for color in colors:
    folder = 'white' if color == 'w' else 'black'
    for name in pieceNames:
        hasArmedVersion = (name != 'knight') and not (color == 'b' and name == 'queen')
        basePath = '/assets/models/meshy'
        url = f'{basePath}/{folder}/{name}.glb'
        if hasArmedVersion:
            url = f'{basePath}/merged/{folder}_{name}_armed.glb'
        
        full_url = f'http://localhost:5173{url}'
        try:
            req = urllib.request.Request(full_url, method='HEAD')
            with urllib.request.urlopen(req) as resp:
                cl = resp.headers.get('Content-Length', 'unknown')
                cl_mb = f"{int(cl)/(1024*1024):.1f}MB" if cl != 'unknown' else 'unknown'
                print(f"[{resp.status}] {color}_{name:6}: {cl_mb} -> {url}")
        except Exception as e:
            print(f"[FAIL] {color}_{name:6}: {e} -> {url}")
