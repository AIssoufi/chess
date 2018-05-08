export default function consoleLog() {
  const consoleCopie = document.querySelector(".console-log");
  const log = console.log;
  console.log = function() {
    log.apply(console, arguments);
    const div = document.createElement("div");
    div.textContent = `${new Date()} > ${arguments[0]}`;
    consoleCopie.appendChild(div);
  }
}