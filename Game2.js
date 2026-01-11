// Ice Lasso — mobile-friendly, dynamic cup and ice spawn
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth * 0.95,
    height: window.innerHeight * 0.95,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 350 }, debug: false }
    },
    scene: { preload, create, update },
    parent: 'body'
};

const game = new Phaser.Game(config);

let iceCubes;
let cupBars = [];
let grabbed = null;
let score = 0;
let scoreText;
let lassoLine;

// Dynamic variables
let cupWidth;
let cupHeight;
let cupX;
let cupY;

function preload() {
    this.load.image('ice', 'https://labs.phaser.io/assets/sprites/ice.png');
    this.load.image('cup_bar', 'https://labs.phaser.io/assets/sprites/block.png');
}

function create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Dynamic cup
    cupWidth = Math.round(width * 0.25);
    cupHeight = Math.round(height * 0.08);
    cupX = width / 2 - cupWidth / 2;
    cupY = height - cupHeight - 50;

    // Background color
    this.cameras.main.setBackgroundColor('#5dade2');

    // Ice cubes group
    iceCubes = this.physics.add.group();

    // Spawn ice dynamically
    this.time.addEvent({
        delay: 700,
        callback: () => {
            const ice = iceCubes.create(
                Phaser.Math.Between(50, width - 50),
                -20,
                'ice'
            );
            ice.setScale(0.5);
            ice.setTint(0x99ffff);
            ice.setBounce(0.5);
            ice.setCollideWorldBounds(true);
            ice.melt = 100;
        },
        loop: true
    });

    // Create cup bars dynamically
    cupBars = [];

    // Horizontal bars
    const horizontalBarCount = 3;
    const horizontalSpacing = cupHeight / 3;
    for (let i = 0; i < horizontalBarCount; i++) {
        const bar = this.physics.add.staticImage(cupX + cupWidth / 2, cupY + i * horizontalSpacing, 'cup_bar');
        bar.setScale(cupWidth / 50, 0.2).refreshBody();
        bar.setTint(0xaaaaaa);
        cupBars.push(bar);
    }

    // Vertical bars (sides)
    for (let i = 0; i < 2; i++) {
        const bar = this.physics.add.staticImage(
            cupX + i * cupWidth,
            cupY + cupHeight / 2,
            'cup_bar'
        );
        bar.setScale(0.08, cupHeight / 20).refreshBody();
        bar.setTint(0xaaaaaa);
        cupBars.push(bar);
    }

    // Score counter
    scoreText = this.add.text(10, 10, 'Score: 0', {
        font: `${Math.round(width / 25)}px Arial`,
        fill: '#fff',
        fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(10);

    // Lasso line
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

        // Draw lasso
        lassoLine.lineStyle(4, 0x00ffff, 1);
        lassoLine.beginPath();
        lassoLine.moveTo(pointer.x, pointer.y);
        lassoLine.lineTo(pointer.x, pointer.y - 20);
        lassoLine.strokePath();
    }

    // Ice melting mechanic
    iceCubes.children.iterate(ice => {
        if (!ice) return;
        const overCup = cupBars.some(bar => Phaser.Geom.Intersects.RectangleToRectangle(ice.getBounds(), bar.getBounds()));
        if (overCup) {
            ice.melt -= 0.5;
            ice.setScale(0.5 * (ice.melt / 100));
            ice.setAlpha(ice.melt / 100);
            if (ice.melt <= 0) {
                ice.destroy();
                score++;
                scoreText.setText('Score: ' + score);
            }
        }
    });
}
