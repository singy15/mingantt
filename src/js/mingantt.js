import moment from 'moment';
import '../css/mingantt.css';

function getStorageDefault(key, defaultVal) {
  let item = localStorage.getItem("mingantt/"+key);
  return (item)? JSON.parse(item) : defaultVal;
}

function setStorageDefault(key, val) {
  localStorage.setItem("mingantt/"+key, JSON.stringify(val));
}

function setDraggable(elements){
  var x;
  var y;

  elements.map(el => {
    el.addEventListener("mousedown", mdown, false);
    el.addEventListener("touchstart", mdown, false);
  });

  function mdown(e) {
    e.target.classList.add("drag");

    if(e.type === "mousedown") {
        var event = e;
    } else {
        var event = e.changedTouches[0];
    }

    x = event.pageX - e.target.offsetLeft;
    y = event.pageY - e.target.offsetTop;

    document.body.addEventListener("mousemove", mmove, false);
    document.body.addEventListener("touchmove", mmove, false);
  }

  function mmove(e) {
    var drag = document.getElementsByClassName("drag")[0];

    if(e.type === "mousemove") {
        var event = e;
    } else {
        var event = e.changedTouches[0];
    }

    e.preventDefault();

    drag.style.top = event.pageY - y + "px";
    drag.style.left = event.pageX - x + "px";

    drag.addEventListener("mouseup", mup, false);
    document.body.addEventListener("mouseleave", mup, false);
    drag.addEventListener("touchend", mup, false);
    document.body.addEventListener("touchleave", mup, false);
  }

  function mup(e) {
    var drag = document.getElementsByClassName("drag")[0];

    document.body.removeEventListener("mousemove", mmove, false);
    drag.removeEventListener("mouseup", mup, false);
    document.body.removeEventListener("touchmove", mmove, false);
    drag.removeEventListener("touchend", mup, false);

    drag.classList.remove("drag");
  }
}

