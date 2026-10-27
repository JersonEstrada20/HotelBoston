const navToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
navToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
});
document.querySelectorAll('.nav a').forEach(link => link.addEventListener('click', () => nav.classList.remove('open')));

const slides = [...document.querySelectorAll('.slide')];
const dots = [...document.querySelectorAll('.slide-dots button')];
let current = 0;
function showSlide(index) {
  current = index;
  slides.forEach((slide, i) => slide.classList.toggle('active', i === current));
  dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
}
dots.forEach((dot, i) => dot.addEventListener('click', () => showSlide(i)));
setInterval(() => showSlide((current + 1) % slides.length), 6500);
document.querySelector('#year').textContent = new Date().getFullYear();
