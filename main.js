/**************** Pomodoro ****/
// function Utilities(){/*...*/}

function App (){
  this.id = null
}
App.prototype.render = function (element, container) {
  const node = document.querySelector(container)
  node.innerHTML = element
};

/*************** Initial Component *****/
function RootComponent(){
  this.component = '<div class="input"></div><section class="list"></section>'
}

/**************** Input Task *****/
const InputTask = function () {
  this.addButton = null
  this.component = `
    <form>
      <span>Agregar nueva Tarea</span>
      <input type="text" spellcheck="false">
      <span class="validator"></span>
      <button id="addTaskBtn">+Add Task</button>
    </form>`
};
InputTask.prototype = Object.create(App.prototype)

InputTask.prototype.createNextNode = function () {
  const div = document.createElement("div")
  div.classList.add("task")
  div.classList.add(`task-${this.id}`)
  const list = document.querySelector(".list")
  list.append(div)
};
InputTask.prototype.addNewTaskContainer = function(e){
  const input = document.querySelector("input")
  const taskDescription = input.value
  this.id = Math.random().toString(36).substr(2, 5)
  let patron = /^\s*$/ /** validar entrada en blanco */
  if (patron.test(taskDescription)) {
    const validator = document.querySelector(".validator")
    validator.replaceChildren("")
    validator.append("Debe ingresar una Tarea!")
  } else {
    const stateMessage = "Esperando..."
    const newTask = new TaskContainer(stateMessage, input.value, this.id)
    this.createNextNode()
    this.render(newTask.component, `.task-${this.id}`)
    newTask.clock.state = new Stopped(this.id)
    newTask.clock.state.context.newData(this.id)
    newTask.clock.state.execute()
    input.value = "" /** Limpia el input */
    newTask.listen()
  }
};
InputTask.prototype.addButtonListener = function () {
  this.addButton.addEventListener("click", (e) => {
    e.preventDefault()
    //console.log("It Works")
    this.addNewTaskContainer()
  });
};
InputTask.prototype.keyDetect = function () {
  document.querySelector("input").addEventListener("keypress", _ => {
    document.querySelector(".validator").replaceChildren("")
  });
};
InputTask.prototype.listen = function(){
  this.keyDetect();
};

/**************** Task Container ****/
const TaskContainer = function (stateMessage, taskDescription, id) {
  this.id = id
  this.stateMessage = stateMessage
  this.taskDescription = taskDescription
  this.clock = new Clock(this.id)
  this.component = `
    <div class="close close-task-${this.id}">X</div>
    <div id="state-${this.id}" class="paused">${this.stateMessage}</div>
    <div class="description">${this.taskDescription}</div>
    ${this.clock.component}
`;
};
TaskContainer.prototype.close = function () {
  const node = document.querySelector(`.close-task-${this.id}`);
  node.addEventListener("click", () => {
    const stopped = new Stopped(this.id)
    stopped.execute();
    const parent = node.parentNode
    const grandPa = parent.parentNode
    grandPa.removeChild(parent)
  });
};
TaskContainer.prototype.listen=function(){
  this.close()
  this.clock.listen()
};

/******************* Clock ****/
function Clock(id){
  this.id = id
  this.startBtn = null
  this.pauseBtn = null
  this.stopBtn = null
  this.state = null /*Initial State*/
  this.component = `
    <div id="clock">
      <div class="display display-${this.id}">
        <span id="minutes-${this.id}">00</span>
        <span>:</span>
        <span id="seconds-${this.id}">00</span>
      </div>
      <div class="btns">
        <button class="startBtn start-${this.id}">Start</button>
        <button class="pauseBtn pause-${this.id}">Pause</button>
        <button class="stopBtn stop-${this.id}">Stop</button>
      </div>
    </div>
  `
}
/******************* Methods ****/
Clock.prototype.startListener=function(){
  this.startBtn = document.querySelector(`.start-${this.id}`)
  this.startBtn.addEventListener('click', () => {
    console.log('Started!');
    if(this.state.context.getStopped(this.id) || this.state.context.getPaused(this.id)){
      const started = new Started(this.id)
      this.state = started
      this.state.execute()
      const span = document.querySelector(`#state-${this.id}`)
      span.textContent="Ejecutando..."
      span.className="executing"
    }
  })
}
Clock.prototype.pauseListener=function(){
  this.pauseBtn = document.querySelector(`.pause-${this.id}`)
  this.pauseBtn.addEventListener('click', ()=>{
    console.log('Paused!');
    if(this.state.context.getStarted(this.id)){
      const paused = new Paused(this.id)
      this.state = paused
      this.state.execute()
      const span = document.querySelector(`#state-${this.id}`)
      span.textContent="Pausado"
      span.className="paused"

    }
  })
}
Clock.prototype.stopListener=function(){
  this.stopBtn = document.querySelector(`.stop-${this.id}`)
  this.stopBtn.addEventListener('click', ()=>{
    console.log('Stopped!');
    if(this.state.context.getStarted(this.id)){
      const stopped = new Stopped(this.id)
      this.state=stopped
      this.state.execute();
      const span = document.querySelector(`#state-${this.id}`)
      span.textContent="Detenido!"
      span.className="stopped"
    }
  })
}
Clock.prototype.listen=function(){
  this.startListener()
  this.pauseListener()
  this.stopListener()
};

