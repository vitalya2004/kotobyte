// === ГЛОБАЛЬНЫЙ МЕНЕДЖЕР ЗВУКА ===
const SoundManager = {
    enabled: true,
    music: null,
    musicKey: null,
    musicVolume: 0.4,
    sfxVolume: 0.6,
    scene: null,

    init(scene) {
        this.scene = scene;
        this.scene.input.once('pointerdown', () => {
            if (this.scene.sound.locked) this.scene.sound.unlock();
            this.retryMusic();
        });
        this.scene.input.keyboard.once('keydown', () => {
            if (this.scene.sound.locked) this.scene.sound.unlock();
            this.retryMusic();
        });
    },

    retryMusic() {
        if (this.musicKey && !this.music && this.enabled) {
            this.playMusic(this.musicKey, this.musicVolume);
        }
    },

    playMusic(key, volume = 0.4) {
        this.stopMusic();
        this.musicKey = key;
        this.musicVolume = volume;
        if (this.enabled && !this.scene.sound.locked) {
            this.music = this.scene.sound.add(key, { volume: volume * this.musicVolume, loop: true });
            this.music.play();
        }
    },

    stopMusic() {
        if (this.music) { this.music.stop(); this.music.destroy(); this.music = null; }
    },

    pauseMusic() { if (this.music) this.music.pause(); },

    resumeMusic() {
        if (this.music && this.enabled && !this.scene.sound.locked) this.music.resume();
    },

    stopAll() {
        if (this.scene && this.scene.sound) this.scene.sound.stopAll();
        this.stopMusic();
    },

    playSound(sound, volume = 0.6) {
        if (this.enabled && sound && !this.scene.sound.locked) {
            sound.stop();
            sound.play({ volume: volume * this.sfxVolume });
        }
    },

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) this.stopAll();
        else if (this.scene && this.musicKey) this.playMusic(this.musicKey, this.musicVolume);
        return this.enabled;
    },

    setMusicVolume(vol) {
        this.musicVolume = vol;
        if (this.music) this.music.setVolume(this.musicVolume * 0.4);
    },

    setSfxVolume(vol) { this.sfxVolume = vol; }
};

// === МЕНЕДЖЕР РЕКОРДОВ И ДОСТИЖЕНИЙ ===
const ScoreManager = {
    getBest() { return parseInt(localStorage.getItem('kotobait_best') || '0'); },
    save(score) {
        const best = this.getBest();
        if (score > best) { localStorage.setItem('kotobait_best', score.toString()); return true; }
        return false;
    },
    hasSeenTutorial() { return localStorage.getItem('kotobait_tutorial_seen') === 'true'; },
    setTutorialSeen() { localStorage.setItem('kotobait_tutorial_seen', 'true'); },

    getAchievements() {
        return JSON.parse(localStorage.getItem('kotobait_achievements') || '[]');
    },

    unlockAchievement(id) {
        const achievements = this.getAchievements();
        if (!achievements.includes(id)) {
            achievements.push(id);
            localStorage.setItem('kotobait_achievements', JSON.stringify(achievements));
            return true;
        }
        return false;
    },

    hasAchievement(id) {
        return this.getAchievements().includes(id);
    }
};

// === ОПРЕДЕЛЕНИЯ ДОСТИЖЕНИЙ ===
const ACHIEVEMENTS = {
    first_blood: { icon: '🪙', name: 'Первые байты', desc: 'Собери 10 монет' },
    combo_master: { icon: '🔥', name: 'Мастер комбо', desc: 'Достигни x5 комбо' },
    survivor: { icon: '⏱️', name: 'Выживший', desc: 'Продержись 5 минут' },
    bomb_defuser: { icon: '💣', name: 'Сапёр', desc: 'Обезвредь 3 бомбы' },
    rich_cat: { icon: '💰', name: 'Богач', desc: 'Набери 1000 очков' },
    speed_demon: { icon: '⚡', name: 'Демон скорости', desc: 'Собери 50 монет за игру' },
    untouchable: { icon: '🛡️', name: 'Неуязвимый', desc: 'Пройди 3 минуты без урона' },
    perfect_game: { icon: '👑', name: 'Идеальная игра', desc: 'Набери 2000 очков' }
};

// === ЦВЕТА КНОПОК ===
const ButtonColors = {
    green: 0x3a7d44, red: 0xa83232, blue: 0x2a5a8a,
    greenHover: 0x4a9e54, redHover: 0xc94c4c, blueHover: 0x3a7aaa
};

// === СОЗДАНИЕ КНОПКИ ===
function createButton(scene, x, y, text, color, onClick, depth = 0) {
    const container = scene.add.container(x, y);
    container.setDepth(depth);

    const btn = scene.add.rectangle(0, 0, 340, 50, color, 0.85);
    btn.setStrokeStyle(2, 0xffffff, 0.4);
    btn.setInteractive({ useHandCursor: true });

    const label = scene.add.text(0, 0, text, {
        fontSize: '22px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 4,
        shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true }
    }).setOrigin(0.5);

    container.add([btn, label]);

    btn.on('pointerover', () => {
        btn.setFillStyle(color === ButtonColors.green ? ButtonColors.greenHover :
            color === ButtonColors.red ? ButtonColors.redHover : ButtonColors.blueHover, 1);
        container.setScale(1.05);
    });
    btn.on('pointerout', () => {
        btn.setFillStyle(color, 0.85);
        container.setScale(1);
    });
    btn.on('pointerdown', onClick);

    return container;
}

