const startBtn = document.getElementById('start-button');
const intervalSelect = document.getElementById('interval-select');
const noteDisplayMode = document.getElementById('note-display-mode');
let isPaused = true;
let interval;
let hasStarted = false;


const scaleModeCheckbox = document.getElementById('scale-mode-checkbox');
const fullScaleCheckbox = document.getElementById('show-full-scale-checkbox');

scaleModeCheckbox.addEventListener('change', () => {
  if (!scaleModeCheckbox.checked) {
    fullScaleCheckbox.checked = false;
    fullScaleCheckbox.disabled = true;
  } else {
    fullScaleCheckbox.disabled = false;
  }
});

// початковий стан при завантаженні
if (!scaleModeCheckbox.checked) {
  fullScaleCheckbox.checked = false;
  fullScaleCheckbox.disabled = true;
}

// Додаємо обробник події для чекбокса
// scaleModeCheckbox.addEventListener('change', () => {
//   // Симулюємо клік кнопки при зміні стану чекбокса
//   startBtn.click();
// });

// Add an event listener for the keydown event
document.addEventListener('keydown', function(event) {
    if (event.key === ' ' || event.key === 'Spacebar') {  // Check if Space key is pressed
        button.click();  // Trigger the button click
    }
});


function startInterval(seconds) {
  if (interval) clearTimeout(interval);

  const delayEnabled = noteDisplayMode.value === 'delay';
  const showImmediate = noteDisplayMode.value === 'immediate';
  const totalTime = delayEnabled ? seconds + 1.5 : seconds;

  function runCycle() {
    clearHighlights();

    const noteData = generateRandomNote(); // обираємо струну і лад
    displayNote(noteData);                 // показуємо назву ноти
    playNote(noteData.frequency);         // граємо звук
    maybeHighlightNote(noteData, seconds, delayEnabled, showImmediate); // підсвічування

    interval = setTimeout(runCycle, totalTime * 1000);
  }

  runCycle();
}


let lastNoteData = null; // Зберігаємо попередню ноту

function generateRandomNote() {
  const selectedStrings = getSelectedStrings();
  if (!selectedStrings.length) return null;

  let newNoteData;

  do {
    const randomString = selectedStrings[Math.floor(Math.random() * selectedStrings.length)];
    const stringData = openNotes.find(n => n.string === randomString);
    const randomFret = Math.floor(Math.random() * 13);

    const { note, octave } = getNoteAndOctave(stringData.note, stringData.octave, randomFret);
    const frequency = getFrequency(note, octave);

    newNoteData = {
      string: randomString,
      fret: randomFret,
      note,
      octave,
      frequency
    };
  } while (
    lastNoteData &&
    newNoteData.note === lastNoteData.note &&
    newNoteData.octave === lastNoteData.octave &&
    newNoteData.string === lastNoteData.string &&
    newNoteData.fret === lastNoteData.fret
  );

  lastNoteData = newNoteData; // зберігаємо для наступного разу

  return newNoteData;
}

const stringDisplay = document.getElementById('string-display');


function displayNote({ note, string }) {
  const showString = document.getElementById('show-string-checkbox')?.checked;

  // Додаємо клас анімації
  noteDisplay.classList.add('fade-animation');

  let noteHTML = '';
  if (note.includes('/')) {
    const [first, second] = note.split('/');
    const color1 = colors[first[0]] || '#fff';
    const color2 = colors[second[0]] || '#fff';

    noteHTML = `
      <span style="color: ${color1}; font-weight: normal;">${first}</span><span style="color: white;">/</span><span style="color: ${color2}; font-weight: normal;">${second}</span>
    `;
  } else {
    const color = colors[note[0]] || '#fff';
    noteHTML = `<span style="color: ${color}; font-weight: bold;">${note}</span>`;
  }

  noteDisplay.innerHTML = noteHTML;
  stringDisplay.innerHTML = showString ? `струна ${string}` : '';

  // Після анімації видаляємо клас, щоб він не застосовувався наступного разу, поки не буде змінено нот
  setTimeout(() => noteDisplay.classList.remove('fade-animation'), 500); // Тривалість анімації 500мс
}


function maybeHighlightNote({ string, fret, note }, seconds, delayEnabled, showImmediate) {
  if (noteDisplayMode.value === 'clear') return;

  if (delayEnabled) {
    setTimeout(() => {
      highlightNote(string, fret, note);
      setTimeout(clearHighlights, 1500);
    }, seconds * 1000);
  } else if (showImmediate) {
    highlightNote(string, fret, note);
    setTimeout(clearHighlights, 1500);
  }
}




function pauseInterval() {
  if (!hasStarted) {
    hasStarted = true;
    const seconds = parseInt(intervalSelect.value);
    startInterval(seconds);
    startBtn.textContent = "Пауза";
    startBtn.style.backgroundColor = "#FF6B6B";
  } else {
    if (isPaused) {
      const seconds = parseInt(intervalSelect.value);
      startInterval(seconds);
      startBtn.textContent = "Пауза";
      startBtn.style.backgroundColor = "#FF6B6B";
    } else {
      clearTimeout(interval);
      startBtn.textContent = "Продовжити";
      startBtn.style.backgroundColor = "#4CAF50";
    }
  }
  isPaused = !isPaused;
}

startBtn.textContent = "Старт";
startBtn.style.backgroundColor = "#4CAF50";
startBtn.addEventListener('click', pauseInterval);



//Notes Calculation

const chromatic = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"];

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

const fretCount = 12;
const noteDisplay = document.getElementById('note-display');
const fretboard = document.getElementById('fretboard');
const stringCheckboxes = document.querySelectorAll('#strings-select input[type=checkbox]');

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
  const noteIndex = chromatic.indexOf(note);
  const a4Index = 9 + 12 * 4;
  const currentIndex = noteIndex + 12 * octave;
  return 440 * Math.pow(2, (currentIndex - a4Index) / 12);
}


