// Global speed variable shared by the car engine and the scrolling track
window.trackSpeed = 15; // Starting speed

// CHANGE THIS VARIABLE to adjust how often incoming traffic cars spawn (in seconds)!
// Example: 5 = spawns a car every 5 seconds, 2 = spawns a car every 2 seconds
window.carSpawnIntervalSeconds = 2;

// 1. CAR CONTROLS COMPONENT (Steer Left/Right, Gas/Brake Up/Down)
AFRAME.registerComponent('car-controls', {
    schema: {
        steerSpeed: { type: 'number', default: 4.0 }, // How fast car moves sideways
        maxSpeed: { type: 'number', default: 45 },    // Max forward speed
        minSpeed: { type: 'number', default: 5 },     // Min forward speed (idle)
        acceleration: { type: 'number', default: 15 },// How fast you speed up
        roadLimitX: { type: 'number', default: 5.2 }  // Keeps car on wider road (width 12)
    },

    init: function () {
        // Keep track of which keys are currently held down
        this.keys = {};

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    },

    tick: function (time, timeDelta) {
        let dt = timeDelta / 1000; // Delta time in seconds
        let pos = this.el.object3D.position;

        // --- STEERING (Left / Right) ---
        // ArrowLeft or KeyA
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            pos.x -= this.data.steerSpeed * dt;
        }
        // ArrowRight or KeyD
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            pos.x += this.data.steerSpeed * dt;
        }

        // Keep the car within the borders of the asphalt!
        if (pos.x < -this.data.roadLimitX) pos.x = -this.data.roadLimitX;
        if (pos.x > this.data.roadLimitX) pos.x = this.data.roadLimitX;

        // --- ACCELERATION & BRAKES (Up / Down) ---
        // ArrowUp or KeyW (Gas Pedal - speeds up the track!)
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            window.trackSpeed += this.data.acceleration * dt;
            if (window.trackSpeed > this.data.maxSpeed) window.trackSpeed = this.data.maxSpeed;
        }
        // ArrowDown or KeyS (Brake Pedal - slows down the track!)
        else if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            window.trackSpeed -= (this.data.acceleration * 1.5) * dt;
            if (window.trackSpeed < this.data.minSpeed) window.trackSpeed = this.data.minSpeed;
        }
    }
});

// 2. UNLIMITED TRACK COMPONENT (Reads window.trackSpeed dynamically)
AFRAME.registerComponent('infinite-scroll', {
    schema: {
        resetZ: { type: 'number', default: 2 },    // Point behind camera where objects reset
        startZ: { type: 'number', default: -38 }   // Point on horizon where they respawn
    },

    tick: function (time, timeDelta) {
        let z = this.el.object3D.position.z;

        // Move object toward camera using the global track speed
        z += window.trackSpeed * (timeDelta / 1000);

        // Loop back to horizon
        if (z >= this.data.resetZ) {
            let overshoot = z - this.data.resetZ;
            z = this.data.startZ + overshoot;
        }

        this.el.object3D.position.z = z;
    }
});

// 3. MINI ARCADE SCREEN ANIMATION
AFRAME.registerComponent('arcade-movement', {
    schema: {
        speed: { type: 'number', default: 3.0 },
        range: { type: 'number', default: 0.15 }
    },

    init: function () {
        this.startX = this.el.object3D.position.x;
    },

    tick: function (time) {
        // Sway left/right on the mini screen
        let newX = this.startX + Math.sin(time / 1000 * this.data.speed) * this.data.range;
        this.el.object3D.position.x = newX;
    }
});

