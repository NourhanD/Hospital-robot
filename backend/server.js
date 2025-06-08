// backend/server.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { Server } = require('socket.io');
const ROSLIB = require('roslib');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: 'http://localhost:3000' } });

app.use(express.json());
app.use(cors());
// Proxy WebSocket traffic to rosbridge
const ROSBRIDGE_WS = process.env.ROSBRIDGE_WS || 'ws://192.168.1.42:9090';
app.use(
  '/ros',
  createProxyMiddleware({
    target: ROSBRIDGE_WS,
    changeOrigin: true,
    ws: true,
    logLevel: 'warn'
  })
);

// Connect to ROS bridge
const ros = new ROSLIB.Ros({ url: ROSBRIDGE_WS });
ros.on('connection', () => console.log('Connected to rosbridge'));
ros.on('error',   e => console.error('ROS bridge error:', e));
ros.on('close',   () => console.log('ROS bridge connection closed'));

// Publisher for robot requests
const requestTopic = new ROSLIB.Topic({
  ros,
  name: '/robot/request',
  messageType: 'std_msgs/String'
});

// In‐memory state
let robotBusy = false;
let robotLocation = { floor: 1, room: 'Lobby', x: 0, y: 0, yaw: 0 };

// When a client connects, send them the current status
io.on('connection', socket => {
  socket.emit('robot_status', { status: robotBusy ? 'busy' : 'idle', currentLocation: robotLocation });
});

// Login endpoint (no DB check)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Please provide both username and password.' });
  }
  return res.json({ username });
});

// Robot‐request endpoint
app.post('/api/robot-request', (req, res) => {
  const coords = req.body;
  // 1) Publish to ROS
  requestTopic.publish(new ROSLIB.Message({ data: JSON.stringify(coords) }));
  // 2) Update shared state → broadcast busy
  robotBusy = true;
  robotLocation = {
    floor: coords.floor,
    room: coords.room || 'Unknown',
    x: coords.x,
    y: coords.y,
    yaw: coords.yaw
  };
  io.emit('robot_status', { status: 'busy', currentLocation: robotLocation });
  // 3) Simulate task completion after 20s; broadcast idle
  setTimeout(() => {
    robotBusy = false;
    io.emit('robot_status', { status: 'idle', currentLocation: robotLocation });
  }, 20000);
  return res.json({ success: true });
});

// Optional: existing robot-id endpoint
app.get('/api/robot-id', (_req, res) => {
  res.json({ id: 'HR-001' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
