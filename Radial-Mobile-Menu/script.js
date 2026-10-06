  const toggle = document.getElementById('menu-toggle');
  const radial = document.querySelector('.radial');
  const home   = document.getElementById('homeBtn');
  const prof   = document.getElementById('profileBtn');

  // Close on tapping a menu item
  radial.querySelectorAll('.menu-item').forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('Action tapped:', btn.dataset.name);
      toggle.checked = false;
    });
  });

  // Close on outside tap
  document.addEventListener('click', (e) => {
    if(toggle.checked && !radial.contains(e.target)){
      toggle.checked = false;
    }
  });

  // Bottom nav tab switching
  [home, prof].forEach(btn => {
    btn.addEventListener('click', () => {
      home.classList.remove('active');
      prof.classList.remove('active');
      btn.classList.add('active');
    });
  });
