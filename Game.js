// Responsive mobile-friendly Ice Lasso
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 300 }, debug: false }
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

function preload() {
    this.load.image('ice', 'https://labs.phaser.io/assets/sprites/ice.png');
    this.load.image('cup_bar', 'https://labs.phaser.io/assets/sprites/block.png');
}

function create() {
    // Ice cubes group
    iceCubes = this.physics.add.group();

    // Spawn multiple ice cubes continuously
    this.time.addEvent({
        delay: 800,
        callback: () => {
            const ice = iceCubes.create(
                Phaser.Math.Between(50, this.scale.width - 50),
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

    // Create cup (3 horizontal bars + 2 vertical bars)
    const cupWidth = 200;
    const cupHeight = 60;
    const cupX = this.scale.width / 2 - cupWidth / 2;
    const cupY = this.scale.height - 100;

    // Horizontal bars
    for (let i = 0; i < 3; i++) {
        let bar = this.physics.add.staticImage(cupX + cupWidth / 2, cupY + i * 20, 'cup_bar');
        bar.setScale(cupWidth / 50, 0.3).refreshBody();
        bar.setTint(0xaaaaaa);
        cupBars.push(bar);
    }

    // Vertical bars (sides)
    for (let i = 0; i < 2; i++) {
        let bar = this.physics.add.staticImage(
            cupX + (i * cupWidth), 
            cupY + cupHeight / 2, 
            'cup_bar'
        );
        bar.setScale(0.1, cupHeight / 20).refreshBody();
        bar.setTint(0xaaaaaa);
        cupBars.push(bar);
    }

    // Score text
    scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '24px', fill: '#000' }).setScrollFactor(0);

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

    // Melting mechanic
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
