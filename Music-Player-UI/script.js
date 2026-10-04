
  const tracks = [
    { title:"Amber Hours",      artist:"The Nocturne Quartet", album:"Low Light", year:"2019", duration:252 },
    { title:"Rooftop, 3AM",     artist:"The Nocturne Quartet", album:"Low Light", year:"2019", duration:198 },
    { title:"Slow Static",      artist:"Marguerite Voss",      album:"Tape Hiss", year:"2021", duration:227 },
    { title:"Copper Skyline",   artist:"Home Movies",          album:"Copper Skyline EP", year:"2017", duration:214 },
    { title:"Last Train Out",   artist:"The Nocturne Quartet", album:"Low Light", year:"2019", duration:281 },
  ];

  let current = 0;
  let isPlaying = false;
  let currentTime = 0;
  let shuffle = false;
  let repeat = false;
  let dragging = false;
  let tickHandle = null;

  const player = document.getElementById('player');
  const playBtn = document.getElementById('playBtn');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const repeatBtn = document.getElementById('repeatBtn');
  const progressTrack = document.getElementById('progressTrack');
  const progressFill = document.getElementById('progressFill');
  const progressKnob = document.getElementById('progressKnob');
  const timeCurrent = document.getElementById('timeCurrent');
  const timeTotal = document.getElementById('timeTotal');
  const trackTitle = document.getElementById('trackTitle');
  const trackArtist = document.getElementById('trackArtist');
  const trackAlbum = document.getElementById('trackAlbum');
  const trackCount = document.getElementById('trackCount');
  const queueList = document.getElementById('queueList');
  const volumeSlider = document.getElementById('volumeSlider');

  function fmt(s){
    s = Math.max(0, Math.floor(s));
    const m = Math.floor(s/60);
    const sec = String(s%60).padStart(2,'0');
    return `${m}:${sec}`;
  }

  function renderQueue(){
    queueList.innerHTML = '';
    tracks.forEach((t, i) => {
      const li = document.createElement('li');
      li.className = 'queue-item' + (i === current ? ' active' : '');
      li.innerHTML = `
        <span class="q-index">
          <span class="num">${i+1}</span>
          <span class="eq"><span></span><span></span><span></span></span>
        </span>
        <span>
          <div class="q-title">${t.title}</div>
          <div class="q-artist">${t.artist}</div>
        </span>
        <span class="q-duration">${fmt(t.duration)}</span>
      `;
      li.addEventListener('click', () => loadTrack(i, true));
      queueList.appendChild(li);
    });
  }

  function loadTrack(index, keepPlaying){
    current = index;
    currentTime = 0;
    const t = tracks[current];
    trackTitle.textContent = t.title;
    trackArtist.textContent = t.artist;
    trackAlbum.innerHTML = `from <em>${t.album}</em>, ${t.year}`;
    trackCount.textContent = `Track ${current+1} of ${tracks.length}`;
    timeTotal.textContent = fmt(t.duration);
    updateProgress();
    renderQueue();
    if(!keepPlaying){ return; }
    if(!isPlaying) setPlaying(true);
  }

  function updateProgress(){
    const t = tracks[current];
    const pct = Math.min(100, (currentTime / t.duration) * 100);
    progressFill.style.width = pct + '%';
    progressKnob.style.left = pct + '%';
    progressTrack.setAttribute('aria-valuenow', Math.round(pct));
    timeCurrent.textContent = fmt(currentTime);
  }

  function setPlaying(val){
    isPlaying = val;
    player.classList.toggle('is-playing', isPlaying);
    playIcon.style.display = isPlaying ? 'none' : 'block';
    pauseIcon.style.display = isPlaying ? 'block' : 'none';
    playBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
    playBtn.classList.toggle('playing', isPlaying);

    if(isPlaying){
      clearInterval(tickHandle);
      tickHandle = setInterval(() => {
        currentTime += 0.25;
        const dur = tracks[current].duration;
        if(currentTime >= dur){
          if(repeat){
            currentTime = 0;
          } else {
            advance(1);
            return;
          }
        }
        updateProgress();
      }, 250);
    } else {
      clearInterval(tickHandle);
    }
  }

  function advance(dir){
    let next;
    if(shuffle){
      do { next = Math.floor(Math.random() * tracks.length); } while(next === current && tracks.length > 1);
    } else {
      next = (current + dir + tracks.length) % tracks.length;
    }
    loadTrack(next, isPlaying);
  }

  playBtn.addEventListener('click', () => setPlaying(!isPlaying));
  nextBtn.addEventListener('click', () => advance(1));
  prevBtn.addEventListener('click', () => {
    if(currentTime > 3){ currentTime = 0; updateProgress(); }
    else advance(-1);
  });

  shuffleBtn.addEventListener('click', () => {
    shuffle = !shuffle;
    shuffleBtn.setAttribute('aria-pressed', String(shuffle));
  });
  repeatBtn.addEventListener('click', () => {
    repeat = !repeat;
    repeatBtn.setAttribute('aria-pressed', String(repeat));
  });

  function seekFromEvent(clientX){
    const rect = progressTrack.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    currentTime = pct * tracks[current].duration;
    updateProgress();
  }

  progressTrack.addEventListener('pointerdown', (e) => {
    dragging = true;
    seekFromEvent(e.clientX);
  });
  window.addEventListener('pointermove', (e) => {
    if(dragging) seekFromEvent(e.clientX);
  });
  window.addEventListener('pointerup', () => { dragging = false; });

  progressTrack.addEventListener('keydown', (e) => {
    const dur = tracks[current].duration;
    if(e.key === 'ArrowRight'){ currentTime = Math.min(dur, currentTime + 5); updateProgress(); }
    if(e.key === 'ArrowLeft'){ currentTime = Math.max(0, currentTime - 5); updateProgress(); }
  });

  volumeSlider.addEventListener('input', () => {
    function updateVolume(){
  const value = volumeSlider.value;

  volumeSlider.style.background = `
    linear-gradient(
      to right,
      var(--brass-light) 0%,
      var(--brass-light) ${value}%,
      rgba(237, 230, 214, 0.15) ${value}%,
      rgba(237, 230, 214, 0.15) 100%
    )
  `;
}

volumeSlider.addEventListener('input', updateVolume);

updateVolume();  });

  loadTrack(0, false);
