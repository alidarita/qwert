const slides = Array.from(document.querySelectorAll('.slide'));
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const titleHolder = document.getElementById('slideTitle');
let idx = 0;

function render() {
  slides.forEach((slide, i) => slide.classList.toggle('active', i === idx));
  prevBtn.disabled = idx === 0;
  nextBtn.disabled = idx === slides.length - 1;
  titleHolder.textContent = slides[idx].dataset.title || '';
}

prevBtn.addEventListener('click', () => {
  if (idx > 0) {
    idx--;
    render();
  }
});

nextBtn.addEventListener('click', () => {
  if (idx < slides.length - 1) {
    idx++;
    render();
  }
});

// Support arrow keys
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') nextBtn.click();
  if (e.key === 'ArrowLeft') prevBtn.click();
});

render(); 