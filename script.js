const fretboard = document.getElementById('fretboard');
const stringCheckboxes = document.querySelectorAll('#strings-select input[type=checkbox]');
const scaleTypeSelect = document.getElementById('scale-type-select');
const showFullCheckbox = document.getElementById('show-full-scale-checkbox');

const chromatic = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"];
const normalizedChromatic = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const openNotes = [
  { string: 6, note: "E", octave: 2 },
  { string: 5, note: "A", octave: 2 },
  { string: 4, note: "D", octave: 3 },
  { string: 3, note: "G", octave: 3 },
  { string: 2, note: "B", octave: 3 },
  { string: 1, note: "E", octave: 4 }
];

const colors = {
  A: '#FF6B6B', B: '#4D96FF', C: '#20C997', D: '#A66CFF',
  E: '#ffcc00', F: '#FF922B', G: '#33cc33'
};

const tuningPresets = {
  standard: {
    name: 'Standard (E)',
    tuning: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']
  },
  dropD: {
    name: 'Drop D',
    tuning: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4']
  },
  dStandard: {
    name: 'D Standard',
    tuning: ['D2', 'G2', 'C3', 'F3', 'A3', 'D4']
  },
  dadgad: {
    name: 'DADGAD',
    tuning: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4']
  },
  openC: {
    name: 'Open C',
    tuning: ['C2', 'G2', 'C3', 'G3', 'C4', 'E4']
  },
  openD: {
    name: 'Open D',
    tuning: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4']
  }
};

