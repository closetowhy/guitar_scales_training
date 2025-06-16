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

const fretCount = 15;

function createFretboard() {
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

    const label = document.createElement('div');
    label.classList.add('header');
    label.textContent = `${stringData.string}`;
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


function getNoteIndex(note) {
  return chromatic.indexOf(note);
}

function getNoteAndOctave(baseNote, baseOctave, fret) {
  const noteIndex = getNoteIndex(baseNote);
  const newIndex = (noteIndex + fret) % chromatic.length;
  const octaveShift = Math.floor((noteIndex + fret) / chromatic.length);
  return {
    note: chromatic[newIndex],
    octave: baseOctave + octaveShift
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

