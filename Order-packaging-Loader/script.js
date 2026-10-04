/* =========================
   ELEMENTS
========================= */

const track =
  document.getElementById("track");

const crane =
  document.getElementById("crane");

const claw =
  document.getElementById("claw");

const pkg =
  claw.querySelector(".package");

const tmpl =
  document.getElementById("box-template");


/* =========================
   POSITIONS
========================= */

const SLOT_ENTRY = -90;

const SLOT0 = 14;

const SLOT1 = 184;

const SLOT2 = 354;

const SLOT_EXIT = 460;


/* =========================
   BOX STORAGE
========================= */

let boxes = [];


/* =========================
   DELAY
========================= */

function wait(ms){

  return new Promise(
    resolve => setTimeout(resolve,ms)
  );

}


/* =========================
   CREATE BOX
========================= */

function makeBox(
  left,
  instant,
  isOpen
){

  const el =
    tmpl.content
      .firstElementChild
      .cloneNode(true);


  if(instant){

    el.style.transition =
      "none";

  }


  el.style.left =
    left + "px";


  if(isOpen){

    el.classList.add("open");

  }


  track.appendChild(el);


  if(instant){

    void el.offsetWidth;

    el.style.transition = "";

  }


  return el;

}


/* =========================
   INITIAL BOXES
========================= */

function initBoxes(){

  boxes = [

    makeBox(
      SLOT0,
      true,
      false
    ),

    makeBox(
      SLOT1,
      true,
      true
    ),

    makeBox(
      SLOT2,
      true,
      false
    )

  ];


  /*
    The right box already
    contains a package.
  */

  boxes[2]
    .classList
    .add("filled");

}


/* =========================
   FILL MIDDLE BOX
========================= */

async function fillAtSlot1(box){

  /*
    Loaded package waits
  */

  await wait(220);


  /*
    Crane descends
  */

  crane.classList.add("lower");

  await wait(420);


  /*
    Small pause
  */

  await wait(150);


  /*
    Claw opens
  */

  claw.classList.add("release");

  await wait(60);


  /*
    Package falls
  */

  pkg.classList.remove("loaded");

  pkg.classList.add("falling");


  await wait(320);


  /*
    Package has landed
  */

  box.classList.add("filled");


  pkg.classList.remove("falling");


  /*
    Empty claw pause
  */

  await wait(210);


  /*
    Claw closes
  */

  claw.classList.remove("release");

  await wait(110);


  /*
    Crane rises
  */

  crane.classList.remove("lower");

  await wait(420);


  /*
    Fresh package appears
  */

  await wait(190);

  pkg.classList.add("loaded");

  await wait(220);

}


/* =========================
   CLOSE RIGHT BOX
========================= */

async function closeAtSlot2(box){

  /*
    Close the flaps
  */

  box.classList.remove("open");

  await wait(350);


  /*
    Add ribbon
  */

  box.classList.add("gift");

  await wait(190);

}


/* =========================
   MOVE CONVEYOR
========================= */

async function shiftConveyor(){

  const leaving =
    boxes[2];


  /*
    Existing finished box
    moves off screen
  */

  leaving.style.left =
    SLOT_EXIT + "px";


  /*
    Other boxes shift
  */

  boxes[1].style.left =
    SLOT2 + "px";


  boxes[0].style.left =
    SLOT1 + "px";


  /*
    New box enters
  */

  const incoming =
    makeBox(
      SLOT_ENTRY,
      true,
      false
    );


  requestAnimationFrame(() => {

    incoming.style.left =
      SLOT0 + "px";

  });


  boxes = [

    incoming,
    boxes[0],
    boxes[1]

  ];


  /*
    Wait for conveyor
  */

  await wait(500);


  /*
    Remove old box
  */

  leaving.remove();


  /*
    New box opens
  */

  incoming.classList.add("open");


  await wait(500);

}


/* =========================
   MAIN LOOP
========================= */

async function loop(){

  initBoxes();


  /*
    First box opens
  */

  await wait(220);

  boxes[0]
    .classList
    .add("open");


  await wait(450);


  /*
    Infinite packing cycle
  */

  while(true){

    await Promise.all([

      fillAtSlot1(
        boxes[1]
      ),

      closeAtSlot2(
        boxes[2]
      )

    ]);


    await shiftConveyor();

  }

}


/* =========================
   START
========================= */

loop();