// === КНОПКА ЗВУКА ===
function createSoundButton(scene, x, y) {
    const btn = scene.add.circle(x, y, 28, 0x333333, 0.9);
    btn.setStrokeStyle(2, 0x888888, 1);
    btn.setInteractive({ useHandCursor: true });
    btn.setDepth(9999);
    const icon = scene.add.text(x, y, SoundManager.enabled ? '♪' : '✕', {
        fontSize: '26px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(9999);
    btn.on('pointerdown', () => {
        const isEnabled = SoundManager.toggle();
        icon.setText(isEnabled ? '♪' : '✕');
        icon.setColor(isEnabled ? '#ffffff' : '#ff4444');
    });
    btn.on('pointerover', () => { btn.setFillStyle(0x555555, 0.9); btn.setScale(1.1); icon.setScale(1.1); });
    btn.on('pointerout', () => { btn.setFillStyle(0x333333, 0.9); btn.setScale(1); icon.setScale(1); });
    return btn;
}

// === ПЛАВНЫЙ ПЕРЕХОД ===
function fadeTransition(scene, targetScene, data = {}) {
    const fade = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0);
    fade.setDepth(99999);
    scene.tweens.add({
        targets: fade, alpha: 1, duration: 500, ease: 'Power2',
        onComplete: () => { scene.scene.start(targetScene, data); }
    });
}

// === ПОЛЗУНОК ===
function createSlider(scene, x, y, width, value, onChange, color = 0x4488ff) {
    const container = scene.add.container(x, y);
    const bg = scene.add.rectangle(0, 0, width, 12, 0x333333, 1);
    bg.setStrokeStyle(1, 0x666666, 0.5);
    const fillWidth = width * value;
    const fill = scene.add.rectangle(-width / 2, 0, fillWidth, 12, color, 1);
    fill.setOrigin(0, 0.5);
    const handleX = -width / 2 + fillWidth;
    const handle = scene.add.circle(handleX, 0, 14, 0xffffff, 1);
    handle.setStrokeStyle(2, color, 1);
    handle.setInteractive({ useHandCursor: true });
    handle.setDepth(10);
    let isDragging = false;
    handle.on('pointerdown', () => {
        isDragging = true; handle.setScale(1.2);
        scene.input.on('pointermove', onDrag);
        scene.input.on('pointerup', onDragEnd);
    });
    function onDrag(pointer) {
        if (!isDragging) return;
        const localX = pointer.x - x;
        const clampedX = Phaser.Math.Clamp(localX, -width / 2, width / 2);
        handle.x = clampedX; fill.width = clampedX + width / 2;
        onChange((clampedX + width / 2) / width);
    }
    function onDragEnd() {
        isDragging = false; handle.setScale(1);
        scene.input.off('pointermove', onDrag);
        scene.input.off('pointerup', onDragEnd);
    }
    handle.on('pointerover', () => { if (!isDragging) handle.setScale(1.1); });
    handle.on('pointerout', () => { if (!isDragging) handle.setScale(1); });
    container.add([bg, fill, handle]);
    return container;
}

// === УВЕДОМЛЕНИЕ О ДОСТИЖЕНИИ ===
function showAchievementNotification(scene, achievementId) {
    const ach = ACHIEVEMENTS[achievementId];
    if (!ach) return;

    const container = scene.add.container(400, 100);
    container.setDepth(99998);

    const bg = scene.add.rectangle(0, 0, 500, 80, 0x000000, 0.9);
    bg.setStrokeStyle(2, 0xffd700, 1);
    bg.setAlpha(0);

    const icon = scene.add.text(-200, 0, ach.icon, { fontSize: '48px' }).setOrigin(0.5).setAlpha(0);
    const name = scene.add.text(0, -15, ' ДОСТИЖЕНИЕ!', {
        fontSize: '20px', fontFamily: 'Arial', color: '#ffd700', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0);
    const desc = scene.add.text(0, 15, `${ach.name}: ${ach.desc}`, {
        fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
        stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0);

    container.add([bg, icon, name, desc]);

    scene.tweens.add({
        targets: [bg, icon, name, desc],
        alpha: 1,
        duration: 500,
        ease: 'Back.easeOut'
    });

    scene.time.delayedCall(3000, () => {
        scene.tweens.add({
            targets: container,
            y: 50,
            alpha: 0,
            duration: 500,
            onComplete: () => container.destroy()
        });
    });
}

// === СЦЕНА 1: МЕНЮ ===
class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }
    preload() { this.load.audio('music', 'sounds/music.mp3'); }

    create() {
        SoundManager.stopAll();
        SoundManager.init(this);
        this.bgGrid = this.add.graphics();
        this.bgGrid.lineStyle(1, 0x4444aa, 0.15);
        this.gridOffset = 0;
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 1);
        bg.fillRect(0, 0, 800, 600);

        const title = this.add.text(400, 100, 'КотоБайт', {
            fontSize: '72px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold',
            stroke: '#4488ff', strokeThickness: 8,
            shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 10, fill: true }
        }).setOrigin(0.5);
        this.tweens.add({ targets: title, y: 110, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        this.add.text(400, 160, '🏆 Рекорд: ' + ScoreManager.getBest(), {
            fontSize: '24px', fontFamily: 'Arial', color: '#ffd700', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        const descBg = this.add.graphics();
        descBg.fillStyle(0x000000, 0.5);
        descBg.fillRoundedRect(100, 190, 600, 120, 15);
        descBg.lineStyle(2, 0x4488ff, 0.5);
        descBg.strokeRoundedRect(100, 190, 600, 120, 15);

        this.add.text(400, 220, 'Котик Барсик случайно попал в компьютер!', { fontSize: '20px', fontFamily: 'Arial', color: '#88ccff', align: 'center', wordWrap: { width: 560 } }).setOrigin(0.5);
        this.add.text(400, 250, 'Собирай байты, получай бусты, избегай вирусов!', { fontSize: '18px', fontFamily: 'Arial', color: '#88ccff', align: 'center', wordWrap: { width: 560 } }).setOrigin(0.5);
        this.add.text(400, 280, 'У тебя есть 10 минут, чтобы набрать максимум очков!', { fontSize: '16px', fontFamily: 'Arial', color: '#ffaa00', fontStyle: 'italic', align: 'center', wordWrap: { width: 560 } }).setOrigin(0.5);

        const controlBg = this.add.graphics();
        controlBg.fillStyle(0x000000, 0.5);
        controlBg.fillRoundedRect(150, 330, 500, 80, 10);
        this.add.text(400, 350, 'УПРАВЛЕНИЕ:', { fontSize: '20px', fontFamily: 'Arial', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(400, 380, 'Стрелки - движение | Пробел - рывок | Esc - пауза', { fontSize: '16px', fontFamily: 'Arial', color: '#aaaaaa' }).setOrigin(0.5);

        createButton(this, 400, 440, '▶ НАЧАТЬ ПРИКЛЮЧЕНИЕ', ButtonColors.green, () => {
            fadeTransition(this, ScoreManager.hasSeenTutorial() ? 'GameScene' : 'TutorialScene');
        });
        createButton(this, 400, 500, '️ НАСТРОЙКИ', ButtonColors.blue, () => {
            fadeTransition(this, 'SettingsScene');
        });
        createButton(this, 400, 560, '✕ ВЫХОД', ButtonColors.red, () => { window.close(); });
        createSoundButton(this, 740, 540);
        SoundManager.playMusic('music', 0.4);
    }

    update() {
        this.gridOffset = (this.gridOffset + 0.5) % 40;
        this.bgGrid.clear();
        this.bgGrid.lineStyle(1, 0x4444aa, 0.15);
        for (let x = this.gridOffset; x < 800; x += 40) this.bgGrid.lineBetween(x, 0, x, 600);
        for (let y = this.gridOffset; y < 600; y += 40) this.bgGrid.lineBetween(0, y, 800, y);
    }
}

// === СЦЕНА ТУТОРИАЛА ===
class TutorialScene extends Phaser.Scene {
    constructor() { super({ key: 'TutorialScene' }); }
    create() {
        SoundManager.init(this);
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.85);
        overlay.setDepth(100);
        this.slides = [
            { icon: '🎮', title: 'УПРАВЛЕНИЕ', text: 'Используй СТРЕЛКИ для движения котика\nПРОБЕЛ — рывок сквозь призраков', color: '#44ff44' },
            { icon: '🪙', title: 'СОБИРАЙ БАЙТЫ', text: 'Собирай золотые монеты чтобы набрать очки\nУ тебя есть 10 минут!', color: '#ffd700' },
            { icon: '💣', title: 'ОПАСНОСТЬ: БОМБА', text: 'Иногда появляется бомба!\nНайди призрака и коснись его за 8 секунд\nИначе — мгновенный проигрыш!', color: '#ff4444' },
            { icon: '✨', title: 'БУСТЫ И ДЕБАФФЫ', text: '🟢 Ускорение |  Щит | 💎 x2 Очки | 🟠 Магнит\n🔴 Замедление | 🙈 Темнота |  Инверсия', color: '#4488ff' },
            { icon: '🔥', title: 'СИСТЕМА КОМБО', text: 'Собирай монеты подряд для комбо!\nx2, x3, x4... множитель очков!\nНо один промах — и комбо сбрасывается!', color: '#ff8800' },
            { icon: '🏆', title: 'ЦЕЛЬ', text: 'Набери максимум очков за 10 минут!\nОткрывай достижения!\nУдачи, Барсик!', color: '#ff44ff' }
        ];
        this.currentSlide = 0;
        this.slideContainer = this.add.container(400, 300);
        this.slideContainer.setDepth(101);
        this.showSlide(0);
        createButton(this, 400, 500, 'ДАЛЕЕ →', ButtonColors.blue, () => this.nextSlide(), 101);
        createButton(this, 400, 560, 'ПРОПУСТИТЬ', ButtonColors.red, () => this.finishTutorial(), 101);
    }
    showSlide(index) {
        this.slideContainer.removeAll(true);
        const slide = this.slides[index];
        this.slideContainer.add(this.add.text(0, -150, slide.icon, { fontSize: '80px' }).setOrigin(0.5));
        this.slideContainer.add(this.add.text(0, -50, slide.title, {
            fontSize: '48px', fontFamily: 'Arial', color: slide.color, fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 6, shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 10, fill: true }
        }).setOrigin(0.5));
        this.slideContainer.add(this.add.text(0, 50, slide.text, {
            fontSize: '22px', fontFamily: 'Arial', color: '#ffffff', align: 'center', lineSpacing: 10,
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5));
        this.slideContainer.add(this.add.text(0, 150, `${index + 1} / ${this.slides.length}`, { fontSize: '20px', fontFamily: 'Arial', color: '#aaaaaa' }).setOrigin(0.5));
        this.slideContainer.setAlpha(0);
        this.slideContainer.setScale(0.8);
        this.tweens.add({ targets: this.slideContainer, alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
    }
    nextSlide() {
        this.currentSlide++;
        if (this.currentSlide < this.slides.length) this.showSlide(this.currentSlide);
        else this.finishTutorial();
    }
    finishTutorial() {
        ScoreManager.setTutorialSeen();
        fadeTransition(this, 'GameScene');
    }
}

// === СЦЕНА НАСТРОЕК ===
class SettingsScene extends Phaser.Scene {
    constructor() { super({ key: 'SettingsScene' }); }

    create() {
        SoundManager.init(this);
        this.bgGrid = this.add.graphics();
        this.bgGrid.lineStyle(1, 0x4444aa, 0.15);
        this.gridOffset = 0;
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 1);
        bg.fillRect(0, 0, 800, 600);

        this.add.text(400, 80, '⚙️ НАСТРОЙКИ', {
            fontSize: '56px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold',
            stroke: '#4488ff', strokeThickness: 6,
            shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 15, fill: true }
        }).setOrigin(0.5);

        this.add.text(400, 180, ' Громкость музыки', { fontSize: '28px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);
        this.musicSlider = createSlider(this, 400, 230, 400, SoundManager.musicVolume, (value) => {
            SoundManager.setMusicVolume(value);
            this.musicValueText.setText(Math.round(value * 100) + '%');
        }, 0x4488ff);
        this.musicValueText = this.add.text(400, 270, Math.round(SoundManager.musicVolume * 100) + '%', {
            fontSize: '24px', fontFamily: 'Arial', color: '#4488ff', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5);

        this.add.text(400, 330, '🔊 Громкость звуков', { fontSize: '28px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);
        this.sfxSlider = createSlider(this, 400, 380, 400, SoundManager.sfxVolume, (value) => {
            SoundManager.setSfxVolume(value);
            this.sfxValueText.setText(Math.round(value * 100) + '%');
        }, 0x44ff88);
        this.sfxValueText = this.add.text(400, 420, Math.round(SoundManager.sfxVolume * 100) + '%', {
            fontSize: '24px', fontFamily: 'Arial', color: '#44ff88', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5);

        createButton(this, 400, 520, '🏠 НАЗАД', ButtonColors.red, () => {
            fadeTransition(this, 'MenuScene');
        });

        createSoundButton(this, 740, 540);
        SoundManager.playMusic('music', 0.4);
    }

    update() {
        this.gridOffset = (this.gridOffset + 0.5) % 40;
        this.bgGrid.clear();
        this.bgGrid.lineStyle(1, 0x4444aa, 0.15);
        for (let x = this.gridOffset; x < 800; x += 40) this.bgGrid.lineBetween(x, 0, x, 600);
        for (let y = this.gridOffset; y < 600; y += 40) this.bgGrid.lineBetween(0, y, 800, y);
    }
}

// === СЦЕНА 2: ИГРА ===
class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    preload() {
        this.load.image('cat', 'assets/cat.png');
        this.load.image('coin', 'assets/coin.png');
        this.load.image('ghost', 'assets/ghost.png');
        this.load.audio('music', 'sounds/music.mp3');
        this.load.audio('coinSound', 'sounds/coin.wav');
        this.load.audio('hitSound', 'sounds/hit.mp3');
    }

    create() {
        SoundManager.stopAll();
        SoundManager.init(this);
        this.bgGrid = this.add.graphics();
        this.bgGrid.lineStyle(1, 0x4444aa, 0.15);
        this.gridOffset = 0;
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 1);
        bg.fillRect(0, 0, 800, 600);

        this.coinSound = this.sound.add('coinSound', { volume: 0.6 });
        this.hitSound = this.sound.add('hitSound', { volume: 0.6 });

        this.add.text(400, 30, 'КотоБайт', { fontSize: '28px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold', stroke: '#4488ff', strokeThickness: 4 }).setOrigin(0.5);
        this.add.text(400, 55, 'Стрелки - движение | Пробел - рывок | Esc - пауза', { fontSize: '12px', fontFamily: 'Arial', color: '#888888' }).setOrigin(0.5);

        this.score = 0;
        this.scoreText = this.add.text(20, 20, 'Байты: 0', { fontSize: '22px', fontFamily: 'Arial', color: '#ffd700', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 });
        this.lives = 3;
        this.livesText = this.add.text(680, 20, '❤️❤️❤️', { fontSize: '26px', fontFamily: 'Arial', stroke: '#000000', strokeThickness: 2 });
        this.dashIndicator = this.add.text(20, 50, 'РЫВОК: ✓', { fontSize: '18px', fontFamily: 'Arial', color: '#44ff44', fontStyle: 'bold', stroke: '#000000', strokeThickness: 2 });

        // === КОМБО СИСТЕМА ===
        this.combo = 0;
        this.comboMultiplier = 1;
        this.comboTimer = 0;
        this.comboMaxTime = 3000;
        this.comboText = this.add.text(700, 80, '', {
            fontSize: '28px', fontFamily: 'Arial', color: '#ff8800', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4,
            shadow: { offsetX: 2, offsetY: 2, color: '#ff4400', blur: 8, fill: true }
        }).setOrigin(0.5);
        this.comboText.setVisible(false);

        this.timeLeft = 600;
        this.timeText = this.add.text(20, 80, '⏱ 10:00', { fontSize: '20px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold', backgroundColor: '#333333', padding: { x: 10, y: 5 } });
        this.timerInterval = this.time.addEvent({ delay: 1000, callback: this.updateTimer, callbackScope: this, loop: true });
        this.effectsText = this.add.text(400, 80, '', { fontSize: '16px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold', align: 'center', stroke: '#000000', strokeThickness: 2 }).setOrigin(0.5);

        // === ПРОГРЕССИВНАЯ СЛОЖНОСТЬ ===
        this.difficultyLevel = 1;
        this.ghostsKilled = 0;
        this.coinsCollected = 0;
        this.bombsDefused = 0;
        this.timeWithoutDamage = 0;
        this.maxComboReached = 0;

        this.cat = this.physics.add.sprite(400, 400, 'cat');
        this.cat.setScale(0.1);
        this.catBobTween = this.tweens.add({ targets: this.cat, scaleX: { from: 0.1, to: 0.11 }, scaleY: { from: 0.1, to: 0.09 }, duration: 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', paused: true });

        this.coins = this.physics.add.group();
        this.powerups = this.physics.add.group();
        for (let i = 0; i < 5; i++) this.spawnCoin();

        this.ghosts = this.physics.add.group();
        for (let i = 0; i < 3; i++) this.spawnGhost();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        this.baseSpeed = 4;
        this.speed = this.baseSpeed;
        this.invulnerable = false;
        this.blinkEvent = null;
        this.effects = { speed: 0, shield: 0, doubleScore: 0, magnet: 0, slow: 0, darkness: 0, invert: 0 };

        this.coinSpawnTimer = this.time.addEvent({ delay: 2000, callback: () => this.spawnCoin(), loop: true });
        this.powerupSpawnTimer = this.time.addEvent({ delay: 8000, callback: () => this.spawnPowerup(), loop: true });
        this.difficultyTimer = this.time.addEvent({ delay: 120000, callback: () => this.increaseDifficulty(), loop: true });

        this.isDashing = false;
        this.dashCooldown = 0;
        this.dashCooldownMax = 6000;
        this.lastDirection = { x: 1, y: 0 };

        const dashGraphics = this.add.graphics();
        dashGraphics.fillStyle(0x44aaff, 1);
        dashGraphics.fillCircle(8, 8, 8);
        dashGraphics.generateTexture('dashParticle', 16, 16);
        dashGraphics.destroy();
        this.dashTrail = this.add.particles(0, 0, 'dashParticle', { speed: { min: 5, max: 15 }, scale: { start: 2.5, end: 0.5 }, alpha: { start: 0.9, end: 0 }, blendMode: 'ADD', lifespan: 800, gravityY: 0, emitting: false, frequency: 15, rotate: { start: 0, end: 360 }, tint: [0x44aaff, 0x66ccff, 0x88ddff] });

        const sparkGraphics = this.add.graphics();
        sparkGraphics.fillStyle(0xffffff, 1);
        sparkGraphics.fillCircle(4, 4, 4);
        sparkGraphics.generateTexture('sparkTrail', 8, 8);
        sparkGraphics.destroy();
        this.dashSparks = this.add.particles(0, 0, 'sparkTrail', { speed: { min: 20, max: 50 }, scale: { start: 1, end: 0 }, alpha: { start: 1, end: 0 }, blendMode: 'ADD', lifespan: 500, gravityY: 0, emitting: false, frequency: 25, tint: 0xaaddff });

        this.hasBomb = false;
        this.bombTimer = null;
        this.bombTimeLeft = 0;
        this.bombText = null;
        this.bombSpawnTimer = this.time.delayedCall(Phaser.Math.Between(25000, 35000), () => { this.spawnBomb(); });
        this.bomb = this.add.text(0, 0, '💣', { fontSize: '32px' }).setOrigin(0.5).setVisible(false);
        this.ghostArrow = this.add.text(0, 0, '', { fontSize: '24px', color: '#ff4444', fontFamily: 'Arial' }).setOrigin(0.5).setVisible(false).setDepth(100);

        const coinSparkGraphics = this.add.graphics();
        coinSparkGraphics.fillStyle(0xffd700, 1);
        coinSparkGraphics.fillCircle(4, 4, 4);
        coinSparkGraphics.generateTexture('sparkParticle', 8, 8);
        coinSparkGraphics.destroy();
        this.coinParticles = this.add.particles(0, 0, 'sparkParticle', { speed: { min: 80, max: 150 }, scale: { start: 1.5, end: 0 }, alpha: { start: 1, end: 0 }, blendMode: 'ADD', lifespan: 600, gravityY: 0, emitting: false });

        this.darknessGraphics = this.add.graphics();
        this.darknessGraphics.setVisible(false);

        this.physics.add.overlap(this.cat, this.coins, this.collectCoin, null, this);
        this.physics.add.overlap(this.cat, this.powerups, this.collectPowerup, null, this);
        this.physics.add.overlap(this.cat, this.ghosts, this.handleGhostCollision, null, this);

        createSoundButton(this, 740, 540);
        SoundManager.playMusic('music', 0.4);
    }

    spawnGhost() {
        let x = Phaser.Math.Between(50, 750), y = Phaser.Math.Between(150, 550);
        let ghost = this.ghosts.create(x, y, 'ghost');
        ghost.setScale(0.4);
        const speed = 100 + (this.difficultyLevel - 1) * 20;
        ghost.setVelocity(Phaser.Math.Between(-speed, speed), Phaser.Math.Between(-speed, speed));
        ghost.setBounce(1);
        ghost.setCollideWorldBounds(true);
        this.tweens.add({ targets: ghost, alpha: { from: 1, to: 0.5 }, scaleX: { from: 0.4, to: 0.45 }, scaleY: { from: 0.4, to: 0.35 }, duration: 800 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Math.random() * 500 });
    }

    increaseDifficulty() {
        this.difficultyLevel++;
        if (this.ghosts.countActive() < 6) {
            this.spawnGhost();
        }
        this.ghosts.children.iterate((ghost) => {
            if (ghost) {
                const currentVel = ghost.body.velocity;
                const speed = 100 + (this.difficultyLevel - 1) * 20;
                const angle = Math.atan2(currentVel.y, currentVel.x);
                ghost.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
            }
        });

        if (this.bombSpawnTimer) this.bombSpawnTimer.remove();
        const minTime = Math.max(15000, 25000 - (this.difficultyLevel - 1) * 2000);
        const maxTime = Math.max(20000, 35000 - (this.difficultyLevel - 1) * 2000);
        this.bombSpawnTimer = this.time.delayedCall(Phaser.Math.Between(minTime, maxTime), () => { this.spawnBomb(); });

        const diffText = this.add.text(400, 200, `⚠️ УРОВЕНЬ ${this.difficultyLevel}!`, {
            fontSize: '48px', fontFamily: 'Arial', color: '#ff4444', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 6,
            shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 10, fill: true }
        }).setOrigin(0.5).setDepth(9999);

        this.tweens.add({
            targets: diffText,
            alpha: 0,
            y: 150,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => diffText.destroy()
        });
    }

    update() {
        this.gridOffset = (this.gridOffset + 0.3) % 40;
        this.bgGrid.clear();
        this.bgGrid.lineStyle(1, 0x4444aa, 0.15);
        for (let x = this.gridOffset; x < 800; x += 40) this.bgGrid.lineBetween(x, 0, x, 600);
        for (let y = this.gridOffset; y < 600; y += 40) this.bgGrid.lineBetween(0, y, 800, y);

        if (Phaser.Input.Keyboard.JustDown(this.escKey) || Phaser.Input.Keyboard.JustDown(this.pKey)) {
            this.togglePause();
            return;
        }

        this.updateEffects();

        if (this.combo > 0) {
            this.comboTimer -= 16;
            if (this.comboTimer <= 0) {
                this.resetCombo();
            }
        }

        if (!this.invulnerable) {
            this.timeWithoutDamage += 16;
        }

        let dx = 0, dy = 0;
        if (this.cursors.left.isDown) dx = -this.speed;
        if (this.cursors.right.isDown) dx = this.speed;
        if (this.cursors.up.isDown) dy = -this.speed;
        if (this.cursors.down.isDown) dy = this.speed;

        if (this.effects.invert > 0) { dx = -dx; dy = -dy; }
        if (dx !== 0) this.cat.flipX = dx < 0;

        if ((dx !== 0 || dy !== 0) && !this.isDashing) {
            if (this.catBobTween.paused) this.catBobTween.resume();
            this.lastDirection = { x: dx, y: dy };
        } else {
            if (!this.catBobTween.paused) this.catBobTween.pause();
            this.cat.setScale(0.1);
        }

        if (this.spaceKey.isDown && this.dashCooldown <= 0 && !this.isDashing) this.performDash();

        if (this.dashCooldown > 0) {
            this.dashCooldown -= 16;
            this.dashIndicator.setText('РЫВОК: ' + Math.ceil(this.dashCooldown / 1000) + 'с');
            this.dashIndicator.setColor('#ff6666');
        } else {
            this.dashIndicator.setText('РЫВОК: ✓');
            this.dashIndicator.setColor('#44ff44');
        }

        if (!this.isDashing) { this.cat.x += dx; this.cat.y += dy; }
        this.cat.x = Phaser.Math.Clamp(this.cat.x, 30, 770);
        this.cat.y = Phaser.Math.Clamp(this.cat.y, 30, 570);

        if (this.isDashing) { this.dashTrail.startFollow(this.cat); this.dashSparks.startFollow(this.cat); }

        if (this.effects.magnet > 0) {
            this.coins.children.iterate((coin) => {
                if (coin) {
                    const dist = Phaser.Math.Distance.Between(this.cat.x, this.cat.y, coin.x, coin.y);
                    if (dist < 150) {
                        const angle = Phaser.Math.Angle.Between(coin.x, coin.y, this.cat.x, this.cat.y);
                        coin.x += Math.cos(angle) * 3;
                        coin.y += Math.sin(angle) * 3;
                    }
                }
            });
        }

        if (this.hasBomb) {
            let nearestGhost = null, nearestDist = Infinity;
            this.ghosts.children.iterate((ghost) => {
                if (ghost) {
                    const dist = Phaser.Math.Distance.Between(this.cat.x, this.cat.y, ghost.x, ghost.y);
                    if (dist < nearestDist) { nearestDist = dist; nearestGhost = ghost; }
                }
            });
            if (nearestGhost) {
                const angle = Phaser.Math.Angle.Between(this.cat.x, this.cat.y, nearestGhost.x, nearestGhost.y);
                const arrowDist = 60;
                this.ghostArrow.x = this.cat.x + Math.cos(angle) * arrowDist;
                this.ghostArrow.y = this.cat.y + Math.sin(angle) * arrowDist;
                this.ghostArrow.setRotation(angle);
                this.ghostArrow.setVisible(true);
                this.ghostArrow.setAlpha(0.5 + Math.sin(this.time.now / 100) * 0.5);
            }
        } else {
            this.ghostArrow.setVisible(false);
        }

        if (this.effects.darkness > 0) {
            this.darknessGraphics.setVisible(true);
            this.darknessGraphics.clear();
            this.darknessGraphics.fillStyle(0x000000, 0.85);
            const radius = 120, x = this.cat.x, y = this.cat.y;
            this.darknessGraphics.fillRect(0, 0, 800, y - radius);
            this.darknessGraphics.fillRect(0, y + radius, 800, 600 - (y + radius));
            this.darknessGraphics.fillRect(0, y - radius, x - radius, radius * 2);
            this.darknessGraphics.fillRect(x + radius, y - radius, 800 - (x + radius), radius * 2);
        } else {
            this.darknessGraphics.setVisible(false);
        }

        if (this.hasBomb) { this.bomb.x = this.cat.x; this.bomb.y = this.cat.y - 30; }
    }

    updateTimer() {
        this.timeLeft--;
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timeText.setText('⏱ ' + `${minutes}:${seconds.toString().padStart(2, '0')}`);
        if (this.timeLeft <= 60) this.timeText.setColor('#ff4444');
        else if (this.timeLeft <= 120) this.timeText.setColor('#ffaa00');
        if (this.timeLeft <= 0) this.timeUp();
    }

    timeUp() {
        this.timerInterval.remove();
        SoundManager.stopAll();
        fadeTransition(this, 'TimeUpScene', { score: this.score });
    }

    updateEffects() {
        let activeList = [];
        for (let key in this.effects) {
            if (this.effects[key] > 0) {
                this.effects[key] -= 16;
                const seconds = Math.ceil(this.effects[key] / 1000);
                const names = { speed: '⚡Ускорение', shield: '🛡️Щит', doubleScore: '💎x2 Очки', magnet: 'Магнит', slow: '🐌Замедление', darkness: '🙈Темнота', invert: '🔄Инверсия' };
                activeList.push(`${names[key]}: ${seconds}с`);
            }
        }
        this.effectsText.setText(activeList.join(' | '));
        if (this.effects.slow > 0) this.speed = this.baseSpeed * 0.5;
        else if (this.effects.speed > 0) this.speed = this.baseSpeed * 2;
        else this.speed = this.baseSpeed;
    }

    spawnCoin() {
        if (this.coins.countActive() < 15) {
            let x = Phaser.Math.Between(50, 750), y = Phaser.Math.Between(100, 550);
            let coin = this.coins.create(x, y, 'coin');
            coin.setScale(0.3);
            this.tweens.add({ targets: coin, y: coin.y - 8, duration: 800 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Math.random() * 800 });
        }
    }

    spawnPowerup() {
        if (this.powerups.countActive() < 3) {
            let x = Phaser.Math.Between(50, 750), y = Phaser.Math.Between(100, 550);
            const types = [
                { type: 'speed', icon: '⚡', color: 0x00ff00 }, { type: 'shield', icon: '🛡️', color: 0x0088ff },
                { type: 'doubleScore', icon: '💎', color: 0xff00ff }, { type: 'magnet', icon: '', color: 0xff8800 },
                { type: 'slow', icon: '🐌', color: 0xff4444 }, { type: 'darkness', icon: '🙈', color: 0x444444 },
                { type: 'invert', icon: '🔄', color: 0xff0088 }
            ];
            const powerup = types[Phaser.Math.Between(0, types.length - 1)];
            const item = this.powerups.create(x, y, 'coin');
            item.setScale(0.3);
            item.setTint(powerup.color);
            item.powerupType = powerup.type;
            item.powerupIcon = powerup.icon;
            this.tweens.add({ targets: item, angle: 360, duration: 3000, repeat: -1, ease: 'Linear' });
            this.tweens.add({ targets: item, scaleX: { from: 0.3, to: 0.38 }, scaleY: { from: 0.3, to: 0.38 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
    }

    collectPowerup(cat, powerup) {
        this.effects[powerup.powerupType] = 5000;
        powerup.destroy();
        this.cameras.main.flash(200, 255, 255, 255);
    }

    togglePause() {
        if (this.scene.isActive('PauseScene')) {
            this.scene.stop('PauseScene');
        }
        this.scene.launch('PauseScene', { fromScene: 'GameScene' });
        this.scene.pause();
        SoundManager.pauseMusic();
    }

    resumeGame() {
        this.scene.resume();
        SoundManager.resumeMusic();
    }

    performDash() {
        this.isDashing = true;
        this.invulnerable = true;
        this.dashCooldown = this.dashCooldownMax;
        const dirX = this.lastDirection.x, dirY = this.lastDirection.y;
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        const normalizedX = dirX / length, normalizedY = dirY / length;
        const dashDistance = 150;
        const targetX = Phaser.Math.Clamp(this.cat.x + normalizedX * dashDistance, 30, 770);
        const targetY = Phaser.Math.Clamp(this.cat.y + normalizedY * dashDistance, 30, 570);

        this.dashTrail.startFollow(this.cat); this.dashTrail.start();
        this.dashSparks.startFollow(this.cat); this.dashSparks.start();

        this.tweens.add({
            targets: this.cat, x: targetX, y: targetY, duration: 200, ease: 'Power2',
            onComplete: () => { this.isDashing = false; this.dashTrail.stop(); this.dashSparks.stop(); }
        });
        this.time.delayedCall(400, () => { this.invulnerable = false; });
    }

    spawnBomb() {
        this.hasBomb = true;
        this.bomb.setVisible(true);
        this.bombTimeLeft = 8000;
        this.bombText = this.add.text(400, 120, '💣 8.0', { fontSize: '36px', fontFamily: 'Arial', color: '#ff0000', fontStyle: 'bold', backgroundColor: '#000000', padding: { x: 12, y: 6 } }).setOrigin(0.5);
        this.bombTimer = this.time.addEvent({
            delay: 100, callback: () => {
                this.bombTimeLeft -= 100;
                this.bombText.setText('💣 ' + (this.bombTimeLeft / 1000).toFixed(1));
                if (this.bombTimeLeft <= 2000) this.bombText.setAlpha(0.5 + Math.sin(this.time.now / 50) * 0.5);
                if (this.bombTimeLeft <= 0) this.bombExplodes();
            }, loop: true
        });
    }

    bombExplodes() {
        this.hasBomb = false;
        this.bomb.setVisible(false);
        if (this.bombText) this.bombText.destroy();
        if (this.bombTimer) this.bombTimer.remove();
        SoundManager.stopAll();
        fadeTransition(this, 'GameOverScene', { score: this.score, reason: 'bomb' });
    }

    handleGhostCollision(cat, ghost) {
        if (this.hasBomb) {
            this.defuseBomb();
            return;
        }
        if (this.effects.shield > 0) return;
        this.takeDamage(cat, ghost);
    }

    takeDamage(cat, ghost) {
        if (this.invulnerable) return;
        this.lives--;
        this.updateLives();
        SoundManager.playSound(this.hitSound, 0.6);
        this.invulnerable = true;
        cat.setTint(0xff0000);
        cat.x += cat.x > ghost.x ? 50 : -50;
        cat.y += cat.y > ghost.y ? 50 : -50;
        this.resetCombo();
        this.timeWithoutDamage = 0;
        this.blinkEvent = this.time.addEvent({ delay: 100, callback: () => cat.setVisible(!cat.visible), loop: true });
        this.time.delayedCall(1000, () => {
            this.invulnerable = false;
            cat.clearTint();
            cat.setVisible(true);
            if (this.blinkEvent) this.blinkEvent.remove();
        });
        if (this.lives <= 0) {
            SoundManager.stopAll();
            fadeTransition(this, 'GameOverScene', { score: this.score, reason: 'lives' });
        }
    }

    defuseBomb() {
        this.hasBomb = false;
        this.bomb.setVisible(false);
        if (this.bombText) this.bombText.destroy();
        if (this.bombTimer) this.bombTimer.remove();
        this.invulnerable = true;
        this.cat.setTint(0x00ff00);
        this.bombsDefused++;
        let nearestGhost = null, nearestDist = Infinity;
        this.ghosts.children.iterate((ghost) => {
            if (ghost) {
                const dist = Phaser.Math.Distance.Between(this.cat.x, this.cat.y, ghost.x, ghost.y);
                if (dist < nearestDist) { nearestDist = dist; nearestGhost = ghost; }
            }
        });
        if (nearestGhost) {
            this.cat.x += this.cat.x > nearestGhost.x ? 80 : -80;
            this.cat.y += this.cat.y > nearestGhost.y ? 80 : -50;
        }
        this.blinkEvent = this.time.addEvent({ delay: 100, callback: () => this.cat.setVisible(!this.cat.visible), loop: true });
        this.time.delayedCall(1500, () => {
            this.invulnerable = false;
            this.cat.clearTint();
            this.cat.setVisible(true);
            if (this.blinkEvent) this.blinkEvent.remove();
        });
        this.cameras.main.shake(200, 0.01);
        this.cameras.main.flash(300, 0, 255, 0);

        const minTime = Math.max(15000, 25000 - (this.difficultyLevel - 1) * 2000);
        const maxTime = Math.max(20000, 35000 - (this.difficultyLevel - 1) * 2000);
        this.bombSpawnTimer = this.time.delayedCall(Phaser.Math.Between(minTime, maxTime), () => { this.spawnBomb(); });

        if (this.bombsDefused >= 3 && ScoreManager.unlockAchievement('bomb_defuser')) {
            showAchievementNotification(this, 'bomb_defuser');
        }
    }

    collectCoin(cat, coin) {
        this.coinParticles.emitParticleAt(coin.x, coin.y, 20);
        coin.destroy();

        this.combo++;
        this.comboTimer = this.comboMaxTime;
        this.comboMultiplier = Math.min(1 + Math.floor(this.combo / 5), 5);
        this.coinsCollected++;

        if (this.combo > this.maxComboReached) {
            this.maxComboReached = this.combo;
        }

        this.comboText.setText(`x${this.comboMultiplier} КОМБО: ${this.combo}`);
        this.comboText.setVisible(true);
        this.comboText.setScale(1.3);
        this.tweens.add({
            targets: this.comboText,
            scale: 1,
            duration: 200,
            ease: 'Back.easeOut'
        });

        const comboColors = ['#ffffff', '#44ff44', '#4488ff', '#ff8800', '#ff44ff'];
        this.comboText.setColor(comboColors[this.comboMultiplier - 1]);

        let points = 10 * this.comboMultiplier;
        if (this.effects.doubleScore > 0) points *= 2;

        this.score += points;
        this.scoreText.setText('Байты: ' + this.score);
        SoundManager.playSound(this.coinSound, 0.6);

        if (this.combo % 5 === 0) {
            SoundManager.playSound(this.coinSound, 1.0);
        }

        if (this.coinsCollected >= 10 && ScoreManager.unlockAchievement('first_blood')) {
            showAchievementNotification(this, 'first_blood');
        }
        if (this.coinsCollected >= 50 && ScoreManager.unlockAchievement('speed_demon')) {
            showAchievementNotification(this, 'speed_demon');
        }
        if (this.maxComboReached >= 5 && ScoreManager.unlockAchievement('combo_master')) {
            showAchievementNotification(this, 'combo_master');
        }
        if (this.score >= 1000 && ScoreManager.unlockAchievement('rich_cat')) {
            showAchievementNotification(this, 'rich_cat');
        }
        if (this.score >= 2000 && ScoreManager.unlockAchievement('perfect_game')) {
            showAchievementNotification(this, 'perfect_game');
        }
    }

    resetCombo() {
        if (this.combo > 0) {
            this.combo = 0;
            this.comboMultiplier = 1;
            this.comboText.setVisible(false);
        }
    }

    updateLives() {
        let hearts = '';
        for (let i = 0; i < this.lives; i++) hearts += '❤️';
        this.livesText.setText(hearts);
    }
}

// === СЦЕНА ПАУЗЫ ===
class PauseScene extends Phaser.Scene {
    constructor() { super({ key: 'PauseScene' }); }

    create(data) {
        this.fromScene = data.fromScene || 'GameScene';

        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
        overlay.setDepth(9000);

        this.pauseTitle = this.add.text(400, 200, '⏸ ПАУЗА', {
            fontSize: '80px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold',
            stroke: '#4488ff', strokeThickness: 6,
            shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 15, fill: true }
        }).setOrigin(0.5).setDepth(9001);

        this.pauseSubtitle = this.add.text(400, 270, 'Игра заморожена', {
            fontSize: '22px', fontFamily: 'Arial', color: '#aaaaaa', fontStyle: 'italic'
        }).setOrigin(0.5).setDepth(9001);

        this.continueBtn = createButton(this, 400, 360, '▶ ПРОДОЛЖИТЬ', ButtonColors.green, () => {
            const gameScene = this.scene.get(this.fromScene);
            if (gameScene) gameScene.resumeGame();
            this.scene.stop();
        }, 9001);

        this.settingsBtn = createButton(this, 400, 430, '⚙️ НАСТРОЙКИ', ButtonColors.blue, () => {
            this.showSettings();
        }, 9001);

        this.menuBtn = createButton(this, 400, 500, '🏠 В МЕНЮ', ButtonColors.red, () => {
            const gameScene = this.scene.get(this.fromScene);
            if (gameScene) gameScene.scene.stop();
            this.scene.stop();
            this.scene.start('MenuScene');
        }, 9001);

        this.settingsBg = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.95);
        this.settingsBg.setDepth(9002);
        this.settingsBg.setVisible(false);

        this.settingsTitle = this.add.text(400, 80, '⚙️ НАСТРОЙКИ', {
            fontSize: '56px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold',
            stroke: '#4488ff', strokeThickness: 6,
            shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 15, fill: true }
        }).setOrigin(0.5).setDepth(9002);
        this.settingsTitle.setVisible(false);

        this.musicLabel = this.add.text(400, 180, '🎵 Громкость музыки', {
            fontSize: '28px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(9002);
        this.musicLabel.setVisible(false);

        this.musicSlider = createSlider(this, 400, 230, 400, SoundManager.musicVolume, (value) => {
            SoundManager.setMusicVolume(value);
            this.musicValueText.setText(Math.round(value * 100) + '%');
        }, 0x4488ff);
        this.musicSlider.setDepth(9002);
        this.musicSlider.setVisible(false);

        this.musicValueText = this.add.text(400, 270, Math.round(SoundManager.musicVolume * 100) + '%', {
            fontSize: '24px', fontFamily: 'Arial', color: '#4488ff', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(9002);
        this.musicValueText.setVisible(false);

        this.sfxLabel = this.add.text(400, 330, ' Громкость звуков', {
            fontSize: '28px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(9002);
        this.sfxLabel.setVisible(false);

        this.sfxSlider = createSlider(this, 400, 380, 400, SoundManager.sfxVolume, (value) => {
            SoundManager.setSfxVolume(value);
            this.sfxValueText.setText(Math.round(value * 100) + '%');
        }, 0x44ff88);
        this.sfxSlider.setDepth(9002);
        this.sfxSlider.setVisible(false);

        this.sfxValueText = this.add.text(400, 420, Math.round(SoundManager.sfxVolume * 100) + '%', {
            fontSize: '24px', fontFamily: 'Arial', color: '#44ff88', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(9002);
        this.sfxValueText.setVisible(false);

        this.backBtn = createButton(this, 400, 520, '◀ НАЗАД', ButtonColors.red, () => {
            this.hideSettings();
        }, 9003);
        this.backBtn.setVisible(false);

        createSoundButton(this, 740, 540);

        this.input.keyboard.on('keydown-ESC', () => {
            if (this.settingsBg.visible) {
                this.hideSettings();
            } else {
                const gameScene = this.scene.get(this.fromScene);
                if (gameScene) gameScene.resumeGame();
                this.scene.stop();
            }
        });
    }

    showSettings() {
        this.pauseTitle.setVisible(false);
        this.pauseSubtitle.setVisible(false);
        this.continueBtn.setVisible(false);
        this.settingsBtn.setVisible(false);
        this.menuBtn.setVisible(false);

        this.settingsBg.setVisible(true);
        this.settingsTitle.setVisible(true);
        this.musicLabel.setVisible(true);
        this.musicSlider.setVisible(true);
        this.musicValueText.setVisible(true);
        this.sfxLabel.setVisible(true);
        this.sfxSlider.setVisible(true);
        this.sfxValueText.setVisible(true);
        this.backBtn.setVisible(true);
    }

    hideSettings() {
        this.pauseTitle.setVisible(true);
        this.pauseSubtitle.setVisible(true);
        this.continueBtn.setVisible(true);
        this.settingsBtn.setVisible(true);
        this.menuBtn.setVisible(true);

        this.settingsBg.setVisible(false);
        this.settingsTitle.setVisible(false);
        this.musicLabel.setVisible(false);
        this.musicSlider.setVisible(false);
        this.musicValueText.setVisible(false);
        this.sfxLabel.setVisible(false);
        this.sfxSlider.setVisible(false);
        this.sfxValueText.setVisible(false);
        this.backBtn.setVisible(false);
    }
}

// === СЦЕНА 4: ВРЕМЯ ВЫШЛО ===
class TimeUpScene extends Phaser.Scene {
    constructor() { super({ key: 'TimeUpScene' }); }
    preload() { this.load.audio('music', 'sounds/music.mp3'); }

    create(data) {
        SoundManager.stopAll();
        SoundManager.init(this);
        const score = data && data.score ? data.score : 0;
        const isNewRecord = ScoreManager.save(score);

        const confettiGraphics = this.add.graphics();
        confettiGraphics.fillStyle(0xffffff, 1);
        confettiGraphics.fillRect(0, 0, 8, 8);
        confettiGraphics.generateTexture('confetti', 8, 8);
        confettiGraphics.destroy();

        this.confettiEmitter = this.add.particles(0, 0, 'confetti', {
            x: { min: 0, max: 800 }, y: -10, speedY: { min: 100, max: 300 }, speedX: { min: -50, max: 50 },
            scale: { start: 1, end: 0.5 }, rotation: { start: 0, end: 360 }, alpha: { start: 1, end: 0.8 },
            lifespan: 4000, gravityY: 200,
            tint: [0xffd700, 0xff44ff, 0x44ff44, 0x4488ff, 0xff4444, 0xffaa00],
            frequency: 50, quantity: 3
        });
        this.time.delayedCall(4000, () => { if (this.confettiEmitter) this.confettiEmitter.stop(); });

        this.add.text(400, 150, '⏱ ВРЕМЯ ВЫШЛО!', { fontSize: '56px', fontFamily: 'Arial', color: '#ffaa00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6, shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 15, fill: true } }).setOrigin(0.5);
        if (isNewRecord) this.add.text(400, 210, '🎉 НОВЫЙ РЕКОРД! 🎉', { fontSize: '32px', fontFamily: 'Arial', color: '#ff44ff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5);
        this.add.text(400, 260, 'Отличная работа! Барсик собрал максимум байтов!', { fontSize: '24px', fontFamily: 'Arial', color: '#ffffff', align: 'center', wordWrap: { width: 600 } }).setOrigin(0.5);
        this.add.text(400, 330, 'Собрано байтов: ' + score, { fontSize: '32px', fontFamily: 'Arial', color: '#ffd700', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5);
        this.add.text(400, 380, 'Лучший результат: ' + ScoreManager.getBest(), { fontSize: '22px', fontFamily: 'Arial', color: '#88ccff', fontStyle: 'bold' }).setOrigin(0.5);

        createButton(this, 400, 460, '🔄 ИГРАТЬ СНОВА', ButtonColors.green, () => { fadeTransition(this, 'GameScene'); });
        createButton(this, 400, 520, '⚙️ НАСТРОЙКИ', ButtonColors.blue, () => { fadeTransition(this, 'SettingsScene'); });
        createButton(this, 400, 580, '🏠 В МЕНЮ', ButtonColors.red, () => { fadeTransition(this, 'MenuScene'); });

        createSoundButton(this, 740, 540);
        SoundManager.playMusic('music', 0.4);
    }
}

// === СЦЕНА 5: ПРОИГРЫШ ===
class GameOverScene extends Phaser.Scene {
    constructor() { super({ key: 'GameOverScene' }); }
    preload() { this.load.audio('music', 'sounds/music.mp3'); }

    create(data) {
        SoundManager.stopAll();
        SoundManager.init(this);
        const score = data && data.score ? data.score : 0;
        const reason = data && data.reason ? data.reason : 'lives';
        const isNewRecord = ScoreManager.save(score);
        const isBombExplosion = reason === 'bomb';

        this.add.text(400, 150, isBombExplosion ? '💥 ВЗРЫВ!' : '💀 GAME OVER', { fontSize: '56px', fontFamily: 'Arial', color: '#ff4444', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6, shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 15, fill: true } }).setOrigin(0.5);
        this.add.text(400, 220, isBombExplosion ? 'Бомба взорвалась!' : 'Вирусы-призраки поймали Барсика!', { fontSize: '24px', fontFamily: 'Arial', color: '#ffffff', align: 'center', wordWrap: { width: 600 } }).setOrigin(0.5);
        if (isNewRecord) this.add.text(400, 280, '🎉 НОВЫЙ РЕКОРД! 🎉', { fontSize: '28px', fontFamily: 'Arial', color: '#ff44ff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5);
        this.add.text(400, 330, 'Собрано байтов: ' + score, { fontSize: '32px', fontFamily: 'Arial', color: '#ffd700', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5);
        this.add.text(400, 380, 'Лучший результат: ' + ScoreManager.getBest(), { fontSize: '22px', fontFamily: 'Arial', color: '#88ccff', fontStyle: 'bold' }).setOrigin(0.5);

        createButton(this, 400, 460, '🔄 ПОПРОБОВАТЬ СНОВА', ButtonColors.green, () => { fadeTransition(this, 'GameScene'); });
        createButton(this, 400, 520, '⚙️ НАСТРОЙКИ', ButtonColors.blue, () => { fadeTransition(this, 'SettingsScene'); });
        createButton(this, 400, 580, '🏠 В МЕНЮ', ButtonColors.red, () => { fadeTransition(this, 'MenuScene'); });

        createSoundButton(this, 740, 540);
        SoundManager.playMusic('music', 0.4);
    }
}

// === НАСТРОЙКИ ИГРЫ ===
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1a1a2e',
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
    scene: [MenuScene, TutorialScene, SettingsScene, GameScene, PauseScene, TimeUpScene, GameOverScene]
};

const game = new Phaser.Game(config);