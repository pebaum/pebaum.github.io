class StoneBGMPlayer {
    constructor(audioPath = 'Stone.mp3') {
        this.bgmBox = document.getElementById('bgm-box');
        this.stoneMusic = new Audio(audioPath);
        this.stoneMusic.volume = 0.4;
        this.isPlaying = false;
        this.init();
    }

    init() {
        this.bgmBox.addEventListener('click', () => {
            if (this.isPlaying) {
                this.pauseMusic();
            } else {
                this.playMusic();
            }
        });

        this.stoneMusic.addEventListener('ended', () => {
            this.isPlaying = false;
            this.updateUI();
        });
    }

    playMusic() {
        const playPromise = this.stoneMusic.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                this.updateUI();
            }).catch(err => {
                console.debug('Stone music play prevented:', err);
            });
        }
    }

    pauseMusic() {
        this.stoneMusic.pause();
        this.isPlaying = false;
        this.updateUI();
    }

    updateUI() {
        if (this.isPlaying) {
            this.bgmBox.querySelector('.location-name').textContent = 'Toggle BGM';
            this.bgmBox.style.background = 'linear-gradient(135deg, #4A4A4A, #3A3A3A)';
        } else {
            this.bgmBox.querySelector('.location-name').textContent = 'Toggle BGM';
            this.bgmBox.style.background = 'linear-gradient(135deg, #3B3E45, #2F2F2F)';
        }
    }
}
