(function(){
  const STORAGE_KEY = 'ontime_schedules_v2';
  const bnMonths = ["SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER","JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST"];
  const monthNamesEn = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
  const weekdayShort = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

  let today = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth(); // 0-indexed
  let selectedDateKey = fmtKey(today);
  let currentTab = 'schedule';

  function fmtKey(d){
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function parseKey(key){
    const [y,m,d] = key.split('-').map(Number);
    return new Date(y, m-1, d);
  }

  // ---- Data layer ----
  function loadData(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : seedData();
    }catch(e){ return seedData(); }
  }
  function saveData(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
  }
  function seedData(){
    const y = today.getFullYear(), m = today.getMonth(), d = today.getDate();
    const k = fmtKey(new Date(y,m,d));
    return {
      [k]: [
        {id: cryptoId(), title:"Design Review with Product Team", start:"10:00", end:"11:30", place:"Studio Room 2", notes:"Walk through the new onboarding flow before the client call", done:false},
        {id: cryptoId(), title:"Coffee with Sarah", start:"17:00", end:"", place:"Blue Bottle, 5th Ave", notes:"Catch up and talk through the freelance project timeline", done:false}
      ]
    };
  }
  function cryptoId(){
    return 'e' + Math.random().toString(36).slice(2,10) + Date.now().toString(36);
  }

  let schedules = loadData();

  // ---- Clock ----
  function updateClock(){
    const now = new Date();
    let h = now.getHours(), m = now.getMinutes();
    const ampm = h>=12 ? 'pm':'am';
    h = h%12; if(h===0) h=12;
    document.getElementById('clock').textContent = h+':'+String(m).padStart(2,'0');
  }
  updateClock(); setInterval(updateClock, 30000);

  // ---- Calendar rendering ----
  function daysInMonth(y,m){ return new Date(y, m+1, 0).getDate(); }

  function renderMonthTitle(){
    document.getElementById('monthTitle').textContent = monthNamesEn[viewMonth] + ' ' + viewYear;
  }

  function renderCalendar(){
    renderMonthTitle();
    const grid = document.getElementById('dayGrid');
    grid.innerHTML = '';

    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    const totalDays = daysInMonth(viewYear, viewMonth);
    const prevMonthDays = daysInMonth(viewYear, viewMonth===0?11:viewMonth-1);

    const cells = [];
    // leading muted days
    for(let i=firstDow-1;i>=0;i--){
      cells.push({num: prevMonthDays-i, muted:true, y:viewMonth===0?viewYear-1:viewYear, m:viewMonth===0?11:viewMonth-1});
    }
    // current month days
    for(let d=1; d<=totalDays; d++){
      cells.push({num:d, muted:false, y:viewYear, m:viewMonth});
    }
    // trailing muted days to complete rows (multiple of 7)
    let next = 1;
    while(cells.length % 7 !== 0){
      cells.push({num: next++, muted:true, y:viewMonth===11?viewYear+1:viewYear, m:viewMonth===11?0:viewMonth+1});
    }

    cells.forEach((c, idx)=>{
      const dow = idx % 7;
      const cellDate = new Date(c.y, c.m, c.num);
      const key = fmtKey(cellDate);
      const isToday = fmtKey(today) === key;
      const isSelected = selectedDateKey === key;
      const hasEvents = schedules[key] && schedules[key].length>0;

      const wrap = document.createElement('div');
      wrap.className = 'day-cell';

      const num = document.createElement('div');
      num.className = 'day-num';
      if(c.muted) num.classList.add('muted');
      if(dow===0) num.classList.add('sunday');
      if(isToday && !c.muted) num.classList.add('today');
      if(isSelected) num.classList.add('selected');
      if(hasEvents && !isSelected) wrap.classList.add('has-dot');
      num.textContent = c.num;

      num.addEventListener('click', ()=>{
        selectedDateKey = key;
        if(c.muted){
          viewYear = c.y; viewMonth = c.m;
        }
        renderCalendar();
        renderScheduleList();
      });

      wrap.appendChild(num);
      grid.appendChild(wrap);
    });
  }

  // ---- Schedule list for selected day ----
  function dateLabel(key){
    const d = parseKey(key);
    const isToday = fmtKey(today) === key;
    const opts = {day:'numeric', month:'long', year:'numeric'};
    const str = d.toLocaleDateString('en-US', opts);
    return isToday ? "Today's Schedule" : str + "'s Schedule";
  }

  function fmtTimeRange(s,e){
    function conv(t){
      if(!t) return '';
      let [h,m] = t.split(':').map(Number);
      const ap = h>=12?'pm':'am';
      h = h%12; if(h===0) h=12;
      return h+'.'+String(m).padStart(2,'0')+' '+ap;
    }
    if(s && e) return conv(s)+' - '+conv(e);
    if(s) return conv(s);
    return 'No time set';
  }

  function renderScheduleList(){
    document.getElementById('scheduleDateLabel').textContent = dateLabel(selectedDateKey);
    const list = schedules[selectedDateKey] || [];
    document.getElementById('scheduleCount').textContent = list.length + (list.length===1?' item':' items');

    const container = document.getElementById('scheduleList');
    container.innerHTML = '';

    if(list.length === 0){
      container.innerHTML = `
        <div class="empty-state">
          <div class="glyph">🗓️</div>
          <p>No schedule for this day</p>
          <div class="sub">Tap the + button below to add a new schedule</div>
        </div>`;
      return;
    }

    const timeline = document.createElement('div');
    timeline.className = 'timeline';

    list.slice().sort((a,b)=> (a.start||'99').localeCompare(b.start||'99')).forEach(ev=>{
      const item = document.createElement('div');
      item.className = 'event-item';

      const dot = document.createElement('div');
      dot.className = 'event-dot';
      dot.textContent = parseKey(selectedDateKey).getDate();
      item.appendChild(dot);

      const card = document.createElement('div');
      card.className = 'event-card' + (ev.done ? ' done':'');

      const del = document.createElement('div');
      del.className = 'del-x';
      del.innerHTML = '✕';
      del.title = 'Delete';
      del.addEventListener('click', (e)=>{
        e.stopPropagation();
        schedules[selectedDateKey] = schedules[selectedDateKey].filter(x=>x.id!==ev.id);
        if(schedules[selectedDateKey].length===0) delete schedules[selectedDateKey];
        saveData();
        renderCalendar();
        renderScheduleList();
      });
      card.appendChild(del);

      const top = document.createElement('div');
      top.className = 'event-top';
      const title = document.createElement('div');
      title.className = 'event-title';
      title.textContent = ev.title;
      const check = document.createElement('div');
      check.className = 'check' + (ev.done ? ' checked':'');
      check.innerHTML = ev.done ? '✓' : '';
      check.addEventListener('click', (e)=>{
        e.stopPropagation();
        ev.done = !ev.done;
        saveData();
        renderScheduleList();
      });
      top.appendChild(title);
      top.appendChild(check);
      card.appendChild(top);

      const meta = document.createElement('div');
      meta.className = 'event-meta';
      meta.innerHTML = `
        <div class="label">Time</div><div class="val">${fmtTimeRange(ev.start, ev.end)}</div>
        <div class="label">Place</div><div class="val">${ev.place || 'Not specified'}</div>
        <div class="label">Notes</div><div class="val notes-val">${ev.notes ? escapeHtml(ev.notes) : 'Nothing'}</div>
      `;
      card.appendChild(meta);

      item.appendChild(card);
      timeline.appendChild(item);
    });

    container.appendChild(timeline);
  }

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- Note view ----
  function renderNoteList(filterText){
    const container = document.getElementById('noteList');
    container.innerHTML = '';
    const f = (filterText||'').trim().toLowerCase();

    // gather all events with a note, across all dates, sorted by date desc
    const keys = Object.keys(schedules).sort((a,b)=> b.localeCompare(a));
    let totalShown = 0;

    keys.forEach(key=>{
      const items = (schedules[key]||[]).filter(ev => ev.notes && ev.notes.trim().length>0);
      const matched = items.filter(ev=>{
        if(!f) return true;
        return (ev.title+' '+ev.notes+' '+(ev.place||'')).toLowerCase().includes(f);
      });
      if(matched.length===0) return;

      const label = document.createElement('div');
      label.className = 'note-group-label';
      const d = parseKey(key);
      label.textContent = d.toLocaleDateString('en-US', {day:'numeric', month:'long', year:'numeric'});
      container.appendChild(label);

      matched.forEach(ev=>{
        totalShown++;
        const card = document.createElement('div');
        card.className = 'note-card';
        card.innerHTML = `
          <div class="note-card-head">
            <div class="note-card-title">${escapeHtml(ev.title)}</div>
            <div class="note-card-date">${fmtTimeRange(ev.start, ev.end)}</div>
          </div>
          <div class="note-card-body">${escapeHtml(ev.notes)}</div>
        `;
        card.addEventListener('click', ()=>{
          selectedDateKey = key;
          const d2 = parseKey(key);
          viewYear = d2.getFullYear(); viewMonth = d2.getMonth();
          switchTab('schedule');
          renderCalendar();
          renderScheduleList();
        });
        container.appendChild(card);
      });
    });

    if(totalShown===0){
      container.innerHTML = `
        <div class="empty-state">
          <div class="glyph">📝</div>
          <p>${f ? 'No notes found' : 'No notes yet'}</p>
          <div class="sub">Notes you add to a schedule will show up here</div>
        </div>`;
    }
  }

  // ---- Tabs ----
  function switchTab(tab){
    currentTab = tab;
    document.querySelectorAll('.tab').forEach(t=> t.classList.toggle('active', t.dataset.tab===tab));
    document.getElementById('schedule-view').style.display = tab==='schedule' ? '' : 'none';
    document.getElementById('note-view').style.display = tab==='note' ? '' : 'none';
    if(tab==='note') renderNoteList(document.getElementById('noteSearch').value);
  }
  document.querySelectorAll('.tab').forEach(t=>{
    t.addEventListener('click', ()=> switchTab(t.dataset.tab));
  });

  document.getElementById('noteSearch').addEventListener('input', (e)=>{
    renderNoteList(e.target.value);
  });

  // ---- Month nav ----
  document.getElementById('prevMonth').addEventListener('click', ()=>{
    viewMonth--; if(viewMonth<0){viewMonth=11; viewYear--;}
    renderCalendar();
  });
  document.getElementById('nextMonth').addEventListener('click', ()=>{
    viewMonth++; if(viewMonth>11){viewMonth=0; viewYear++;}
    renderCalendar();
  });

  // ---- Modal ----
  const overlay = document.getElementById('modalOverlay');
  function openModal(){
    document.getElementById('modalDateSub').textContent =
      'For ' + parseKey(selectedDateKey).toLocaleDateString('en-US', {day:'numeric', month:'long', year:'numeric'});
    document.getElementById('inpTitle').value = '';
    document.getElementById('inpStart').value = '09:00';
    document.getElementById('inpEnd').value = '10:00';
    document.getElementById('inpPlace').value = '';
    document.getElementById('inpNotes').value = '';
    overlay.classList.add('open');
    setTimeout(()=> document.getElementById('inpTitle').focus(), 250);
  }
  function closeModal(){ overlay.classList.remove('open'); }

  document.getElementById('fabAdd').addEventListener('click', ()=>{
    if(currentTab === 'note') switchTab('schedule');
    openModal();
  });
  document.getElementById('btnCancel').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e)=>{ if(e.target===overlay) closeModal(); });

  document.getElementById('btnSave').addEventListener('click', ()=>{
    const title = document.getElementById('inpTitle').value.trim();
    if(!title){
      document.getElementById('inpTitle').focus();
      document.getElementById('inpTitle').style.borderColor = 'var(--danger)';
      return;
    }
    const ev = {
      id: cryptoId(),
      title,
      start: document.getElementById('inpStart').value,
      end: document.getElementById('inpEnd').value,
      place: document.getElementById('inpPlace').value.trim(),
      notes: document.getElementById('inpNotes').value.trim(),
      done: false
    };
    if(!schedules[selectedDateKey]) schedules[selectedDateKey] = [];
    schedules[selectedDateKey].push(ev);
    saveData();
    closeModal();
    renderCalendar();
    renderScheduleList();
  });

  // ---- init ----
  renderCalendar();
  renderScheduleList();
})();
