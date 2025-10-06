Quick frontend config

This project includes a small `config.json` in the `frontend` folder to let you switch the backend URL without editing source files.

- File: `frontend/config.json`
- Key: `BASE_URL` — set this to the backend API root, e.g. `http://10.0.2.2:3000/api` for Android emulator or `http://192.168.8.111:3000/api` for a phone on the same Wi‑Fi.

Examples
- Emulator (default):
  {
    "BASE_URL": "http://10.0.2.2:3000/api"
  }

- Physical device (same Wi‑Fi):
  {
    "BASE_URL": "http://192.168.8.111:3000/api"
  }

Tips
- Use `adb reverse tcp:3000 tcp:3000` to map device 127.0.0.1:3000 to your PC's localhost:3000 (no firewall changes needed).
- If you change `config.json`, rebuild/reinstall the app or reload the JS bundle.