//AUDIO
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


//HIGHLIGHT notes
function highlightNote(stringNum, fretNum, note) {
  const cell = document.querySelector(`.fret[data-string="${stringNum}"][data-fret="${fretNum}"]`);
  if (cell) {
    cell.classList.add('highlight');
    cell.style.backgroundColor = colors[note[0]] || '#fff';
    cell.style.color = '#000';

    

  }
}

function clearHighlights() {
  document.querySelectorAll('.fret.highlight').forEach(cell => {
    cell.classList.remove('highlight');

    const noteText = cell.querySelector('.note-main')?.textContent || '';
    const baseColor = colors[noteText[0]] || '#666';

    cell.style.backgroundColor = `${baseColor}22`; // відновлюємо тьмяний фон
    cell.style.color = 'white';
  });
}

function getSelectedStrings() {
  const selected = Array.from(stringCheckboxes).filter(cb => cb.checked).map(cb => parseInt(cb.value));
  return selected.length ? selected : [1];
}



// Допоміжна функція: повертає нормалізовану ноту (без альтернативної нотації).
function normalizeNote(note) {
  // Якщо в ноті є знак "/" (наприклад, "A#/Bb"), повертаємо перший варіант ("A#")
  return note.includes('/') ? note.split('/')[0] : note;
}

// Масив нормалізованих нот для розрахунків (без альтернативних варіантів)
const normalizedChromatic = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Обчислює гамму (масив нормалізованих нот) за заданою основою та типом (major або minor)
function computeScale(root, mode) {
  // Використовуємо стандартний інтервальний розподіл:
  // Major: [2, 2, 1, 2, 2, 2, 1]
  // Minor: [2, 1, 2, 2, 1, 2, 2]
  const intervals = mode === 'major' ? [2, 2, 1, 2, 2, 2, 1] : [2, 1, 2, 2, 1, 2, 2];
  let scale = [root];
  let index = normalizedChromatic.findIndex(n => n === root);
  intervals.forEach(step => {
    index = (index + step) % 12;
    scale.push(normalizedChromatic[index]);
  });
  return scale;
}






//FRETBOARD
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

      // ✳️ Додати спеціальний клас для відкритої струни
      if (fret === 0) {
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




//SCALES

const scalePatterns = {
  major: [2, 2, 1, 2, 2, 2, 1],
  minor: [2, 1, 2, 2, 1, 2, 2],
  harmonicMinor: [2, 1, 2, 2, 1, 3, 1],
  melodicMinor: [2, 1, 2, 2, 2, 2, 1],
  pentatonicMajor: [2, 2, 3, 2, 3],       // 5 нот
  pentatonicMinor: [3, 2, 2, 3, 2],
  blues: [3, 2, 1, 1, 3, 2],              // 6 нот, включає блюзову ноту
  dorian: [2, 1, 2, 2, 2, 1, 2],
  phrygian: [1, 2, 2, 2, 1, 2, 2],
  lydian: [2, 2, 2, 1, 2, 2, 1],
  mixolydian: [2, 2, 1, 2, 2, 1, 2],
  locrian: [1, 2, 2, 1, 2, 2, 2]
};
function computeFullScaleAllOctaves(rootNote, mode) {
  const normalizedChromatic = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const rootNorm = normalizeNote(rootNote);
  const intervals = scalePatterns[mode] || scalePatterns['major'];

  const allNotes = [];

  // 💡 Ми проскануємо гаму в діапазоні октав 1–7 (для надійності)
  for (let octave = 1; octave <= 7; octave++) {
    for (let chromIndex = 0; chromIndex < 12; chromIndex++) {
      const currentNote = normalizedChromatic[chromIndex];
      const base = { note: currentNote, octave };

      // Якщо ця нота — тоніка нашої гами
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


function handleCellClick(stringData, fret) {
  const { note, octave } = getNoteAndOctave(stringData.note, stringData.octave, fret);
  const frequency = getFrequency(note, octave);
  playNote(frequency);

  const scaleModeEnabled = document.getElementById('scale-mode-checkbox')?.checked;
  if (!scaleModeEnabled) return;

  const scaleType = document.getElementById('scale-type-select')?.value || 'major';
  const showFull = document.getElementById('show-full-scale-checkbox')?.checked;
const scaleNotes = showFull
  ? computeFullScaleAllOctaves(note, scaleType)
  : computeFullScale(note, octave, scaleType); 

  document.querySelectorAll('.fret').forEach(cell => {
    const cellString = parseInt(cell.dataset.string);
    const cellFret = parseInt(cell.dataset.fret);
    const stringObj = openNotes.find(s => s.string === cellString);
    const { note: cellNote, octave: cellOctave } = getNoteAndOctave(stringObj.note, stringObj.octave, cellFret);
    const normNote = normalizeNote(cellNote);

    const match = scaleNotes.some(s => s.note === normNote && s.octave === cellOctave);
    if (match) {
      cell.classList.add('highlight');
      cell.style.backgroundColor = colors[normNote[0]] || '#fff';
      cell.style.color = '#000';
    }
  });

  // Після 1.5 секунд видаляємо підсвічування
  //setTimeout(clearHighlights, 1500);
}

function normalizeNote(note) {
  return note.includes('/') ? note.split('/')[0] : note;
}

// НОВА версія з октавами
function computeFullScale(rootNote, rootOctave, mode) {
  const intervals = scalePatterns[mode] || scalePatterns['major'];
  const normalizedChromatic = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
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

createFretboard();

document.getElementById('clear-button').addEventListener('click', clearHighlights);