function applyTuningPreset(presetKey) {
  const preset = tuningPresets[presetKey];
  if (!preset) return;

  preset.tuning.forEach((noteStr, i) => {
    const match = noteStr.match(/^([A-G](#|b)?)(\d)$/);
    if (!match) return;

    const { note } = sanitizeInputNote(match[1]);
    const octave = Number(match[3]);

    // string: 6 → 1
    openNotes[i].note = note;
    openNotes[i].octave = octave;
  });

  createFretboard();
}


const presetSelect = document.getElementById('tuning-preset-select');

Object.entries(tuningPresets).forEach(([key, preset]) => {
  const option = document.createElement('option');
  option.value = key;
  option.textContent = preset.name;
  presetSelect.appendChild(option);
});

presetSelect.addEventListener('change', () => {
  if (presetSelect.value) {
    applyTuningPreset(presetSelect.value);
  }
});


function changeStringTuning(stringNumber) {
  const stringData = openNotes.find(s => s.string === stringNumber);
  if (!stringData) return;

  const input = prompt(
    `Enter tuning for string ${stringNumber} (e.g. D#3 or Eb3)`,
    `${stringData.note}${stringData.octave}`
  );

  if (!input) return;

  const match = input.trim().match(/^([A-G](#|b)?)(\d)$/);
  if (!match) {
    alert("Invalid format. Example: D#3 or Eb3");
    return;
  }

  const { note: safeNote, warning } = sanitizeInputNote(match[1]);

  if (warning) {
    console.warn(warning);
    alert(warning);
  }

  stringData.note = safeNote;
  stringData.octave = Number(match[3]);

  createFretboard();
}
const fretCountInput = document.getElementById('fret-count-input');

fretCountInput.addEventListener('change', () => {
  let value = Number(fretCountInput.value);

  if (Number.isNaN(value)) return;

  // limit 1–24
  value = Math.max(1, Math.min(24, value));

  fretCount = value;
  fretCountInput.value = value; // UI

  createFretboard();
});



let fretCount = 15;

function createFretboard() {
  fretboard.replaceChildren();
  const header = document.createElement('div');
  header.classList.add('fret-row');
  header.innerHTML = `<div class="header">Лад Стр.</div>` +
    Array.from({ length: fretCount + 1 }, (_, f) =>
      `<div class="header">${f === 0 ? '' : f}</div>`
    ).join('');
  fretboard.appendChild(header);

  [...openNotes].reverse().forEach(stringData => {
    const row = document.createElement('div');
    row.classList.add('fret-row');


    //change button;
const label = document.createElement('div');
label.classList.add('header', 'string-control-cell');

const tuningBtn = document.createElement('button');
tuningBtn.classList.add('string-tuning-btn');
tuningBtn.title = 'Change tuning';
tuningBtn.innerHTML = '⚙';

tuningBtn.addEventListener('click', () => {
  changeStringTuning(stringData.string);
});

const stringNumber = document.createElement('span');
stringNumber.classList.add('string-number');
stringNumber.textContent = stringData.string; // 1–6

label.appendChild(tuningBtn);
label.appendChild(stringNumber);

row.appendChild(label);

    for (let fret = 0; fret <= fretCount; fret++) {
      const cell = document.createElement('div');
      const { note, octave } = getNoteAndOctave(stringData.note, stringData.octave, fret);
      cell.classList.add('fret');

      if (fret === 0||fret % 12 === 0) {
        cell.classList.add('open-string');
      }

      cell.innerHTML = `
        <div class="note-main">${note}</div>
        <div class="note-octave">${octave}</div>
      `;

      if (note.includes('/')) {
        const [left, right] = note.split('/').map(n => n[0]);
        const colorLeft = colors[left] || '#666';
        const colorRight = colors[right] || '#666';
        cell.style.background = `linear-gradient(to right, ${colorLeft}22 50%, ${colorRight}22 50%)`;
      } else {
        const baseColor = colors[note[0]] || '#666';
        cell.style.backgroundColor = `${baseColor}22`;
      }

      cell.style.color = 'white';
      cell.dataset.string = stringData.string;
      cell.dataset.fret = fret;

      cell.addEventListener('click', () => {
        handleCellClick(stringData, fret);
      });

      row.appendChild(cell);
    }

    fretboard.appendChild(row);
  });
  
}

function normalizeNote(note) {
  let n = note.includes('/') ? note.split('/')[0] : note;
  return enharmonicMap[n] || n;
}

const enharmonicMap = {
  'Cb': 'B',
  'Db': 'C#',
  'Eb': 'D#',
  'Fb': 'E',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
  'E#': 'F',
  'B#': 'C'
};

function getNoteIndex(note) {
  // Return index of the normalized note in the chromatic scale
  return normalizedChromatic.indexOf(normalizeNote(note));
}

function getNoteAndOctave(baseNote, baseOctave, fret) {
  // Normalize the base note (handles enharmonic equivalents)
  const normBase = normalizeNote(baseNote);

  // Find the base note index in the normalized chromatic scale
  const noteIndex = normalizedChromatic.indexOf(normBase);

  // Safety fallback: should never happen if input is sanitized,
  // but prevents the fretboard from breaking
  if (noteIndex < 0) {
    return {
      note: chromatic[0],
      octave: baseOctave
    };
  }

  // Absolute semitone index from the base note
  const abs = noteIndex + fret;

  // Wrap around within one octave
  const newIndex = abs % 12;

  // Calculate octave shift
  const octaveShift = Math.floor(abs / 12);

  return {
    // Use display chromatic scale (e.g. C#/Db)
    note: chromatic[newIndex],
    octave: baseOctave + octaveShift
  };
}

function sanitizeInputNote(note) {
  // Remove enharmonic display (e.g. "C#/Db" -> "C#")
  let n = note.includes('/') ? note.split('/')[0] : note;

  // 1) Already valid normalized note (C, C#, D, ...)
  if (normalizedChromatic.includes(n)) {
    return { note: n, warning: null };
  }

  // 2) Flats are allowed and silently converted to sharps
  if (n.endsWith('b') && enharmonicMap[n]) {
    return { note: enharmonicMap[n], warning: null };
  }

  // 3) Theoretical notes (E#, B#, Cb, Fb) → convert with warning
  if (enharmonicMap[n]) {
    return {
      note: enharmonicMap[n],
      warning: `${n} is a theoretical note and was converted to ${enharmonicMap[n]}`
    };
  }

  // 4) Completely invalid input → hard fallback
  return {
    note: 'C',
    warning: `${n} is invalid and was replaced with C`
  };
}


function getFrequency(note, octave) {
  const noteIndex = normalizedChromatic.indexOf(normalizeNote(note));
  const a4Index = 9 + 12 * 4;
  const currentIndex = noteIndex + 12 * octave;
  return 440 * Math.pow(2, (currentIndex - a4Index) / 12);
}

function playNote(freq, duration = 1) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(10000, ctx.currentTime);

  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function normalizeNote(note) {
  return note.includes('/') ? note.split('/')[0] : note;
}

const scalePatterns = {
  major: [2, 2, 1, 2, 2, 2, 1],
  minor: [2, 1, 2, 2, 1, 2, 2],
  harmonicMinor: [2, 1, 2, 2, 1, 3, 1],
  melodicMinor: [2, 1, 2, 2, 2, 2, 1],
  pentatonicMajor: [2, 2, 3, 2, 3],
  pentatonicMinor: [3, 2, 2, 3, 2],
  blues: [3, 2, 1, 1, 3, 2],
  dorian: [2, 1, 2, 2, 2, 1, 2],
  phrygian: [1, 2, 2, 2, 1, 2, 2],
  lydian: [2, 2, 2, 1, 2, 2, 1],
  mixolydian: [2, 2, 1, 2, 2, 1, 2],
  locrian: [1, 2, 2, 1, 2, 2, 2]
};

function computeFullScale(rootNote, rootOctave, mode) {
  const intervals = scalePatterns[mode] || scalePatterns['major'];
  const rootNorm = normalizeNote(rootNote);
  let index = normalizedChromatic.findIndex(n => n === rootNorm);

  const scale = [{ note: rootNorm, octave: rootOctave }];
  let currentOctave = rootOctave;

  intervals.forEach(step => {
    index += step;
    if (index >= 12) {
      index -= 12;
      currentOctave += 1;
    }
    scale.push({ note: normalizedChromatic[index], octave: currentOctave });
  });

  return scale;
}

function computeFullScaleAllOctaves(rootNote, mode) {
  const rootNorm = normalizeNote(rootNote);
  const intervals = scalePatterns[mode] || scalePatterns['major'];
  const allNotes = [];

  for (let octave = 1; octave <= 7; octave++) {
    for (let chromIndex = 0; chromIndex < 12; chromIndex++) {
      const currentNote = normalizedChromatic[chromIndex];
      if (currentNote === rootNorm) {
        let index = chromIndex;
        let currentOctave = octave;
        allNotes.push({ note: currentNote, octave: currentOctave });

        intervals.forEach(step => {
          index += step;
          if (index >= 12) {
            index -= 12;
            currentOctave += 1;
          }
          allNotes.push({ note: normalizedChromatic[index], octave: currentOctave });
        });
      }
    }
  }

  return allNotes;
}

function getSelectedStrings() {
  const selected = Array.from(stringCheckboxes).filter(cb => cb.checked).map(cb => parseInt(cb.value));
  return selected.length ? selected : [1];
}


function clearHighlights() {
  document.querySelectorAll('.fret').forEach(cell => {
    cell.classList.remove('highlight', 'tonic');
    cell.style.backgroundColor = '';
    cell.style.color = '';
    cell.style.border = '';
    cell.style.boxShadow = '';
  });
}



const lockScale = document.getElementById('lock-scale-checkbox')?.checked;


function getChordTypesForScale(scaleType) {
  switch (scaleType) {
    case 'major':
      return ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];
    case 'minor':
      return ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'];
    case 'harmonicMinor':
      return ['min', 'dim', 'aug', 'min', 'maj', 'maj', 'dim'];
    case 'melodicMinor':
      return ['min', 'min', 'aug', 'maj', 'maj', 'dim', 'dim'];
    case 'pentatonicMajor':
    case 'pentatonicMinor':
    case 'blues':
      return []; // Поки без акордів
    case 'dorian':
      return ['min', 'min', 'maj', 'maj', 'min', 'dim', 'maj'];
    case 'phrygian':
      return ['min', 'maj', 'maj', 'min', 'dim', 'maj', 'min'];
    case 'lydian':
      return ['maj', 'maj', 'min', 'dim', 'maj', 'min', 'min'];
    case 'mixolydian':
      return ['maj', 'min', 'dim', 'maj', 'min', 'min', 'maj'];
    case 'locrian':
      return ['dim', 'maj', 'min', 'min', 'maj', 'maj', 'min'];
    default:
      return ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];
  }
}

// Прогресії для різних типів гам
const progressionByScaleType = {
  major: [
    { name: "I–V–vi–IV", steps: ['I', 'V', 'vi', 'IV'] },
    { name: "ii–V–I", steps: ['ii', 'V', 'I'] },
    { name: "I–vi–IV–V", steps: ['I', 'vi', 'IV', 'V'] },
    { name: "I–IV–V", steps: ['I', 'IV', 'V'] },
  ],
  minor: [
    { name: "i–iv–v-i", steps: ['i', 'iv', 'v', 'i'] },
    { name: "i–VI–III–VII", steps: ['i', 'VI', 'III', 'VII'] },
    { name: "ii°–V–i", steps: ['ii°', 'V', 'i'] },
  ],
  dorian: [
    { name: "i–IV–v", steps: ['i', 'IV', 'v'] },
    { name: "i–VII–IV", steps: ['i', 'VII', 'IV'] },
  ],
  phrygian: [
    { name: "i–II–v", steps: ['i', 'II', 'v'] },
  ],
  lydian: [
    { name: "I–II–V", steps: ['I', 'II', 'V'] },
  ],
  mixolydian: [
    { name: "I–VII–IV", steps: ['I', 'VII', 'IV'] },
  ],
  locrian: [
    { name: "i°–VII–v", steps: ['i°', 'VII', 'v'] },
  ],
  harmonicMinor: [
    { name: "i–iv–V", steps: ['i', 'iv', 'V'] },
    { name: "i–VI–III–VII", steps: ['i', 'VI', 'III', 'VII'] },
  ],
  melodicMinor: [
    { name: "i–II–V", steps: ['i', 'II', 'V'] },
  ],
};

function showScaleDegrees(rootNote, rootOctave, scaleType, scaleNotes) {
  const chordTypes = getChordTypesForScale(scaleType);

  for (let i = 0; i < 7; i++) {
    const noteObj = scaleNotes[i];
    const noteText = noteObj ? `${noteObj.note}` : '';
    const chord = chordTypes[i] ? `${noteText}${chordTypes[i]}` : '';

    const noteEl = document.getElementById(`note-${i + 1}`);
    const chordEl = document.getElementById(`chord-${i + 1}`);

    if (noteEl) noteEl.textContent = noteText;
    if (chordEl) chordEl.textContent = chord;
  }
}

function renderProgressions(scaleNotes, scaleType) {
  const chordTypes = getChordTypesForScale(scaleType);

  // Вибираємо прогресії для поточного типу гами,
  // якщо немає — беремо мажорні за замовчуванням
  const progressionDefs = progressionByScaleType[scaleType] || progressionByScaleType['major'];

  const romanToIndex = {
    // великі літери — мажорні ступені
    'I': 0, 'ii': 1, 'II': 1, 'iii': 2, 'III': 2, 'IV': 3,
    'V': 4, 'vi': 5, 'VI': 5, 'vii': 6, 'VII': 6,

    // малі літери — мінорні
    'i': 0, 'ii°': 1, 'iv': 3, 'v': 4, 'VI': 5, 'III': 2, 'VII': 6,

    // додатково для зменшеного ступеня (dim)
    'ii°': 1, 'i°': 0
  };

  const container = document.getElementById('progression-display');
  container.innerHTML = ''; // очищуємо

const maxChordsPerRow = 4;

progressionDefs.forEach(p => {
  const row = document.createElement('div');
  row.className = 'progression-row';

  const title = document.createElement('span');
  title.className = 'progression-name';
  title.textContent = p.name;
  row.appendChild(title);

  for (let i = 0; i < maxChordsPerRow; i++) {
    const r = p.steps[i];
    let chord = '';

    if (r) {
      const idx = romanToIndex[r];
      if (idx >= 0 && scaleNotes[idx]) {
        const note = scaleNotes[idx].note;
        chord = chordTypes[idx] ? `${note}${chordTypes[idx]}` : '?';
      } else {
        chord = '?';
      }
    }

    const chordSpan = document.createElement('span');
    chordSpan.className = 'progression-chord';
    chordSpan.textContent = chord;
    row.appendChild(chordSpan);
  }

  container.appendChild(row);
});
}


function handleCellClick(stringData, fret) {
  const { note, octave } = getNoteAndOctave(stringData.note, stringData.octave, fret);
  const frequency = getFrequency(note, octave);
  playNote(frequency);

  const lockScale = document.getElementById('lock-scale-checkbox')?.checked;
  if (lockScale) return;

  const scaleType = scaleTypeSelect?.value || 'major';
  const showFull = showFullCheckbox?.checked;

  const scaleNotes = showFull
    ? computeFullScaleAllOctaves(note, scaleType)
    : computeFullScale(note, octave, scaleType);

    
  showScaleDegrees(note, octave, scaleType, scaleNotes); 
  renderProgressions(scaleNotes, scaleType);
  const selectedStrings = getSelectedStrings();

  clearHighlights();

  const tonicNote = normalizeNote(note); // обираємо з оригінального кліку
  const tonicColor = colors[tonicNote[0]] || '#fff';

  document.querySelectorAll('.fret').forEach(cell => {
    const cellString = parseInt(cell.dataset.string);
    if (!selectedStrings.includes(cellString)) return;

    const cellFret = parseInt(cell.dataset.fret);
    const stringObj = openNotes.find(s => s.string === cellString);
    const { note: cellNote, octave: cellOctave } = getNoteAndOctave(stringObj.note, stringObj.octave, cellFret);
    const normNote = normalizeNote(cellNote);

    const match = scaleNotes.some(s => s.note === normNote && s.octave === cellOctave);
    if (match) {
      cell.classList.add('highlight');
      cell.style.backgroundColor = colors[normNote[0]] || '#fff';
      cell.style.color = '#000';

      if (normNote === tonicNote) {
      cell.classList.add('tonic');
    }
    }
  });


}






createFretboard();


document.getElementById('clear-button').addEventListener('click', clearHighlights);