/****************************************** Display Prototype ***/
function Display(){
  this.displaySec = null
  this.displayMin = null
}
Display.prototype.renderSec=function(sec){
  this.displaySec.replaceChildren( sec<10?`0${sec}`:sec )
}
Display.prototype.renderMin=function(min){
  this.displayMin.replaceChildren( min<10?`0${min}`:min )
}

/*** States Machine ***/
function StateContext(){ /* Singleton class for clock's resources*/
  var context = null

  var getState = function(){
    if(this.context==null)
      this.context = createInstance()
    return this.context
  }

  var createInstance = function(){
    return {
      data:{},
      newData: function(key){
        this.data[key]={states:[false,false,true]}
      },
      newDisplay: function(key){
        const display = new Display()
        display.displayMin = document.querySelector(`#minutes-${key}`)
        display.displaySec = document.querySelector(`#seconds-${key}`)
        this.data[key].display = display;
      },
      show: function(){
        console.log("Data: ", this.data);
      },
      renderSec: function(key, sec){
        taskData = this.data[key]
        taskData.display.renderSec(sec)
      },
      renderMin: function(key, min){
        taskData = this.data[key]
        taskData.display.renderMin(min)
      },
      setStates: function(key, started, paused, stopped){
        const taskData = this.data[key]
        taskData.states = [started, paused, stopped]
      },
      setMinutes: function(key, min){
        taskData = this.data[key]
        taskData.minutes = min
      },
      setSeconds: function(key, sec){
        taskData = this.data[key]
        taskData.seconds = sec
      },
      getData: function(key){
        return this.data[key]
      },
      getStarted: function(key){
        const taskData = this.data[key]
        const started = taskData.states[0]
        return started
      },
      getPaused: function(key){
        const taskData = this.data[key]
        const paused = taskData.states[1]
        return paused
      },
      getStopped: function(key){
        const taskData = this.data[key]
        const stopped = taskData.states[2]
        return stopped
      },
      getMinutes: function(key){
        const taskData = this.data[key]
        const minutes = taskData.minutes
        return minutes
      },
      getSeconds: function(key){
        const taskData = this.data[key]
        const seconds = taskData.seconds
        return seconds
      },
      renderMin: function(key, min){
        const taskData = this.data[key]
        taskData.display.renderMin(min)
      },
      renderSec: function(key, sec){
        const taskData = this.data[key]
        taskData.display.renderSec(sec)
      }
    }
  }
  return getState()
}

/************************ Started Prototype ****/
function Started(id){
  this.id = id
  this.context = new StateContext()
  this.started = context.getStarted(this.id)
  this.context.setStates(this.id, true, false, false)
}
/*** Methods ***/ 
Started.prototype.execute = function(){
  let minutes = this.context.getMinutes(this.id)
  let seconds = this.context.getSeconds(this.id)
  this.context.setStates(this.id, true, false, false)
  this.context.newDisplay(this.id)
  const startTopDown = () => {
      if(seconds==0){
          if(minutes==0){
              clearInterval(timeInterval)
              const span = document.querySelector(`#state-${this.id}`)
              span.textContent="Finalizado!"
              span.className="done"
              document.querySelector(`.start-${this.id}`).disabled = true
              document.querySelector(`.pause-${this.id}`).disabled = true
              document.querySelector(`.stop-${this.id}`).disabled = true
          }else{
              minutes--
              seconds=60
              seconds--
          }
         this.context.renderMin(this.id, minutes)
      } else {
          seconds--
      }
      if(this.context.getStopped(this.id) || this.context.getPaused(this.id)){
          clearInterval(timeInterval)
      } else {
          this.context.renderSec(this.id, seconds) 
      }
      console.log(`Ejecutando - ${this.id}`);
  }
  const timeInterval = setInterval(startTopDown, 1000)
}

/************************** Paused Prototype ****/
function Paused(id){
  this.id = id
  this.context = new StateContext()
  this.context.setStates(this.id,false,true,false)
}
/*** Methods ***/
Paused.prototype.execute = function(){
  this.updateTime()
}
Paused.prototype.updateTime = function(){
  this.context.setMinutes(this.id, parseInt(document.querySelector(`#minutes-${this.id}`).textContent));
  this.context.setSeconds(this.id, parseInt(document.querySelector(`#seconds-${this.id}`).textContent));
}

/*************************** Stopped Prototye ****/
function Stopped(id){
  this.id = id
  this.context = new StateContext()
}
/*** Methods ***/
Stopped.prototype.execute = function(){
  this.context.setStates(this.id, false, false, true)
  this.context.setMinutes(this.id, 2)
  this.context.setSeconds(this.id, 0)
  this.context.newDisplay(this.id)
  this.context.renderMin(this.id, 2)
  this.context.renderSec(this.id, 0)
}

/******************* Main ****/
function main() {
  /** Objects */
  const app =  new App()
  const root = new RootComponent()
  const input = new InputTask()

  /** Render First */
  app.render(root.component, "#app")
  app.render(input.component, ".input")
  
  /** Start initial methods */
  input.listen()
  input.addButton = document.getElementById("addTaskBtn")
  input.addButtonListener()
}
main();

