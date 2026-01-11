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

function preload() {
    this.load.image('ice', 'https://labs.phaser.io/assets/sprites/ice.png');
    this.load.image('cup_bar', 'https://labs.phaser.io/assets/sprites/block.png');
    this.load.image('lasso', 'https://labs.phaser.io/assets/sprites/blue_ball.png');
}

function create() {
    iceCubes = this.physics.add.group();

    this.time.addEvent({
        delay: 800,
        callback: () => {
            const ice = iceCubes.create(
                Phaser.Math.Between(100, 700),
                -20,
                'ice'
            );
            ice.setScale(0.5);
            ice.melt = 100;
            ice.setBounce(0.5);
            ice.setCollideWorldBounds(true);
        },
        loop: true
    });

    // Cup bars
    const barCount = 6;
    const barWidth = 50;
    for (let i = 0; i < barCount; i++) {
        let bar = this.physics.add.staticImage(300 + i * barWidth, 500, 'cup_bar');
        bar.setScale(1, 0.2).refreshBody();
        cupBars.push(bar);
    }

    scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '24px', fill: '#fff' });

    lassoLine = this.add.graphics();

    // Input for lasso
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

    cupBars.forEach(bar => {
        this.physics.add.collider(iceCubes, bar);
    });
}

function update() {
    lassoLine.clear();

    if (grabbed) {
        const pointer = this.input.activePointer;
        grabbed.setPosition(pointer.x, pointer.y);

        lassoLine.lineStyle(4, 0x00ffff, 1);
        lassoLine.beginPath();
        lassoLine.moveTo(pointer.x, pointer.y);
        lassoLine.lineTo(pointer.x, pointer.y - 20);
        lassoLine.strokePath();
    }

    iceCubes.children.iterate(ice => {
        if (!ice) return;
        let overCup = cupBars.some(bar => Phaser.Geom.Intersects.RectangleToRectangle(ice.getBounds(), bar.getBounds()));
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