// 4. TRAFFIC SPAWNER COMPONENT (Reads window.carSpawnIntervalSeconds)
AFRAME.registerComponent('traffic-spawner', {
    schema: {
        startZ: { type: 'number', default: -38 },
        resetZ: { type: 'number', default: 4 }
    },

    init: function () {
        // 4 lanes across width 12 road (-6 to +6)
        this.lanes = [-4.5, -1.5, 1.5, 4.5];
        this.currentLaneIndex = 0;
        this.timer = 0;
    },

    tick: function (time, timeDelta) {
        if (!timeDelta) return;
        this.timer += timeDelta;

        // Reads window.carSpawnIntervalSeconds dynamically (convert seconds to ms)
        let intervalMs = (window.carSpawnIntervalSeconds || 5) * 1000;

        if (this.timer >= intervalMs) {
            this.timer = this.timer % intervalMs;
            this.spawnCarInNextLane();
        }
    },

    spawnCarInNextLane: function () {
        let laneX = this.lanes[this.currentLaneIndex];
        // Alternate to the next lane for subsequent spawns
        this.currentLaneIndex = (this.currentLaneIndex + 1) % this.lanes.length;

        // Create traffic car entity container
        let carEl = document.createElement('a-entity');
        carEl.setAttribute('position', `${laneX} 0 ${this.data.startZ}`);
        carEl.setAttribute('traffic-car', `resetZ: ${this.data.resetZ}`);

        // Palette of colors for traffic variety
        let colors = ['#e74c3c', '#3498db', '#9b59b6', '#f1c40f', '#e67e22', '#1abc9c'];
        let carColor = colors[Math.floor(Math.random() * colors.length)];

        // Car Main Body (Standard car dimensions, keeping car size same)
        let body = document.createElement('a-box');
        body.setAttribute('position', '0 0.5 0');
        body.setAttribute('width', '1.5');
        body.setAttribute('height', '0.6');
        body.setAttribute('depth', '2.5');
        body.setAttribute('color', carColor);
        carEl.appendChild(body);

        // Car Cabin / Roof
        let cabin = document.createElement('a-box');
        cabin.setAttribute('position', '0 1.0 -0.1');
        cabin.setAttribute('width', '1.3');
        cabin.setAttribute('height', '0.5');
        cabin.setAttribute('depth', '1.4');
        cabin.setAttribute('color', '#222222');
        carEl.appendChild(cabin);

        // Headlights (Facing +Z toward player)
        let headlightLeft = document.createElement('a-box');
        headlightLeft.setAttribute('position', '-0.5 0.5 1.26');
        headlightLeft.setAttribute('width', '0.3');
        headlightLeft.setAttribute('height', '0.15');
        headlightLeft.setAttribute('depth', '0.05');
        headlightLeft.setAttribute('color', '#ffff99');
        carEl.appendChild(headlightLeft);

        let headlightRight = document.createElement('a-box');
        headlightRight.setAttribute('position', '0.5 0.5 1.26');
        headlightRight.setAttribute('width', '0.3');
        headlightRight.setAttribute('height', '0.15');
        headlightRight.setAttribute('depth', '0.05');
        headlightRight.setAttribute('color', '#ffff99');
        carEl.appendChild(headlightRight);

        // Taillights
        let taillightLeft = document.createElement('a-box');
        taillightLeft.setAttribute('position', '-0.5 0.5 -1.26');
        taillightLeft.setAttribute('width', '0.3');
        taillightLeft.setAttribute('height', '0.15');
        taillightLeft.setAttribute('depth', '0.05');
        taillightLeft.setAttribute('color', '#ff0000');
        carEl.appendChild(taillightLeft);

        let taillightRight = document.createElement('a-box');
        taillightRight.setAttribute('position', '0.5 0.5 -1.26');
        taillightRight.setAttribute('width', '0.3');
        taillightRight.setAttribute('height', '0.15');
        taillightRight.setAttribute('depth', '0.05');
        taillightRight.setAttribute('color', '#ff0000');
        carEl.appendChild(taillightRight);

        // Wheels
        const wheelPositions = [
            '-0.8 0.25 0.8',
            '0.8 0.25 0.8',
            '-0.8 0.25 -0.8',
            '0.8 0.25 -0.8'
        ];
        wheelPositions.forEach(posStr => {
            let wheel = document.createElement('a-cylinder');
            wheel.setAttribute('position', posStr);
            wheel.setAttribute('rotation', '0 0 90');
            wheel.setAttribute('radius', '0.25');
            wheel.setAttribute('height', '0.15');
            wheel.setAttribute('color', '#111111');
            carEl.appendChild(wheel);
        });

        this.el.sceneEl.appendChild(carEl);
    }
});

