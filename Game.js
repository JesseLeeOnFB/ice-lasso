const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 300 }, debug: false }
    },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);

let iceCubes;
let cupBars = [];
let lassoLine;
let grabbed = null;
let score = 0;
let scoreText;
let particles;

function preload() {
    // Main assets
    this.load.image('ice', 'https://labs.phaser.io/assets/sprites/ice.png');
    this.load.image('cup_bar', 'https://labs.phaser.io/assets/sprites/block.png');
    this.load.image('lasso', 'https://labs.phaser.io/assets/sprites/blue_ball.png');
    this.load.image('spark', 'https://labs.phaser.io/assets/particles/blue.png'); // sparkle particle
}

function create() {
    // Particle emitter for melting ice
    particles = this.add.particles('spark');

    // Ice cubes group
    iceCubes = this.physics.add.group();

    // Spawn ice cubes
    this.time.addEvent({
        delay: 800,
        callback: () => {
            const ice = iceCubes.create(
                Phaser.Math.Between(150, 650),
                -20,
                'ice'
            );
            ice.setScale(0.5);
            ice.setTint(0x99ffff); // light blue ice
            ice.melt = 100;
            ice.setBounce(0.5);
            ice.setCollideWorldBounds(true);

            // Add small shine sprite
            ice.shine = this.add.sprite(ice.x, ice.y, 'spark').setScale(0.1).setAlpha(0.5).setDepth(1);
        },
        loop: true
    });

    // Cup bars forming cage
    const barCount = 6;
    const barWidth = 50;
    const barHeight = 20;

    // Horizontal bars
    for (let i = 0; i < barCount; i++) {
        let bar = this.physics.add.staticImage(300 + i * barWidth, 500, 'cup_bar');
        bar.setScale(1, 0.3).refreshBody();
        bar.setTint(0xaaaaaa);
        cupBars.push(bar);
    }

    // Vertical sides
    for (let i = 0; i < 2; i++) {
        let bar = this.physics.add.staticImage(300 + i * 5 + i*250, 460, 'cup_bar');
        bar.setScale(0.1, 2).refreshBody();
        bar.setTint(0xaaaaaa);
        cupBars.push(bar);
    }

    // Score text
    scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '24px', fill: '#000' });

    // Lasso graphics
    lassoLine = this.add.graphics();

    // Input for grabbing ice cubes
    this.input.on('pointerdown', pointer => {
        iceCubes.children.iterate(ice => {
            if (!ice) return;
            if (Phaser.Math.Distance.Between(pointer.x, pointer.y, ice.x, ice.y) < 40) {
                grabbed = ice;
                ice.body.allowGravity = false;
            }
        });
    });

    this.input.on('pointerup', () => {
        if (grabbed) {
            grabbed.body.allowGravity = true;
            grabbed = null;
        }
    });

    // Collide ice with cup bars
    cupBars.forEach(bar => {
        this.physics.add.collider(iceCubes, bar);
    });
}

function update() {
    lassoLine.clear();

    if (grabbed) {
        const pointer = this.input.activePointer;
        grabbed.setPosition(pointer.x, pointer.y);

        // Draw lasso line
        lassoLine.lineStyle(4, 0x00ffff, 1);
        lassoLine.beginPath();
        lassoLine.moveTo(pointer.x, pointer.y);
        lassoLine.lineTo(pointer.x, pointer.y - 20);
        lassoLine.strokePath();
    }

    // Melting mechanic & particle effect
    iceCubes.children.iterate(ice => {
        if (!ice) return;

        // Move shine with ice
        if (ice.shine) {
            ice.shine.x = ice.x;
            ice.shine.y = ice.y;
        }

        let overCup = cupBars.some(bar => Phaser.Geom.Intersects.RectangleToRectangle(ice.getBounds(), bar.getBounds()));
        if (overCup) {
            ice.melt -= 0.5;
            ice.setScale(0.5 * (ice.melt / 100));
            ice.setAlpha(ice.melt / 100);
            if (ice.shine) ice.shine.setAlpha(ice.melt / 100);

            // Emit particles while melting
            particles.createEmitter({
                x: ice.x,
                y: ice.y,
                lifespan: 300,
                speed: { min: 10, max: 30 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.05, end: 0 },
                quantity: 1,
                frequency: 50
            });

            if (ice.melt <= 0) {
                if (ice.shine) ice.shine.destroy();
                ice.destroy();
                score++;
                scoreText.setText('Score: ' + score);
            }
        }
    });
}
