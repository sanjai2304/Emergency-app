const canvas = document.createElement('canvas');
canvas.id = 'glitter-canvas';
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');
let width, height;
let particles = [];

// Style the canvas dynamically to overlay everything
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.pointerEvents = 'none'; // Click through
canvas.style.zIndex = '9999'; // On top
canvas.style.mixBlendMode = 'screen'; // Glowing effect

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        // Random spread
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.size = Math.random() * 2 + 0.5;
        this.life = 1;
        this.decay = Math.random() * 0.02 + 0.015;

        // Glitter Colors: White, Light Blue, Silver
        const colors = [
            '255, 255, 255', // White
            '59, 130, 246',  // Primary Blue
            '99, 102, 241',  // Indigo
            '148, 163, 184'  // Silver
        ];
        this.rgb = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    draw() {
        ctx.beginPath();
        // Glitter sparkle: random opacity flicker
        const flicker = Math.random() > 0.8 ? 0 : 1;
        ctx.fillStyle = `rgba(${this.rgb}, ${this.life * flicker})`;

        // Draw star shape or circle? Circle is faster/smoother for glitter
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Mouse Interaction
let mouseX = 0, mouseY = 0;
let isMoving = false;

window.addEventListener('mousemove', (e) => {
    isMoving = true;
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Create bursts on move
    for (let i = 0; i < 4; i++) {
        particles.push(new Particle(mouseX, mouseY));
    }
});

// Animation Loop
function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        if (particles[i].life <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }
    requestAnimationFrame(animate);
}
animate();