// 5. TRAFFIC CAR MOVEMENT & CRASH PENALTY COMPONENT
AFRAME.registerComponent('traffic-car', {
    schema: {
        speedOffset: { type: 'number', default: 5 }, // Extra relative speed towards camera
        resetZ: { type: 'number', default: 4 }
    },

    init: function () {
        this.hasCrashed = false;
    },

    tick: function (time, timeDelta) {
        let pos = this.el.object3D.position;
        let dt = timeDelta / 1000;

        // Move car down the track towards player position Z
        pos.z += (window.trackSpeed + this.data.speedOffset) * dt;

        // --- FRONT BONNET CRASH PENALTY DETECTION ---
        if (!this.hasCrashed) {
            let playerCar = document.querySelector('#player-car');
            if (playerCar) {
                let playerX = playerCar.object3D.position.x;
                // Check lateral X distance and front bonnet Z zone (-3.5 to -0.2)
                let dx = Math.abs(pos.x - playerX);
                if (dx < 1.4 && pos.z >= -3.5 && pos.z <= -0.2) {
                    this.hasCrashed = true;
                    this.triggerCrashPenalty(playerCar, pos.x);
                }
            }
        }

        // Despawn element when it passes behind player view
        if (pos.z >= this.data.resetZ) {
            if (this.el.parentNode) {
                this.el.parentNode.removeChild(this.el);
            }
        }
    },

    triggerCrashPenalty: function (playerCar, crashX) {
        // 1. Heavy Speed Drop Penalty: Instant brake drop to 5 km/h
        window.trackSpeed = 5;

        // 2. Red Windshield Flash Overlay
        let flashEl = document.querySelector('#crash-flash');
        if (flashEl) {
            flashEl.setAttribute('visible', 'true');
            setTimeout(() => {
                flashEl.setAttribute('visible', 'false');
            }, 400);
        }

        // 3. HUD Crash Penalty Warning Text
        let crashText = document.querySelector('#crash-warning-text');
        if (crashText) {
            crashText.setAttribute('value', '💥 CRASH PENALTY!');
            crashText.setAttribute('visible', 'true');
            setTimeout(() => {
                crashText.setAttribute('visible', 'false');
            }, 1500);
        }

        // 4. Camera Shake Effect on Impact
        let originalY = 1.2;
        let cameraEl = playerCar.querySelector('a-camera');
        if (cameraEl) {
            let shakeCount = 0;
            let shakeInterval = setInterval(() => {
                let offsetX = (Math.random() - 0.5) * 0.16;
                let offsetY = originalY + (Math.random() - 0.5) * 0.16;
                cameraEl.setAttribute('position', `${offsetX} ${offsetY} 0`);
                shakeCount++;
                if (shakeCount > 8) {
                    clearInterval(shakeInterval);
                    cameraEl.setAttribute('position', `0 ${originalY} 0`);
                }
            }, 30);
        }

        // 5. Bonnet Impact Burst Sparks/Flash Mesh
        let scene = this.el.sceneEl;
        if (scene) {
            let spark = document.createElement('a-box');
            spark.setAttribute('position', `${crashX} 0.5 -2.2`);
            spark.setAttribute('width', '1.8');
            spark.setAttribute('height', '0.8');
            spark.setAttribute('depth', '0.5');
            spark.setAttribute('color', '#ff2200');
            spark.setAttribute('material', 'shader: flat; opacity: 0.9');
            scene.appendChild(spark);

            setTimeout(() => {
                if (spark.parentNode) spark.parentNode.removeChild(spark);
            }, 250);
        }
    }
});
