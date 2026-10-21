export default function consoleLog() {
  const consoleCopy = document.querySelector('.console-log');
  const log = console.log;
  console.log = function () {
    log.apply(console, arguments);
    const div = document.createElement('div');
    const now = new Date();
    const formattedTime = now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
    div.textContent = `${formattedTime} > ${arguments[0]}`;
    consoleCopy.appendChild(div);
    consoleCopy.scrollTop = consoleCopy.scrollHeight;
  };
}
