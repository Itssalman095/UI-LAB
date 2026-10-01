(() => {
  const $ = s => document.querySelector(s);
  const stage = $('#send'), body = $('.body'), pill = $('.pill'), label = $('.label'),
        plane = $('.plane'), back = $('.plane-back'), arc = $('.arc'), check = $('.check'),
        sent = $('.sent'), sentText = $('.sent span'), ripple = $('.ripple'),
        hint = $('#hint'), status = $('#status');

  const SPEED = 1.7; // higher = slower
  const k = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : SPEED; // 0 = jump to end state
  let state = 'idle', anims = [];

  // Every animation holds its end frame; before its delay the CSS base state shows.
  const play = (el, frames, o) => {
    const a = el.animate(frames, {
      fill: 'forwards', easing: 'cubic-bezier(.45,0,.25,1)', ...o,
      duration: o.duration * k, delay: (o.delay || 0) * k
    });
    anims.push(a);
    return a;
  };

  function send(e) {
    state = 'running';
    hint.textContent = '';

    // touch ripple at the click point
    const r = pill.getBoundingClientRect();
    ripple.style.left = (e.detail ? e.clientX - r.left : r.width / 2) + 'px';
    ripple.style.top  = (e.detail ? e.clientY - r.top  : r.height / 2) + 'px';
    play(ripple, [
      { transform: 'translate(-50%,-50%) scale(.3)', opacity: .9 },
      { transform: 'translate(-50%,-50%) scale(1.8)', opacity: 0 }
    ], { duration: 450 });

    // 1. press
    play(pill, [{ transform: 'scale(1)' }, { transform: 'scale(.95,.9)' }, { transform: 'scale(1)' }], { duration: 220 });
    play(label, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.4)', opacity: 0 }], { delay: 80, duration: 260 });

    // 2. blue plane launches up and off to the right
    play(plane, [
      { transform: 'translate(-54px,0) rotate(0deg) scale(1)', color: '#4a63e7', opacity: 1 },
      { transform: 'translate(-40px,-64px) rotate(8deg) scale(1.15)', color: '#ffffff', opacity: 1, offset: .4 },
      { transform: 'translate(130px,-150px) rotate(25deg) scale(.6)', color: '#ffffff', opacity: 0 }
    ], { delay: 100, duration: 520 });

    // 3. button wobbles into a circle
    play(pill, [
      { width: '200px', height: '58px', borderRadius: '12px', transform: 'rotate(0deg)' },
      { width: '214px', height: '48px', borderRadius: '10px', transform: 'rotate(-7deg)', offset: .3 },
      { width: '112px', height: '72px', borderRadius: '30px', transform: 'rotate(7deg)', offset: .65 },
      { width: '76px',  height: '76px', borderRadius: '38px', transform: 'rotate(0deg)' }
    ], { delay: 300, duration: 650 });

    // 4. white plane loops round the circle, streak follows it
    play(back, [
      { transform: 'translate(120px,-90px) rotate(170deg) scale(.6)', opacity: 0 },
      { transform: 'translate(105px,-40px) rotate(185deg) scale(1)', opacity: 1, offset: .2 },
      { transform: 'translate(70px,45px) rotate(225deg) scale(1.15)', opacity: 1, offset: .5 },
      { transform: 'translate(0px,74px) rotate(300deg) scale(1.15)', opacity: 1, offset: .78 },
      { transform: 'translate(0px,26px) rotate(360deg) scale(.55)', opacity: 0 }
    ], { delay: 480, duration: 720 });
    play(arc, [
      { transform: 'rotate(-100deg)', opacity: 0 },
      { transform: 'rotate(20deg)', opacity: 1, offset: .35 },
      { transform: 'rotate(200deg)', opacity: 0 }
    ], { delay: 450, duration: 800 });

    // 5. check pops up from the bottom of the circle
    play(check, [
      { transform: 'translateY(44px) rotate(-12deg) scale(.7)', opacity: 0 },
      { opacity: 1, offset: .25 },
      { transform: 'translateY(0) rotate(0deg) scale(1)', opacity: 1 }
    ], { delay: 1150, duration: 450, easing: 'cubic-bezier(.34,1.56,.64,1)' });

    // blob / jelly effect when the plane lands inside the circle
    play(pill, [
      { transform: 'scale(1)', borderRadius: '38px' },
      { transform: 'scale(1.14,.84)', borderRadius: '46% 54% 42% 58% / 58% 42% 58% 42%', offset: .25 },
      { transform: 'scale(.9,1.12)', borderRadius: '56% 44% 54% 46% / 44% 56% 44% 56%', offset: .5 },
      { transform: 'scale(1.05,.96)', borderRadius: '44% 56% 48% 52% / 52% 48% 56% 44%', offset: .75 },
      { transform: 'scale(1)', borderRadius: '38px' }
    ], { delay: 1100, duration: 700, easing: 'ease-in-out' });

    // 6. circle slides left, "Sent!" pill grows out behind it
    play(body, [{ transform: 'translateX(0)' }, { transform: 'translateX(-66px)' }],
      { delay: 1800, duration: 520, easing: 'cubic-bezier(.5,0,.2,1)' });
    play(sent, [
      { transform: 'translateX(19px) scaleX(0)' },
      { transform: 'translateX(19px) scaleX(1)' }
    ], { delay: 1800, duration: 520, easing: 'cubic-bezier(.5,0,.2,1)' });
    play(sentText, [{ opacity: 0, transform: 'translateX(-10px)' }, { opacity: 1, transform: 'translateX(0)' }],
      { delay: 2150, duration: 300 });

    Promise.all(anims.map(a => a.finished)).then(() => {
      state = 'done';
      stage.setAttribute('aria-label', 'Sent. Activate to reset');
      status.textContent = 'Sent!';
      hint.textContent = 'Click to reset';
    }).catch(() => {});
  }

  function reset() {
    anims.forEach(a => a.cancel());
    anims = [];
    state = 'idle';
    stage.setAttribute('aria-label', 'Send');
    status.textContent = '';
    hint.textContent = 'Click to send';
  }

  stage.addEventListener('click', e => {
    if (state === 'idle') send(e);
    else if (state === 'done') reset();
  });
})();
