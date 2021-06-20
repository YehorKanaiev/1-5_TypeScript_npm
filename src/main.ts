import moment from 'moment';

const RELOAD_DELAY: number = 200; // ms
const MINUTE: number = 60; // s
const ON_WORK_LABEL: string = 'Осталось';
const WAIT_LABEL: string = 'Укажите время в минутах';

const startButton = document.getElementById('startButton');
const plusButton = document.getElementById('plusButton');
const minusButton = document.getElementById('minusButton');
const display = document.getElementById('display');
const timerDescription = document.getElementById('timerDescription');
let isBlocked: boolean = false;

plusButton.addEventListener('click', (): void => {
  if (isBlocked) {
    return;
  }
  display.innerText = String(parseInt(display.innerText, 10) + 1);
});

minusButton.addEventListener('click', (): void => {
  if (isBlocked) {
    return;
  }
  const currentValue: number = parseInt(display.innerText, 10);
  if (currentValue > 0) {
    display.innerText = String(currentValue - 1);
  }
});

startButton.addEventListener('click', (): void => {
  if (isBlocked) {
    return;
  }
  isBlocked = true;
  const duration: number = parseInt(display.innerText, 10);
  const startTime: number = moment().unix();
  const endTime: number = startTime + duration * MINUTE;

  let counter: number = 0;
  display.innerText = moment.unix(duration * MINUTE).format('mm:ss');
  timerDescription.innerText = ON_WORK_LABEL;

  function countTime(): void {
    const currentTime: number = moment().unix();
    if (currentTime < endTime) {
      if (currentTime - startTime > counter) {
        counter += 1;
        display.innerText = moment
          .unix(duration * MINUTE - counter)
          .format('mm:ss');
      }
      setTimeout(countTime, RELOAD_DELAY);
    } else {
      timerDescription.innerText = WAIT_LABEL;
      display.innerText = String(duration);
      isBlocked = false;
    }
  }

  countTime();
});
