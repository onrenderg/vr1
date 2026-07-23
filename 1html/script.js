// Global speed variable shared by the car engine and the scrolling track
window.trackSpeed = 15; // Starting speed

// 1. CAR CONTROLS COMPONENT (Steer Left/Right, Gas/Brake Up/Down)
AFRAME.registerComponent('car-controls', {
    schema: {
        steerSpeed: { type: 'number', default: 4.0 }, // How fast car moves sideways
        maxSpeed: { type: 'number', default: 45 },    // Max forward speed
        minSpeed: { type: 'number', default: 5 },     // Min forward speed (idle)
        acceleration: { type: 'number', default: 15 },// How fast you speed up
        roadLimitX: { type: 'number', default: 2.2 }  // Keeps car from flying off the road
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