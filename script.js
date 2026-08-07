// Global speed variable shared by the car engine and the scrolling track
window.trackSpeed = 15; // Starting speed

// CHANGE THIS VARIABLE to adjust how often incoming traffic cars spawn (in seconds)!
window.carSpawnIntervalSeconds = 2;

// Global game pause flag (used when Exit modal is active)
window.isGamePaused = false;

// 1. CAR CONTROLS COMPONENT (Keyboard + VR Controller Thumbstick + WebXR InputSources)
AFRAME.registerComponent('car-controls', {
    schema: {
        steerSpeed: { type: 'number', default: 5.0 }, // How fast car moves sideways
        maxSpeed: { type: 'number', default: 45 },    // Max forward speed
        minSpeed: { type: 'number', default: 5 },     // Min forward speed (idle)
        acceleration: { type: 'number', default: 15 },// How fast you speed up
        roadLimitX: { type: 'number', default: 5.2 }  // Keeps car on wider road (width 12)
    },

    init: function () {
        // Keep track of which keys are currently held down
        this.keys = {};
        this.xButtonPressed = false;

        // VR Thumbstick state storage from events
        this.vrAxisX = 0;
        this.vrAxisY = 0;

        // Find Steering Wheel Entity for realistic visual turn animation
        this.steeringWheelEl = this.el.querySelector('a-torus')?.parentNode || null;

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            // Press 'X' key to open/close Exit Modal
            if (e.code === 'KeyX') {
                if (window.toggleExitModal) window.toggleExitModal();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Listen for A-Frame WebXR controller axis events (works in Quest & Immersive Web Emulator)
        let updateVrAxes = (evt) => {
            if (!evt || !evt.detail) return;
            let detail = evt.detail;
            if (detail.x !== undefined && detail.y !== undefined) {
                this.vrAxisX = detail.x;
                this.vrAxisY = detail.y;
            } else if (detail.axis) {
                this.vrAxisX = detail.axis[0] || 0;
                this.vrAxisY = detail.axis[1] || 0;
            }
        };

        this.el.sceneEl.addEventListener('axismoved', updateVrAxes);
        this.el.sceneEl.addEventListener('thumbstickmoved', updateVrAxes);
    },

    tick: function (time, timeDelta) {
        if (window.isGamePaused) return; // Freeze car controls when Exit menu is open

        let dt = timeDelta / 1000; // Delta time in seconds
        let pos = this.el.object3D.position;

        let moveX = 0; // Sideways steering input (-1 left, +1 right)
        let moveY = 0; // Acceleration/Brake input (+1 gas, -1 brake)

        // --- 1. KEYBOARD CONTROLS ---
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) moveX -= 1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) moveX += 1;
        if (this.keys['ArrowUp'] || this.keys['KeyW']) moveY += 1;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) moveY -= 1;

        // --- 2. VR THUMBSTICK AXES (FROM EVENT LISTENERS) ---
        if (Math.abs(this.vrAxisX) > 0.1) moveX = this.vrAxisX;
        if (Math.abs(this.vrAxisY) > 0.1) moveY = -this.vrAxisY;

        // --- 3. DIRECT WEBXR INPUT SOURCES (FOR QUEST & EMULATOR) ---
        let sceneEl = this.el.sceneEl;
        if (sceneEl && sceneEl.xrSession && sceneEl.xrSession.inputSources) {
            let sources = sceneEl.xrSession.inputSources;
            for (let i = 0; i < sources.length; i++) {
                let src = sources[i];
                if (src && src.gamepad && src.gamepad.axes) {
                    let axes = src.gamepad.axes;
                    let axX = 0;
                    let axY = 0;

                    if (axes.length >= 4) {
                        // Standard Oculus Touch / WebXR Gamepad Thumbstick mapping
                        let mainX = axes[2];
                        let mainY = axes[3];
                        let altX = axes[0];
                        let altY = axes[1];
                        axX = Math.abs(mainX) > 0.1 ? mainX : (Math.abs(altX) > 0.1 ? altX : 0);
                        axY = Math.abs(mainY) > 0.1 ? mainY : (Math.abs(altY) > 0.1 ? altY : 0);
                    } else if (axes.length >= 2) {
                        axX = Math.abs(axes[0]) > 0.1 ? axes[0] : 0;
                        axY = Math.abs(axes[1]) > 0.1 ? axes[1] : 0;
                    }

                    if (Math.abs(axX) > 0.1) moveX = axX;
                    if (Math.abs(axY) > 0.1) moveY = -axY;

                    // Check Left Controller X Button (Button 4 or 3)
                    if (src.gamepad.buttons) {
                        let btns = src.gamepad.buttons;
                        let isXDown = (btns[4] && btns[4].pressed) || (btns[3] && btns[3].pressed);
                        if (isXDown) {
                            if (!this.xButtonPressed) {
                                this.xButtonPressed = true;
                                if (window.toggleExitModal) window.toggleExitModal();
                            }
                        } else {
                            this.xButtonPressed = false;
                        }
                    }
                }
            }
        }

        // --- 4. FALLBACK HTML5 GAMEPADS ---
        let gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let i = 0; i < gamepads.length; i++) {
            let gp = gamepads[i];
            if (!gp || !gp.axes) continue;

            let axes = gp.axes;
            let axX = 0;
            let axY = 0;

            if (axes.length >= 4) {
                axX = Math.abs(axes[2]) > 0.1 ? axes[2] : (Math.abs(axes[0]) > 0.1 ? axes[0] : 0);
                axY = Math.abs(axes[3]) > 0.1 ? axes[3] : (Math.abs(axes[1]) > 0.1 ? axes[1] : 0);
            } else if (axes.length >= 2) {
                axX = Math.abs(axes[0]) > 0.1 ? axes[0] : 0;
                axY = Math.abs(axes[1]) > 0.1 ? axes[1] : 0;
            }

            if (Math.abs(axX) > 0.1) moveX = axX;
            if (Math.abs(axY) > 0.1) moveY = -axY;
        }

        // --- APPLY STEERING (Left / Right) ---
        if (moveX !== 0) {
            pos.x += moveX * this.data.steerSpeed * dt;
        }

        // Keep car within the road borders (-5.2 to +5.2)
        if (pos.x < -this.data.roadLimitX) pos.x = -this.data.roadLimitX;
        if (pos.x > this.data.roadLimitX) pos.x = this.data.roadLimitX;

        // Steering Wheel 3D Rotation Effect
        if (this.steeringWheelEl && window.THREE) {
            let targetRotZ = -moveX * 0.7; // Rotate steering wheel on turn
            this.steeringWheelEl.object3D.rotation.z += (targetRotZ - this.steeringWheelEl.object3D.rotation.z) * 0.2;
        }

        // --- APPLY ACCELERATION & BRAKES (Up / Down) ---
        if (moveY > 0) {
            // Gas Pedal - speed up!
            window.trackSpeed += moveY * this.data.acceleration * dt;
            if (window.trackSpeed > this.data.maxSpeed) window.trackSpeed = this.data.maxSpeed;
        } else if (moveY < 0) {
            // Brake Pedal - slow down!
            window.trackSpeed += moveY * (this.data.acceleration * 1.5) * dt;
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
        if (window.isGamePaused) return;

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
        if (window.isGamePaused) return;
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
        if (window.isGamePaused || !timeDelta) return;
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

        // Car Main Body
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

        // Headlights
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
        if (window.isGamePaused) return;

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

// 6. EXIT MODAL HANDLER & VR CONTROLLER LISTENER
AFRAME.registerComponent('exit-modal-handler', {
    init: function () {
        let sceneEl = this.el.sceneEl;
        let exitModal = document.querySelector('#exit-modal');
        let btnExit = document.querySelector('#btn-exit-game');
        let btnStay = document.querySelector('#btn-stay-game');

        window.toggleExitModal = () => {
            if (!exitModal) return;
            let isVisible = exitModal.getAttribute('visible') === 'true';
            let nextState = !isVisible;
            exitModal.setAttribute('visible', nextState ? 'true' : 'false');
            window.isGamePaused = nextState;
        };

        if (btnExit) {
            btnExit.addEventListener('click', () => {
                if (sceneEl && sceneEl.is('vr-mode')) {
                    sceneEl.exitVR();
                }
                if (exitModal) exitModal.setAttribute('visible', 'false');
                window.isGamePaused = false;
                window.location.reload();
            });
        }

        if (btnStay) {
            btnStay.addEventListener('click', () => {
                if (exitModal) exitModal.setAttribute('visible', 'false');
                window.isGamePaused = false;
            });
        }

        // VR Controller Button X (or Y) trigger events
        this.el.addEventListener('xbuttondown', () => {
            window.toggleExitModal();
        });
        this.el.addEventListener('ybuttondown', () => {
            window.toggleExitModal();
        });
    }
});

// =========================================================================
// 7. 3D DRIVER CHARACTER COMPONENT (Helmet, Suit, Animated Hands, Legs)
// =========================================================================
AFRAME.registerComponent('driver-character', {
    schema: {
        suitStyle: { type: 'string', default: 'cyber-racer' } // 'cyber-racer', 'mecha-android', 'vaporwave-pilot'
    },

    init: function () {
        this.steerInput = 0;
        this.buildCharacterMesh();
    },

    buildCharacterMesh: function () {
        // Clear previous mesh if re-building
        while (this.el.firstChild) {
            this.el.removeChild(this.el.firstChild);
        }

        // Color palettes for character themes
        const palettes = {
            'cyber-racer': { body: '#0d1124', armor: '#ff007f', visor: '#00f0ff', accents: '#00f0ff', skin: '#1e293b' },
            'mecha-android': { body: '#18181b', armor: '#eab308', visor: '#f97316', accents: '#facc15', skin: '#09090b' },
            'vaporwave-pilot': { body: '#2e1065', armor: '#a855f7', visor: '#ec4899', accents: '#38bdf8', skin: '#3b0764' }
        };

        const p = palettes[this.data.suitStyle] || palettes['cyber-racer'];

        // --- 1. TORSO & RACING CHEST SUIT ---
        let torso = document.createElement('a-box');
        torso.setAttribute('position', '-0.25 0.7 -0.15');
        torso.setAttribute('width', '0.45');
        torso.setAttribute('height', '0.5');
        torso.setAttribute('depth', '0.3');
        torso.setAttribute('color', p.body);
        torso.setAttribute('rotation', '15 0 0');

        // Chest Armor Plate
        let chestArmor = document.createElement('a-box');
        chestArmor.setAttribute('position', '0 0.05 -0.16');
        chestArmor.setAttribute('width', '0.42');
        chestArmor.setAttribute('height', '0.32');
        chestArmor.setAttribute('depth', '0.04');
        chestArmor.setAttribute('color', p.armor);
        chestArmor.setAttribute('material', `shader: flat; emissive: ${p.armor}`);
        torso.appendChild(chestArmor);

        // Center Reactor Core Badge
        let core = document.createElement('a-cylinder');
        core.setAttribute('position', '0 0.05 -0.19');
        core.setAttribute('rotation', '90 0 0');
        core.setAttribute('radius', '0.06');
        core.setAttribute('height', '0.02');
        core.setAttribute('color', p.visor);
        core.setAttribute('material', `shader: flat; emissive: ${p.visor}`);
        torso.appendChild(core);

        this.el.appendChild(torso);

        // --- 2. DRIVER HELMET & VISOR ---
        let headGroup = document.createElement('a-entity');
        headGroup.setAttribute('position', '-0.25 1.15 -0.05');

        // Helmet Main Shell
        let helmet = document.createElement('a-sphere');
        helmet.setAttribute('radius', '0.18');
        helmet.setAttribute('color', p.body);
        helmet.setAttribute('material', 'roughness: 0.2; metalness: 0.8');
        headGroup.appendChild(helmet);

        // Glowing Cyber Visor
        let visor = document.createElement('a-box');
        visor.setAttribute('position', '0 0.02 -0.12');
        visor.setAttribute('width', '0.28');
        visor.setAttribute('height', '0.11');
        visor.setAttribute('depth', '0.1');
        visor.setAttribute('color', p.visor);
        visor.setAttribute('material', `shader: flat; emissive: ${p.visor}; opacity: 0.95; transparent: true`);
        headGroup.appendChild(visor);

        // Helmet Side Ear Guards
        let earL = document.createElement('a-cylinder');
        earL.setAttribute('position', '-0.17 0 -0.02');
        earL.setAttribute('rotation', '0 0 90');
        earL.setAttribute('radius', '0.04');
        earL.setAttribute('height', '0.04');
        earL.setAttribute('color', p.armor);
        earL.setAttribute('material', `shader: flat; emissive: ${p.armor}`);
        headGroup.appendChild(earL);

        let earR = document.createElement('a-cylinder');
        earR.setAttribute('position', '0.17 0 -0.02');
        earR.setAttribute('rotation', '0 0 90');
        earR.setAttribute('radius', '0.04');
        earR.setAttribute('height', '0.04');
        earR.setAttribute('color', p.armor);
        earR.setAttribute('material', `shader: flat; emissive: ${p.armor}`);
        headGroup.appendChild(earR);

        this.headGroup = headGroup;
        this.el.appendChild(headGroup);

        // --- 3. DRIVER ARMS & HANDS ON STEERING WHEEL ---
        // Left Arm Container
        let leftArm = document.createElement('a-entity');
        leftArm.setAttribute('position', '-0.45 0.8 -0.18');

        let upperArmL = document.createElement('a-cylinder');
        upperArmL.setAttribute('position', '0 -0.1 -0.08');
        upperArmL.setAttribute('rotation', '50 20 -20');
        upperArmL.setAttribute('radius', '0.045');
        upperArmL.setAttribute('height', '0.28');
        upperArmL.setAttribute('color', p.body);
        leftArm.appendChild(upperArmL);

        let lowerArmL = document.createElement('a-cylinder');
        lowerArmL.setAttribute('position', '0.06 -0.12 -0.18');
        lowerArmL.setAttribute('rotation', '80 35 -10');
        lowerArmL.setAttribute('radius', '0.04');
        lowerArmL.setAttribute('height', '0.28');
        lowerArmL.setAttribute('color', p.armor);
        leftArm.appendChild(lowerArmL);

        // Left Hand Glove
        let handL = document.createElement('a-box');
        handL.setAttribute('position', '0.08 -0.1 -0.27');
        handL.setAttribute('width', '0.07');
        handL.setAttribute('height', '0.07');
        handL.setAttribute('depth', '0.09');
        handL.setAttribute('color', p.visor);
        handL.setAttribute('material', `shader: flat; emissive: ${p.visor}`);
        leftArm.appendChild(handL);

        this.leftArm = leftArm;
        this.el.appendChild(leftArm);

        // Right Arm Container
        let rightArm = document.createElement('a-entity');
        rightArm.setAttribute('position', '-0.05 0.8 -0.18');

        let upperArmR = document.createElement('a-cylinder');
        upperArmR.setAttribute('position', '0 -0.1 -0.08');
        upperArmR.setAttribute('rotation', '50 -20 20');
        upperArmR.setAttribute('radius', '0.045');
        upperArmR.setAttribute('height', '0.28');
        upperArmR.setAttribute('color', p.body);
        rightArm.appendChild(upperArmR);

        let lowerArmR = document.createElement('a-cylinder');
        lowerArmR.setAttribute('position', '-0.06 -0.12 -0.18');
        lowerArmR.setAttribute('rotation', '80 -35 10');
        lowerArmR.setAttribute('radius', '0.04');
        lowerArmR.setAttribute('height', '0.28');
        lowerArmR.setAttribute('color', p.armor);
        rightArm.appendChild(lowerArmR);

        // Right Hand Glove
        let handR = document.createElement('a-box');
        handR.setAttribute('position', '-0.08 -0.1 -0.27');
        handR.setAttribute('width', '0.07');
        handR.setAttribute('height', '0.07');
        handR.setAttribute('depth', '0.09');
        handR.setAttribute('color', p.visor);
        handR.setAttribute('material', `shader: flat; emissive: ${p.visor}`);
        rightArm.appendChild(handR);

        this.rightArm = rightArm;
        this.el.appendChild(rightArm);

        // --- 4. DRIVER LEGS & BOOTS ---
        let legL = document.createElement('a-cylinder');
        legL.setAttribute('position', '-0.38 0.35 -0.3');
        legL.setAttribute('rotation', '70 0 0');
        legL.setAttribute('radius', '0.055');
        legL.setAttribute('height', '0.45');
        legL.setAttribute('color', p.body);
        this.el.appendChild(legL);

        let legR = document.createElement('a-cylinder');
        legR.setAttribute('position', '-0.12 0.35 -0.3');
        legR.setAttribute('rotation', '70 0 0');
        legR.setAttribute('radius', '0.055');
        legR.setAttribute('height', '0.45');
        legR.setAttribute('color', p.body);
        this.el.appendChild(legR);

        let bootL = document.createElement('a-box');
        bootL.setAttribute('position', '-0.38 0.2 -0.55');
        bootL.setAttribute('width', '0.1');
        bootL.setAttribute('height', '0.1');
        bootL.setAttribute('depth', '0.2');
        bootL.setAttribute('color', p.armor);
        this.el.appendChild(bootL);

        let bootR = document.createElement('a-box');
        bootR.setAttribute('position', '-0.12 0.2 -0.55');
        bootR.setAttribute('width', '0.1');
        bootR.setAttribute('height', '0.1');
        bootR.setAttribute('depth', '0.2');
        bootR.setAttribute('color', p.armor);
        this.el.appendChild(bootR);
    },

    update: function (oldData) {
        if (oldData.suitStyle !== this.data.suitStyle) {
            this.buildCharacterMesh();
        }
    },

    tick: function () {
        if (window.isGamePaused) return;

        // Dynamic Driver Lean & Steering Arm Animation
        let carControls = document.querySelector('#player-car')?.components['car-controls'];
        if (carControls) {
            let vrX = carControls.vrAxisX || 0;
            let keys = carControls.keys || {};
            let keyX = (keys['ArrowRight'] || keys['KeyD'] ? 1 : 0) - (keys['ArrowLeft'] || keys['KeyA'] ? 1 : 0);
            let steerVal = Math.abs(vrX) > 0.1 ? vrX : keyX;

            // Head & Helmet tilt on steering turn
            if (this.headGroup) {
                let targetHeadRotZ = -steerVal * 15;
                let curHeadZ = this.headGroup.getAttribute('rotation')?.z || 0;
                this.headGroup.setAttribute('rotation', `0 0 ${curHeadZ + (targetHeadRotZ - curHeadZ) * 0.1}`);
            }

            // Arm rotation to match steering wheel turn
            if (this.leftArm && this.rightArm) {
                let armOffsetZ = steerVal * 12;
                this.leftArm.setAttribute('rotation', `0 0 ${armOffsetZ}`);
                this.rightArm.setAttribute('rotation', `0 0 ${armOffsetZ}`);
            }
        }
    }
});

// =========================================================================
// 8. CAMERA VIEW MODE TOGGLE (1st Person Cockpit vs 3rd Person Character View)
// =========================================================================
AFRAME.registerComponent('camera-view-toggle', {
    init: function () {
        this.is3rdPerson = false;
        this.cameraRig = this.el;

        window.toggleCameraView = () => {
            this.is3rdPerson = !this.is3rdPerson;
            if (this.is3rdPerson) {
                // 3rd Person View (Follow Character & Car)
                this.cameraRig.setAttribute('position', '0 2.4 3.6');
                this.cameraRig.setAttribute('rotation', '-18 0 0');
                let btn = document.querySelector('#btn-view-toggle');
                if (btn) btn.textContent = '🎥 View: 3rd Person';
            } else {
                // 1st Person Driver View
                this.cameraRig.setAttribute('position', '0 1.2 0');
                this.cameraRig.setAttribute('rotation', '0 0 0');
                let btn = document.querySelector('#btn-view-toggle');
                if (btn) btn.textContent = '🎥 View: 1st Person';
            }
        };
    }
});

// =========================================================================
// 9. WEBXR LAUNCH OVERLAY & SESSION MANAGER (Fixes Quest Enter VR Issue)
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
    let overlay = document.querySelector('#vr-launch-overlay');
    let btnEnterVR = document.querySelector('#btn-enter-vr');
    let btnPlayDesktop = document.querySelector('#btn-play-desktop');
    let sceneEl = document.querySelector('a-scene');

    // Suit Selector Buttons
    let suitBtns = document.querySelectorAll('.char-btn');
    suitBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            suitBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            let style = btn.getAttribute('data-style');
            let driverChar = document.querySelector('[driver-character]');
            if (driverChar) {
                driverChar.setAttribute('driver-character', `suitStyle: ${style}`);
            }
        });
    });

    // Enter WebXR Immersive VR Session
    if (btnEnterVR) {
        btnEnterVR.addEventListener('click', () => {
            if (overlay) overlay.style.display = 'none';

            if (sceneEl) {
                if (sceneEl.hasLoaded) {
                    sceneEl.enterVR();
                } else {
                    sceneEl.addEventListener('loaded', () => sceneEl.enterVR());
                }
            }
        });
    }

    // Play 2D Standalone / Desktop Mode
    if (btnPlayDesktop) {
        btnPlayDesktop.addEventListener('click', () => {
            if (overlay) overlay.style.display = 'none';
        });
    }

    // Automatically hide overlay if already inside VR mode
    if (sceneEl) {
        sceneEl.addEventListener('enter-vr', () => {
            if (overlay) overlay.style.display = 'none';
        });

        // Error handling for VR Session failures
        sceneEl.addEventListener('sessionend', () => {
            console.log('WebXR session ended');
        });
    }
});

