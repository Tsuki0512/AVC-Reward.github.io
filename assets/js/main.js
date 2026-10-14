(() => {
  const rewardCases = [
    {
      scene: 'Live jazz band on stage', video: '1817_1.mp4',
      scores: ['1.00', '1.00', '1.00'], overall: '1.00', human: '1.00',
      conclusion: '...the audio-video consistency is exceptionally high across all dimensions. The content is perfectly coherent, synchronized, and semantically aligned ...'
    },
    {
      scene: 'Choir with a conductor', video: '575_1.mp4',
      scores: ['1.00', '0.90', '0.90'], overall: '0.93', human: '0.93',
      conclusion: '... represents a standard concert recording where the audio track is a direct recording of the visual performance....'
    },
    {
      scene: 'Puppet speaking in a factory scene', video: '684_4.mp4',
      scores: ['1.00', '1.00', '0.90'], overall: '0.97', human: '0.93',
      conclusion: '...the ambient background music and drone. This is a common convention in film and animation and does not significantly detract from the overall coherence ...'
    },
    {
      scene: 'Two people on screen, one clear speech track', video: '1175_3.mp4',
      scores: ['0.40', '0.40', '0.40'], overall: '0.40', human: '0.48',
      conclusion: '... The only point of minor connection is the presence of a feminine-like voice that matches one of the two anime characters on screen ...'
    },
    {
      scene: 'Orchestra with a dubbed soundtrack', video: '1084_4.mp4',
      scores: ['1.00', '0.70', '0.70'], overall: '0.80', human: '0.67',
      conclusion: '...The musicians are miming to a studio recording, which breaks the authentic physical connection between their actions and the sound produced. ...'
    },
    {
      scene: 'Blacksmith striking an anvil', video: '16_3.mp4',
      scores: ['1.00', '0.40', '0.40'], overall: '0.60', human: '0.50',
      conclusion: '...While the general atmosphere is cohesive, the lack of precise timing between the hammer impacts and the resulting sounds ...'
    }
  ];

  const generationCases = [
    { prompt: 'A political campaign montage moves between title cards, a sneaker stepping over chalk lettering, a candidate, and animated slogans.', key: 'avgenbench_0002' },
    { prompt: 'A close-up piano tutorial shows a hand playing and releasing an A-minor chord.', key: 'avgenbench_0163' },
    { prompt: 'A dog on one side of a room barks, then a cat on the other side answers.', key: 'avphysbench_0061' },
    { prompt: 'A person speaks beside a powerful waterfall.', key: 'avphysbench_0095' },
    { prompt: 'Water fills a clear glass pot as the requested pouring sound becomes lower in pitch.', key: 'avphysbench_0271' },
    { prompt: 'An overhead cooking tutorial shows hands slicing a tomato beside a simmering pot while a narrator gives instructions.', key: 'gen_added_P49', oursModel: 'omninft_step876' },
  ];

  const additionalCases = [
    { key: 'avgenbench_0010', prompt: 'A close-up of a branded takeout box transitions to a black title card and smiling mascot illustration.' },
    { key: 'avgenbench_0046', prompt: 'A fizzy drink is poured over ice spheres as the camera closes in on the rising bubbles and foam.' },
    { key: 'avgenbench_0079', prompt: 'A sealed flask is shaken, then the liquid cycles through visible color changes while it rests.' },
    { key: 'avgenbench_0113', prompt: 'A cockpit view follows a small plane accelerating down a runway, lifting off, and retracting its landing gear.' },
    { key: 'avgenbench_0152', prompt: 'A close-up follows fingers moving rapidly over the keys of a saxophone.' },
    { key: 'avgenbench_0195', prompt: 'A magnet descends slowly through a vertical copper tube in a physics classroom demonstration.' },
    { key: 'avphysbench_0161', prompt: 'A mallet moves along a xylophone from longer bars to shorter bars.' },
    { key: 'avphysbench_0195', prompt: 'A ping-pong ball bounces first on a wooden table, then on carpet.' },
    { key: 'avphysbench_0308', prompt: 'A person leaves a busy street and enters a building lobby through a heavy door.' },
    { key: 'vabench_0268', prompt: 'A reader turns the final page of a book and closes it with a satisfied smile.' },
    { key: 'vabench_0315', prompt: 'A bride repeatedly tries on her veil and smiles nervously at the mirror.' },
    { key: 'vabench_0380', prompt: 'A first-person subway scene follows someone using over-ear headphones to reduce the surrounding rumble.' },
    { key: 'vabench_0454', prompt: 'Water is poured into a glass as the pitch of taps on its side rises with the water level.' },
    { key: 'vabench_0666', prompt: 'A chef chops and seasons ingredients at the lower edge of the frame while preparing a hot dish.' },
    { key: 'vabench_0537', prompt: 'A surreal time bank shows golden liquid flowing through glass tubes.', folder: 'ref/case/02_gen' }
  ];

  const createText = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value;
    return node;
  };

  const videoElements = [];

  const setOverlayLabel = (shell, text) => {
    const label = shell.querySelector('.video-overlay-label');
    if (label) label.textContent = text;
  };

  const createVideo = (src, label, options = {}) => {
    const shell = document.createElement('div');
    shell.className = 'video-shell';
    shell.dataset.src = src;
    if (Number.isFinite(options.previewTime)) shell.dataset.previewTime = String(options.previewTime);

    const video = document.createElement('video');
    video.className = 'case-video';
    video.controls = false;
    video.preload = 'none';
    video.playsInline = true;
    video.muted = true;
    video.controlsList = 'nofullscreen';
    video.disablePictureInPicture = true;
    video.setAttribute('aria-label', label);
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    videoElements.push(video);

    const overlay = document.createElement('button');
    overlay.type = 'button';
    overlay.className = 'video-overlay';
    overlay.setAttribute('aria-label', 'Load preview and play ' + label);
    overlay.append(createText('span', 'video-play-glyph', '\u25b6'));
    overlay.append(createText('span', 'video-overlay-label', 'Load preview'));

    const status = createText('p', 'video-error', 'Video unavailable. Activate to retry.');
    status.setAttribute('role', 'status');
    shell.append(video, overlay, status);

    let source = null;
    let seekTimer = null;
    let previewAttempted = false;
    let playbackRequested = false;

    const fail = (message) => {
      shell.classList.remove('is-loading', 'is-playing');
      shell.classList.add('is-error');
      status.textContent = message;
      video.controls = false;
      setOverlayLabel(shell, 'Play video');
      overlay.setAttribute('aria-label', 'Try to play ' + label);
    };

    const markPreviewReady = () => {
      if (seekTimer) clearTimeout(seekTimer);
      seekTimer = null;
      shell.classList.remove('is-loading', 'is-error');
      shell.classList.add('is-preview-ready');
      setOverlayLabel(shell, 'Play video');
      overlay.setAttribute('aria-label', 'Play ' + label);
      if (!playbackRequested) {
        video.pause();
        video.muted = true;
        video.controls = false;
      }
    };

    const attachSource = () => {
      if (source && shell.dataset.failed !== 'true') return;
      shell.classList.remove('is-error');
      shell.dataset.failed = '';
      shell.dataset.loaded = 'true';
      shell.classList.add('is-loading');
      setOverlayLabel(shell, 'Loading preview');
      if (source) source.remove();
      source = document.createElement('source');
      source.src = shell.dataset.src;
      source.type = 'video/mp4';
      video.append(source);
      video.preload = 'metadata';
      video.muted = true;
      video.load();
    };

    const startPlayback = () => {
      playbackRequested = true;
      video.muted = false;
      video.controls = true;
      const request = video.play();
      if (request && typeof request.catch === 'function') {
        request.catch(() => {
          playbackRequested = false;
          video.controls = false;
          video.muted = true;
          fail('Unable to start playback. Activate to retry.');
        });
      }
    };

    video.addEventListener('loadedmetadata', () => {
      if (playbackRequested || previewAttempted) return;
      previewAttempted = true;
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) {
        fail('Preview unavailable. Activate to play the video.');
        return;
      }
      const configured = Number(shell.dataset.previewTime);
      const target = Number.isFinite(configured) && shell.dataset.previewTime
        ? configured
        : Math.min(0.5, duration * 0.15);
      const safeTime = Math.max(0, Math.min(target, Math.max(0, duration - 0.04)));
      if (safeTime <= 0.01 || Math.abs(video.currentTime - safeTime) < 0.01) {
        markPreviewReady();
        return;
      }
      try {
        video.currentTime = safeTime;
        seekTimer = setTimeout(() => {
          if (!shell.classList.contains('is-preview-ready') && !playbackRequested) {
            fail('Preview could not be decoded. Activate to play the video.');
          }
        }, 5000);
      } catch (error) {
        fail('Preview unavailable. Activate to play the video.');
      }
    });

    video.addEventListener('seeked', () => {
      if (!playbackRequested) markPreviewReady();
      else shell.classList.add('is-preview-ready');
    });

    video.addEventListener('playing', () => {
      shell.classList.remove('is-error', 'is-loading');
      shell.classList.add('is-playing');
      videoElements.forEach((other) => {
        if (other !== video && !other.paused) {
          other.pause();
          other.muted = true;
          other.controls = false;
          const otherShell = other.closest('.video-shell');
          if (otherShell) otherShell.classList.remove('is-playing');
        }
      });
    });

    video.addEventListener('pause', () => {
      if (!video.ended) shell.classList.remove('is-playing');
      if (shell.classList.contains('is-preview-ready')) {
        video.controls = false;
        setOverlayLabel(shell, 'Play video');
      }
    });

    video.addEventListener('ended', () => {
      shell.classList.remove('is-playing');
      video.controls = false;
      setOverlayLabel(shell, 'Replay video');
    });

    video.addEventListener('error', () => {
      shell.dataset.failed = 'true';
      fail('Unable to load this video. Activate to retry.');
    });

    shell.loadPreview = attachSource;
    overlay.addEventListener('click', () => {
      attachSource();
      video.muted = false;
      shell.classList.add('is-loading');
      setOverlayLabel(shell, 'Starting video');
      startPlayback();
    });

    return shell;
  };

  const renderRewardCases = () => {
    const tbody = document.getElementById('reward-cases');
    if (!tbody) return;
    const dimensions = ['macro', 'temporal', 'fine'];
    const scoreLabels = ['Macro-semantic alignment', 'Temporal synchronization', 'Fine-grained event correspondence'];
    rewardCases.forEach((item) => {
      const row = document.createElement('tr');
      const caseCell = document.createElement('td');
      caseCell.className = 'reward-case-cell';
      caseCell.append(createText('strong', 'case-scene', item.scene));
      caseCell.append(createVideo('ref/case/01_rewardmodel/videos/' + item.video, item.scene + ' audio-video clip'));
      const scoreCells = item.scores.map((score, index) => {
        const numericScore = Math.max(0, Math.min(1, Number.parseFloat(score) || 0));
        const cell = document.createElement('td');
        cell.className = 'score-cell';
        cell.setAttribute('aria-label', scoreLabels[index] + ': ' + score);
        cell.append(createText('div', 'score-value', score));
        const meter = document.createElement('div');
        meter.className = 'score-meter ' + dimensions[index];
        meter.setAttribute('role', 'progressbar');
        meter.setAttribute('aria-label', scoreLabels[index]);
        meter.setAttribute('aria-valuemin', '0');
        meter.setAttribute('aria-valuemax', '1');
        meter.setAttribute('aria-valuenow', String(numericScore));
        const fill = document.createElement('span');
        fill.style.width = (numericScore * 100) + '%';
        meter.append(fill);
        cell.append(meter);
        return cell;
      });
      const conclusionCell = document.createElement('td');
      conclusionCell.className = 'conclusion-cell';
      conclusionCell.append(createText('strong', 'overall-score', 'AVC-Reward ' + item.overall));
      conclusionCell.append(createText('span', 'human-score', 'Human avg ' + item.human));
      conclusionCell.append(createText('p', 'conclusion-excerpt', 'Conclusion: "' + item.conclusion + '"'));
      row.append(caseCell, ...scoreCells, conclusionCell);
      tbody.append(row);
    });
  };

  const renderVideoCases = (tbodyId, cases, folder) => {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    cases.forEach((item) => {
      const row = document.createElement('tr');
      const prompt = createText('td', 'prompt-cell', item.prompt);
      row.append(prompt);
      ['ltx2', 'omninft', item.oursModel || 'ours_step876'].forEach((model, index) => {
        const cell = document.createElement('td');
        cell.className = 'video-cell';
        const label = index === 2 ? 'Ours' : model === 'ltx2' ? 'LTX-2' : 'OmniNFT';
        cell.append(createVideo((item.folder || folder) + '/' + item.key + '_' + model + '.mp4', item.prompt + ' - ' + label + ' audio-video clip', item));
        row.append(cell);
      });
      tbody.append(row);
    });
  };

  renderRewardCases();
  renderVideoCases('generation-cases', generationCases, 'ref/case/02_gen');
  renderVideoCases('additional-cases', additionalCases, 'ref/adding_case');

  if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const shell = entry.target;
        if (!shell.dataset.loaded && typeof shell.loadPreview === 'function') shell.loadPreview();
        videoObserver.unobserve(shell);
      });
    }, { rootMargin: '300px 0px' });
    document.querySelectorAll('.video-shell').forEach((shell) => videoObserver.observe(shell));
  }

  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#site-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const year = document.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