var mingantt = {
  data: function () {
    return {
      curday: moment(),
      curyear: moment().format("YYYY"),
      curyear2: moment().format("YY"),
      start_month: moment().add(-1, "months").format("YYYY-MM"),
      end_month: moment().add(2, "months").format("YYYY-MM"),
      block_size: 24,
      block_number: 0,
      calendars:[],
      inner_width: '',
      inner_height: '',
      task_width: '',
      task_height: '',
      today:moment(),
      tasks: [],
      position_id: 0,
      positionY: 0,
      dragging:false,
      pageX:'',
      elememt:'',
      left:'',
      task_id:'',
      width:'',
      leftResizing:false,
      rightResizing:false,
      task: '',
      show: false,
      showPref: false,
      formDefault: () => {
        return {
          taskId: '',
            subject: '',
            planStartDate: '',
            planEndDate: '',
            actualStartDate: '',
            actualEndDate: '',
            assignedUserId: '',
            progress: 0,
            planWorkload: 0,
            actualWorkload: 0,
            planWorkloadMap: "",
            content: "",
            parentTaskId: 0
        };
      },
      form: {
        taskId: '',
        subject: '',
        planStartDate: '',
        planEndDate: '',
        actualStartDate: '',
        actualEndDate: '',
        assignedUserId: '',
        progress: 0,
        planWorkload: 0,
        actualWorkload: 0,
        planWorkloadMap: "",
        content: "",
        parentTaskId: 0
      },
      update_mode: false,
      encodeFn: null,
      decodeFn: null,
      rowHeight: 20,
      onUpdateTask: null, // (updateInfo => { update: [...], delete: [...], insert: [...] }) => void
      onSelectTask: null,
      selectedTask: null,
      selections: [],
      notifyStyle: {
        position: "absolute",
        display: "none",
      },
      notifyMessage: "",
      collapseInfoSet: {},
      autoSetProgress: true,
      prefHideCompletedTask: getStorageDefault("prefHideCompletedTask", false),
      prefShowGuide: getStorageDefault("prefShowGuide", true),
      prefSetDefaultPlanDate: getStorageDefault("prefSetDefaultPlanDate", false),
      prefShowTaskStatistics: getStorageDefault("prefShowTaskStatistics", false),
      prefUseTimeSyntax: getStorageDefault("prefUseTimeSyntax", false),
      prefUseTimeSyntaxHoursOfDay: getStorageDefault("prefUseTimeSyntaxHoursOfDay", 8.0),
      showContextMenu: false,
      contextMenuLeft: 0,
      contextMenuTop: 0,
      contextMenu: [
        { 
          template: () => { 
            return `<span>+ ADD CHILD TASK</span>`; 
          },
          condition: (selections) => {
            return selections.length === 1; 
          },
          action: (event, selections) => {
            this.addChildTask();
          }
        }, 
        { 
          template: () => { return `<span>- DELETE TASK</span>`; }, 
          condition: (selections) => {
            return selections.length === 1; 
          },
          action: (event, selections) => {
            this.deleteTask(selections[0].taskId);
          }
        }, 
        { 
          template: () => { return `<span>* SET PARENT: <input class="mg-text-xs mg-w-12" onclick="event.stopPropagation()"/></span>`; }, 
          condition: (selections) => {
            return selections.length >= 1;
          },
          action: (event, selections) => {
            let val = event.target.querySelector("input").value;

            if(val == null || val === "" || val === undefined) {
              val = 0;
            } else {
              val = parseInt(val, 10);
            }

            if(val !== 0 && !(this.tasks.find(t => t.taskId === val))) {
              alert("Parent task not exists!");
              return;
            }

            selections.map(x => x.parentTaskId = val);

            if(this.onUpdateTask) {
              this.onUpdateTask({update: selections});
            }
          }
        }, 
      ],
      alarmTimeBegin: getStorageDefault("alarmTimeBegin", "00:00"),
      alarmTimeEnd: getStorageDefault("alarmTimeEnd", "00:00"),
      alarmProgress: 0,
      alarmRestPre: "",
      alarmRest: { h:0,m:0,s:0 },
      alarmDiff: 0
    };
  },
  template:
`
<div style="width:100%; height:100%;">
  <div :style="notifyStyle">
    {{ notifyMessage }}
  </div>

  <!-- Content -->
  <div id="gantt-content" class="mg-flex mg-h-full mg-w-full">
    <!-- List section -->
    <div id="gantt-task">
      <!-- Header -->
      <div id="gantt-task-title" class="mg-flex mg-items-center mg-bg-gray mg-text-white mg-h-15" ref="task">
        <div class="mg-col-header mg-border-l mg-border-r mg-w-12">ID</div>
        <div class="mg-col-header mg-border-r mg-w-96">Subject</div>
        <div class="mg-col-header mg-border-r mg-w-40">Pl/Term</div>
        <div class="mg-col-header mg-border-r mg-w-40">Ac/Term </div>
        <div class="mg-col-header mg-border-r mg-w-16">Assig.</div>
        <div class="mg-col-header mg-border-r mg-w-12">Pl/WL</div>
        <div class="mg-col-header mg-border-r mg-w-12">Ac/WL</div>
        <div class="mg-col-header mg-border-r mg-w-16" v-if="prefShowTaskStatistics">Stat Pl</div>
        <div class="mg-col-header mg-border-r mg-w-16" v-if="prefShowTaskStatistics">Stat Ac</div>
        <div class="mg-col-header mg-border-r mg-w-16" v-if="prefShowTaskStatistics">Stat Rst</div>
      </div>

      <div id="gantt-task-list" class="mg-overflow-y-hidden" :style="'height:' + 20 + 'px;' + 'border-bottom:solid 1px #CCC; box-sizing:border-box;'">
          <div class="mg-flex mg-items-center mg-w-full mg-text-xs mg-flex mg-items-center">
            <button @click="addTask" class="mg-bg-darkgray mg-text-white mg-px-4 mg-w-24 mg-flex mg-items-center mg-h-full mg-justify-center">
              <svg class="mg-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button @click="addChildTask" class="mg-bg-darkgray mg-text-white mg-px-4 mg-w-24 mg-flex mg-items-center mg-h-full mg-justify-center" style="margin-left:5px">
              <svg class="mg-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span class=" mg-text-xs">Sub</span>
            </button>
            <button @click="moveTask(-1)" class="mg-bg-darkgray mg-text-white mg-px-4 mg-w-16 mg-flex mg-items-center mg-h-full mg-justify-center" style="margin-left:5px">
              <svg class="mg-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <polyline points="0,18 12,6 24,18" stroke="currentColor" stroke-width="2" fill="none" />
              </svg>
            </button>
            <button @click="moveTask(1)" class="mg-bg-darkgray mg-text-white mg-px-4 mg-w-16 mg-flex mg-items-center mg-h-full mg-justify-center" style="margin-left:5px">
              <svg class="mg-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <polyline points="0,6 12,18 24,6" stroke="currentColor" stroke-width="2" fill="none" />
              </svg>
            </button>
            <button @click="showPref = true" class="mg-bg-darkgray mg-text-white mg-px-4 mg-w-24 mg-flex mg-items-center mg-h-full mg-justify-center" style="margin-left:5px">
              Preference
            </button>
          </div>
      </div>

      <div id="gantt-task-list" class="mg-overflow-y-hidden" :style="'height:' + (calendarViewHeight - rowHeight*2) + 'px;'">
        <div class="mg-flex mg-border-b mg-bg-lightgray" :style="'height:0px;' + 'margin-top:' + positionY + 'px;'"></div>
        <div v-for="(task,index) in displayTasks" :key="index" class="mg-flex mg-h-5 mg-border-b" 
            :style="(((selectedTask) && (selectedTask.taskId === task.taskId)) || ((selections.length > 1) && (selections.find(x => x.taskId === task.taskId))))? 'background-color:rgba(253, 226, 184, 0.5)' : (((task.actualEndDate !== ''))? 'background-color: #DDD;' : (((task.actualStartDate !== ''))? 'background-color: #EEF;' : '')) + ';user-select:none;'"
            @click.exact="closeContextMenu(); selectTask(task)" @click.right.prevent="openContextMenu($event, task)" @click.ctrl="closeContextMenu(); addSelection(task)" >
          <template v-if="(index >= Math.floor(Math.abs(positionY)/rowHeight)) && (index < (Math.floor(Math.abs(positionY)/rowHeight) + ((calendarViewHeight / rowHeight)-2)) )">
            <div @click="editTask(task)" class="mg-flex mg-items-center mg-border-r mg-border-l mg-justify-center mg-w-12 mg-text-xs"
              draggable="true" @dragstart="dragTask(task)" @dragenter.prevent @dragover.prevent @drop.prevent="dragTaskOver(task)">
              {{task.taskId }}
            </div>
            <div class="mg-border-r mg-flex mg-items-center mg-w-96 mg-text-xs mg-pl-2">
              <span v-for="n of viewInfoSet[task.taskId].level" :key="n" style="display:inline-block; width:13px; height:100%; border:none; border-left:solid 1px #AAA; margin-left: 7px; box-sizing:border-box;"></span>
              <div class="pr-4" @click="toggleCollapsed(task.taskId)" v-if="viewInfoSet[task.taskId].children" style="width:16px;">
                <span v-if="collapseInfoSet[task.taskId]">
                  <svg class="mg-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                <span v-else>
                  <svg class="mg-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
              <div class="pr-4" v-if="!viewInfoSet[task.taskId].children" style="width:16px;">
                <svg class="mg-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                </svg>
              </div>
              <input @change="silentEditTask(task)" class="mg-text-xs mg-w-96" :style="'width:'+'calc(100% - '+(viewInfoSet[task.taskId].level*21+((viewInfoSet[task.taskId].children)? 32 : 16)).toString()+'px)'+';'+'hright:20px; background-color:transparent; outline:none; border:none; font-size:0.70rem; text-align:left;'" v-model="task.subject" spellcheck="false">
            </div>
            <div class="mg-border-r mg-flex mg-items-center mg-justify-left mg-w-20 mg-text-xs">
              <input @change="silentEditTask(task)" class="mg-text-xs mg-w-20 smallcalendar" style="width:15px; hright:20px; background-color:transparent; outline:none; border:none; font-size:0.70rem; text-align:left; " v-model="task.planStartDate" type="date">
              {{ formatDate2ShortDateStr(task.planStartDate) }}
            </div>
            <div class="mg-border-r mg-flex mg-items-center mg-justify-left mg-w-20 mg-text-xs">
              <input @change="silentEditTask(task)" class="mg-text-xs mg-w-20 smallcalendar" style="width:15px; hright:20px; background-color:transparent; outline:none; border:none; font-size:0.70rem; text-align:left; " v-model="task.planEndDate" type="date">
              {{ formatDate2ShortDateStr(task.planEndDate) }}
            </div>
            <div class="mg-border-r mg-flex mg-items-center mg-justify-left mg-w-20 mg-text-xs">
              <input @change="silentEditTask(task)" class="mg-text-xs mg-w-20 smallcalendar" style="width:15px; hright:20px; background-color:transparent; outline:none; border:none; font-size:0.70rem; text-align:left; " v-model="task.actualStartDate" type="date">
              {{ formatDate2ShortDateStr(task.actualStartDate) }}
            </div>
            <div class="mg-border-r mg-flex mg-items-center mg-justify-left mg-w-20 mg-text-xs">
              <input @change="silentEditTask(task)" class="mg-text-xs mg-w-20 smallcalendar" style="width:15px; hright:20px; background-color:transparent; outline:none; border:none; font-size:0.70rem; text-align:left; " v-model="task.actualEndDate" type="date">
              {{ formatDate2ShortDateStr(task.actualEndDate) }}
            </div>
            <div class="mg-border-r mg-flex mg-items-center mg-justify-center mg-w-16 mg-text-xs">
              <input @change="silentEditTask(task)" class="mg-text-xs mg-w-16" style="hright:20px; background-color:transparent; outline:none; border:none; font-size:0.70rem; text-align:left; " v-model="task.assignedUserId" >
            </div>
            <div class="mg-flex mg-items-center mg-justify-center mg-w-12 mg-text-xs mg-border-r">
              <input v-if="prefUseTimeSyntax" @change="silentEditTask(task)" class="mg-text-xs mg-w-12 nospinner" style="hright:20px; background-color:transparent; outline:none; border:none; font-size:0.70rem; text-align:right; -webkit-appearance:none; margin:0;" v-model="task.planWorkload">
              <input v-if="!prefUseTimeSyntax" @change="silentEditTask(task)" class="mg-text-xs mg-w-12 nospinner" style="hright:20px; background-color:transparent; outline:none; border:none; font-size:0.70rem; text-align:right; -webkit-appearance:none; margin:0;" v-model="task.planWorkload" type="number">
            </div>
            <div class="mg-flex mg-items-center mg-justify-center mg-w-12 mg-text-xs mg-border-r">
              <input v-if="prefUseTimeSyntax" @change="silentEditTask(task)" class="mg-text-xs mg-w-12 nospinner" style="hright:20px; background-color:transparent; outline:none; border:none; font-size:0.70rem; text-align:right; -webkit-appearance:none; margin:0;" v-model="task.actualWorkload" >
              <input v-if="!prefUseTimeSyntax" @change="silentEditTask(task)" class="mg-text-xs mg-w-12 nospinner" style="hright:20px; background-color:transparent; outline:none; border:none; font-size:0.70rem; text-align:right; -webkit-appearance:none; margin:0;" v-model="task.actualWorkload" type="number">
            </div>
            <div class="mg-flex mg-items-center mg-justify-center mg-w-16 mg-text-xs mg-border-r" v-if="prefShowTaskStatistics">
              <input class="mg-text-xs mg-w-16 nospinner" style="hright:20px; background-color:transparent; outline:none; border:none; font-size:0.70rem; text-align:right; -webkit-appearance:none; margin:0; color:#00F;" :value="parseFloat(viewInfoSet[task.taskId].subtotalPlanWorkload.toFixed(2),10)" readonly v-if="viewInfoSet[task.taskId].children">
            </div>
            <div class="mg-flex mg-items-center mg-justify-center mg-w-16 mg-text-xs mg-border-r" v-if="prefShowTaskStatistics">
              <input class="mg-text-xs mg-w-16 nospinner" style="hright:20px; background-color:transparent; outline:none; border:none; font-size:0.70rem; text-align:right; -webkit-appearance:none; margin:0; color:#00F;" :value="parseFloat(viewInfoSet[task.taskId].subtotalActualWorkload.toFixed(2),10)" readonly v-if="viewInfoSet[task.taskId].children">
            </div>
            <div class="mg-flex mg-items-center mg-justify-center mg-w-16 mg-text-xs" v-if="prefShowTaskStatistics">
              <input class="mg-text-xs mg-w-16 nospinner" style="hright:20px; background-color:transparent; outline:none; border:none; font-size:0.70rem; text-align:right; -webkit-appearance:none; margin:0; color:#00F;" :value="parseFloat(viewInfoSet[task.taskId].subtotalRestWorkload.toFixed(2),10)" readonly v-if="viewInfoSet[task.taskId].children">
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Calendar section -->
    <div id="gantt-calendar" class="mg-overflow-x-scroll mg-overflow-y-hidden mg-border-l" :style="'width:' + calendarViewWidth + 'px;'" ref="calendar">
      <div id="gantt-date" class="mg-h-15">
        <div id="gantt-year-month" class="mg-relative mg-h-5" style="z-index:890;">
          <div v-for="(calendar,index) in calendars" :key="index">
            <div
              class="mg-text-black mg-bg-gray mg-text-dark mg-border-b mg-border-r mg-border-t mg-h-5 mg-absolute mg-text-xs mg-flex mg-items-center mg-justify-center"
              :style="'width:' + calendar.calendar*block_size + 'px;' + 'left:' + calendar.start_block_number*block_size + 'px'">
              {{calendar.date}}
            </div>
          </div>
        </div>
        <div id="gantt-day" class="mg-relative mg-h-10" style="z-index:890;">
          <div v-for="(calendar,index) in calendars" :key="index">
            <div v-for="(day,index) in calendar.days" :key="index">
              <div class="mg-border-r mg-border-b mg-h-10 mg-absolute mg-flex mg-items-center mg-justify-center mg-flex-col mg-text-xs mg-bg-gray"
                   :class="(calendar.year=== today.year() && calendar.month === today.month() && day.day === today.date())? 'mg-bg-darkred mg-text-white' : ((day.dayOfWeek === 0 || day.dayOfWeek === 6)? 'mg-bg-darkgray mg-text-white' : '')"
                   :style="'width:' + block_size + 'px;' + 'left:' + day.block_number*block_size + 'px'">
                <span style="text-align:center;">{{ day.day }}<br><span class="mg-text-xxs" style="display:inline-block;transform: scale(0.75,0.8);">{{ "" }}</span></span>
              </div>
            </div>
          </div>
        </div>
        <div id="gantt-height" class="mg-relative">
          <div v-for="(calendar,index) in calendars" :key="index">
            <div v-for="day in calendar.days" :key="index">
              <div class="mg-border-r mg-border-b mg-absolute"
                   :class="(calendar.year=== today.year() && calendar.month === today.month() && day.day === today.date())? 'mg-bg-lightred' : ((day.dayOfWeek === 6 || day.dayOfWeek === 0)? 'mg-bg-lightgray' : '')"
                   :style="'border-right:solid 1px rgba(221,221,221,0.4); border-bottom:solid 1px rgba(221,221,221,0.4);' + 'width:' + block_size + 'px;' + 'left:' + day.block_number*block_size + 'px;' + 'height:' + calendarViewHeight + 'px'">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bar Area -->
      <div id="gantt-bar-area" class="mg-relative" :style="'width:' + calendarViewWidth + 'px;' + 'height:' + calendarViewHeight + 'px;' + 'top:' + positionY + 'px;'">
        <div v-for="(bar,index) in taskBars" :key="index">
          <div v-if="prefShowGuide && viewInfoSet[bar.task.taskId].children && !collapseInfoSet[bar.task.taskId]" :style="'position:absolute; border-top-left-radius:3px; border-bottom-left-radius:3px; ' + 'top:' + (bar.style.topRaw).toString() + 'px' + ';' + ' left:' + ((bar.style.leftRaw - (viewInfoSet[bar.task.taskId].deepestLevel - viewInfoSet[bar.task.taskId].level) * 10 - 5)).toString() + 'px' + ';' + ' color:#888; border-left:solid 2px #CCC; border-top:solid 2px #CCC; border-bottom:solid 2px #CCC; width:2px;' + 'height:' + ((!collapseInfoSet[bar.task.taskId])? (viewInfoSet[bar.task.taskId].showMemberCount + 1) * rowHeight - 9 : rowHeight - 4).toString() + 'px;'"></div>

          <template v-if="(index >= Math.floor(Math.abs(positionY)/rowHeight)) && (index < (Math.floor(Math.abs(positionY)/rowHeight) + ((calendarViewHeight / rowHeight)-2)) )">
            <span @click="toggleCollapsed(bar.task.taskId)" v-if="viewInfoSet[bar.task.taskId].children && collapseInfoSet[bar.task.taskId]" :style="'position:absolute; color:#AAA; cursor:pointer; display:inline-block; width:4px; height:2px; user-select:none; border: none; line-height:0px; z-index:10;' + 'top:' + (bar.style.topRaw + 3).toString() + 'px' + ';' + ' left:' + (bar.style.leftRaw - 11).toString() + 'px' + ';' + '' + ';'">
              +
            </span>
            <span @click="toggleCollapsed(bar.task.taskId)" v-if="viewInfoSet[bar.task.taskId].children && !collapseInfoSet[bar.task.taskId]" :style="'position:absolute; color:#AAA; cursor:pointer; display:inline-block; width:4px; height:2px; user-select:none; border: none; line-height:0px; z-index:10;' + 'top:' + (bar.style.topRaw + 2).toString() + 'px' + ';' + ' left:' + (bar.style.leftRaw - 9).toString() + 'px' + ';' + '' + ';'">
              -
            </span>

            <!-- Focused -->
            <div :style="bar.barStyle" style="background-color:rgba(253, 226, 184, 0.5)" class="mg-absolute mg-h-2" v-if="(selections.find(x => x.taskId === bar.task.taskId))">
            </div>

            <!-- Focused -->
            <div :style="bar.barStyle" style="background-color:transparent; border-top:solid 1px rgba(221,221,221,0.4); " class="mg-absolute mg-h-2">
            </div>

            <!-- Plan -->
            <div :class="(bar.task.actualEndDate)? 'ribbon-pre-cmpl' : 'ribbon-pre'" :style="bar.preStyle" style="border:solid 1px transparent; background-color:transparent; z-index:888; width:0px !important; height:0px !important;" class="mg-absolute mg-h-2 mg-border mg-task" 
                v-if="bar.style.scheduled === true && viewInfoSet[bar.task.taskId].children">
            </div>
            <div :style="bar.style" style="cursor:pointer; background-color:#dde5ff;" class="mg-absolute mg-h-2 mg-border mg-task" 
                v-if="bar.style.scheduled === true" @mousedown="mouseDownMove(bar.task)" 
                @click.exact="selectTask(bar.task)" @click.ctrl="addSelection(bar.task)">
              <div class="mg-w-full mg-h-full" style="pointer-events: none;">
                <div class="mg-h-full" 
                     style="pointer-events:none; background-color:#8492bd" 
                     :style="'width:' + bar.task.progress + '%'"></div>
              </div>
              <div class="mg-absolute mg-w-2 mg-h-2 mg-task" 
                   style="top:3px;left:-6px;cursor:col-resize" 
                   @mousedown.stop="mouseDownResize(bar.task,'left')">
              </div>
              <div class="mg-absolute mg-w-2 mg-h-2 mg-task" 
                   style="top:3px;right:-6px;cursor:col-resize" 
                   @mousedown.stop="mouseDownResize(bar.task,'right')">
              </div>
            </div>
            <div :class="(bar.task.actualEndDate)? 'ribbon-aft-cmpl' : 'ribbon-aft'" :style="bar.aftStyle" style="border:solid 1px transparent; background-color:transparent; z-index:888;" class="mg-absolute mg-h-2 mg-border mg-task" 
                v-if="bar.style.scheduled === true && viewInfoSet[bar.task.taskId].children">
            </div>

            <!-- Actual -->
            <div :style="bar.actualStyle" style="cursor:pointer; " class="mg-absolute mg-h-1 mg-border mg-actual mg-task" 
                v-if="bar.actualStyle.scheduled === true" @mousedown="mouseDownMove(bar.task)" 
                @click.exact="selectTask(bar.task)" @click.ctrl="addSelection(bar.task)">
              <div class="mg-w-full mg-h-full mg-task" style="pointer-events: none;">
                <div class="mg-h-full" 
                     style="pointer-events:none; background-color:#8492bd" 
                     :style="'width:' + bar.task.progress + '%'"></div>
              </div>
              <div class="mg-absolute mg-w-2 mg-h-2 mg-task" 
                   style="top:3px;left:-6px;cursor:col-resize" 
                   @mousedown.stop="mouseDownResize(bar.task,'left')">
              </div>
              <div class="mg-absolute mg-w-2 mg-h-2 mg-task" 
                   style="top:3px;right:-6px;cursor:col-resize" 
                   @mousedown.stop="mouseDownResize(bar.task,'right')">
              </div>
            </div>
          </template>
        </div>
      </div>

    </div>

  </div>

  <!-- Header -->
  <div id="gantt-header" v-show="show" class="mg-h-12 mg-p-2 mg-flex mg-items-center" style="position:fixed; z-index:900">
    <div class="mg-base" @keyup.ctrl.enter="(update_mode)? updateTask(form.taskId) : saveTask()" >
      <div class="mg-overlay" @click="show = false"></div>
      <!--
      <div class="mg-content" style="overflow:auto; resize:both;" id="formEdit"
        draggable="true" @dragstart="formDragstart($event)" @dragenter.prevent @dragover.prevent @dragend="formDragend($event)" >
      -->
      <div class="mg-content" style="overflow:auto; resize:both;" id="formEdit">
        <h2 v-if="update_mode">Edit Task</h2>
        <h2 v-else>Add Task</h2>
        <div class="mg-form-item">
          <div name="left" style="float:left; padding:5px;">
            <div class="mg-form-item">
              <label>ID: </label>
              <input class="mg-form-input mg-w-22" v-model.number="form.taskId" :disabled="update_mode">
            </div>
            <div class="mg-form-item">
            </div>
            <div class="mg-form-item">
              <label>Subject: </label>
              <input class="mg-form-input mg-w-full" v-model="form.subject" spellcheck="false">
            </div>
            <div class="mg-form-item">
              <label>AssignedTo: </label>
              <input class="mg-form-input mg-w-24" v-model="form.assignedUserId">
            </div>
            <div class="mg-form-item">
              <label>Pl. Term: </label>
              <input class="mg-form-input mg-no-rounded-br mg-no-rounded-tr" v-model="form.planStartDate" type="date">
              <input class="mg-form-input mg-no-rounded-bl mg-no-rounded-tl" v-model="form.planEndDate" type="date">
            </div>
            <div class="mg-form-item">
              <label>Ac. Term: </label>
              <input class="mg-form-input mg-no-rounded-br mg-no-rounded-tr" v-model="form.actualStartDate" type="date">
              <input class="mg-form-input mg-no-rounded-bl mg-no-rounded-tl" v-model="form.actualEndDate" type="date">
            </div>
            <div class="mg-form-item">
              <label>Pl. Workload: </label>
              <input v-if="prefUseTimeSyntax" class="mg-form-input mg-w-22" v-model="form.planWorkload">
              <input v-if="!prefUseTimeSyntax" class="mg-form-input mg-w-22" v-model="form.planWorkload" type="number">
              <label> WL/Map: </label>
              <input class="mg-form-input mg-w-22" v-model="form.planWorkloadMap">
            </div>
            <div class="mg-form-item">
              <label> Ac. Workload: </label>
              <input v-if="prefUseTimeSyntax" class="mg-form-input mg-w-22" v-model="form.actualWorkload">
              <input v-if="!prefUseTimeSyntax" class="mg-form-input mg-w-22" v-model="form.actualWorkload" type="number">
              <label> Parent: </label>
              <input class="mg-form-input mg-w-22" v-model="form.parentTaskId" type="number">
            </div>
            <div class="mg-form-item">
              <label> Progress: </label>
              <input class="mg-form-input mg-w-22" v-model="form.progress" type="number"><span>%</span>
              <span>&nbsp;</span>
              <label><input type="checkbox" v-model="autoSetProgress"/>Auto-Set</label>
              <br>
              <progress :value="form.progress" max="100" class="mg-w-full"></progress>
              <br>
              <div class="mg-w-full" style="display:flex; justify-content: space-between;">
                <div style="cursor:pointer;" @click="setFormProgress(0)">0%</div>
                <div style="cursor:pointer;" @click="setFormProgress(25)">25%</div>
                <div style="cursor:pointer;" @click="setFormProgress(50)">50%</div>
                <div style="cursor:pointer;" @click="setFormProgress(75)">75%</div>
                <div style="cursor:pointer;" @click="setFormProgress(100)">100%</div>
              </div>
            </div>
            <div class="mg-form-item">
              <label>Activity: 
                <input type="time" v-model="alarmTimeBegin" style="outline:none;font-size:0.7rem;border:solid 1px #CCC;"/>
                <input type="time" v-model="alarmTimeEnd" style="outline:none;font-size:0.7rem;border:solid 1px #CCC;"/>&nbsp;
                <meter :value="alarmProgress" min="0" max="100" low="20" style="width:100px;"></meter>&nbsp;
                <span style="display:inline-block; width:90px;">
                  <span>{{ alarmRestPre }}&nbsp;</span>
                  <span>{{ alarmRest.h }}</span><span style="font-size:0.5rem">h</span>
                  <span>{{ alarmRest.m }}</span><span style="font-size:0.5rem">m</span>
                  <span>{{ alarmRest.s }}</span><span style="font-size:0.5rem">s</span>
                </span>
                &nbsp;
                <button class="mg-green mg-text-white" style="width:28px;height:16px;line-height:0px;font-size:0.5rem;cursor:pointer;" @click="setActualByAlarm()">SET</button>
              </label>
            </div>
          </div>
          <div name="right" style="float:right; padding:5px;">
            <div class="mg-form-item">
              <label>Desc: </label><br>
              <textarea class="mg-form-input mg-w-full" v-model="form.content" style="width:400px; height:400px; min-width:400px; min-height:400px; word-wrap:break-word:" spellcheck="false"></textarea>
            </div>
          </div>
        </div>
        <div style="clear:both;">
          <div v-if="update_mode" class="mg-flex mg-items-center mg-justify-left">
            <button @click="updateTask(form.taskId)" class="mg-green mg-text-white mg-py-2 mg-px-16 mg-rounded-lg mg-text-xs mg-flex mg-items-center">
              <svg class="mg-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span class="mg-text-xs  mg-text-white" style="white-space: nowrap;">Save and Close</span>
            </button>
            <button @click="updateTask(form.taskId, false)" class="mg-green mg-text-white mg-py-2 mg-px-16 mg-rounded-lg mg-text-xs mg-flex mg-items-center mg-ml-2">
              <svg class="mg-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span class="mg-text-xs  mg-text-white">Save</span>
            </button>
            <button @click="deleteTask(form.taskId)"
                    class="mg-red mg-text-white mg-py-2 mg-px-4 mg-rounded-lg mg-flex mg-items-center mg-ml-2" >
              <svg class="mg-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span class="mg-text-xs mg-text-white">Delete</span>
            </button>
          </div>
          <div v-else>
            <button @click="saveTask"
              class="mg-indigo mg-text-white mg-py-2 mg-px-16 mg-rounded-lg mg-flex mg-items-center">
              <svg class="mg-w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span class=" mg-text-xs">
                Register
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Configuration -->
  <div id="gantt-header" v-show="showPref" class="mg-h-12 mg-p-2 mg-flex mg-items-center" style="position:fixed; z-index:900">
    <div class="mg-base">
      <div class="mg-overlay" @click="showPref=false"></div>
      <div class="mg-content">
        <h2>Preference</h2>
        <div class="mg-form-item">
          <div name="left" style="float:left; padding:5px;">
            <div class="mg-form-item">
              <label>Show indent guide: 
                <input type="checkbox" class="mg-form-input mg-w-20" v-model="prefShowGuide">
              </label>
            </div>
            <div class="mg-form-item">
              <label>Hide completed task: 
                <input type="checkbox" class="mg-form-input mg-w-20" v-model="prefHideCompletedTask">
              </label>
            </div>
            <div class="mg-form-item">
              <label>Set default date: 
                <input type="checkbox" class="mg-form-input mg-w-20" v-model="prefSetDefaultPlanDate">
              </label>
            </div>
            <div class="mg-form-item">
              <label>Show statistics:
                <input type="checkbox" class="mg-form-input mg-w-20" v-model="prefShowTaskStatistics">
              </label>
            </div>
            <div class="mg-form-item">
              <label>Use TimeSyntax:
                <input type="checkbox" class="mg-form-input mg-w-20" v-model="prefUseTimeSyntax">
              </label>
            </div>
            <div class="mg-form-item">
              <label>Hours of a day:
                <input class="mg-form-input mg-w-24" v-model="prefUseTimeSyntaxHoursOfDay" type="number">
              </label>
            </div>
          </div>
          <!--
          <div name="right" style="float:right; padding:5px;">
          </div>
          -->
        </div>
        <div style="clear:both;">
          <button @click="showPref = false" class="mg-green mg-text-white mg-py-2 mg-px-16 mg-rounded-lg mg-text-xs mg-flex mg-items-center">
            <span class="mg-text-xs  mg-text-white" style="white-space: nowrap;">Close</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <div id="mingantt-context-menu" v-if="showContextMenu"
    :style="{'top': contextMenuTop.toString() + 'px', 'left': contextMenuLeft.toString() + 'px'}">
    <template v-for="item in contextMenu">
      <div class="mingantt-context-menu-item" 
          v-if="(item.condition)? item.condition(selections) : true"
          @click.prevent.stop="item.action($event, selections); closeContextMenu();"
          v-html="item.template()">
      </div>
    </template>
  </div>
</div>
`,
  methods: {
    loadTasks(tasks) {
      let before = null;
      if(this.selectedTask) {
        before = this.selectedTask.taskId;
      }

      if(this.encodeFn) {
        this.tasks = tasks.map(this.encodeFn);

        // Set collapse info
        this.tasks.map((x) => {
          let savedCollapseState = localStorage.getItem("mingantt/collapsed/" + x.taskId.toString());
          if(savedCollapseState) {
            this.collapseInfoSet[x.taskId] = JSON.parse(savedCollapseState);
          } else {
            this.collapseInfoSet[x.taskId] = false;
          }
        });
      } else {
        this.tasks = tasks;
      }

      let newtask = this.tasks.find(x => x.taskId === before);
      if(newtask) {
        this.selectedTask = newtask
      } else {
        this.selectedTask = null;
      }
    },
    getTasks() {
      if(this.decodeFn) {
        return this.tasks.map(this.decodeFn);
      } else {
        return this.tasks;
      }
    },
    getDays(year, month, block_number) {
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      let days = [];
      let date = moment(`${year}-${month}-01`);
      let num = date.daysInMonth();
      for (let i = 0; i < num; i++) {
        days.push({
          day: date.date(),
          dayOfWeek: date.day(),
          dayOfWeekStr: dayOfWeek[date.day()],
          block_number
        })
        date.add(1, 'day');
        block_number++;
      }
      return days;
    },
    getCalendar() {
      let block_number = 0;
      let days;
      let start_month = moment(this.start_month)
      let end_month = moment(this.end_month)
      let between_month = end_month.diff(start_month, 'months')
      for (let i = 0; i <= between_month; i++) {
        days = this.getDays(start_month.year(), start_month.format('MM'), block_number);
        this.calendars.push({
          date: start_month.format('YYYY/MM'),
          year: start_month.year(),
          month: start_month.month(),
          start_block_number: block_number,
          calendar: days.length,
          days: days
        })
        start_month.add(1, 'months')
        block_number = days[days.length - 1].block_number
        block_number++;
      }
      return block_number;
    },
    getWindowSize() {
      var content = window.document.querySelector("#gantt-content");
      this.inner_width = content.getBoundingClientRect().width;
      this.inner_height = content.getBoundingClientRect().height;
      this.task_width = this.$refs.task.offsetWidth;
      this.task_height = this.$refs.task.offsetHeight;
    },
    todayPosition() {
      this.$refs.calendar.scrollLeft = this.scrollDistance
    },
    windowSizeCheck() {
      // let height = this.lists.length - this.position_id
      // if (event.deltaY > 0 && height * 40 > this.calendarViewHeight) {
      //   this.position_id+=3;
      // } else if (event.deltaY < 0 && this.position_id !== 0) {
      //   this.position_id-=3;
      // }

      if(this.show) {
        return;
      }

      this.positionY = this.positionY - event.deltaY;

      if(this.positionY > 0) {
        this.positionY = 0;
      } else if(this.positionY < (((this.displayTasks.length - 0) * this.rowHeight) * (-1))){
        this.positionY = (((this.displayTasks.length - 0) * this.rowHeight) * (-1));
      }
    },
    mouseDownMove(task){
      this.dragging = true;
      this.pageX = event.pageX;
      this.element = event.target;
      this.left = event.target.style.left;
      this.task_id = task.taskId
      console.log('mouseDownMove')
    },
    mouseMove() {
      if (this.dragging) {
        let diff = this.pageX - event.pageX;
        this.element.style.left = `${parseInt(this.left.replace('px', '')) - diff}px`;
      }
    },
    stopDrag(){
      if (this.dragging) {
        let diff = this.pageX - event.pageX
        let days = Math.round(diff / this.block_size)
        if (days !== 0) {
          let task = this.tasks.find(task => task.taskId === this.task_id);
          let planStartDate = moment(task.planStartDate).add(-days, 'days')
          let planEndDate = moment(task.planEndDate).add(-days, 'days')
          task['planStartDate'] = planStartDate.format('YYYY-MM-DD')
          task['planEndDate'] = planEndDate.format('YYYY-MM-DD')

          // Fires handler
          if(this.onUpdateTask) {
            this.onUpdateTask({update: [task]});
          }
        } else {
          this.element.style.left = `${this.left.replace('px', '')}px`;
        }
      }
      if (this.leftResizing) {
        let diff = this.pageX - event.pageX;
        let days = Math.round(diff / this.block_size)
        if (days !== 0) {
          let task = this.tasks.find(task => task.taskId === this.task_id);
          let planStartDate = moment(task.planStartDate).add(-days, 'days')
          let planEndDate = moment(task.planEndDate)
          if (planEndDate.diff(planStartDate, 'days') <= 0) {
            task['planStartDate'] = planEndDate.format('YYYY-MM-DD')
          } else {
            task['planStartDate'] = planStartDate.format('YYYY-MM-DD')
          }

          // Fires handler
          if(this.onUpdateTask) {
            this.onUpdateTask({update: [task]});
          }
        } else {
          this.element.style.width = this.width;
          this.element.style.left = `${this.left.replace('px', '')}px`;
        }
      }
      if (this.rightResizing) {
        let diff = event.pageX - this.pageX;
        let days = Math.round(diff / this.block_size)
        if (days !== 0) {
          let task = this.tasks.find(task => task.taskId === this.task_id);
          let planStartDate = moment(task.planStartDate);
          let planEndDate = moment(task.planEndDate).add(days, 'days');
          if (planStartDate.diff(planEndDate, 'days') <= 0) {
            task['planEndDate'] = planEndDate.format('YYYY-MM-DD')
          } else {
            task['planEndDate'] = planStartDate.format('YYYY-MM-DD')
          }

          // Fires handler
          if(this.onUpdateTask) {
            this.onUpdateTask({update: [task]});
          }
        } else {
          this.element.style.width = this.width;
          this.element.style.left = `${this.left.replace('px', '')}px`;
        }
      }
      this.dragging = false;
      this.leftResizing = false;
      this.rightResizing = false;
    },
    mouseDownResize(task, direction) {
      direction === 'left' ? this.leftResizing = true : this.rightResizing = true;
      this.pageX = event.pageX;
      this.width = event.target.parentElement.style.width;
      this.left = event.target.parentElement.style.left;
      this.element = event.target.parentElement;
      this.task_id = task.taskId
    },
    mouseResize() {
      if (this.leftResizing) {
        let diff = this.pageX - event.pageX
        if (parseInt(this.width.replace('px', '')) + diff > this.block_size) {
          this.element.style.width = `${parseInt(this.width.replace('px', '')) + diff}px`
          this.element.style.left = `${this.left.replace('px', '') - diff}px`;
        }
      }
      if (this.rightResizing) {
        let diff = this.pageX - event.pageX;
        if (parseInt(this.width.replace('px', '')) - diff > this.block_size) {
          this.element.style.width = `${parseInt(this.width.replace('px', '')) - diff}px`
        }
      }
    },
    dragTask(dragTask) {
      this.task = dragTask;
    },
    dragTaskOver(overTask) {
      if(this.task.parentTaskId !== overTask.parentTaskId) {
        return;
      }

      this.task.sortOrder = overTask.sortOrder - 1;

      let ls = this.tasks.filter(x => x.parentTaskId === this.task.parentTaskId);
      this.resetSortOrder(ls);

      if(this.onUpdateTask) {
        this.onUpdateTask({update: ls});
      }

      // let deleteIndex;
      // let addIndex;

      // if (overTask.taskId !== this.task.taskId && overTask.parentTaskId !== this.task.taskId) {

      //   // Change parent
      //   // if(overTask.parentTaskId !== this.task.parentTaskId && overTask.parentTaskId !== this.task.taskId) {
      //   //   let before = this.task.parentTaskId;
      //   //   this.task.parentTaskId = overTask.parentTaskId;

      //   //   // Validate circular relation
      //   //   let checkCircularRelation = (task, tasks, state) => {
      //   //     if(state[task.taskId]) {
      //   //       return false;
      //   //     }

      //   //     if(task.parentTaskId === 0) {
      //   //       return true;
      //   //     }

      //   //     state[task.taskId] = true;

      //   //     let par = this.tasks.find(x => x.taskId === task.parentTaskId);

      //   //     return checkCircularRelation(par, tasks, state);
      //   //   };

      //   //   if(!checkCircularRelation(this.task, this.tasks, {})) {
      //   //     this.task.parentTaskId = before;
      //   //     alert("Error: circular relation!");
      //   //     return;
      //   //   }
      //   // }

      //   let tmp = this.task.sortOrder;
      //   this.task.sortOrder = overTask.sortOrder;
      //   overTask.sortOrder = tmp;

      //   // Fires handler
      //   if(this.onUpdateTask) {
      //     this.onUpdateTask({update: [this.task, overTask]});
      //   }
      // }
    },
    toggleCollapsed(taskId) {
      this.collapseInfoSet[taskId] = !this.collapseInfoSet[taskId];
      localStorage.setItem("mingantt/collapsed/" + taskId.toString(), JSON.stringify(this.collapseInfoSet[taskId]));
    },
    addTask() {
      this.update_mode = false;
      this.form = {...((this.formDefault)())};

      if(this.prefSetDefaultPlanDate) {
        this.form.planStartDate = moment().format('YYYY-MM-DD');
        this.form.planEndDate = moment().format('YYYY-MM-DD');
      }

      this.show = true;
    },
    addChildTask() {
      if(this.selectedTask == null || this.tasks.find(x => x.taskId === this.selectedTask.taskId) === undefined) {
        alert("Select parent task!");
        return;
      }

      this.update_mode = false;
      this.form = {...((this.formDefault)())};

      if(this.prefSetDefaultPlanDate) {
        this.form.planStartDate = moment().format('YYYY-MM-DD');
        this.form.planEndDate = moment().format('YYYY-MM-DD');
      }

      this.form.parentTaskId = this.selectedTask.taskId;
      this.show = true;
    },
    saveTask() {
      let task = this.tasks.find(task => task.taskId === this.form.taskId);

      if(task) {
        alert("ID Confilict!");
        return;
      }

      if(this.form.parentTaskId === "") {
        this.form.parentTaskId = 0;
      }

      if(this.form.parentTaskId !== 0 && !(this.tasks.find(t => t.taskId === this.form.parentTaskId))) {
        alert("Parent task not exists!");
        return;
      }

      // Auto set progress
      if(this.autoSetProgress && this.form.actualEndDate !== "") {
        this.form.progress = 100;
      } else if(this.autoSetProgress && this.form.actualEndDate === "") {
        this.form.progress = 0;
      }

      // Set sortOrder
      this.form.sortOrder = this.form.taskId;

      // Parse TimeSyntax
      this.form.planWorkload = this.parseTimeSyntax(this.form.planWorkload);
      this.form.actualWorkload = this.parseTimeSyntax(this.form.actualWorkload);

      this.tasks.push(this.form);

      // Fires handler
      if(this.onUpdateTask) {
        this.onUpdateTask({insert: [this.form]});
      }

      // Clear form
      this.form = {};

      // Close edit form
      this.show = false;
    },
    editTask(task, silent=false){
      this.update_mode=true;
      this.show = !silent;
      Object.assign(this.form, task);
    },
    updateTask(taskId, clear=true) {
      if(this.form.parentTaskId === "") {
        this.form.parentTaskId = 0;
      }

      if(this.form.parentTaskId !== 0 && !(this.tasks.find(t => t.taskId === this.form.parentTaskId))) {
        alert("Parent task not exists!");
        return;
      }

      // Validate circular relation
      let checkCircularRelation = (task, tasks, state) => {
        if(state[task.taskId]) {
          return false;
        }

        if(task.parentTaskId === 0) {
          return true;
        }

        state[task.taskId] = true;

        let par = this.tasks.find(x => x.taskId === task.parentTaskId);

        return checkCircularRelation(par, tasks, state);
      };

      if(!checkCircularRelation(this.form, this.tasks, {})) {
        alert("Error: circular relation!");
        return;
      }

      // Auto set progress
      if(this.autoSetProgress && this.form.actualEndDate !== "") {
        this.form.progress = 100;
      } else if(this.autoSetProgress && this.form.actualEndDate === "") {
        this.form.progress = 0;
      }

      // Parse TimeSyntax
      this.form.planWorkload = this.parseTimeSyntax(this.form.planWorkload);
      this.form.actualWorkload = this.parseTimeSyntax(this.form.actualWorkload);

      let task = this.tasks.find(task => task.taskId === taskId);
      Object.assign(task, this.form);

      // Fires handler
      if(this.onUpdateTask) {
        this.onUpdateTask({update: [task]});
      }

      if(clear) {
        // Clear form
        this.form = {}

        // Close edit form
        this.show = false;
      }
    },
    parseTimeSyntax(str) {
      let val = str.toString();
      if(val.match(/(([1-9]\d*|0)(\.\d+)?)d/)
        || val.match(/(([1-9]\d*|0)(\.\d+)?)h/)
        || val.match(/(([1-9]\d*|0)(\.\d+)?)m/)) {
        let fixed = 0.0;
        if(val.match(/(([1-9]\d*|0)(\.\d+)?)d/)) {
          fixed += parseFloat(val.match(/(([1-9]\d*|0)(\.\d+)?)d/)[1],10) * parseFloat(this.prefUseTimeSyntaxHoursOfDay);
        }
        if(val.match(/(([1-9]\d*|0)(\.\d+)?)h/)) {
          fixed += parseFloat(val.match(/(([1-9]\d*|0)(\.\d+)?)h/)[1],10);
        }
        if(val.match(/(([1-9]\d*|0)(\.\d+)?)m/)) {
          fixed += parseFloat(val.match(/(([1-9]\d*|0)(\.\d+)?)m/)[1],10) / 60.0;
        }
        val = fixed;
      } else if(val === "") {
        val = 0.0;
      } else {
        let valAc = parseFloat(val, 10);
        if(isNaN(valAc)) {
          val = 0.0;
        } else {
          val = valAc;
        }
      }
      val = parseFloat(val.toFixed(2), 10);

      return val;
    },
    silentEditTask(task) {
      task.actualWorkload = this.parseTimeSyntax(task.actualWorkload);
      task.planWorkload = this.parseTimeSyntax(task.planWorkload);

      this.editTask(task, true);
      this.updateTask(task.taskId);
    },
    deleteTask(taskId) {
      if(this.tasks.find((x) => x.parentTaskId === taskId)) {
        alert("Delete children of this task first!");
        return;
      }

      let delete_index;
      this.tasks.map((task, index) => {
        if (task.taskId === taskId) delete_index = index;
      })

      let deleted = this.tasks.splice(delete_index, 1)

      // Fires handler
      if(this.onUpdateTask) {
        this.onUpdateTask({delete: [deleted[0]]});
      }

      // Clear form
      this.form = {}

      // Set selected
      this.selectedTask = null;
      this.selections = this.selections.filter(x => x.taskId !== deleted.taskId);

      // Close edit form
      this.show = false;
    },
    formatDate2ShortDateStr(date) {
      if(date === "") {
        return "";
      }

      // var cur = moment();
      // var dt = moment(date);
      // var pre = "";

      // if(cur.format('YY') !== dt.format('YY')) {
      //   pre = dt.format('YY') + "/";
      // }

      // return pre + dt.format('M/D');
      
      let m1 = date.substring(5,6);
      let m2 = date.substring(6,7);
      let d1 = date.substring(8,9);
      let d2 = date.substring(9,10);
      let yy = date.substring(2,4);
      let str = ((yy !== this.curyear2)? yy + "/" : "") + ((m1 !== "0")? m1 : "" ) + m2 + "/" + ((d1 !== "0")? d1 : "" ) + d2;
      return str;
    },
    selectTask(task) {
      this.selectedTask = task;
      this.selections = [task];

      // Fires handler
      if(this.onSelectTask) {
        this.onSelectTask(task);
      }
    },
    addSelection(task) {
      this.selectedTask = task;
      this.selections.push(task);

      // Fires handler
      if(this.onSelectTask) {
        this.onSelectTask(task);
      }
    },
    showNotify(msg, time) {
      this.notifyMessage = msg;
      this.notifyStyle.display = "block";

      setTimeout(() => {
        this.notifyMessage = "";
        this.notifyStyle.display = "none";
      }, time);
    },
    setFormProgress(progress) {
      this.form.progress = progress;
    },
    inplaceSort(ls) {
      let makeSortKey = (task) => {
        return task.sortOrder.toString().padStart(7,"0") + task.taskId.toString().padStart(7,"0");
      };

      ls.sort((a,b) => {
        let sortKeyA = makeSortKey(a);
        let sortKeyB = makeSortKey(b);

        if(sortKeyA < sortKeyB) {
          return -1;
        } else if(sortKeyA = sortKeyB) {
          return 0;
        }  else if(sortKeyA > sortKeyB) {
          return 1;
        }
      });
    },
    resetSortOrder(ls) {
      this.inplaceSort(ls);

      let ix = 0;
      ls.map(x => {
        x.sortOrder = ix;
        ix += 2;
      });
    },
    moveTask(dir) {
      if(this.selectedTask) {
        let ls = this.lists.filter(x => (x.parentTaskId === this.selectedTask.parentTaskId));
        let index = ls.indexOf(this.selectedTask);

        if((dir < 0) && (index > 0) 
            && (ls[index-1].level === this.selectedTask.level) 
            && (ls[index-1].parentTaskId === this.selectedTask.parentTaskId)) {
          // let src = this.selectedTask;
          // let tgt = ls[index-1];
          // let tmp = src.sortOrder;
          // src.sortOrder = tgt.sortOrder;
          // tgt.sortOrder = tmp;
          this.selectedTask.sortOrder -= 3;

          // re-ordering
          this.resetSortOrder(ls);

          // Fires handler
          if(this.onUpdateTask) {
            this.onUpdateTask({update: ls});
          }
        } else if((dir > 0) && (index < ls.length - 1) 
            && (ls[index+1].level === this.selectedTask.level) 
            && (ls[index+1].parentTaskId === this.selectedTask.parentTaskId)) {
          // let src = this.selectedTask;
          // let tgt = ls[index+1];
          // let tmp = src.sortOrder;
          // src.sortOrder = tgt.sortOrder;
          // tgt.sortOrder = tmp;
          this.selectedTask.sortOrder += 3;

          // re-ordering
          this.resetSortOrder(ls);

          // Fires handler
          if(this.onUpdateTask) {
            this.onUpdateTask({update: ls});
          }
        }
      }
    },
    formDragstart(elForm) {
      console.log("drag", elForm);
    },
    formDragend(elForm) {
      console.log("drop", elForm);
      elForm.target.style.position = "fixed";
      elForm.target.style.left = elForm.screenX.toString() + "px";
      elForm.target.style.top = elForm.screenY.toString() + "px";
    },
    openContextMenu(event, task) {
      console.log("openContextMenu", event);

      if(this.selections.length <= 1) {
        this.selectTask(task);
      }

      this.showContextMenu = true;
      this.contextMenuTop = event.clientY;
      this.contextMenuLeft = event.clientX;
    },
    closeContextMenu() {
      console.log("closeContextMenu");
      this.showContextMenu = false;
    },
    updateAlarm() {
      if(this.alarmTimeBegin === "00:00" 
          || this.alarmTimeEnd === "00:00" 
          || this.alarmTimeBegin === this.alarmTimeEnd) {
        this.alarmProgress = 0;
        return;
      }

      let t_b = moment(this.alarmTimeBegin, "hh:mm");
      let t_e = moment(this.alarmTimeEnd, "hh:mm");
      let t_0 = moment();

      let divTime = (xs) => {
        let axs = Math.abs(xs);
        let h = Math.floor(axs / (60 * 60));
        let m = Math.floor((axs - (h * 60 * 60)) / 60);
        let s = axs - (h * 60 * 60) - (m * 60);
        return {diff: xs, h: h, m: m, s: s};
      };

      let pre = "";
      let sec = 0;
      let prg = 0;
      let maxsec = t_e.diff(t_b, "seconds");

      if(t_b.diff(t_0) >= 0) {
        pre = "T~";
        sec = t_b.diff(t_0, "seconds");
        prg = 100;
      } else if(t_e.diff(t_0) >= 0) {
        pre = "T-";
        sec = t_e.diff(t_0, "seconds");
        prg = Math.floor((sec / maxsec) * 100.0);
      } else {
        pre = "T+";
        sec = t_0.diff(t_e, "seconds");
        prg = 0;
      }

      this.alarmRestPre = pre;
      this.alarmRest = divTime(sec);;
      this.alarmProgress = prg;
      this.alarmDiff = divTime(t_0.diff(t_b, "seconds"));
    },
    setActualByAlarm() {
      if(this.alarmDiff.diff <= 0) {
        this.form.actualWorkload = "0m";
      } else {
        this.form.actualWorkload = `${this.alarmDiff.h}h${this.alarmDiff.m}m`;
      }
    }
  },
  watch: {
    prefHideCompletedTask(newVal, oldVal) {
      setStorageDefault("prefHideCompletedTask", newVal);
    },
    prefShowGuide(newVal, oldVal) {
      setStorageDefault("prefShowGuide", newVal);
    },
    prefSetDefaultPlanDate(newVal, oldVal) {
      setStorageDefault("prefSetDefaultPlanDate", newVal);
    },
    prefShowTaskStatistics(newVal, oldVal) {
      setStorageDefault("prefShowTaskStatistics", newVal);
    },
    prefUseTimeSyntax(newVal, oldVal) {
      setStorageDefault("prefUseTimeSyntax", newVal);
    },
    prefUseTimeSyntaxHoursOfDay(newVal, oldVal) {
      setStorageDefault("prefUseTimeSyntaxHoursOfDay", newVal);
    },
    alarmTimeBegin(newVal, oldVal) {
      setStorageDefault("alarmTimeBegin", newVal);
    },
    alarmTimeEnd(newVal, oldVal) {
      setStorageDefault("alarmTimeEnd", newVal);
    }
  },
  mounted() {
    this.getCalendar();
    this.getWindowSize();
    window.addEventListener('resize', this.getWindowSize);
    window.addEventListener('wheel', this.windowSizeCheck);
    window.addEventListener('mousemove', this.mouseMove);
    window.addEventListener('mousemove', this.mouseResize);
    window.addEventListener('mouseup', this.stopDrag);
    // setDraggable([document.getElementById("formEdit")]);
    setInterval(this.updateAlarm, 1000);
    this.$nextTick(() => {
      this.todayPosition();
    });
  },
  computed: {
    calendarViewWidth() {
      return this.inner_width - this.task_width;
    },
    calendarViewHeight() {
      return this.inner_height - this.task_height;
    },
    scrollDistance() {
      let planStartDate = moment(this.start_month);
      let between_days = this.today.diff(planStartDate, 'days')
      return (between_days + 1) * this.block_size - this.calendarViewWidth / 2;
    },
    viewInfoSet() {
      console.log("viewinfoset");
      let vis = {};
      let taskHashSet = {};
      let taskChildrenHashSet = {};
      let taskDeepestLevelHashSet = {};
      this.tasks.map((x) => { 
        taskHashSet[x.taskId] = x; 
        vis[x.taskId] = {};
        if(x.parentTaskId !== 0) {
          if(taskChildrenHashSet[x.parentTaskId]) {
            taskChildrenHashSet[x.parentTaskId].push(x);
          } else {
            taskChildrenHashSet[x.parentTaskId] = [];
            taskChildrenHashSet[x.parentTaskId].push(x);
          }
        }

      });

      // format function
      let makeSortKey = (task) => {
        return task.sortOrder.toString().padStart(7,"0") + task.taskId.toString().padStart(7,"0");
      };

      // Calulate sortKey and level info
      let calcSortAndLevelInfo = (task, cur, tasks) => {
        return (task.parentTaskId === 0)? 
            cur 
            : calcSortAndLevelInfo(
                taskHashSet[task.parentTaskId], 
                { sortKey: makeSortKey(taskHashSet[task.parentTaskId]) + "-" + cur.sortKey, level: cur.level + 1 }, 
                tasks);
      };

      // Calculate show info
      let calcShowInfo = (x) => {
        if(x.parentTaskId === 0) {
          return true;
        }

        let par = taskHashSet[x.parentTaskId];

        return !this.collapseInfoSet[par.taskId] && calcShowInfo(par);
      };

      this.tasks.map((x) => {
        var vi = vis[x.taskId];

        // Set sortKey and level info
        let sortAndLevelInfo = calcSortAndLevelInfo(x, { sortKey: makeSortKey(x), level: 0 }, this.tasks);
        vi.sortKey = sortAndLevelInfo.sortKey;
        vi.level = sortAndLevelInfo.level;

        // Set show flag
        vi.show = calcShowInfo(x);

        // Set children
        vi.children = taskChildrenHashSet[x.taskId];

        vi.deepestLevel = 0;

        vi.memberCount = 0;
        vi.showMemberCount = 0;
        
        vi.subtotalPlanWorkload = this.parseTimeSyntax(x.planWorkload);
        vi.subtotalActualWorkload = this.parseTimeSyntax(x.actualWorkload);
        vi.subtotalRestWorkload = (!(x.actualEndDate))? this.parseTimeSyntax(x.planWorkload) : 0.0;
      });

      let deepestLevel = (task, cur) => {
        if(vis[cur.taskId].deepestLevel < vis[task.taskId].level) {
          vis[cur.taskId].deepestLevel = vis[task.taskId].level;
        }

        vis[cur.taskId].memberCount = vis[cur.taskId].memberCount + 1;
        if(vis[task.taskId].show) {
          vis[cur.taskId].showMemberCount = vis[cur.taskId].showMemberCount + 1;
        }

        if(cur.parentTaskId === 0) {
          return;
        }

        deepestLevel(task, taskHashSet[cur.parentTaskId]);
      };

      let subtotal = (task, cur) => {
        let wlPl = this.parseTimeSyntax(task.planWorkload);
        let wlAc = this.parseTimeSyntax(task.actualWorkload);

        vis[cur.taskId].subtotalPlanWorkload = vis[cur.taskId].subtotalPlanWorkload + wlPl;
        vis[cur.taskId].subtotalActualWorkload = vis[cur.taskId].subtotalActualWorkload + wlAc;
        vis[cur.taskId].subtotalRestWorkload = vis[cur.taskId].subtotalRestWorkload + ((!(task.actualEndDate)) ? wlPl : 0.0);

        if(cur.parentTaskId === 0) {
          return;
        }

        subtotal(task, taskHashSet[cur.parentTaskId]);
      };

      this.tasks.map((x) => {
        if(x.parentTaskId !== 0) {
          deepestLevel(x, taskHashSet[x.parentTaskId]);
          if(this.prefShowTaskStatistics) { 
            subtotal(x, taskHashSet[x.parentTaskId]);
          }
        }
      });
      
      return vis;
    },
    lists() {
      const self = this;
      let lists = [];

      let vis = this.viewInfoSet;

      lists = this.tasks.filter((x) => {
        return vis[x.taskId].show;
      });

      lists.sort((a,b) => {
        let sortKeyA = vis[a.taskId].sortKey;
        let sortKeyB = vis[b.taskId].sortKey;

        if(sortKeyA < sortKeyB) {
          return -1;
        } else if(sortKeyA = sortKeyB) {
          return 0;
        }  else if(sortKeyA > sortKeyB) {
          return 1;
        }
      });

      return lists;
    },
    taskBars() {
      let planStartDate = moment(this.start_month);
      let top = 2 + this.rowHeight;
      let left;
      let leftAc;
      let between;
      let betweenAc;
      let start;
      let startAc;
      let style;
      let actualStyle;
      let barStyle;
      let preStyle;
      let aftStyle;
      let index = -1;
      return this.displayTasks.map(task => {
        index++;
        style = {}
        let date_from = moment(task.planStartDate);
        let date_to = moment(task.planEndDate);
        let ac_date_from = moment(task.actualStartDate);
        let ac_date_to = (task.actualEndDate !== "")? (moment(task.actualEndDate)) : (moment());
        between = date_to.diff(date_from, 'days');
        between++;
        betweenAc = ac_date_to.diff(ac_date_from, 'days');
        betweenAc++;
        start = date_from.diff(planStartDate, 'days');
        startAc = ac_date_from.diff(planStartDate, 'days');
        left = start * this.block_size - 1;
        leftAc = startAc * this.block_size - 1;
        style = {
          top: `${top}px`,
          left: `${left}px`,
          topRaw: top,
          leftRaw: left,
          width: `${this.block_size * between + 1}px`,
          scheduled: (task.planStartDate !== ""),
        };
        preStyle = {
          top: `${top}px`,
          left: `${left}px`,
          topRaw: top,
          leftRaw: left,
          width: `0px`,
          height: `0px`,
          scheduled: (task.planStartDate !== ""),
        };
        aftStyle = {
          top: `${top}px`,
          left: `${left + this.block_size * between - 1}px`,
          topRaw: top,
          leftRaw: left,
          width: `0px`,
          height: `0px`,
          scheduled: (task.planStartDate !== ""),
        };
        actualStyle = {
          top: `${top+7}px`,
          left: `${leftAc}px`,
          width: `${this.block_size * betweenAc + 1}px`,
          scheduled: (task.actualStartDate !== ""),
        };
        var blocks = 0;
        this.calendars.map((cal) => {  
          blocks = blocks + cal.days.length;
        });
        barStyle = {
          top: `${top - 3}px`,
          height: `${this.rowHeight}px`,
          left: `${0}px`,
          width: `${this.block_size * blocks}px`,
        };
        top = top + this.rowHeight;
        return {
          index:index,
          style,
          preStyle,
          aftStyle,
          actualStyle,
          barStyle,
          task
        }
      })
    },
    displayTasks() {
      let display_task_number = Math.floor(this.calendarViewHeight / this.rowHeight);
      // return this.lists.slice(this.position_id, this.position_id + display_task_number);
      return this.lists;
    },
  }
};

window.mingantt = mingantt;

