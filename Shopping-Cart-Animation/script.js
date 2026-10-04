// Each entry: an SVG path, a size, and a CSS class (item-1..item-6) that
  // sets its horizontal position (margin-left) and time delay in the CSS above.
  // Add, remove, or reorder items here -- just keep enough item-N classes in the CSS,
  // and re-tune the fallIntoCart keyframe distances if you resize the cart again.
  const ITEM_ICONS = [
    {
      size: 40,
      className: 'item-1',
      svg: '<path d="M16 3l5 3-2 4-3-1.5V21H8V8.5L5 10 3 6l5-3c0 1.7 1.8 3 4 3s4-1.3 4-3z"/>' // shirt
    },
    {
      size: 30,
      className: 'item-2',
      svg: '<path d="M17 7H7a5 5 0 0 0-4.8 6.4l.6 2A3 3 0 0 0 5.7 18a3 3 0 0 0 2.5-1.4L9 15h6l.8 1.6A3 3 0 0 0 18.3 18a3 3 0 0 0 2.9-2.6l.6-2A5 5 0 0 0 17 7z"/>' // game controller
    },
    

    {
      size: 40,
      className: 'item-4',
      svg: '<path d="M2 18c0-1.7 1.3-3 3-3 .6 0 1.1-.4 1.3-1L8 9.5C8.6 8 10 7 11.6 7H14a2 2 0 0 1 2 1.6l.7 3.4H19a3 3 0 0 1 3 3v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/>' // shoe
    },
    {
      size: 36,
      className: 'item-5',
      svg: '<path d="M4 8l8-5 8 5v3H4zM4 12h16v9H4z"/>' // gift box
    },
    
  ];

  const container = document.getElementById('items');

  ITEM_ICONS.forEach(icon => {
    const span = document.createElement('span');
    span.className = `fall-item ${icon.className}`;
    span.innerHTML = `
      <svg width="${icon.size}" height="${icon.size}" viewBox="0 0 24 24" fill="currentColor">
        ${icon.svg}
      </svg>`;
    container.appendChild(span);
  });
