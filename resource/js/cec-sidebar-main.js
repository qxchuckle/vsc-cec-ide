const activateButton = document.querySelector('#activation-button');
const notification = document.querySelector('#notification');

let canClick = true;

activateButton.addEventListener('click', () => {
  if (canClick) {
    notification.classList.add('show');
    canClick = false;

    setTimeout(() => {
      notification.classList.remove('show');
      canClick = true;
    }, 3000); // 停留3秒钟后消失
  }
});
