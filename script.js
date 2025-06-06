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

      if (fret === 0||fret%12===0) {
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

// function clearHighlights() {
//   document.querySelectorAll('.fret.highlight').forEach(cell => {
//     cell.classList.remove('highlight');
//     const noteText = cell.querySelector('.note-main')?.textContent || '';
//     const baseColor = colors[noteText[0]] || '#666';
//     cell.style.backgroundColor = `${baseColor}22`;
//     cell.style.color = 'white';
//   });
// }
// function clearHighlights() {
//   document.querySelectorAll('.fret').forEach(cell => {
//     cell.classList.remove('highlight', 'tonic');

//     const noteText = cell.querySelector('.note-main')?.textContent || '';
//     const baseColor = colors[noteText[0]] || '#666';

//     // Відновлюємо тьмяний фон
//     if (noteText.includes('/')) {
//       const [left, right] = noteText.split('/');
//       const colorLeft = colors[left[0]] || '#666';
//       const colorRight = colors[right[0]] || '#666';
//       cell.style.background = `linear-gradient(to right, ${colorLeft}22 50%, ${colorRight}22 50%)`;
//     } else {
//       cell.style.backgroundColor = `${baseColor}22`;
//     }

//     cell.style.color = 'white';
//   });
// }

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

function showScaleDegrees(scaleNotes) {
  // Контейнер для ступенів
  const container = document.createElement('div');
  container.style.marginLeft = '20px';
  container.style.fontFamily = 'monospace';
  container.style.whiteSpace = 'pre'; // щоб зберігати відступи

  // Масив римських чисел для ступенів
  const degrees = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

  // Формуємо текст
  let text = '';
  for (let i = 0; i < degrees.length; i++) {
    text += `${degrees[i].padEnd(4)}- ${scaleNotes[i]}\n`;
  }

  container.textContent = text;

  // Додаємо цей блок до DOM, наприклад, після грифу
  document.body.appendChild(container);
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

