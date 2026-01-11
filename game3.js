const config = {
    type: Phaser.AUTO,
    width: window.innerWidth*0.95,
    height: window.innerHeight*0.95,
    physics:{ default:'arcade', arcade:{ gravity:{y:350}, debug:false }},
    scale:{ mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene:[StartScene, GameScene]
};

const game = new Phaser.Game(config);

// ===== Start Scene =====
class StartScene extends Phaser.Scene {
    constructor(){ super({key:'StartScene'}); }
    preload(){
        this.load.image('ice','assets/ice.png');
        this.load.image('cup_bar','assets/cup_bar.png');
        this.load.audio('bgMusic','assets/bgMusic.mp3');
        this.load.audio('catch','assets/catch.mp3');
    }
    create(){
        const width = this.scale.width, height=this.scale.height;
        this.add.text(width/2,height/2-50,'Ice Lasso',{font:'48px Arial', fill:'#fff', fontStyle:'bold'}).setOrigin(0.5);
        this.add.text(width/2,height/2+20,'Tap to Start',{font:'28px Arial', fill:'#fff'}).setOrigin(0.5);

        this.input.once('pointerdown',()=>{
            this.scene.start('GameScene',{bgMusic:'bgMusic',catchKey:'catch'});
        });
    }
}

// ===== Game Scene =====
class GameScene extends Phaser.Scene {
    constructor(){ super({key:'GameScene'}); }
    init(data){ this.audioKeys = data; }
    create(){
        const width=this.scale.width,height=this.scale.height;

        // background
        this.cameras.main.setBackgroundColor('#5dade2');

        // score
        this.score=0;
        this.scoreText=this.add.text(10,10,'Score: 0',{font:`${Math.round(width/25)}px Arial`,fill:'#fff', fontStyle:'bold'}).setDepth(10);

        // ice group
        this.iceCubes=this.physics.add.group();
        this.time.addEvent({delay:700, callback:()=>{
            const ice=this.iceCubes.create(Phaser.Math.Between(50,width-50),-20,'ice');
            ice.setScale(0.5).setBounce(0.5).setCollideWorldBounds(true);
            ice.melt=100;
        }, loop:true });

        // cup bars
        this.cupBars=[];
        const cupWidth=Math.round(width*0.25), cupHeight=Math.round(height*0.08);
        const cupX=width/2-cupWidth/2, cupY=height-cupHeight-50;
        const horizontalBarCount=3;
        const horizontalSpacing=cupHeight/3;
        for(let i=0;i<horizontalBarCount;i++){
            const bar=this.physics.add.staticImage(cupX+cupWidth/2,cupY+i*horizontalSpacing,'cup_bar');
            bar.setScale(cupWidth/50,0.2).refreshBody().setTint(0xaaaaaa);
            this.cupBars.push(bar);
        }
        for(let i=0;i<2;i++){
            const bar=this.physics.add.staticImage(cupX+i*cupWidth,cupY+cupHeight/2,'cup_bar');
            bar.setScale(0.08,cupHeight/20).refreshBody().setTint(0xaaaaaa);
            this.cupBars.push(bar);
        }

        // lasso
        this.lassoLine=this.add.graphics();
        this.grabbed=null;

        // audio
        this.bgMusic=this.sound.add(this.audioKeys.bgMusic,{volume:0.3,loop:true});
        this.catchSound=this.sound.add(this.audioKeys.catchKey,{volume:0.5});
        this.bgMusic.play(); // first tap triggers this

        // input
        this.input.on('pointerdown',pointer=>{
            this.iceCubes.children.iterate(ice=>{
                if(!ice) return;
                if(Phaser.Math.Distance.Between(pointer.x,pointer.y,ice.x,ice.y)<40){
                    this.grabbed=ice;
                    ice.body.allowGravity=false;
                }
            });
        });
        this.input.on('pointerup',()=>{
            if(this.grabbed){
                this.grabbed.body.allowGravity=true;
                this.grabbed=null;
            }
        });

        // colliders
        this.cupBars.forEach(bar=>this.physics.add.collider(this.iceCubes,bar));
    }

    update(){
        this.lassoLine.clear();
        if(this.grabbed){
            const pointer=this.input.activePointer;
            this.grabbed.setPosition(pointer.x,pointer.y);
            this.lassoLine.lineStyle(4,0x00ffff,1);
            this.lassoLine.beginPath();
            this.lassoLine.moveTo(pointer.x,pointer.y);
            this.lassoLine.lineTo(pointer.x,pointer.y-20);
            this.lassoLine.strokePath();
        }
        // ice melting
        this.iceCubes.children.iterate(ice=>{
            if(!ice) return;
            const overCup=this.cupBars.some(bar=>Phaser.Geom.Intersects.RectangleToRectangle(ice.getBounds(),bar.getBounds()));
            if(overCup){
                ice.melt-=0.5;
                ice.setScale(0.5*(ice.melt/100));
                ice.setAlpha(ice.melt/100);
                if(ice.melt<=0){
                    ice.destroy();
                    this.score++;
                    this.scoreText.setText('Score: '+this.score);
                    this.catchSound.play();
                }
            }
        });
    }
}
