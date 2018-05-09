export default function consoleLog() {
  const consoleCopie = document.querySelector(".console-log");
  const log = console.log;
  console.log = function() {
    log.apply(console, arguments);
    const div = document.createElement("div");
    const dateCoutante = new Date();
    const dateFormatee = dateCoutante.getHours() + ":"  
                + dateCoutante.getMinutes() + ":" 
                + dateCoutante.getSeconds();
    div.textContent = `${dateFormatee} > ${arguments[0]}`;
    consoleCopie.appendChild(div);
    consoleCopie.scrollTop = consoleCopie.scrollHeight;
  }
}